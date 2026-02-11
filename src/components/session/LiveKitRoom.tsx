import React, { useEffect, useRef, useState } from 'react';
import { LiveKitRoom as LiveKitRoomComponent, useParticipants, useRoomContext } from '@livekit/components-react';
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import { useLiveKitRoom, LiveKitParticipant } from '@/hooks/useLiveKitRoom';
import { VideoGrid } from './VideoGrid';
import { MediaControls } from './MediaControls';
import { ChatPanel, ChatMessage } from './ChatPanel';
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
            <div className="absolute top-4 left-4 w-[340px] max-h-[calc(100%-2rem)] bg-white rounded-2xl shadow-2xl z-30 overflow-hidden border border-gray-200">
              <ParticipantList participants={formattedParticipants.map(p => p.formatted)} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 hover:bg-gray-100 rounded-full z-50"
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
          "flex-1 p-4 transition-all duration-300"
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

        {/* Floating Participants Panel - Left Side with better design */}
        {showParticipants && (
          <div className="absolute top-4 left-4 w-[340px] max-h-[calc(100vh-180px)] bg-white rounded-2xl shadow-2xl z-30 overflow-hidden border border-gray-200">
            <ParticipantList participants={formattedParticipants.map(p => p.formatted)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 hover:bg-gray-100 rounded-full z-50"
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