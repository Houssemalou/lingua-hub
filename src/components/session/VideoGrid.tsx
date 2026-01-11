import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp,
  User,
  Crown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHost?: boolean;
  isCurrentUser?: boolean;
  role?: 'professor' | 'student' | 'admin';
}

interface VideoGridProps {
  participants: Participant[];
  screenShareStream?: MediaStream | null;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
  isRTL?: boolean;
}

export function VideoGrid({
  participants,
  screenShareStream,
  localVideoRef,
  isRTL = false,
}: VideoGridProps) {
  const activeScreenSharer = participants.find(p => p.isScreenSharing);
  
  // Calculate grid layout based on participant count
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="space-y-4">
      {/* Screen Share View */}
      {activeScreenSharer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-video bg-muted rounded-xl overflow-hidden border border-border"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MonitorUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {activeScreenSharer.name} partage son écran
              </p>
            </div>
          </div>
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-success/20 text-success">
              <MonitorUp className="w-3 h-3 mr-1" />
              Partage d'écran
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Video Grid */}
      <div className={cn(
        "grid gap-3",
        getGridCols(participants.length)
      )}>
        {participants.map((participant) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative aspect-video rounded-xl overflow-hidden border-2 transition-all",
              participant.isCurrentUser
                ? "border-primary/50 bg-primary/5"
                : participant.isHost
                ? "border-accent/50 bg-accent/5"
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
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback className="text-2xl">
                        {participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                      Caméra activée
                    </span>
                  </div>
                )
              ) : (
                <div className="text-center">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback>
                      {participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>

            {/* Participant Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
              <div className={cn(
                "flex items-center justify-between",
                isRTL && "flex-row-reverse"
              )}>
                <div className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse"
                )}>
                  {participant.isHost && (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  )}
                  <span className="text-white text-sm font-medium truncate max-w-[120px]">
                    {participant.name}
                    {participant.isCurrentUser && ' (Vous)'}
                  </span>
                </div>
                <div className={cn(
                  "flex items-center gap-1",
                  isRTL && "flex-row-reverse"
                )}>
                  {participant.isScreenSharing && (
                    <div className="w-6 h-6 rounded-full bg-success/80 flex items-center justify-center">
                      <MonitorUp className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    participant.isCameraOn ? "bg-primary/80" : "bg-muted-foreground/50"
                  )}>
                    {participant.isCameraOn ? (
                      <Video className="w-3 h-3 text-white" />
                    ) : (
                      <VideoOff className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    participant.isMuted ? "bg-muted-foreground/50" : "bg-destructive/80"
                  )}>
                    {participant.isMuted ? (
                      <MicOff className="w-3 h-3 text-white" />
                    ) : (
                      <Mic className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Role Badge */}
            {participant.role && (
              <div className="absolute top-2 right-2">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
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
        ))}
      </div>
    </div>
  );
}
