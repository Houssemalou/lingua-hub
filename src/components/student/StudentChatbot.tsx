import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Mic,
  MicOff,
  Send,
  Download,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Bot,
  PhoneOff,
  Timer,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Room, RoomEvent, RemoteParticipant, Track, RemoteTrackPublication, TranscriptionSegment, DataPacket_Kind, Participant, TrackPublication } from 'livekit-client';
import { SessionSummaryData, DataTrackMessage } from '@/types';

interface StudentChatbotProps {
  studentId: string;
  studentName: string;
  language: string;
  level: string;
  age?: string;
  onClose?: () => void;
  isRTL?: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'summary' | 'transcription';
  summary?: SessionSummaryData['summary'];
}

const STUDENT_CHAT_SESSION_DURATION_SECONDS = 15 * 60;
const CHAT_HISTORY_TTL_MS = 5 * 60 * 1000;
const SUMMARY_ICON_THRESHOLD_SECONDS = 10 * 60;

export function StudentChatbot({
  studentId,
  studentName,
  language,
  level,
  age,
  onClose,
  isRTL = false,
}: StudentChatbotProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData['summary'] | null>(null);
  const [summaryPdf, setSummaryPdf] = useState<{ base64: string; filename: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(STUDENT_CHAT_SESSION_DURATION_SECONDS);
  const [sessionTimer, setSessionTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [summaryRequested, setSummaryRequested] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const [periodEndsAt, setPeriodEndsAt] = useState<string | null>(null);

  // track viewport size for mobile-specific behaviour
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const roomRef = useRef<Room | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptionBuffer = useRef(new Map<string, ChatMessage>());
  const attachedElements = useRef(new Map<string, HTMLMediaElement>());
  const clearHistoryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const historyStorageKey = `student-chatbot-history:${studentId}`;

  const serializeMessages = useCallback((items: ChatMessage[]) => {
    return items.map((msg) => ({
      id: msg.id,
      content: msg.content,
      isUser: msg.isUser,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date(msg.timestamp).toISOString(),
      type: msg.type,
    }));
  }, []);

  const loadSavedHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(historyStorageKey);
      if (!raw) return [] as ChatMessage[];
      const parsed = JSON.parse(raw) as Array<{
        id?: string;
        content?: string;
        isUser?: boolean;
        timestamp?: string;
        type?: 'text' | 'summary' | 'transcription';
      }>;
      return (parsed || [])
        .filter((m) => m && typeof m.content === 'string' && m.content.trim())
        .slice(-50)
        .map((m, idx) => ({
          id: m.id || `msg-${idx}-${Date.now()}`,
          content: m.content || '',
          isUser: Boolean(m.isUser),
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          type: m.type || 'text',
        }));
    } catch {
      return [] as ChatMessage[];
    }
  }, [historyStorageKey]);

  const fetchSessionState = useCallback(async () => {
    const aiBase = import.meta.env.VITE_AI_ASSISTANT_URL || 'https://learnup.tn/assistant';
    const response = await fetch(
      `${aiBase}/api/chatbot/session/state?userIdentity=${encodeURIComponent(studentId)}`,
      { method: 'GET' },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch chatbot session state');
    }

    return await response.json() as {
      totalSeconds: number;
      usedSeconds: number;
      remainingSeconds: number;
      periodEndsAt?: string;
      isSessionActive?: boolean;
    };
  }, [studentId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const stopSessionTimer = useCallback(() => {
    if (sessionTimer) {
      clearInterval(sessionTimer);
      setSessionTimer(null);
    }
  }, [sessionTimer]);

  const clearChatHistory = useCallback(() => {
    try {
      localStorage.removeItem(historyStorageKey);
    } catch {
      // Best effort local persistence only.
    }
    setMessages([]);
    setSessionSummary(null);
    setSummaryPdf(null);
    setSummaryRequested(false);
  }, [historyStorageKey]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const saved = loadSavedHistory();
    if (saved.length > 0) {
      setMessages(saved);
    }
  }, [loadSavedHistory]);

  useEffect(() => {
    if (clearHistoryTimeoutRef.current) {
      clearTimeout(clearHistoryTimeoutRef.current);
      clearHistoryTimeoutRef.current = null;
    }

    if (!isChatOpen) {
      clearHistoryTimeoutRef.current = setTimeout(() => {
        clearChatHistory();
      }, CHAT_HISTORY_TTL_MS);
    }

    return () => {
      if (clearHistoryTimeoutRef.current) {
        clearTimeout(clearHistoryTimeoutRef.current);
        clearHistoryTimeoutRef.current = null;
      }
    };
  }, [isChatOpen, clearChatHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(serializeMessages(messages)));
    } catch {
      // Best effort local persistence only.
    }
  }, [historyStorageKey, messages, serializeMessages]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (sessionTimer) {
        clearInterval(sessionTimer);
      }
    };
  }, [sessionTimer]);

  const addMessage = useCallback((content: string, isUser: boolean = false, type: 'text' | 'summary' | 'transcription' = 'text') => {
    const normalized = content?.toString().trim();
    const message: ChatMessage = {
      id: Date.now().toString(),
      content: normalized,
      isUser,
      timestamp: new Date(),
      type,
    };

    setMessages(prev => {
      // look only at a small recent window to avoid false positives in long history
      const WINDOW = 6;
      const start = Math.max(0, prev.length - WINDOW);

      // find a recent message with same content and same author
      for (let i = prev.length - 1; i >= start; i--) {
        const m = prev[i];
        if (m.content?.toString().trim() === normalized && m.isUser === isUser) {
          // exact same type -> skip duplicate
          if (m.type === type) return prev;

          // transcription exists, and now we're adding a final text -> replace transcription with text
          if (m.type === 'transcription' && type === 'text') {
            return prev.map(x => (x === m ? message : x));
          }

          // text exists and a transcription is coming in (same content) -> ignore transcription
          if (m.type === 'text' && type === 'transcription') {
            return prev;
          }

          // otherwise replace the older entry with the new one
          return prev.map(x => (x === m ? message : x));
        }
      }

      // no recent duplicate found -> append
      return [...prev, message];
    });
  }, []);

  const setupRoomListeners = useCallback((room: Room) => {
    room.on(RoomEvent.TrackSubscribed, (
      track: Track,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.play().catch(() => {});
        attachedElements.current.set(`${participant.identity}_${publication.trackSid}`, audioElement);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (
      track: Track,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (track.kind === Track.Kind.Audio) {
        const elementKey = `${participant.identity}_${publication.trackSid}`;
        const audioElement = attachedElements.current.get(elementKey);
        if (audioElement) {
          track.detach(audioElement);
          attachedElements.current.delete(elementKey);
        }
      }
    });

    // Gestion des données (transcriptions, messages)
    room.on(RoomEvent.DataReceived, (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: DataPacket_Kind
    ) => {
      const decoder = new TextDecoder();
      const message = decoder.decode(payload);
      handleDataMessage(message, participant);
    });

    // Gestion des transcriptions
    room.on(RoomEvent.TranscriptionReceived, (
      transcriptions: TranscriptionSegment[],
      participant?: Participant,
      publication?: TrackPublication
    ) => {
      transcriptions.forEach(t => {
        handleTranscription(t, participant);
      });
    });

    room.on(RoomEvent.Disconnected, () => {
      setIsConnected(false);
      setIsRecording(false);
    });

    room.on(RoomEvent.Reconnecting, () => {
      setIsConnecting(true);
    });

    room.on(RoomEvent.Reconnected, () => {
      setIsConnected(true);
      setIsConnecting(false);
    });
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const connectToRoom = useCallback(async () => {
    if (isConnected) return true;

    setIsConnecting(true);
    try {
      // Create room via API
      const aiBase = import.meta.env.VITE_AI_ASSISTANT_URL || 'https://learnup.tn/assistant';
      const response = await fetch(`${aiBase}/api/room/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: studentName,
          userIdentity: studentId,
          language,
          age,
          level,
          recentHistory: serializeMessages(messages).slice(-20),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || payload?.error || 'Failed to create room');
      }

      const { roomName, token, url, remainingSeconds, periodEndsAt: endsAt } = await response.json();

      setRoomName(roomName);
      if (typeof remainingSeconds === 'number') {
        setSessionTimeLeft(Math.max(0, remainingSeconds));
      }
      if (endsAt) {
        setPeriodEndsAt(endsAt);
      }

      // Connect to LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      roomRef.current = room;

      // Set up event listeners
      setupRoomListeners(room);

      await room.connect(url, token);
      setIsConnected(true);

      // Enable microphone for voice-to-voice communication
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
        setIsRecording(true);
      } catch {
        addMessage(language === 'ar' ? 'خطأ في تفعيل الميكروفون. تحقق من الأذونات.' : 'Erreur d\'activation du microphone. Vérifiez les permissions.', false);
      }

      return true;
    } catch {
      addMessage(
        (language === 'ar' ? 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.' : 'Erreur de connexion. Veuillez réessayer.'),
        false,
      );
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [studentId, studentName, language, level, age, isConnected, addMessage, setupRoomListeners, serializeMessages, messages]);

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
    setIsMinimized(false);
  }, []);

  const handleMinimizeChat = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);

  const closeRoom = useCallback(async () => {
    if (!roomName) return;

    try {
      const aiBase = import.meta.env.VITE_AI_ASSISTANT_URL || 'https://learnup.tn/assistant';
      await fetch(`${aiBase}/api/room/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomName, userIdentity: studentId }),
      });

      // Disconnect room
      if (roomRef.current) {
        // Cleanup attached elements
        attachedElements.current.forEach((element) => {
          element.pause();
          element.remove();
        });
        attachedElements.current.clear();
        transcriptionBuffer.current.clear();

        await roomRef.current.disconnect();
        roomRef.current = null;
      }

      setIsConnected(false);
      setIsRecording(false);
      setSessionSummary(null);
      setSummaryPdf(null);
      setSummaryRequested(false);
      setRoomName(null);
      stopSessionTimer();

      try {
        const state = await fetchSessionState();
        setSessionTimeLeft(Math.max(0, state.remainingSeconds || 0));
        setPeriodEndsAt(state.periodEndsAt || null);
      } catch {
        // ignore quota refresh errors on close
      }

      handleCloseChat();
    } catch {
      // ignore room close errors
    }
  }, [roomName, handleCloseChat, stopSessionTimer, studentId, fetchSessionState]);

  const startSessionTimer = useCallback(() => {
    if (sessionTimer) {
      clearInterval(sessionTimer);
    }
    
    const timer = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setSessionTimer(null);
          addMessage(
            language === 'ar'
              ? 'انتهى الوقت المتاح. يتم الآن إعداد الملخص النهائي.'
              : 'Le temps disponible est termine. Le resume final est en preparation.',
            false,
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setSessionTimer(timer);
  }, [addMessage, sessionTimer, language]);

  const handleOpenChat = useCallback(async () => {
    setIsChatOpen(true);
    setIsMinimized(false);

    if (!isConnected && !isConnecting) {
      try {
        const state = await fetchSessionState();
        setSessionTimeLeft(Math.max(0, state.remainingSeconds || 0));
        setPeriodEndsAt(state.periodEndsAt || null);

        if ((state.remainingSeconds || 0) <= 0) {
          addMessage(
            language === 'ar'
              ? 'استهلكت 15 دقيقة كاملة. ينجم ترجع تستعمل الشاتبوت بعد نهاية فترة 48 ساعة.'
              : 'Tu as consomme les 15 minutes. Tu pourras reutiliser le chatbot apres la fin de la fenetre de 48h.',
            false,
          );
          return;
        }

        const connected = await connectToRoom();
        if (connected) {
          startSessionTimer();
        }
      } catch {
        addMessage(
          language === 'ar' ? 'تعذر جلب رصيد الوقت الحالي.' : 'Impossible de recuperer le quota de temps actuel.',
          false,
        );
      }
    }
  }, [
    isConnected,
    isConnecting,
    connectToRoom,
    startSessionTimer,
    addMessage,
    language,
    fetchSessionState,
  ]);

  const requestSummaryNow = useCallback(async () => {
    if (!roomRef.current || summaryRequested) return;
    try {
      await roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify({
          type: 'request_summary',
          timestamp: new Date().toISOString(),
        })),
        { reliable: true }
      );
      setSummaryRequested(true);
      addMessage(
        language === 'ar'
          ? 'جاري إعداد ملخص الجلسة...'
          : 'Preparation du resume en cours...'
        , false
      );
    } catch {
      // ignore summary request errors
    }
  }, [addMessage, language, summaryRequested]);

  const processMessage = useCallback((data: DataTrackMessage | { type?: string; content?: string }) => {
    if ('content' in data && typeof data.content === 'string') {
      const content = data.content;
      const msgType = typeof data.type === 'string' ? data.type : 'text';
      let messageType: 'text' | 'summary' | 'transcription' = 'text';
      if (msgType === 'summary' || msgType === 'transcription') messageType = msgType;
      addMessage(content, false, messageType);
    }
  }, [addMessage]);

  const handleDataMessage = useCallback((message: string, participant?: RemoteParticipant) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'agent_message') {
        processMessage(data);
      } else if (data.type === 'session_summary') {
        setSessionSummary(data.summary);
        if (data.pdfBase64) {
          setSummaryPdf({
            base64: data.pdfBase64,
            filename: data.pdfFilename || `session-summary-${new Date().toISOString().split('T')[0]}.pdf`,
          });
        }
        addMessage(language === 'ar' ? 'ملخص الجلسة متاح للتحميل.' : 'Résumé de la session disponible pour téléchargement.', false, 'summary');
      }
    } catch {
      // ignore data message errors
    }
  }, [processMessage, addMessage, language]);

  const handleTranscription = useCallback((transcription: TranscriptionSegment, participant?: Participant) => {
    const role = participant?.identity?.toLowerCase()?.includes('agent') ? 'assistant' : 'user';
    const segmentId = transcription.id || Date.now().toString();
    const normalized = transcription.text?.toString().trim() || '';

    const message: ChatMessage = {
      id: segmentId,
      content: normalized,
      isUser: role === 'user',
      timestamp: new Date(),
      type: 'transcription',
    };

    // Replace or update existing segment by id
    if (transcription.final) {
      transcriptionBuffer.current.delete(segmentId);

      setMessages(prev => {
        // remove any recent duplicates (same content & same author) that have a different id
        const WINDOW = 8;
        const start = Math.max(0, prev.length - WINDOW);
        const deduped = prev.filter((m, idx) => !(idx >= start && m.content?.toString().trim() === normalized && m.isUser === message.isUser && m.id !== segmentId));

        const existingIndex = deduped.findIndex(m => m.id === segmentId);
        if (existingIndex !== -1) {
          deduped[existingIndex] = message;
          return deduped;
        }

        // if there is already a "text" message with same content by same author, don't add the transcription
        const hasText = deduped.slice(start).some(m => m.content?.toString().trim() === normalized && m.isUser === message.isUser && m.type === 'text');
        if (hasText) return deduped;

        return [...deduped, message];
      });
    } else {
      // interim: update in-place or add if missing
      transcriptionBuffer.current.set(segmentId, message);
      setMessages(prev => {
        const existingIndex = prev.findIndex(m => m.id === segmentId);
        if (existingIndex !== -1) {
          return prev.map(m => (m.id === segmentId ? message : m));
        }

        // avoid adding an interim if an identical recent text exists
        const WINDOW = 6;
        const start = Math.max(0, prev.length - WINDOW);
        const hasRecentText = prev.slice(start).some(m => m.content?.toString().trim() === normalized && m.isUser === message.isUser && m.type === 'text');
        if (hasRecentText) return prev;

        return [...prev, message];
      });
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!currentMessage.trim() || !roomRef.current) return;

    addMessage(currentMessage, true);
    setCurrentMessage('');

    // Send message via data track
    const messageData = {
      type: 'chat_message',
      content: currentMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      await roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(messageData)),
        { reliable: true }
      );
    } catch {
      // ignore message send errors
    }
  }, [currentMessage, addMessage]);

