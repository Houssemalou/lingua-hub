import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp,
  Crown,
  Hand,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VideoTrack, AudioTrack } from '@livekit/components-react';
import { Participant as LiveKitParticipant, TrackPublication, Track } from 'livekit-client';

export interface Participant {
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
}

interface ParticipantCardProps {
  participant: Participant;
  liveKitParticipant?: LiveKitParticipant;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
  isRTL?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ParticipantCard({
  participant,
  liveKitParticipant,
  localVideoRef,
  isRTL = false,
  size = 'medium',
}: ParticipantCardProps) {
  // Get video and screen share tracks from LiveKit participant
  const videoPublication = liveKitParticipant ? Array.from(liveKitParticipant.videoTrackPublications.values())
    .find(pub => pub.source === Track.Source.Camera) : undefined;
  const videoTrack = videoPublication?.track;
  
  const screenSharePublication = liveKitParticipant ? Array.from(liveKitParticipant.videoTrackPublications.values())
    .find(pub => pub.source === Track.Source.ScreenShare) : undefined;
  const screenShareTrack = screenSharePublication?.track;
  
  const audioPublication = liveKitParticipant ? Array.from(liveKitParticipant.audioTrackPublications.values())[0] : undefined;
  const audioTrack = audioPublication?.track;
  
  const sizeClasses = {
    small: 'h-32 sm:h-40',
    medium: 'h-48 sm:h-56 lg:h-64',
    large: 'h-full min-h-[300px]',
  };

  const avatarSizes = {
    small: 'w-10 h-10 sm:w-12 sm:h-12',
    medium: 'w-14 h-14 sm:w-16 sm:h-16',
    large: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative w-full rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 shadow-md",
        sizeClasses[size],
        participant.isCurrentUser
          ? "border-blue-400 ring-2 ring-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
          : participant.isHost
          ? "border-purple-400 ring-2 ring-purple-200 bg-gradient-to-br from-purple-50 to-pink-50"
          : participant.isPicked
          ? "border-green-400 ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
          : "border-gray-200 bg-white",
        participant.isCameraOn && "bg-black"
      )}
    >
      {/* Video or Avatar placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Display screen share if available */}
        {participant.isScreenSharing && screenShareTrack ? (
          <VideoTrack
            trackRef={{ participant: liveKitParticipant!, publication: screenSharePublication!, source: Track.Source.ScreenShare }}
            className="w-full h-full object-contain bg-black"
          />
        ) : participant.isCameraOn && videoTrack ? (
          /* Display camera video */
          <>
            <VideoTrack
              trackRef={{ participant: liveKitParticipant!, publication: videoPublication!, source: Track.Source.Camera }}
              className="w-full h-full object-cover"
            />
            {audioTrack && audioPublication && (
              <AudioTrack
                trackRef={{ participant: liveKitParticipant!, publication: audioPublication, source: Track.Source.Microphone }}
                volume={participant.isCurrentUser ? 0 : 1}
              />
            )}
          </>
        ) : (
          /* Display avatar when camera is off */
          <div className="text-center w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <Avatar className={avatarSizes[size]}>
              <AvatarImage src={participant.avatar} />
              <AvatarFallback className="text-xl">
                {participant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Picked indicator */}
      {participant.isPicked && (
        <div className="absolute top-2 left-2">
          <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center animate-pulse">
            <Hand className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        <div className={cn(
          "flex items-center justify-between gap-2",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn(
            "flex items-center gap-1.5 min-w-0 flex-1",
            isRTL && "flex-row-reverse"
          )}>
            {participant.isHost && (
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 drop-shadow-lg" />
            )}
            <span className="text-white text-sm sm:text-base font-semibold truncate drop-shadow-md">
              {participant.name}
              {participant.isCurrentUser && ' (Vous)'}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-1 sm:gap-1.5 flex-shrink-0",
            isRTL && "flex-row-reverse"
          )}>
            {participant.isScreenSharing && (
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500 shadow-md flex items-center justify-center">
                <MonitorUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
            <div className={cn(
              "w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-md flex items-center justify-center",
              participant.isCameraOn ? "bg-green-500" : "bg-red-500"
            )}>
              {participant.isCameraOn ? (
                <Video className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              ) : (
                <VideoOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              )}
            </div>
            <div className={cn(
              "w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-md flex items-center justify-center",
              participant.isMuted ? "bg-red-500" : "bg-green-500"
            )}>
              {participant.isMuted ? (
                <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              ) : (
                <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      {participant.role && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs sm:text-sm px-2 py-0.5 font-semibold shadow-md",
              participant.role === 'professor' && "bg-blue-500 text-white border-0",
              participant.role === 'student' && "bg-green-500 text-white border-0",
              participant.role === 'admin' && "bg-red-500 text-white border-0"
            )}
          >
            {participant.role === 'professor' ? 'Prof' : 
             participant.role === 'student' ? 'Élève' : 'Admin'}
          </Badge>
        </div>
      )}
    </motion.div>
  );
}
