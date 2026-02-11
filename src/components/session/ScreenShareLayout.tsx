import React from 'react';
import { motion } from 'framer-motion';
import { MonitorUp, Maximize2, Minimize2 } from 'lucide-react';
import { VideoTrack, AudioTrack } from '@livekit/components-react';
import { Participant as LiveKitParticipant, Track } from 'livekit-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ScreenShareLayoutProps {
  screenShareParticipant: LiveKitParticipant;
  localParticipant?: LiveKitParticipant;
  participantName: string;
  isLocalSharing: boolean;
}

export const ScreenShareLayout: React.FC<ScreenShareLayoutProps> = ({
  screenShareParticipant,
  localParticipant,
  participantName,
  isLocalSharing,
}) => {
  const [isPiPMinimized, setIsPiPMinimized] = React.useState(false);

  // Get screen share track
  const screenSharePublication = Array.from(screenShareParticipant.videoTrackPublications.values())
    .find(pub => pub.source === Track.Source.ScreenShare);
  const screenShareTrack = screenSharePublication?.track;

  // Get local camera track if sharing locally
  const localVideoPublication = localParticipant && Array.from(localParticipant.videoTrackPublications.values())
    .find(pub => pub.source === Track.Source.Camera);
  const localVideoTrack = localVideoPublication?.track;
  const localAudioPublication = localParticipant && Array.from(localParticipant.audioTrackPublications.values())[0];
  const localAudioTrack = localAudioPublication?.track;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Main Screen Share View - Takes maximum space */}
      <div className="w-full h-full flex items-center justify-center p-4">
        {screenShareTrack && screenSharePublication ? (
          <VideoTrack
            trackRef={{ 
              participant: screenShareParticipant, 
              publication: screenSharePublication, 
              source: Track.Source.ScreenShare 
            }}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center text-white">
            <MonitorUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">En attente du partage d'écran...</p>
          </div>
        )}
      </div>

      {/* Screen Share Label */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <Badge className="bg-blue-600/95 hover:bg-blue-600 text-white border-0 text-sm py-2 px-4 shadow-lg">
          <MonitorUp className="w-4 h-4 mr-2" />
          {participantName} partage son écran
        </Badge>
      </div>

      {/* Picture-in-Picture: Local Camera (only when sharing locally) */}
      {isLocalSharing && localParticipant && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: isPiPMinimized ? 0.85 : 1, 
            scale: 1 
          }}
          className={cn(
            "absolute z-20 rounded-xl overflow-hidden border-2 border-white shadow-2xl transition-all",
            isPiPMinimized ? "bottom-4 right-4 w-32 h-24" : "bottom-6 right-6 w-72 h-52"
          )}
        >
          {/* PiP Controls */}
          <div className="absolute top-2 right-2 z-30">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsPiPMinimized(!isPiPMinimized)}
            >
              {isPiPMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Camera View */}
          <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
            {localVideoTrack && localVideoPublication ? (
              <>
                <VideoTrack
                  trackRef={{ 
                    participant: localParticipant, 
                    publication: localVideoPublication, 
                    source: Track.Source.Camera 
                  }}
                  className="w-full h-full object-cover"
                />
                {!isPiPMinimized && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                      Vous
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar className={isPiPMinimized ? "w-12 h-12" : "w-20 h-20"}>
                  <AvatarFallback className="bg-blue-500 text-white text-xl">
                    {participantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Audio Track (muted) */}
          {localAudioTrack && localAudioPublication && (
            <AudioTrack
              trackRef={{ 
                participant: localParticipant, 
                publication: localAudioPublication, 
                source: Track.Source.Microphone 
              }}
              volume={0}
            />
          )}
        </motion.div>
      )}
    </div>
  );
};
