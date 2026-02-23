import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveKitRoom as LiveKitRoomComponent, useParticipants, useRoomContext } from '@livekit/components-react';
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import { useLiveKitRoom, LiveKitParticipant } from '@/hooks/useLiveKitRoom';
import { VideoGrid } from './VideoGrid';
import { MediaControls } from './MediaControls';
import { ChatPanel, type ChatMessage } from './ChatPanel';
import { ParticipantList } from './ParticipantList';
import { ScreenShareLayout } from './ScreenShareLayout';
import { WhiteboardPanel } from './WhiteboardPanel';
import { PhoneOff, MessageSquare, Users, X, ChevronDown, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import RoomService from '@/services/RoomService';
import { useIsMobile } from '@/hooks/use-mobile';

interface LiveKitRoomProps {
  roomId: string;
  onLeaveRoom: () => void;
}

// Bottom sheet component for mobile
const BottomSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onClose}
        />
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
          style={{ maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}
        >
          {/* Handle + header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
            <div className="w-12 h-1 rounded-full bg-gray-300 absolute top-2 left-1/2 -translate-x-1/2" />
            <span className="font-semibold text-gray-900 text-base mt-2">{title}</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full mt-1">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// Inner component that has access to LiveKit context
const RoomContent: React.FC<{ roomId: string; onLeaveRoom: () => void }> = ({ roomId, onLeaveRoom }) => {
  const participants = useParticipants();
  const room = useRoomContext();
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Convert LiveKit participants to our format
  const formattedParticipants = participants.map((p) => ({
    formatted: {
      id: p.identity,
      name: p.name || (p.isLocal ? 'You' : 'Anonymous'),
      avatar: undefined,
      isMuted: !p.isMicrophoneEnabled,
      isCameraOn: p.isCameraEnabled,
      isScreenSharing: p.isScreenShareEnabled,
      isHost: p.isLocal,
      isCurrentUser: p.isLocal,
      role: p.isLocal ? 'professor' as const : 'student' as const,
      isPicked: false,
      isLocal: p.isLocal,
      handRaised: false,
      isSpeaking: p.isSpeaking,
    },
    liveKit: p
  }));

  const localParticipant = formattedParticipants.find(p => p.formatted.isLocal);
  const isProfessor = localParticipant?.formatted.role === 'professor';
  const screenSharingParticipant = formattedParticipants.find(p => p.formatted.isScreenSharing);
  const isScreenSharing = !!screenSharingParticipant;

  // Handle incoming chat messages
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, participant: RemoteParticipant) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));
        if (data?.type === 'chat') {
          const newMessage: ChatMessage = {
            id: `${participant.identity}-${data.timestamp || Date.now()}`,
            type: 'chat',
            message: data.message,
            timestamp: data.timestamp || Date.now(),
            sender: { id: participant.identity, name: participant.name || 'Anonymous' },
          };
          setMessages(prev => [...prev, newMessage]);
          if (!showChat) setUnreadCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error parsing chat message:', error);
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => { room.off('dataReceived', handleDataReceived); };
  }, [room, showChat]);

  const handleToggleChat = () => {
    setShowChat(s => {
      const next = !s;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  const handleSendMessage = (message: string) => {
    if (message.trim() && room) {
      const chatMessage = { type: 'chat', message: message.trim(), timestamp: Date.now() };
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(chatMessage)),
        { reliable: true }
      );
      const newMessage: ChatMessage = {
        id: `${room.localParticipant.identity}-${Date.now()}`,
        type: 'chat',
        message: message.trim(),
        timestamp: Date.now(),
        sender: { id: room.localParticipant.identity, name: room.localParticipant.name || 'You' },
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const toggleMicrophone = async () => {
    await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);
  };
  const toggleCamera = async () => {
    await room.localParticipant.setCameraEnabled(!room.localParticipant.isCameraEnabled);
  };
  const toggleScreenShare = async () => {
    await room.localParticipant.setScreenShareEnabled(!room.localParticipant.isScreenShareEnabled);
  };
  const handleLeaveRoom = async () => {
    try { await RoomService.leave(roomId); } catch (e) { console.error('Error notifying leave:', e); }
    await room.disconnect();
    onLeaveRoom();
  };

  // Floating panel for desktop
  const DesktopFloatingChat = () => showChat && !isMobile ? (
    <div className="absolute top-4 right-4 bottom-20 w-[360px] bg-white rounded-2xl shadow-2xl z-30 border border-gray-200 overflow-hidden flex flex-col">
      <ChatPanel messages={messages} onSendMessage={handleSendMessage} currentUserId={room.localParticipant.identity} visible={showChat} roomId={roomId} />
      <Button variant="ghost" size="icon" className="absolute top-3 right-3 hover:bg-gray-100 rounded-full z-50" onClick={() => setShowChat(false)}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  ) : null;

  const DesktopFloatingParticipants = () => showParticipants && !isMobile ? (
    <div className="absolute top-4 right-4 w-[340px] max-h-[calc(100vh-180px)] bg-white rounded-2xl shadow-2xl z-30 overflow-hidden border border-gray-200">
      <ParticipantList participants={formattedParticipants.map(p => p.formatted)} />
      <Button variant="ghost" size="icon" className="absolute top-3 left-3 hover:bg-gray-100 rounded-full z-50" onClick={() => setShowParticipants(false)}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  ) : null;

  // Controls bar — compact on mobile
  const ControlsBar = () => (
    <div className={cn(
      "border-t border-white/5 bg-black/60 backdrop-blur-xl",
      isMobile
        ? showChat
          ? "fixed bottom-[58%] left-0 right-0 z-40 p-2 pb-safe"
          : "fixed bottom-0 left-0 right-0 z-20 p-2 pb-safe"
        : "relative z-20 p-3 sm:p-4"
    )}>
      <div className={cn("mx-auto flex items-center justify-between", isMobile ? "max-w-full gap-1" : "max-w-5xl")}>
        {/* Left: Participants + Chat (and whiteboard toggle) */}
        <div className={cn("flex items-center", isMobile ? "gap-1" : "gap-2")}>
          {/* whiteboard button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "sm"}
              onClick={() => setShowWhiteboard(w => !w)}
              className={cn(
                "rounded-full font-semibold transition-all border-0 relative",
                isMobile ? "px-2 h-9" : "px-4",
                showWhiteboard
                  ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg"
                  : "bg-white/10 hover:bg-white/20 text-white"
              )}
            >
              <Pencil className={cn(isMobile ? "w-4 h-4" : "w-4 h-4")} />
              {!isMobile && <span className="ml-1">Tableau</span>}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "sm"}
              onClick={() => setShowParticipants(s => !s)}
              className={cn(
                "rounded-full font-semibold transition-all border-0 relative",
                isMobile ? "px-2 h-9" : "px-4",
                showParticipants
                  ? "bg-violet-500 hover:bg-violet-600 text-white shadow-lg"
                  : "bg-white/10 hover:bg-white/20 text-white"
              )}
            >
              <Users className={cn(isMobile ? "w-4 h-4" : "w-4 h-4 mr-1")} />
              {!isMobile && <span>{participants.length}</span>}
              {isMobile && <span className="text-xs ml-0.5">{participants.length}</span>}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "sm"}
              onClick={handleToggleChat}
              className={cn(
                "rounded-full font-semibold transition-all border-0 relative",
                isMobile ? "px-2 h-9" : "px-4",
                showChat
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg"
                  : "bg-white/10 hover:bg-white/20 text-white"
              )}
            >
              <MessageSquare className={cn(isMobile ? "w-4 h-4" : "w-4 h-4")} />
              {!isMobile && <span className="ml-1">Chat</span>}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Center: Media Controls */}
        <MediaControls
          isMuted={localParticipant?.formatted.isMuted || false}
          isCameraOn={localParticipant?.formatted.isCameraOn || false}
          isScreenSharing={localParticipant?.formatted.isScreenSharing || false}
          onToggleMute={toggleMicrophone}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={isMobile ? () => {} : toggleScreenShare}
          compact={isMobile}
        />

        {/* Right: Leave */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleLeaveRoom}
            size={isMobile ? "sm" : "sm"}
            className={cn(
              "rounded-full font-semibold bg-rose-500 hover:bg-rose-600 text-white border-0",
              isMobile ? "px-2 h-9" : "px-4 gap-2"
            )}
          >
            <PhoneOff className="w-4 h-4" />
            {!isMobile && <span>Quitter</span>}
          </Button>
        </motion.div>
      </div>
    </div>
  );

  // Screen share layout
  if (isScreenSharing && screenSharingParticipant) {
    return (
      <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 relative">
          <ScreenShareLayout
            screenShareParticipant={screenSharingParticipant.liveKit}
            localParticipant={screenSharingParticipant.formatted.isCurrentUser ? screenSharingParticipant.liveKit : undefined}
            participantName={screenSharingParticipant.formatted.name}
            isLocalSharing={screenSharingParticipant.formatted.isCurrentUser}
          />
          {!isMobile && <DesktopFloatingChat />}
          {!isMobile && <DesktopFloatingParticipants />}
        </div>
        <ControlsBar />
        {/* Mobile bottom sheets */}
        {/* also allow opening whiteboard on mobile via bottom sheet toggle? currently handled by button above */}
        {isMobile && (
          <>
            <BottomSheet isOpen={showChat} onClose={() => setShowChat(false)} title="Chat">
              <ChatPanel messages={messages} onSendMessage={handleSendMessage} currentUserId={room.localParticipant.identity} visible={showChat} roomId={roomId} />
            </BottomSheet>
            <BottomSheet isOpen={showParticipants} onClose={() => setShowParticipants(false)} title={`Participants (${participants.length})`}>
              <ParticipantList participants={formattedParticipants.map(p => p.formatted)} />
            </BottomSheet>
          </>
        )}
      </div>
    );
  }

  // Normal Gallery Layout
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-10 -left-10 w-60 h-60 bg-violet-600/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute -bottom-10 -right-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex z-10 min-h-0">
        {/* whiteboard overlay */}
        {showWhiteboard && (
          <div className="absolute inset-0 z-50">
            <WhiteboardPanel
              room={room}
              isProfessor={isProfessor}
              participantCount={participants.length}
              onClose={() => setShowWhiteboard(false)}
            />
          </div>
        )}
        <div className={cn(
          "flex-1 transition-all duration-300 min-h-0",
          formattedParticipants.length === 1 ? "p-0" : isMobile ? "p-2" : "p-3 sm:p-4"
        )}>
          <VideoGrid
            participants={formattedParticipants.map(p => p.formatted)}
            liveKitParticipants={formattedParticipants.map(p => p.liveKit)}
          />
        </div>

        {/* Desktop floating panels */}
        {!isMobile && <DesktopFloatingChat />}
        {!isMobile && <DesktopFloatingParticipants />}
      </div>

      {/* Controls Bar */}
      <ControlsBar />

      {/* Mobile bottom sheets */}
      {isMobile && (
        <>
          <BottomSheet isOpen={showChat} onClose={() => setShowChat(false)} title="Chat">
            <ChatPanel messages={messages} onSendMessage={handleSendMessage} currentUserId={room.localParticipant.identity} visible={showChat} roomId={roomId} />
          </BottomSheet>
          <BottomSheet isOpen={showParticipants} onClose={() => setShowParticipants(false)} title={`Participants (${participants.length})`}>
            <ParticipantList participants={formattedParticipants.map(p => p.formatted)} />
          </BottomSheet>
        </>
      )}
    </div>
  );
};

export const LiveKitRoom: React.FC<LiveKitRoomProps> = ({ roomId, onLeaveRoom }) => {
  const { error, serverUrl, token } = useLiveKitRoom(roomId);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <p className="text-red-500 mb-4">Failed to connect: {error}</p>
        </div>
      </div>
    );
  }

  if (!serverUrl || !token) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/80">Connexion en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoomComponent
      serverUrl={serverUrl}
      token={token}
      connect={true}
      onDisconnected={onLeaveRoom}
    >
      <RoomContent roomId={roomId} onLeaveRoom={onLeaveRoom} />
    </LiveKitRoomComponent>
  );
};
