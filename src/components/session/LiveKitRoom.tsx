import React, { useEffect } from 'react';
import { LiveKitRoom as LiveKitRoomComponent } from '@livekit/components-react';
import { Room } from 'livekit-client';
import { useLiveKitRoom } from '@/hooks/useLiveKitRoom';
import { VideoGrid } from './VideoGrid';
import { MediaControls } from './MediaControls';
import { ChatPanel } from './ChatPanel';
import { ParticipantList } from './ParticipantList';

interface LiveKitRoomProps {
  roomId: string;
  onLeaveRoom: () => void;
}

export const LiveKitRoom: React.FC<LiveKitRoomProps> = ({ roomId, onLeaveRoom }) => {
  const {
    room,
    participants,
    isConnected,
    error,
    connectToRoom,
    disconnectFromRoom,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    serverUrl,
    token,
  } = useLiveKitRoom(roomId);

  useEffect(() => {
    connectToRoom();

    return () => {
      disconnectFromRoom();
    };
  }, [roomId, connectToRoom, disconnectFromRoom]);

  const handleLeaveRoom = async () => {
    await disconnectFromRoom();
    onLeaveRoom();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to connect to room: {error}</p>
          <button
            onClick={connectToRoom}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !serverUrl || !token) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoomComponent 
      room={room} 
      connect={false}
    >
      <div className="flex flex-col h-full">
        {/* Video Grid */}
        <div className="flex-1">
          <VideoGrid participants={participants} />
        </div>

        {/* Controls */}
        <div className="border-t bg-white p-4">
          <MediaControls
            isMuted={participants.find(p => p.isLocal)?.isMuted || false}
            isCameraOn={participants.find(p => p.isLocal)?.isCameraOn || false}
            isScreenSharing={participants.find(p => p.isLocal)?.isScreenSharing || false}
            onToggleMute={toggleMicrophone}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={toggleScreenShare}
          />
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleLeaveRoom}
              className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Side Panels */}
        <div className="flex border-t bg-gray-50">
          <div className="w-80 border-r">
            <ParticipantList participants={participants} />
          </div>
          <div className="flex-1">
            <ChatPanel room={room} />
          </div>
        </div>
      </div>
    </LiveKitRoomComponent>
  );
};