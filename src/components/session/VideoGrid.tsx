import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MonitorUp,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ParticipantCard, Participant } from './ParticipantCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface VideoGridProps {
  participants: Participant[];
  screenShareStream?: MediaStream | null;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
  isRTL?: boolean;
  maxVisibleParticipants?: number;
}

export function VideoGrid({
  participants,
  screenShareStream,
  localVideoRef,
  isRTL = false,
  maxVisibleParticipants = 8,
}: VideoGridProps) {
  const activeScreenSharer = participants.find(p => p.isScreenSharing);
  
  // Separate host/current user (priority) from other participants
  const { priorityParticipants, otherParticipants } = useMemo(() => {
    const priority = participants.filter(p => p.isHost || p.isCurrentUser || p.isPicked);
    const others = participants.filter(p => !p.isHost && !p.isCurrentUser && !p.isPicked);
    return { priorityParticipants: priority, otherParticipants: others };
  }, [participants]);

  // Calculate how many participants to show in main grid vs carousel
  const showCarousel = participants.length > maxVisibleParticipants;
  
  // Get participants for main display (up to 4 for main grid when many participants)
  const mainDisplayCount = showCarousel ? Math.min(4, priorityParticipants.length) : participants.length;
  const mainParticipants = showCarousel 
    ? priorityParticipants.slice(0, mainDisplayCount)
    : participants;
  
  // Carousel participants (the rest)
  const carouselParticipants = showCarousel 
    ? [...priorityParticipants.slice(mainDisplayCount), ...otherParticipants]
    : [];

  // Calculate grid layout based on participant count
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  // Get card size based on number of visible participants
  const getCardSize = (count: number): 'small' | 'medium' | 'large' => {
    if (count <= 2) return 'large';
    if (count <= 4) return 'medium';
    return 'small';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Screen Share View */}
      <AnimatePresence>
        {activeScreenSharer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative aspect-video bg-muted rounded-xl overflow-hidden border border-border"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MonitorUp className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 opacity-50" />
                <p className="text-base sm:text-lg font-medium">
                  {activeScreenSharer.name} partage son écran
                </p>
              </div>
            </div>
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex items-center gap-2">
              <Badge variant="secondary" className="bg-success/20 text-success text-xs sm:text-sm">
                <MonitorUp className="w-3 h-3 mr-1" />
                Partage d'écran
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participant Count Badge */}
      {participants.length > 4 && (
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="gap-1.5">
            <Users className="w-3 h-3" />
            {participants.length} participants
          </Badge>
          {showCarousel && (
            <span className="text-xs text-muted-foreground">
              Faites défiler pour voir tous les participants
            </span>
          )}
        </div>
      )}

      {/* Main Video Grid */}
      <div className={cn(
        "grid gap-2 sm:gap-3",
        getGridCols(mainParticipants.length)
      )}>
        {mainParticipants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            localVideoRef={participant.isCurrentUser ? localVideoRef : undefined}
            isRTL={isRTL}
            size={getCardSize(mainParticipants.length)}
          />
        ))}
      </div>

      {/* Carousel for additional participants (Teams-style) */}
      {showCarousel && carouselParticipants.length > 0 && (
        <div className="relative">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 sm:-ml-3">
              {carouselParticipants.map((participant) => (
                <CarouselItem 
                  key={participant.id} 
                  className="pl-2 sm:pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <ParticipantCard
                    participant={participant}
                    isRTL={isRTL}
                    size="small"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious 
              className="hidden sm:flex -left-3 sm:-left-4 h-8 w-8 sm:h-10 sm:w-10" 
            />
            <CarouselNext 
              className="hidden sm:flex -right-3 sm:-right-4 h-8 w-8 sm:h-10 sm:w-10" 
            />
          </Carousel>
          
          {/* Mobile swipe hint */}
          <div className="sm:hidden flex justify-center mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="w-3 h-3" />
              <span>Glissez pour voir plus</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export Participant type for convenience
export type { Participant };
