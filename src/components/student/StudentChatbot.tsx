import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Mic,
  MicOff,
  Send,
  Download,
  Sparkles,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Bot,
  PhoneOff,
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
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'summary' | 'transcription';
  summary?: SessionSummaryData['summary'];
}

export function StudentChatbot({
  studentId,
  studentName,
  language,
  level,
  age,
  onClose
}: StudentChatbotProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData['summary'] | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(10 * 60); // 10 minutes in seconds
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      console.log('Track subscribed:', track.kind, 'from', participant.identity);
      if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.play().catch(e => console.error('Failed to play audio:', e));
        attachedElements.current.set(`${participant.identity}_${publication.trackSid}`, audioElement);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (
      track: Track,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
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
      console.log('Transcription received from', participant?.identity, transcriptions);
      transcriptions.forEach(t => {
        handleTranscription(t, participant);
      });
    });

    room.on(RoomEvent.Disconnected, () => {
      console.log('Room disconnected');
      setIsConnected(false);
      setIsRecording(false);
    });

    room.on(RoomEvent.Reconnecting, () => {
      console.log('Room reconnecting');
      setIsConnecting(true);
    });

    room.on(RoomEvent.Reconnected, () => {
      console.log('Room reconnected');
      setIsConnected(true);
      setIsConnecting(false);
    });

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
    });

    // Additional event listeners for debugging and handling tracks
    room.on(RoomEvent.TrackPublished, (publication, participant) => {
      console.log('Track published:', publication.kind, 'by', participant.identity);
    });

    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      console.log('Local track published:', publication.kind);
    });

    room.on(RoomEvent.TrackSubscriptionFailed, (trackSid, participant) => {
      console.log('Track subscription failed:', trackSid, 'from', participant.identity);
    });

    room.on(RoomEvent.TrackMuted, (publication, participant) => {
      console.log('Track muted:', publication.kind, 'by', participant.identity);
    });

    room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
      console.log('Track unmuted:', publication.kind, 'by', participant.identity);
    });
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const connectToRoom = useCallback(async () => {
    if (isConnected) return;

    setIsConnecting(true);
    try {
      // Create room via API
      const aiBase = import.meta.env.VITE_AI_ASSISTANT_URL || 'http://localhost:3200';
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const { roomName, token, url } = await response.json();

      setRoomName(roomName);

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
        console.log('Microphone enabled successfully');
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to enable microphone:', error);
        addMessage('Erreur d\'activation du microphone. Vérifiez les permissions.', false);
      }
    } catch (error) {
      console.error('Failed to connect to room:', error);
      addMessage('Erreur de connexion. Veuillez réessayer.', false);
    } finally {
      setIsConnecting(false);
    }
  }, [studentId, studentName, language, level, age, isConnected, addMessage, setupRoomListeners]);

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
      const aiBase = import.meta.env.VITE_AI_ASSISTANT_URL || 'http://localhost:3200';
      await fetch(`${aiBase}/api/room/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomName }),
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
      setMessages([]);
      setSessionSummary(null);
      setRoomName(null);
      stopSessionTimer();
      setSessionTimeLeft(10 * 60); // Reset timer
      handleCloseChat();
    } catch (error) {
      console.error('Failed to close room:', error);
    }
  }, [roomName, handleCloseChat, stopSessionTimer]);

  const startSessionTimer = useCallback(() => {
    if (sessionTimer) {
      clearInterval(sessionTimer);
    }
    
    const timer = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - close the session
          closeRoom();
          addMessage('La session de 10 minutes est terminée. Merci d\'avoir participé !', false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setSessionTimer(timer);
  }, [closeRoom, addMessage, sessionTimer]);

  const handleOpenChat = useCallback(() => {
    setIsChatOpen(true);
    setIsMinimized(false);
    setSessionTimeLeft(10 * 60); // Reset to 10 minutes
    if (!isConnected && !isConnecting) {
      connectToRoom();
    }
    startSessionTimer();
  }, [isConnected, isConnecting, connectToRoom, startSessionTimer]);

  const handleDataReceived = useCallback((payload: Uint8Array, participant: RemoteParticipant) => {
    try {
      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(payload)) as DataTrackMessage;

      switch (data.type) {
        case 'session_summary':
          setSessionSummary(data.summary);
          addMessage('Résumé de la session disponible pour téléchargement.', false, 'summary');
          break;

        case 'transcription':
          // Transcription messages may arrive via LiveKit `TranscriptionReceived` event —
          // ignore data-track 'transcription' here to avoid duplicate UI entries.
          // If you really need data-track transcription, implement deduplication here.
          break;
      }
    } catch (error) {
      console.error('Failed to parse data track message:', error);
    }
  }, [addMessage]);

  const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
    // Participant joined - no message added
  }, []);

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
        addMessage('Résumé de la session disponible pour téléchargement.', false, 'summary');
      }
    } catch (e) {
      console.error('Received message:', (e as Error)?.message || e);
    }
  }, [processMessage, addMessage]);

  const handleTranscription = useCallback((transcription: TranscriptionSegment, participant?: Participant) => {
    console.log('Received transcription:', transcription);
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
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [currentMessage, addMessage]);

const downloadSummary = useCallback(async () => {
    if (!sessionSummary) return;

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
        <div style="width: 100%; max-width: 800px; margin: 0 auto; background: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: ltr;">
          <!-- En-tête -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 0 0 20px 20px;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Lingua Hub</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Résumé de Session d'Apprentissage</p>
          </div>

          <!-- Informations générales -->
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div style="flex: 1;">
                <h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 10px 0; border-bottom: 3px solid #667eea; padding-bottom: 5px;">Session Details</h2>
                <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              <div style="text-align: right;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">📚</div>
              </div>
            </div>
          </div>

          <!-- Objectif de la session -->
          <div style="padding: 30px; border-left: 5px solid #667eea; margin: 20px 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #2c3e50; font-size: 20px; margin: 0 0 15px 0; display: flex; align-items: center;">
              <span style="background: #667eea; color: white; padding: 5px 10px; border-radius: 50%; margin-right: 10px; font-size: 14px;">🎯</span>
              Objectif de la Session
            </h3>
            <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.6;">Apprentissage et pratique de nouveaux mots en arabe et français</p>
          </div>

          <!-- Mots appris (groupés) -->
          ${sessionSummary.learnedGroups && sessionSummary.learnedGroups.length > 0 ? `
          <div style="padding: 30px; margin: 20px 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #2c3e50; font-size: 20px; margin: 0 0 20px 0; display: flex; align-items: center;">
              <span style="background: #28a745; color: white; padding: 5px 10px; border-radius: 50%; margin-right: 10px; font-size: 14px;">🗂️</span>
              Mots Appris (par groupe)
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



          <!-- Pied de page -->
          <div style="background: #2c3e50; color: white; padding: 30px; text-align: center; margin-top: 40px;">
            <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px;">
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">Document généré automatiquement par Lingua Hub</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.6;">Plateforme d'apprentissage des langues • ${new Date().getFullYear()}</p>
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
      pdf.save(`resume-session-lingua-hub-${new Date().toISOString().split('T')[0]}.pdf`);

      // Nettoyer
      document.body.removeChild(printElement);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      // Fallback vers l'ancienne méthode si html2canvas échoue
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Résumé de Session d\'Apprentissage', 20, 30);
      doc.setFontSize(12);
      doc.text(`Objectif: ${sessionSummary.sessionObjective || 'Non spécifié'}`, 20, 50);

      if (sessionSummary.learnedGroups && sessionSummary.learnedGroups.length > 0) {
        doc.text('Mots appris (par groupe):', 20, 80);
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
  }, [sessionSummary]);

  const toggleRecording = useCallback(async () => {
    if (!roomRef.current) return;

    try {
      const newState = !isRecording;
      await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
      setIsRecording(newState);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, [isRecording]);

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            onClick={handleOpenChat}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed z-50 bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto w-full sm:w-96 max-w-[calc(100vw-3rem)] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col",
              // on small screens make chat take full viewport height when open
              !isMinimized && isMobile ? "h-screen" : ""
            )}
            style={
              isMinimized
                ? { maxHeight: '40vh' }
                : isMobile
                ? { height: '100vh' }
                : { maxHeight: '80vh' }
            }
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Assistant IA</h3>
                  <p className="text-xs opacity-90">Niveau {level}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Session Timer */}
                {isChatOpen && (
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
                    <div className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⏱️</span>
                    </div>
                    <span className="text-sm font-mono font-semibold">
                      {formatTime(sessionTimeLeft)}
                    </span>
                  </div>
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
                  title="Clôturer la discussion"
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
                  onClick={handleCloseChat}
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
                {isConnected ? "Connecté" : isConnecting ? "Connexion..." : "Déconnecté"}
              </span>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <Bot className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Bienvenue !</p>
                    <p className="text-xs text-gray-400">Posez-moi vos questions sur l'apprentissage du {language}</p>
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
                            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">📊</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 text-sm">Rapport de Session d'Apprentissage</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={downloadSummary}
                                  className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors text-xs"
                                >
                                  <Download className="w-3 h-3" />
                                  Télécharger PDF
                                </button>
                              </div>
                            </div>

                            {/* Learned Vocabulary (grouped) */}
                            {sessionSummary.learnedGroups && sessionSummary.learnedGroups.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-3">Mots Appris par groupe</h5>
                                <div className="space-y-3">
                                  {sessionSummary.learnedGroups.map((g, gi) => (
                                    <div key={gi} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-gray-800">{g.group}</div>
                                        <div className="text-xs text-gray-500">{(g.words || []).length} mots</div>
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



                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-600 text-center">
                                🎯 <strong>Résumé de session généré sur demande</strong>
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

                            <div className={cn("flex flex-col max-w-[75%]", isUser && "items-end")}>
                              <div className={cn("rounded-xl px-3 py-2 shadow-sm text-sm", isUser ? "bg-blue-100 text-gray-900" : "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-gray-800")}>
                                <p className="leading-relaxed break-words italic" style={isUser ? { direction: 'rtl' } : {}}>{message.content}</p>
                              </div>
                              <span className={cn("text-[10px] text-gray-400 mt-1", isUser && "text-right")}>
                                {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
                          <div className={cn("flex flex-col max-w-[75%]", message.isUser && "items-end")}>
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
                              {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
              <div className="p-4 border-t bg-white/90 backdrop-blur-sm flex-none">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <button
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                    onClick={() => { setCurrentMessage('Corriger ma prononciation'); setTimeout(sendMessage, 150); }}
                  >
                    Corriger prononciation
                  </button>
                  <button
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                    onClick={() => { setCurrentMessage('Donne-moi un exercice de vocabulaire'); setTimeout(sendMessage, 150); }}
                  >
                    Exercice vocabulaire
                  </button>
                </div>

                <div className="flex gap-2 items-center min-w-0">
                  <button
                    onClick={toggleRecording}
                    aria-label="Activer le micro"
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
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
                    placeholder="Tapez votre message..."
                    aria-label="Message"
                    className="flex-1 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white rounded-full text-black text-sm placeholder:text-gray-400 px-4 py-2 shadow-sm"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim()}
                    aria-label="Envoyer"
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 disabled:from-gray-300 disabled:to-gray-300 text-white p-2 rounded-full transition-shadow disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Appuyez sur Entrée pour envoyer • Suggestions rapides disponibles</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}