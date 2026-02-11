import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ParticipantCard, Participant } from './ParticipantCard';
import { LiveKitParticipant } from '@/hooks/useLiveKitRoom';
import type { Participant as LiveKitParticipantType } from 'livekit-client';

interface VideoGridProps {
  participants: (Participant | LiveKitParticipant)[];
  liveKitParticipants?: LiveKitParticipantType[];
  screenShareStream?: MediaStream | null;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
  isRTL?: boolean;
  maxVisibleParticipants?: number;
}

export function VideoGrid({
  participants,
  liveKitParticipants = [],
  screenShareStream,
  localVideoRef,
  isRTL = false,
  maxVisibleParticipants = 8,
}: VideoGridProps) {
  // Helper to find LiveKit participant by ID
  const getLiveKitParticipant = (participantId: string) => {
    return liveKitParticipants.find(p => p.identity === participantId);
  };

  const activeScreenSharer = participants.find(p => p.isScreenSharing);
  
  // All participants visible - no carousel
  const mainParticipants = participants;

  // Calculate grid layout based on participant count - optimized for full screen
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 lg:grid-cols-2';
    if (count === 3) return 'grid-cols-1 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-2 lg:grid-cols-2';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
    if (count <= 9) return 'grid-cols-3 lg:grid-cols-3';
    return 'grid-cols-3 lg:grid-cols-4';
  };

  // Get card size based on number of visible participants - larger cards
  const getCardSize = (count: number): 'small' | 'medium' | 'large' => {
    if (count === 1) return 'large';
    if (count <= 4) return 'large';
    if (count <= 6) return 'medium';
    return 'small';
  };

  return (
    <div className="h-full flex flex-col space-y-3 sm:space-y-4">
      {/* Participant Count Badge */}
      {participants.length > 1 && (
        <div className="flex items-center justify-between px-2">
          <Badge variant="outline" className="gap-1.5 bg-white/10 text-white border-white/20">
            <Users className="w-3 h-3" />
            {participants.length} participant{participants.length > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Main Video Grid - Takes all available space */}
      <div className={cn(
        "flex-1 grid gap-2 sm:gap-4 content-center",
        getGridCols(mainParticipants.length)
      )}>
        {mainParticipants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            liveKitParticipant={getLiveKitParticipant(participant.id)}
            localVideoRef={participant.isCurrentUser ? localVideoRef : undefined}
            isRTL={isRTL}
            size={getCardSize(mainParticipants.length)}
          />
        ))}
      </div>
    </div>
  );
}

// Re-export Participant type for convenience
export type { Participant };
