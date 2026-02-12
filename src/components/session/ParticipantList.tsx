import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Crown, Hand, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveKitParticipant } from '@/hooks/useLiveKitRoom';

interface ParticipantListProps {
  participants: LiveKitParticipant[];
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ participants }) => {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-gray-900">Participants</h3>
              <p className="text-xs text-gray-500">{participants.length} connecté{participants.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={cn(
                "group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                participant.isCurrentUser 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm" 
                  : "hover:bg-white hover:shadow-md border border-gray-100",
                participant.isSpeaking && "ring-2 ring-green-400 shadow-lg scale-[1.02]"
              )}
            >
              {/* Avatar with indicator */}
              <div className="relative flex-shrink-0">
                <Avatar className={cn(
                  "w-12 h-12 border-2 shadow-md transition-all",
                  participant.isCurrentUser ? "border-blue-400" : "border-white",
                  participant.isSpeaking && "ring-2 ring-green-400 ring-offset-2"
                )}>
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback className={cn(
                    "text-white font-semibold text-sm",
                    participant.isCurrentUser 
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600" 
                      : "bg-gradient-to-br from-gray-500 to-gray-600"
                  )}>
                    {participant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {participant.isSpeaking && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse shadow-md">
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping" />
                  </div>
                )}
              </div>

              {/* Name and status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={cn(
                    "font-semibold truncate text-sm",
                    participant.isCurrentUser ? "text-blue-900" : "text-gray-900"
                  )}>
                    {participant.name}
                  </span>
                  {participant.isCurrentUser && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                      Vous
                    </Badge>
                  )}
                  {participant.isHost && (
                    <span title="Animateur"><Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /></span>
                  )}
                  {participant.handRaised && (
                    <span title="Main levée"><Hand className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 animate-bounce" /></span>
                  )}
                </div>

                {/* Role badge */}
                {participant.role && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-[10px] px-2 py-0.5 font-medium",
                      participant.role === 'professor' && "bg-blue-100 text-blue-700 border-blue-200",
                      participant.role === 'student' && "bg-green-100 text-green-700 border-green-200"
                    )}
                  >
                    {participant.role === 'professor' ? '👨‍🏫 Prof' : '👨‍🎓 Élève'}
                  </Badge>
                )}
              </div>

              {/* Media controls indicators */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Microphone */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm",
                  participant.isMuted 
                    ? "bg-red-100 hover:bg-red-200" 
                    : "bg-green-100 hover:bg-green-200"
                )}>
                  {participant.isMuted ? (
                    <MicOff className="w-3.5 h-3.5 text-red-600" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-green-600" />
                  )}
                </div>

                {/* Camera */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm",
                  participant.isCameraOn 
                    ? "bg-blue-100 hover:bg-blue-200" 
                    : "bg-gray-100 hover:bg-gray-200"
                )}>
                  {participant.isCameraOn ? (
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <VideoOff className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>

                {/* Screen sharing */}
                {participant.isScreenSharing && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-100 hover:bg-purple-200 transition-all shadow-sm">
                    <MonitorUp className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                )}
              </div>

              {/* Speaking indicator overlay */}
              {participant.isSpeaking && (
                <div className="absolute inset-0 rounded-xl border-2 border-green-400 pointer-events-none" />
              )}
            </div>
          ))}

          {participants.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Aucun participant</p>
              <p className="text-xs text-gray-400 mt-1">En attente de connexions...</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};