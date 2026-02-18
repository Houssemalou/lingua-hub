import React, { useEffect, useRef, useState } from 'react';
import { LiveKitRoom as LiveKitRoomComponent, useParticipants, useRoomContext } from '@livekit/components-react';
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import { useLiveKitRoom, LiveKitParticipant } from '@/hooks/useLiveKitRoom';
import { VideoGrid } from './VideoGrid';
import { MediaControls } from './MediaControls';
import { ChatPanel } from './ChatPanel';
import { ParticipantList } from './ParticipantList';
import { ScreenShareLayout } from './ScreenShareLayout';
import { PhoneOff, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LiveKitRoomProps {
  roomId: string;
  onLeaveRoom: () => void;
}

// Inner component that has access to LiveKit context
const RoomContent: React.FC<{ onLeaveRoom: () => void }> = ({ onLeaveRoom }) => {
  const participants = useParticipants();
  const room = useRoomContext();
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [messages, setMessages] = useState<import('./ChatPanel').ChatMessage[]>([]);

  // Ensure AudioContext is resumed after first user gesture to satisfy browser autoplay policy
  React.useEffect(() => {
    const resumeAudioOnGesture = () => {
      try {
        const globalWin = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
        const AC = globalWin.AudioContext ?? globalWin.webkitAudioContext;
        if (AC) {
          const ctx = new AC();
          if (ctx.state === 'suspended') {
            void ctx.resume();
          }
          // close temporary context shortly after
          void setTimeout(() => void ctx.close(), 1000);
        }
      } catch (e) {
        // ignore
      }
      document.removeEventListener('pointerdown', resumeAudioOnGesture);
    };

    document.addEventListener('pointerdown', resumeAudioOnGesture, { once: true });
    return () => document.removeEventListener('pointerdown', resumeAudioOnGesture);
  }, []);

  
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

  const toggleMicrophone = async () => {
    await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);
  };

  const toggleCamera = async () => {
    await room.localParticipant.setCameraEnabled(!room.localParticipant.isCameraEnabled);
  };

  const toggleScreenShare = async () => {
    await room.localParticipant.setScreenShareEnabled(!room.localParticipant.isScreenShareEnabled);
  };

  // Chat via LiveKit data channel
  React.useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, participant: RemoteParticipant) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));
        if (data?.type === 'chat' && data.message) {
          const newMessage = {
            id: `${participant.identity}-${data.timestamp || Date.now()}`,
            type: 'chat',
            message: data.message,
            timestamp: data.timestamp || Date.now(),
            sender: { id: participant.identity, name: participant.name || 'Anonymous' }
          } as import('./ChatPanel').ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (err) {
        console.error('invalid dataReceived payload', err);
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => { room.off('dataReceived', handleDataReceived); };
  }, [room]);

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    const chatMessage = { type: 'chat', message: message.trim(), timestamp: Date.now() };
    try {
      room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(chatMessage)), { reliable: true });
    } catch (e) {
      console.error('failed to publish chat', e);
    }

    const localMsg: import('./ChatPanel').ChatMessage = {
      id: `${room.localParticipant.identity}-${Date.now()}`,
      type: 'chat',
      message: message.trim(),
      timestamp: Date.now(),
      sender: { id: room.localParticipant.identity, name: room.localParticipant.name || 'You' }
    };
    setMessages(prev => [...prev, localMsg]);
  };

  const handleLeaveRoom = async () => {
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

          {/* Floating Chat Panel */}
          {showChat && (
            <div className="absolute top-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-30 overflow-hidden">
              <ChatPanel messages={messages} onSendMessage={handleSendMessage} currentUserId={room.localParticipant.identity} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setShowChat(false)}
              >
                ✕
              </Button>
            </div>
          )}

          {/* Floating Participants Panel */}
          {showParticipants && (
            <div className="absolute top-4 left-4 w-80 h-[500px] bg-white rounded-lg shadow-2xl z-30 overflow-hidden">
              <ParticipantList participants={formattedParticipants.map(p => p.formatted)} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
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
  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Main Content Area */}
      <div className="flex-1 relative flex">
        {/* Video Grid - Takes remaining space */}
        <div className={cn(
          "flex-1 p-4 transition-all duration-300",
          showChat && "mr-96"
        )}>
          <VideoGrid 
            participants={formattedParticipants.map(p => p.formatted)} 
            liveKitParticipants={formattedParticipants.map(p => p.liveKit)}
          />
        </div>

        {/* Floating Chat Panel - Right Side */}
        {showChat && (
          <div className="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-2xl z-30 border-l border-gray-200">
            <ChatPanel messages={messages} onSendMessage={handleSendMessage} currentUserId={room.localParticipant.identity} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 hover:bg-gray-100"
              onClick={() => setShowChat(false)}
            >
              ✕
            </Button>
          </div>
        )}

        {/* Floating Participants Panel - Left Side */}
        {showParticipants && (
          <div className="absolute top-4 left-4 w-80 max-h-[calc(100%-2rem)] bg-white rounded-lg shadow-2xl z-30 overflow-hidden">
            <ParticipantList participants={formattedParticipants.map(p => p.formatted)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 hover:bg-gray-100"
              onClick={() => setShowParticipants(false)}
            >
              ✕
            </Button>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="border-t bg-gray-800 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={showParticipants ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{participants.length}</span>
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
      <RoomContent onLeaveRoom={onLeaveRoom} />
    </LiveKitRoomComponent>
  );
};