const downloadSummary = useCallback(async () => {
    if (!sessionSummary) return;

    if (summaryPdf?.base64) {
      try {
        const binaryString = atob(summaryPdf.base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i += 1) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = summaryPdf.filename || `session-summary-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        return;
      } catch {
        // ignore PDF download errors
      }
    }

    try {
      // Créer un élément HTML temporaire pour le rendu
      const printElement = document.createElement('div');
      printElement.style.position = 'absolute';
      printElement.style.left = '-9999px';
      printElement.style.top = '-9999px';
      printElement.style.width = '800px';
      printElement.style.backgroundColor = 'white';
      printElement.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(printElement);

      // Template HTML professionnel avec support arabe
      const htmlContent = `
        <div style="width: 100%; max-width: 800px; margin: 0 auto; background: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: ${language === 'ar' ? 'rtl' : 'ltr'};">
          <!-- En-tête -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 0 0 20px 20px;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">LearnUP</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">${language === 'ar' ? 'ملخص جلسة التعلم' : "Résumé de Session d'Apprentissage"}</p>
          </div>

          <!-- Informations générales -->
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div style="flex: 1;">
                <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 10px 0; border-bottom: 3px solid #667eea; padding-bottom: 5px;">${language === 'ar' ? 'تفاصيل الجلسة' : 'Session Details'}</h2>
                <p style="margin: 5px 0; color: #666;"><strong>${language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR')}</p>
              </div>
              <div style="text-align: right;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">L</div>
              </div>
            </div>
          </div>

          <!-- Objectif de la session -->
          <div style="padding: 30px; border-left: 5px solid #667eea; margin: 20px 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #2c3e50; font-size: 20px; margin: 0 0 15px 0; display: flex; align-items: center;">
              <span style="background: #667eea; color: white; padding: 5px 10px; border-radius: 50%; margin-right: 10px; font-size: 14px;">O</span>
              ${language === 'ar' ? 'هدف الجلسة' : 'Objectif de la Session'}
            </h3>
            <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.6;">${sessionSummary.sessionObjective || ''}</p>
          </div>

          <!-- Resume detaille -->
          ${sessionSummary.detailedSummary ? `
          <div style="padding: 30px; margin: 20px 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #2c3e50; font-size: 20px; margin: 0 0 15px 0; display: flex; align-items: center;">
              <span style="background: #17a2b8; color: white; padding: 5px 10px; border-radius: 50%; margin-right: 10px; font-size: 14px;">R</span>
              ${language === 'ar' ? 'تفاصيل الجلسة' : 'Resume detaille'}
            </h3>
            <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">${sessionSummary.detailedSummary}</p>
          </div>
          ` : ''}

          <!-- Mots appris (groupes) -->
          ${sessionSummary.learnedGroups && sessionSummary.learnedGroups.length > 0 ? `
          <div style="padding: 30px; margin: 20px 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #2c3e50; font-size: 20px; margin: 0 0 20px 0; display: flex; align-items: center;">
              <span style="background: #28a745; color: white; padding: 5px 10px; border-radius: 50%; margin-right: 10px; font-size: 14px;">V</span>
              ${language === 'ar' ? 'الكلمات المكتسبة (حسب المجموعة)' : 'Mots Appris (par groupe)'}
            </h3>
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${sessionSummary.learnedGroups.map(g => `
                <div style="background:#f8f9fa; border:1px solid #e9ecef; border-radius:10px; padding:12px;">
                  <div style="font-weight:700; color:#2c3e50; margin-bottom:8px;">${g.group}</div>
                  <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${g.words.map(w => `<span style="background:white; border:1px solid #e9ecef; padding:6px 8px; border-radius:6px; font-size:13px; color:#555; direction: ${/[\u0600-\u06FF]/.test(w) ? 'rtl' : 'ltr'};">${w}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''} 

          <!-- Exemples -->
          ${sessionSummary.examples && sessionSummary.examples.length > 0 ? `
          <div style="padding: 30px; margin: 20px 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #2c3e50; font-size: 20px; margin: 0 0 20px 0; display: flex; align-items: center;">
              <span style="background: #ffc107; color: white; padding: 5px 10px; border-radius: 50%; margin-right: 10px; font-size: 14px;">E</span>
              ${language === 'ar' ? 'امثلة' : 'Exemples'}
            </h3>
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${sessionSummary.examples.map(ex => `
                <div style="background:#f8f9fa; border:1px solid #e9ecef; border-radius:10px; padding:12px;">
                  <div style="font-weight:700; color:#2c3e50; margin-bottom:6px;">${ex.title}</div>
                  <div style="color:#555; font-size:14px; line-height:1.6;">${ex.text}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}



          <!-- Pied de page -->
          <div style="background: #2c3e50; color: white; padding: 30px; text-align: center; margin-top: 40px;">
            <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px;">
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">${language === 'ar' ? 'وثيقة تم إنشاؤها تلقائياً بواسطة LearnUP' : 'Document généré automatiquement par LearnUP'}</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.6;">${language === 'ar' ? 'منصة تعلم اللغات' : "Plateforme d'apprentissage des langues"} • ${new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      `;

      printElement.innerHTML = htmlContent;

      // Utiliser html2canvas pour capturer le contenu
      const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: printElement.scrollHeight
      });

      // Créer le PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Première page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Télécharger le PDF
      pdf.save(`resume-session-learnup-${new Date().toISOString().split('T')[0]}.pdf`);

      // Nettoyer
      document.body.removeChild(printElement);

    } catch {
      // ignore PDF generation errors
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(language === 'ar' ? 'ملخص جلسة التعلم' : 'Résumé de Session d\'Apprentissage', 20, 30);
      doc.setFontSize(12);
      doc.text(`${language === 'ar' ? 'الهدف' : 'Objectif'}: ${sessionSummary.sessionObjective || (language === 'ar' ? 'غير محدد' : 'Non spécifié')}`, 20, 50);

      if (sessionSummary.learnedGroups && sessionSummary.learnedGroups.length > 0) {
        doc.text(language === 'ar' ? 'الكلمات المكتسبة (حسب المجموعة):' : 'Mots appris (par groupe):', 20, 80);
        let y = 90;
        sessionSummary.learnedGroups.forEach((g) => {
          doc.setFontSize(11);
          doc.text(`- ${g.group}:`, 20, y);
          y += 7;
          doc.setFontSize(10);
          const wordsLine = (g.words || []).join(', ');
          // tronquer si très long
          doc.text(wordsLine, 25, y);
          y += 12;
        });
      }

      doc.save(`resume-session-simple-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  }, [sessionSummary, language, summaryPdf]);

  const toggleRecording = useCallback(async () => {
    if (!roomRef.current) return;

    try {
      const newState = !isRecording;
      await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
      setIsRecording(newState);
    } catch {
      // ignore microphone toggle errors
    }
  }, [isRecording]);

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            onClick={handleOpenChat}
            className={cn("fixed bottom-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group", isRTL ? "left-6" : "right-6")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
            <div className={cn("absolute -top-1 w-4 h-4 bg-green-400 rounded-full animate-pulse", isRTL ? "-left-1" : "-right-1")} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: isMobile ? 1 : 0.8, y: isMobile ? '100%' : 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{ opacity: 0, scale: isMobile ? 1 : 0.8, y: isMobile ? '100%' : 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed z-50 bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col",
              // Mobile: full-screen
              "inset-0 sm:inset-auto",
              // Desktop: positioned bottom-right widget
              isRTL ? "sm:bottom-6 sm:left-6" : "sm:bottom-6 sm:right-6",
              "sm:w-[460px] sm:h-[720px] sm:rounded-2xl",
              // Minimized state
              isMinimized && "sm:max-h-[40vh]"
            )}
            style={
              isMinimized
                ? { maxHeight: isMobile ? undefined : '40vh' }
                : isMobile
                ? {}
                : { height: '720px' }
            }
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 sm:p-4 flex items-center justify-between gap-2 flex-shrink-0 safe-area-top">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{language === 'ar' ? 'المساعد الذكي' : 'Assistant IA'}</h3>
                  <p className="text-xs opacity-90">{language === 'ar' ? `المستوى ${level}` : `Niveau ${level}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Session Timer */}
                {isChatOpen && (
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
                    <div className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                      <Timer className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-mono font-semibold">
                      {formatTime(sessionTimeLeft)}
                    </span>
                  </div>
                )}
                {isConnected && (STUDENT_CHAT_SESSION_DURATION_SECONDS - sessionTimeLeft) >= SUMMARY_ICON_THRESHOLD_SECONDS && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={requestSummaryNow}
                    disabled={summaryRequested}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      summaryRequested ? "bg-white/10 text-white/50" : "bg-white/20 text-white hover:bg-white/30"
                    )}
                    title={language === 'ar' ? 'احصل على ملخص الجلسة' : 'Generer le resume'}
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeRoom}
                  disabled={!isConnected}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isConnected
                      ? "hover:bg-red-500/20 text-red-400"
                      : "text-gray-400 cursor-not-allowed"
                  )}
                  title={language === 'ar' ? 'إنهاء المحادثة' : 'Clôturer la discussion'}
                >
                  <PhoneOff className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMinimizeChat}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (isConnected) {
                      closeRoom();
                    } else {
                      handleCloseChat();
                    }
                  }}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-400" : isConnecting ? "bg-yellow-400 animate-pulse" : "bg-red-400"
              )} />
              <span className="text-xs text-gray-600">
                {isConnected ? (language === 'ar' ? "متصل" : "Connecté") : isConnecting ? (language === 'ar' ? "جارٍ الاتصال..." : "Connexion...") : (language === 'ar' ? "غير متصل" : "Déconnecté")}
              </span>
              <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {language === 'ar'
                  ? `الوقت المتبقي: ${formatTime(sessionTimeLeft)}`
                  : `Temps restant: ${formatTime(sessionTimeLeft)}`}
              </span>
            </div>

            {periodEndsAt && (
              <div className="px-4 py-1 bg-amber-50 border-b text-[11px] text-amber-800">
                {language === 'ar'
                  ? `إعادة شحن الرصيد بعد: ${new Date(periodEndsAt).toLocaleString('ar-TN')}`
                  : `Rechargement du quota: ${new Date(periodEndsAt).toLocaleString('fr-FR')}`}
              </div>
            )}

            {/* Messages Area */}
            {!isMinimized && (
              <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-3 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <Bot className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{language === 'ar' ? 'أهلا بيك' : 'Bienvenue'}</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((message, index) => {
                      // Handle summary messages
                      if (message.type === 'summary' && sessionSummary) {
                        return (
                          <motion.div
                            key={`${message.id}-${index}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 cursor-pointer"
                            onClick={downloadSummary}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <BarChart3 className="w-3 h-3 text-white" />
                                </div>
                                <h4 className="font-semibold text-gray-900 text-sm">{language === 'ar' ? 'تقرير جلسة التعلم' : "Rapport de Session d'Apprentissage"}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={downloadSummary}
                                  className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors text-xs"
                                >
                                  <Download className="w-3 h-3" />
                                  {language === 'ar' ? 'تحميل PDF' : 'Télécharger PDF'}
                                </button>
                              </div>
                            </div>

                            {/* Learned Vocabulary (grouped) */}
                            {sessionSummary.learnedGroups && sessionSummary.learnedGroups.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-3">{language === 'ar' ? 'الكلمات المكتسبة حسب المجموعة' : 'Mots Appris par groupe'}</h5>
                                <div className="space-y-3">
                                  {sessionSummary.learnedGroups.map((g, gi) => (
                                    <div key={gi} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-gray-800">{g.group}</div>
                                        <div className="text-xs text-gray-500">{(g.words || []).length} {language === 'ar' ? 'كلمات' : 'mots'}</div>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {(g.words || []).map((w, wi) => (
                                          <span key={wi} className={cn(
                                            "px-2 py-1 bg-gray-50 border rounded text-sm text-gray-700",
                                            /[\u0600-\u06FF]/.test(w) ? "text-right" : "text-left"
                                          )}>
                                            {w}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {sessionSummary.detailedSummary && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">{language === 'ar' ? 'تفاصيل الجلسة' : 'Resume detaille'}</h5>
                                <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed">
                                  {sessionSummary.detailedSummary}
                                </div>
                              </div>
                            )}

                            {sessionSummary.examples && sessionSummary.examples.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">{language === 'ar' ? 'امثلة' : 'Exemples'}</h5>
                                <div className="space-y-2">
                                  {sessionSummary.examples.map((ex, exIdx) => (
                                    <div key={`${ex.title}-${exIdx}`} className="bg-white border border-gray-200 rounded-lg p-3">
                                      <div className="text-xs font-semibold text-gray-700 mb-1">{ex.title}</div>
                                      <div className="text-sm text-gray-600 leading-relaxed">{ex.text}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}



                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-600 text-center">
                                <strong>{language === 'ar' ? 'اضغط على الملخص لتحميله مباشرة PDF' : 'Cliquez sur le résumé pour le télécharger directement en PDF'}</strong>
                              </p>
                            </div>
                          </motion.div>
                        );
                      }

                      // Handle transcription messages (real-time voice responses)
                      if (message.type === 'transcription') {
                        const isUser = message.isUser;
                        return (
                          <motion.div
                            key={`${message.id}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}
                          >
                            {isUser ? (
                              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Mic className="w-3 h-3 text-white" />
                              </div>
                            )}

                            <div className={cn("flex flex-col max-w-[80%] sm:max-w-[75%]", isUser && "items-end")}>
                              <div className={cn("rounded-xl px-3 py-2 shadow-sm text-sm", isUser ? "bg-blue-100 text-gray-900" : "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-gray-800")}>
                                <p className="leading-relaxed break-words italic" style={isUser ? { direction: 'rtl' } : {}}>{message.content}</p>
                              </div>
                              <span className={cn("text-[10px] text-gray-400 mt-1", isUser && "text-right")}>
                                {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </motion.div>
                        );
                      }

                      // Handle regular chat messages
                      return (
                        <motion.div
                          key={`${message.id}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex gap-2",
                            message.isUser ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          {!message.isUser ? (
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Bot className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <MessageCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className={cn("flex flex-col max-w-[80%] sm:max-w-[75%]", message.isUser && "items-end")}>
                            <div
                              className={cn(
                                "rounded-xl px-3 py-2 shadow-sm text-sm",
                                message.isUser
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-800"
                              )}
                            >
                              <p className="leading-relaxed break-words" style={message.isUser ? { direction: 'rtl' } : {}}>{message.content}</p>
                            </div>
                            <span className={cn(
                              "text-[10px] text-gray-400 mt-1",
                              message.isUser && "text-right"
                            )}>
                              {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input Area */}
            {!isMinimized && (
              <div className="p-3 sm:p-4 border-t bg-white/90 backdrop-blur-sm flex-none pb-[max(0.75rem,env(safe-area-inset-bottom))]">

                <div className="flex gap-2 items-center min-w-0">
                  <button
                    onClick={toggleRecording}
                    aria-label={language === 'ar' ? 'تفعيل الميكروفون' : 'Activer le micro'}
                    className={cn(
                      "w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                      isRecording
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Tapez votre message...'}
                    aria-label={language === 'ar' ? 'رسالة' : 'Message'}
                    className="flex-1 min-w-0 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white rounded-full text-black text-sm placeholder:text-gray-400 px-4 py-2.5 sm:py-2 shadow-sm"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim()}
                    aria-label={language === 'ar' ? 'إرسال' : 'Envoyer'}
                    className="w-10 h-10 sm:w-auto sm:h-auto bg-gradient-to-r from-indigo-500 to-blue-500 disabled:from-gray-300 disabled:to-gray-300 text-white p-2.5 sm:p-2 rounded-full transition-shadow disabled:cursor-not-allowed shadow-sm hover:shadow-md flex-shrink-0 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 hidden sm:block">{language === 'ar' ? 'اضغط على Enter للإرسال • اقتراحات سريعة متاحة' : 'Appuyez sur Entrée pour envoyer • Suggestions rapides disponibles'}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}