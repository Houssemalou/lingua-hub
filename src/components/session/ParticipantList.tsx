import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Crown, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveKitParticipant } from '@/hooks/useLiveKitRoom';

interface ParticipantListProps {
  participants: LiveKitParticipant[];
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ participants }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Participants ({participants.length})</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors",
                participant.isCurrentUser && "bg-blue-50"
              )}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={participant.avatar} />
                <AvatarFallback>
                  {participant.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {participant.name}
                    {participant.isCurrentUser && " (You)"}
                  </span>
                  {participant.isHost && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                  {participant.handRaised && (
                    <Hand className="w-4 h-4 text-orange-500" />
                  )}
                </div>

                <div className="flex items-center gap-1 mt-1">
                  {participant.role && (
                    <Badge variant="secondary" className="text-xs">
                      {participant.role}
                    </Badge>
                  )}
                  {participant.isSpeaking && (
                    <Badge variant="default" className="text-xs bg-green-500">
                      Speaking
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {participant.isMuted ? (
                  <MicOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Mic className="w-4 h-4 text-green-500" />
                )}

                {participant.isCameraOn ? (
                  <Video className="w-4 h-4 text-green-500" />
                ) : (
                  <VideoOff className="w-4 h-4 text-gray-500" />
                )}

                {participant.isScreenSharing && (
                  <MonitorUp className="w-4 h-4 text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};