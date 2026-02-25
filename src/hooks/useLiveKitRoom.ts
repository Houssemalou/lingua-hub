import { useEffect, useState, useCallback, useRef } from 'react';
import { Room, RoomEvent, Participant, RemoteParticipant, LocalParticipant } from 'livekit-client';
import { RoomService } from '@/services/RoomService';
import { useAuth } from '@/contexts/AuthContext';

export interface LiveKitParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHost?: boolean;
  isCurrentUser?: boolean;
  role?: 'professor' | 'student' | 'admin';
  isPicked?: boolean;
  isLocal: boolean;
  handRaised: boolean;
  isSpeaking: boolean;
}

export const useLiveKitRoom = (roomId: string) => {
  const [room] = useState(() => new Room());
  const [participants, setParticipants] = useState<LiveKitParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { user } = useAuth();
  const isConnectingRef = useRef(false);
  const eventListenersSetupRef = useRef(false);

  const updateParticipants = useCallback(() => {
    const participantList: LiveKitParticipant[] = [];

    // Add local participant
    const localParticipant = room.localParticipant;
    if (localParticipant) {
      const localRole: 'professor' | 'student' | 'admin' =
        (user?.role === 'professor' || user?.role === 'admin') ? 'professor' : 'student';

      participantList.push({
        id: localParticipant.identity,
        name: localParticipant.name || 'You',
        avatar: undefined, // TODO: get from user profile
        isMuted: localParticipant.isMicrophoneEnabled === false,
        isCameraOn: localParticipant.isCameraEnabled === true,
        isScreenSharing: localParticipant.isScreenShareEnabled === true,
        isHost: true, // Assume local user is host for now
        isCurrentUser: true,
        role: localRole,
        isPicked: false,
        isLocal: true,
        handRaised: false, // TODO: implement hand raising
        isSpeaking: localParticipant.isSpeaking,
      });
    }

    // Add remote participants
    room.remoteParticipants.forEach((participant: RemoteParticipant) => {
      // if you add metadata to the LiveKit participant you could detect role here
      participantList.push({
        id: participant.identity,
        name: participant.name || 'Anonymous',
        avatar: undefined, // TODO: get from user profile
        isMuted: participant.isMicrophoneEnabled === false,
        isCameraOn: participant.isCameraEnabled === true,
        isScreenSharing: participant.isScreenShareEnabled === true,
        isHost: false,
        isCurrentUser: false,
        role: 'student', // default assumption for remote users
        isPicked: false,
        isLocal: false,
        handRaised: false, // TODO: implement hand raising
        isSpeaking: participant.isSpeaking,
      });
    });

    setParticipants(participantList);
  }, [room, user]);

  // Set up event listeners once
  useEffect(() => {
    if (!eventListenersSetupRef.current) {
      eventListenersSetupRef.current = true;
      
      room.on(RoomEvent.Connected, () => {
        console.log('RoomEvent.Connected fired');
        setIsConnected(true);
        updateParticipants();
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity);
        updateParticipants();
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('Participant disconnected:', participant.identity);
        updateParticipants();
      });

      room.on(RoomEvent.TrackSubscribed, () => {
        updateParticipants();
      });

      room.on(RoomEvent.TrackUnsubscribed, () => {
        updateParticipants();
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('Disconnected from room, reason:', reason);
        setIsConnected(false);
      });

      room.on(RoomEvent.Reconnecting, () => {
        console.log('Reconnecting to room...');
      });

      room.on(RoomEvent.Reconnected, () => {
        console.log('Reconnected to room');
        setIsConnected(true);
      });

      room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        console.log('Connection quality changed:', quality, participant?.identity);
      });
    }
  }, [room, updateParticipants]);

  // Fetch token without connecting (connection is managed by LiveKitRoomComponent)
  useEffect(() => {
    const fetchToken = async () => {
      if (isConnectingRef.current || !user?.id) {
        return;
      }

      isConnectingRef.current = true;

      try {
        console.log('Getting LiveKit token for room:', roomId, 'user:', user.id);
        
        const tokenResponse = await RoomService.getLiveKitToken(roomId, user.id);
        
        console.log('Token response received:', tokenResponse);
        
        if (!tokenResponse.success || !tokenResponse.data) {
          const errorMessage = tokenResponse.error || 'Failed to get LiveKit token';
          console.error('Token error:', errorMessage);
          throw new Error(errorMessage);
        }

        const { token, serverUrl } = tokenResponse.data;

        if (!token || !serverUrl) {
          throw new Error('Invalid token or server URL received from backend');
        }

        console.log('LiveKit credentials ready:', { serverUrl, hasToken: !!token });

        setToken(token);
        setServerUrl(serverUrl);
        setError(null);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get LiveKit token';
        setError(errorMessage);
        console.error('LiveKit token error:', err);
      } finally {
        isConnectingRef.current = false;
      }
    };

    fetchToken();
  }, [user?.id, roomId]);

  const connectToRoom = useCallback(async () => {
    // This is now a no-op since LiveKitRoomComponent handles connection
    console.log('connectToRoom called but connection is managed by LiveKitRoomComponent');
  }, []);

  const disconnectFromRoom = useCallback(async () => {
    isConnectingRef.current = false;
    await room.disconnect();
    setIsConnected(false);
    setParticipants([]);
    setToken(null);
    setServerUrl(null);
  }, [room]);

  const toggleMicrophone = useCallback(async () => {
    if (room.localParticipant) {
      if (room.localParticipant.isMicrophoneEnabled) {
        await room.localParticipant.setMicrophoneEnabled(false);
      } else {
        await room.localParticipant.setMicrophoneEnabled(true);
      }
      updateParticipants();
    }
  }, [room, updateParticipants]);

  const toggleCamera = useCallback(async () => {
    if (room.localParticipant) {
      if (room.localParticipant.isCameraEnabled) {
        await room.localParticipant.setCameraEnabled(false);
      } else {
        await room.localParticipant.setCameraEnabled(true);
      }
      updateParticipants();
    }
  }, [room, updateParticipants]);

  const toggleScreenShare = useCallback(async () => {
    if (room.localParticipant) {
      if (room.localParticipant.isScreenShareEnabled) {
        await room.localParticipant.setScreenShareEnabled(false);
      } else {
        await room.localParticipant.setScreenShareEnabled(true);
      }
      updateParticipants();
    }
  }, [room, updateParticipants]);

  // Note: cleanup is handled by the component that uses this hook (LiveKitRoom.tsx)
  // Do not add a useEffect with room.disconnect() here as it causes reconnection loops

  return {
    room,
    participants,
    isConnected,
    error,
    serverUrl,
    token,
    connectToRoom,
    disconnectFromRoom,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
  };
};