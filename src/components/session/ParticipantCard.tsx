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
  Star,
  Sparkles,
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
  size?: 'small' | 'medium' | 'large' | 'full';
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
  
  const isFull = size === 'full';

  const sizeClasses = {
    small: 'h-32 sm:h-40',
    medium: 'h-48 sm:h-56 lg:h-64',
    large: 'h-full min-h-[300px]',
    full: 'w-full h-full',
  };

  const avatarSizes = {
    small: 'w-10 h-10 sm:w-12 sm:h-12',
    medium: 'w-14 h-14 sm:w-16 sm:h-16',
    large: 'w-16 h-16 sm:w-20 sm:h-20',
    full: 'w-24 h-24 sm:w-32 sm:h-32',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={cn(
        "relative overflow-hidden transition-all flex-shrink-0",
        sizeClasses[size],
        isFull
          ? "rounded-none border-0 shadow-none"
          : "w-full rounded-2xl border-2 shadow-lg",
        !isFull && participant.isCurrentUser
          ? "border-cyan-400 ring-2 ring-cyan-300/40"
          : !isFull && participant.isHost
          ? "border-violet-400 ring-2 ring-violet-300/40"
          : !isFull && participant.isPicked
          ? "border-emerald-400 ring-2 ring-emerald-300/40"
          : !isFull && "border-white/10",
        participant.isCameraOn ? "bg-black" : "bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950"
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
          /* Display avatar when camera is off - fun animated background */
          <div className="text-center w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900 flex items-center justify-center relative overflow-hidden">
            {/* Animated floating shapes for kid-friendly feel */}
            <motion.div
              animate={{ y: [-8, 8, -8], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[10%] left-[10%] text-yellow-400/20"
            >
              <Star className="w-8 h-8 sm:w-12 sm:h-12" fill="currentColor" />
            </motion.div>
            <motion.div
              animate={{ y: [6, -6, 6], rotate: [0, -15, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-[15%] right-[12%] text-pink-400/20"
            >
              <Sparkles className="w-6 h-6 sm:w-10 sm:h-10" />
            </motion.div>
            <motion.div
              animate={{ y: [4, -4, 4], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-[20%] right-[20%] text-cyan-400/15"
            >
              <Star className="w-5 h-5 sm:w-7 sm:h-7" fill="currentColor" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Avatar className={cn(avatarSizes[size], "ring-4 ring-white/20 shadow-2xl")}>
                <AvatarImage src={participant.avatar} />
                <AvatarFallback className={cn(
                  "bg-gradient-to-br from-cyan-500 to-violet-600 text-white font-bold",
                  isFull ? "text-5xl" : "text-xl"
                )}>
                  {participant.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
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
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent",
        isFull ? "p-4 sm:p-6" : "p-2 sm:p-3"
      )}>
        <div className={cn(
          "flex items-center justify-between gap-2",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn(
            "flex items-center gap-2 min-w-0 flex-1",
            isRTL && "flex-row-reverse"
          )}>
            {participant.isHost && (
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Crown className={cn(
                  "text-amber-400 flex-shrink-0 drop-shadow-lg",
                  isFull ? "w-6 h-6 sm:w-7 sm:h-7" : "w-4 h-4 sm:w-5 sm:h-5"
                )} />
              </motion.div>
            )}
            <span className={cn(
              "text-white font-semibold truncate drop-shadow-md",
              isFull ? "text-lg sm:text-xl" : "text-sm sm:text-base"
            )}>
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

      {/* Role Badge - fun pill style */}
      {participant.role && (
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className={cn(
            "absolute",
            isFull ? "top-4 right-4 sm:top-5 sm:right-5" : "top-2 right-2 sm:top-3 sm:right-3"
          )}
        >
          <Badge 
            variant="secondary" 
            className={cn(
              "font-bold shadow-lg border-0 backdrop-blur-sm",
              isFull ? "text-sm sm:text-base px-3 py-1 rounded-full" : "text-xs sm:text-sm px-2 py-0.5 rounded-full",
              participant.role === 'professor' && "bg-blue-500/90 text-white",
              participant.role === 'student' && "bg-emerald-500/90 text-white",
              participant.role === 'admin' && "bg-rose-500/90 text-white"
            )}
          >
            {participant.role === 'professor' ? '🎓 Prof' : 
             participant.role === 'student' ? '⭐ Élève' : '🛡️ Admin'}
          </Badge>
        </motion.div>
      )}
    </motion.div>
  );
}
