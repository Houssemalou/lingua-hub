import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Hand, 
  UserX,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Student {
  id: string;
  name: string;
  avatar?: string;
  level: string;
  isMuted: boolean;
  isPicked: boolean;
  handRaised?: boolean;
}

interface StudentModerationProps {
  students: Student[];
  onMuteStudent: (studentId: string) => void;
  onUnmuteStudent: (studentId: string) => void;
  onPickStudent: (studentId: string) => void;
  onUnpickStudent: (studentId: string) => void;
  onMuteAll: () => void;
  onUnmuteAll: () => void;
  isRTL?: boolean;
}

export function StudentModeration({
  students,
  onMuteStudent,
  onUnmuteStudent,
  onPickStudent,
  onUnpickStudent,
  onMuteAll,
  onUnmuteAll,
  isRTL = false,
}: StudentModerationProps) {
  const pickedStudents = students.filter(s => s.isPicked);
  const mutedCount = students.filter(s => s.isMuted).length;

  return (
    <div className="space-y-4">
      {/* Global Controls */}
      <div className={cn(
        "flex flex-wrap items-center gap-2",
        isRTL && "flex-row-reverse"
      )}>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onMuteAll}
          className="gap-2"
        >
          <VolumeX className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isRTL ? 'كتم الجميع' : 'Muter tous'}
          </span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUnmuteAll}
          className="gap-2"
        >
          <Volume2 className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isRTL ? 'إلغاء كتم الجميع' : 'Démuter tous'}
          </span>
        </Button>
        <Badge variant="secondary" className="ml-auto">
          {isRTL ? `${mutedCount} كتم` : `${mutedCount} muté(s)`}
        </Badge>
      </div>

      {/* Picked Students */}
      {pickedStudents.length > 0 && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className={cn(
            "text-sm font-medium text-primary mb-2",
            isRTL && "text-right"
          )}>
            {isRTL ? 'الطلاب المختارون للتحدث' : 'Étudiants sélectionnés pour parler'}
          </p>
          <div className={cn(
            "flex flex-wrap gap-2",
            isRTL && "flex-row-reverse"
          )}>
            {pickedStudents.map(student => (
              <Badge 
                key={student.id} 
                variant="default" 
                className="gap-1 cursor-pointer hover:bg-primary/80"
                onClick={() => onUnpickStudent(student.id)}
              >
                <Hand className="w-3 h-3" />
                {student.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Student List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {students.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                student.isPicked 
                  ? "bg-primary/5 border-primary/30" 
                  : "bg-muted/50 border-border hover:bg-muted",
                isRTL && "flex-row-reverse"
              )}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={student.avatar} />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                <div className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse justify-end"
                )}>
                  <p className="font-medium text-sm truncate">{student.name}</p>
                  {student.handRaised && (
                    <Hand className="w-4 h-4 text-warning animate-bounce" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{student.level}</p>
              </div>

              <div className={cn(
                "flex items-center gap-1",
                isRTL && "flex-row-reverse"
              )}>
                <TooltipProvider>
                  {/* Pick/Unpick Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={student.isPicked ? "default" : "outline"}
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => 
                          student.isPicked 
                            ? onUnpickStudent(student.id)
                            : onPickStudent(student.id)
                        }
                      >
                        <Hand className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {student.isPicked 
                        ? (isRTL ? 'إلغاء الاختيار' : 'Désélectionner')
                        : (isRTL ? 'اختيار للتحدث' : 'Sélectionner pour parler')
                      }
                    </TooltipContent>
                  </Tooltip>

                  {/* Mute/Unmute Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={student.isMuted ? "destructive" : "outline"}
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => 
                          student.isMuted 
                            ? onUnmuteStudent(student.id)
                            : onMuteStudent(student.id)
                        }
                      >
                        {student.isMuted ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {student.isMuted 
                        ? (isRTL ? 'إلغاء كتم الصوت' : 'Activer le micro')
                        : (isRTL ? 'كتم الصوت' : 'Couper le micro')
                      }
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
