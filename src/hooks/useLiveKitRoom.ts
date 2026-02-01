import { useEffect, useState, useCallback } from 'react';
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

  const updateParticipants = useCallback(() => {
    const participantList: LiveKitParticipant[] = [];

    // Add local participant
    const localParticipant = room.localParticipant;
    if (localParticipant) {
      participantList.push({
        id: localParticipant.identity,
        name: localParticipant.name || 'You',
        avatar: undefined, // TODO: get from user profile
        isMuted: localParticipant.isMicrophoneEnabled === false,
        isCameraOn: localParticipant.isCameraEnabled === true,
        isScreenSharing: localParticipant.isScreenShareEnabled === true,
        isHost: true, // Assume local user is host for now
        isCurrentUser: true,
        role: 'professor', // TODO: get from user context
        isPicked: false,
        isLocal: true,
        handRaised: false, // TODO: implement hand raising
        isSpeaking: localParticipant.isSpeaking,
      });
    }

    // Add remote participants
    room.remoteParticipants.forEach((participant: RemoteParticipant) => {
      participantList.push({
        id: participant.identity,
        name: participant.name || 'Anonymous',
        avatar: undefined, // TODO: get from user profile
        isMuted: participant.isMicrophoneEnabled === false,
        isCameraOn: participant.isCameraEnabled === true,
        isScreenSharing: participant.isScreenShareEnabled === true,
        isHost: false,
        isCurrentUser: false,
        role: 'student', // TODO: get from participant metadata
        isPicked: false,
        isLocal: false,
        handRaised: false, // TODO: implement hand raising
        isSpeaking: participant.isSpeaking,
      });
    });

    setParticipants(participantList);
  }, [room]);

  const connectToRoom = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      // Get token from backend
      const tokenResponse = await RoomService.getLiveKitToken(roomId, user.id);
      if (!tokenResponse.success || !tokenResponse.data) {
        const errorMessage = tokenResponse.error || 'Failed to get LiveKit token';
        throw new Error(errorMessage);
      }

      const token = tokenResponse.data.token;
      const serverUrl = tokenResponse.data.serverUrl;

      // Validate token and serverUrl
      if (!token || !serverUrl) {
        throw new Error('Invalid token or server URL received from backend');
      }

      if (typeof serverUrl !== 'string' || !serverUrl.trim()) {
        throw new Error('Server URL is empty or invalid');
      }

      if (typeof token !== 'string' || !token.trim()) {
        throw new Error('Token is empty or invalid');
      }

      // Save token + serverUrl for consumers (components) and for debugging
      setToken(token);
      setServerUrl(serverUrl);

      // Connect to LiveKit room
      await room.connect(serverUrl, token);
      setIsConnected(true);
      setError(null);

      // Set up event listeners
      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        updateParticipants();
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        updateParticipants();
      });

      room.on(RoomEvent.TrackSubscribed, () => {
        updateParticipants();
      });

      room.on(RoomEvent.TrackUnsubscribed, () => {
        updateParticipants();
      });

      updateParticipants();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to room';
      setError(errorMessage);
      console.error('LiveKit connection error:', err);
    }
  }, [user?.id, roomId, room, updateParticipants]);

  const disconnectFromRoom = useCallback(async () => {
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

  useEffect(() => {
    return () => {
      room.disconnect();
    };
  }, [room]);

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