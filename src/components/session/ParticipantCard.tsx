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
  localVideoRef?: React.RefObject<HTMLVideoElement>;
  isRTL?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ParticipantCard({
  participant,
  localVideoRef,
  isRTL = false,
  size = 'medium',
}: ParticipantCardProps) {
  const sizeClasses = {
    small: 'h-24 sm:h-28',
    medium: 'h-32 sm:h-40',
    large: 'h-40 sm:h-48 lg:h-56',
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
        "relative w-full rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
        sizeClasses[size],
        participant.isCurrentUser
          ? "border-primary/50 bg-primary/5"
          : participant.isHost
          ? "border-accent/50 bg-accent/5"
          : participant.isPicked
          ? "border-success/50 bg-success/5 ring-2 ring-success/30"
          : "border-border bg-muted/50",
        participant.isCameraOn && "bg-card"
      )}
    >
      {/* Video or Avatar placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        {participant.isCameraOn ? (
          participant.isCurrentUser && localVideoRef ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Avatar className={avatarSizes[size]}>
                <AvatarImage src={participant.avatar} />
                <AvatarFallback className="text-xl">
                  {participant.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          )
        ) : (
          <div className="text-center">
            <Avatar className={avatarSizes[size]}>
              <AvatarImage src={participant.avatar} />
              <AvatarFallback>
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
      <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className={cn(
          "flex items-center justify-between gap-1",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn(
            "flex items-center gap-1 min-w-0 flex-1",
            isRTL && "flex-row-reverse"
          )}>
            {participant.isHost && (
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />
            )}
            <span className="text-white text-xs sm:text-sm font-medium truncate">
              {participant.name}
              {participant.isCurrentUser && ' (Vous)'}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-0.5 sm:gap-1 flex-shrink-0",
            isRTL && "flex-row-reverse"
          )}>
            {participant.isScreenSharing && (
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-success/80 flex items-center justify-center">
                <MonitorUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </div>
            )}
            <div className={cn(
              "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center",
              participant.isCameraOn ? "bg-primary/80" : "bg-muted-foreground/50"
            )}>
              {participant.isCameraOn ? (
                <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              ) : (
                <VideoOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              )}
            </div>
            <div className={cn(
              "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center",
              participant.isMuted ? "bg-muted-foreground/50" : "bg-destructive/80"
            )}>
              {participant.isMuted ? (
                <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              ) : (
                <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      {participant.role && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-[10px] sm:text-xs px-1.5 py-0.5",
              participant.role === 'professor' && "bg-primary/20 text-primary",
              participant.role === 'student' && "bg-accent/20 text-accent-foreground",
              participant.role === 'admin' && "bg-destructive/20 text-destructive"
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
