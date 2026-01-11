import { useState, useCallback, useRef, useEffect } from 'react';

interface UseMediaStreamOptions {
  onError?: (error: Error) => void;
}

interface MediaStreamState {
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
}

export function useMediaStream(options: UseMediaStreamOptions = {}) {
  const { onError } = options;
  
  const [state, setState] = useState<MediaStreamState>({
    isMuted: true,
    isCameraOn: false,
    isScreenSharing: false,
    localStream: null,
    screenStream: null,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Toggle microphone
  const toggleMute = useCallback(() => {
    setState(prev => {
      if (prev.localStream) {
        const audioTracks = prev.localStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = prev.isMuted;
        });
      }
      return { ...prev, isMuted: !prev.isMuted };
    });
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    try {
      if (state.isCameraOn) {
        // Turn off camera
        if (state.localStream) {
          const videoTracks = state.localStream.getVideoTracks();
          videoTracks.forEach(track => {
            track.stop();
            state.localStream?.removeTrack(track);
          });
        }
        setState(prev => ({ ...prev, isCameraOn: false }));
      } else {
        // Turn on camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: !state.localStream,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setState(prev => ({
          ...prev,
          isCameraOn: true,
          localStream: stream,
        }));
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
      onError?.(error as Error);
    }
  }, [state.isCameraOn, state.localStream, onError]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (state.isScreenSharing) {
        // Stop screen sharing
        if (state.screenStream) {
          state.screenStream.getTracks().forEach(track => track.stop());
        }
        setState(prev => ({
          ...prev,
          isScreenSharing: false,
          screenStream: null,
        }));
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor',
          },
          audio: true,
        });

        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setState(prev => ({
            ...prev,
            isScreenSharing: false,
            screenStream: null,
          }));
        };

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        setState(prev => ({
          ...prev,
          isScreenSharing: true,
          screenStream: stream,
        }));
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        onError?.(error as Error);
      }
    }
  }, [state.isScreenSharing, state.screenStream, onError]);

  // Request microphone permission
  const requestMicrophoneAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setState(prev => ({
        ...prev,
        localStream: stream,
        isMuted: true,
      }));
      // Mute by default
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      return true;
    } catch (error) {
      console.error('Error requesting microphone access:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
      }
      if (state.screenStream) {
        state.screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    requestMicrophoneAccess,
    localVideoRef,
    screenVideoRef,
  };
}
