import React, { useMemo, useState } from 'react';
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
  maxVisibleParticipants = 9,
}: VideoGridProps) {
  // Pagination state
  const [page, setPage] = useState(0);
  // Helper to find LiveKit participant by ID
  const getLiveKitParticipant = (participantId: string) => {
    return liveKitParticipants.find(p => p.identity === participantId);
  };

  const activeScreenSharer = participants.find(p => p.isScreenSharing);
  

  // Focus speaker: always show the most recently speaking participant first
  const sortedParticipants = useMemo(() => {
    // Prioritize host (professor), then speakers, then others
    const withSpeaking = participants as (Participant & { isSpeaking?: boolean; isHost?: boolean })[];
    const host = withSpeaking.filter(p => p.isHost);
    const speakers = withSpeaking.filter(p => !p.isHost && p.isSpeaking);
    const others = withSpeaking.filter(p => !p.isHost && !p.isSpeaking);
    // Show: host, then up to 8 others (speakers first)
    return [...host, ...speakers, ...others];
  }, [participants]);

  // Pagination logic
  // Always show host (prof), then 8 others per page
  const host = sortedParticipants.find(p => (p as Participant).isHost);
  const others = sortedParticipants.filter(p => !(p as Participant).isHost);
  const totalPages = Math.ceil(others.length / (maxVisibleParticipants - 1));
  const paginatedOthers = others.slice(page * (maxVisibleParticipants - 1), (page + 1) * (maxVisibleParticipants - 1));
  const paginatedParticipants = host ? [host, ...paginatedOthers] : paginatedOthers;

  // Calculate grid layout based on visible participants
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-2 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-3 lg:grid-cols-4';
  };

  // Get card size based on number of visible participants
  const getCardSize = (count: number): 'small' | 'medium' | 'large' | 'full' => {
    if (count === 1) return 'full';
    if (count <= 2) return 'large';
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mb-2">
          <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            Précédent
          </Button>
          <span className="text-xs text-white/80">Page {page + 1} / {totalPages}</span>
          <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
            Suivant
          </Button>
        </div>
      )}

      {/* Main Video Grid - paginated */}
      <div className={cn(
        "flex-1 grid gap-2 sm:gap-4 items-stretch h-full",
        getGridCols(paginatedParticipants.length)
      )}>
        {paginatedParticipants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            liveKitParticipant={getLiveKitParticipant(participant.id)}
            localVideoRef={participant.isCurrentUser ? localVideoRef : undefined}
            isRTL={isRTL}
            size={getCardSize(paginatedParticipants.length)}
          />
        ))}
      </div>
    </div>
  );
}

// Re-export Participant type for convenience
export type { Participant };
