import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LiveKitRoom as LiveKitRoomComponent, useParticipants, useRoomContext } from '@livekit/components-react';
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import { useLiveKitRoom, LiveKitParticipant } from '@/hooks/useLiveKitRoom';
import { VideoGrid } from './VideoGrid';
import { MediaControls } from './MediaControls';
import { ChatPanel, ChatMessage } from './ChatPanel';
import { ParticipantList } from './ParticipantList';
import { ScreenShareLayout } from './ScreenShareLayout';
import { PhoneOff, MessageSquare, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import RoomService from '@/services/RoomService';

interface LiveKitRoomProps {
  roomId: string;
  onLeaveRoom: () => void;
}

// Inner component that has access to LiveKit context
const RoomContent: React.FC<{ roomId: string; onLeaveRoom: () => void }> = ({ roomId, onLeaveRoom }) => {
  const participants = useParticipants();
  const room = useRoomContext();
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Convert LiveKit participants to our format with reference to original
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
  const screenSharingParticipant = formattedParticipants.find(p => p.formatted.isScreenSharing);
  const isScreenSharing = !!screenSharingParticipant;

  // Handle incoming chat messages
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));
        
        if (data.type === 'chat') {
          const newMessage: ChatMessage = {
            id: `${participant.identity}-${data.timestamp}`,
            type: 'chat',
            message: data.message,
            timestamp: data.timestamp,
            sender: {
              id: participant.identity,
              name: participant.name || 'Anonymous',
            },
          };
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (error) {
        console.error('Error parsing chat message:', error);
      }
    };

    room.on('dataReceived', handleDataReceived);

    return () => {
      room.off('dataReceived', handleDataReceived);
    };
  }, [room]);

  const handleSendMessage = (message: string) => {
    if (message.trim() && room) {
      const chatMessage = {
        type: 'chat',
        message: message.trim(),
        timestamp: Date.now(),
      };
      
      // Send via data channel
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(chatMessage)),
        { reliable: true }
      );

      // Add to local messages
      const newMessage: ChatMessage = {
        id: `${room.localParticipant.identity}-${Date.now()}`,
        type: 'chat',
        message: message.trim(),
        timestamp: Date.now(),
        sender: {
          id: room.localParticipant.identity,
          name: room.localParticipant.name || 'You',
        },
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
    try {
      await RoomService.leave(roomId);
    } catch (e) {
      console.error('Error notifying leave:', e);
    }
    await room.disconnect();
    onLeaveRoom();
  };

  // Screen Share Layout
  if (isScreenSharing && screenSharingParticipant) {
    return (
      <div className="flex flex-col h-full bg-gray-900">
        {/* Main Content: Screen Share */}
        <div className="flex-1 relative">
          <ScreenShareLayout
            screenShareParticipant={screenSharingParticipant.liveKit}
            localParticipant={screenSharingParticipant.formatted.isCurrentUser ? screenSharingParticipant.liveKit : undefined}
            participantName={screenSharingParticipant.formatted.name}
            isLocalSharing={screenSharingParticipant.formatted.isCurrentUser}
          />

          {/* Floating Chat Panel - Better positioned */}
          {showChat && (
            <div className="absolute top-4 right-4 w-[380px] h-[calc(100%-2rem)] bg-white rounded-2xl shadow-2xl z-30 overflow-hidden border border-gray-200">
              <ChatPanel 
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUserId={room.localParticipant.identity}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 hover:bg-gray-100 rounded-full z-50"
                onClick={() => setShowChat(false)}
              >
                ✕
              </Button>
            </div>
          )}

          {/* Floating Participants Panel - Better positioned */}
          {showParticipants && (
            <div className="absolute top-4 right-4 w-[340px] max-h-[calc(100%-2rem)] bg-white rounded-2xl shadow-2xl z-30 overflow-hidden border border-gray-200 slide-in-from-right">
              <ParticipantList participants={formattedParticipants.map(p => p.formatted)} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 left-3 hover:bg-gray-100 rounded-full z-50"
                onClick={() => setShowParticipants(false)}
              >
                ✕
              </Button>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="border-t bg-gray-800 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={showParticipants ? "default" : "secondary"}
                size="sm"
                onClick={() => setShowParticipants(!showParticipants)}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Participants ({participants.length})</span>
              </Button>
              <Button
                variant={showChat ? "default" : "secondary"}
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </Button>
            </div>

            <MediaControls
              isMuted={localParticipant?.formatted.isMuted || false}
              isCameraOn={localParticipant?.formatted.isCameraOn || false}
              isScreenSharing={localParticipant?.formatted.isScreenSharing || false}
              onToggleMute={toggleMicrophone}
              onToggleCamera={toggleCamera}
              onToggleScreenShare={toggleScreenShare}
            />

            <Button
              onClick={handleLeaveRoom}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Quitter</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Normal Gallery Layout
  const isSolo = formattedParticipants.length === 1;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950 relative overflow-hidden">
      {/* Animated background decorations for kids */}
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
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute top-1/3 right-1/4 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex z-10">
        {/* Video Grid */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          isSolo ? "p-0" : "p-3 sm:p-4"
        )}>
          <VideoGrid 
            participants={formattedParticipants.map(p => p.formatted)} 
            liveKitParticipants={formattedParticipants.map(p => p.liveKit)}
          />
        </div>

        {/* Floating Chat Panel - Right Side with better design */}
        {showChat && (
          <div className="absolute top-4 right-4 bottom-20 w-[380px] bg-white rounded-2xl shadow-2xl z-30 border border-gray-200 overflow-hidden">
            <ChatPanel 
              messages={messages}
              onSendMessage={handleSendMessage}
              currentUserId={room.localParticipant.identity}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 hover:bg-gray-100 rounded-full z-50"
              onClick={() => setShowChat(false)}
            >
              ✕
            </Button>
          </div>
        )}

        {/* Floating Participants Panel — right-side (Meet/Zoom style) */}
        {showParticipants && (
          <div className="absolute top-4 right-4 w-[340px] max-h-[calc(100vh-180px)] bg-white rounded-2xl shadow-2xl z-30 overflow-hidden border border-gray-200 slide-in-from-right">
            <ParticipantList participants={formattedParticipants.map(p => p.formatted)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 left-3 hover:bg-gray-100 rounded-full z-50"
              onClick={() => setShowParticipants(false)}
            >
              ✕
            </Button>
          </div>
        )}
      </div>

      {/* Controls Bar - floating glass morphism style */}
      <div className="relative z-20 border-t border-white/5 bg-black/40 backdrop-blur-xl p-3 sm:p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={showParticipants ? "default" : "secondary"}
                size="sm"
                onClick={() => setShowParticipants(!showParticipants)}
                className={cn(
                  "gap-2 rounded-full px-4 font-semibold transition-all",
                  showParticipants
                    ? "bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                    : "bg-white/10 hover:bg-white/20 text-white border-0"
                )}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">{participants.length}</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={showChat ? "default" : "secondary"}
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className={cn(
                  "gap-2 rounded-full px-4 font-semibold transition-all",
                  showChat
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/25"
                    : "bg-white/10 hover:bg-white/20 text-white border-0"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </Button>
            </motion.div>
          </div>

          {/* Center Controls */}
          <MediaControls
            isMuted={localParticipant?.formatted.isMuted || false}
            isCameraOn={localParticipant?.formatted.isCameraOn || false}
            isScreenSharing={localParticipant?.formatted.isScreenSharing || false}
            onToggleMute={toggleMicrophone}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={toggleScreenShare}
          />

          {/* Right Controls */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleLeaveRoom}
              size="sm"
              className="gap-2 rounded-full px-4 font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 border-0"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Quitter</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export const LiveKitRoom: React.FC<LiveKitRoomProps> = ({ roomId, onLeaveRoom }) => {
  const {
    error,
    serverUrl,
    token,
  } = useLiveKitRoom(roomId);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to connect to room: {error}</p>
        </div>
      </div>
    );
  }

  if (!serverUrl || !token) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading connection info...</p>
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