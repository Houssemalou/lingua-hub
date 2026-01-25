import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Clock, 
  User, 
  Zap, 
  Image,
  Star,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { 
  ProfessorChallenge, 
  challengeSubjects, 
  difficultyConfig,
  calculateChallengePoints,
  hasStudentCompletedChallenge
} from '@/data/professorChallenges';

interface ChallengeCardProps {
  challenge: ProfessorChallenge;
  studentId: string;
  onPlay: (challengeId: string) => void;
}

export function ChallengeCard({ challenge, studentId, onPlay }: ChallengeCardProps) {
  const { language, isRTL } = useLanguage();
  const isCompleted = hasStudentCompletedChallenge(studentId, challenge.id);

  const subject = challengeSubjects.find(s => s.id === challenge.subject);
  const difficulty = difficultyConfig.find(d => d.id === challenge.difficulty);
  const maxPoints = calculateChallengePoints(challenge.basePoints, challenge.difficulty, 1);

  const getTimeRemaining = () => {
    const diff = new Date(challenge.expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return language === 'fr' ? `${days}j restants` : language === 'ar' ? `${days} أيام متبقية` : `${days}d left`;
    }
    return `${hours}h ${minutes}m`;
  };

  const getTitle = () => {
    return language === 'fr' ? challenge.titleFr : language === 'ar' ? challenge.titleAr : challenge.title;
  };

  const getSubjectName = () => {
    if (!subject) return challenge.subject;
    return language === 'fr' ? subject.nameFr : language === 'ar' ? subject.nameAr : subject.name;
  };

  const getDifficultyName = () => {
    if (!difficulty) return challenge.difficulty;
    return language === 'fr' ? difficulty.nameFr : language === 'ar' ? difficulty.nameAr : difficulty.name;
  };

  const labels = {
    fr: { by: 'Par', play: 'Jouer', completed: 'Complété', points: 'points' },
    ar: { by: 'من', play: 'العب', completed: 'مكتمل', points: 'نقاط' },
    en: { by: 'By', play: 'Play', completed: 'Completed', points: 'points' }
  };
  const t = labels[language as keyof typeof labels] || labels.en;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className={cn(
        "relative overflow-hidden h-full flex flex-col transition-all",
        isCompleted 
          ? "bg-success/5 border-success/30" 
          : "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
      )}>
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(135deg, ${subject?.color || 'hsl(var(--primary))'}20, transparent 50%)`
          }}
          animate={{
            background: [
              `linear-gradient(135deg, ${subject?.color || 'hsl(var(--primary))'}20, transparent 50%)`,
              `linear-gradient(180deg, ${subject?.color || 'hsl(var(--primary))'}20, transparent 50%)`,
              `linear-gradient(135deg, ${subject?.color || 'hsl(var(--primary))'}20, transparent 50%)`
            ]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Image Section */}
        {challenge.imageUrl && (
          <div className="relative h-32 overflow-hidden">
            <img 
              src={challenge.imageUrl} 
              alt={getTitle()} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        <div className="relative p-4 flex-1 flex flex-col">
          {/* Header badges */}
          <div className={cn("flex items-center gap-2 flex-wrap mb-3", isRTL && "flex-row-reverse")}>
            <Badge 
              className="gap-1"
              style={{ backgroundColor: `${subject?.color}20`, color: subject?.color }}
            >
              <span>{subject?.icon}</span>
              {getSubjectName()}
            </Badge>
            <Badge 
              variant="outline"
              style={{ borderColor: difficulty?.color, color: difficulty?.color }}
            >
              {getDifficultyName()}
            </Badge>
            {isCompleted && (
              <Badge variant="secondary" className="gap-1 bg-success/20 text-success">
                <CheckCircle className="w-3 h-3" />
                {t.completed}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className={cn("font-bold text-lg mb-2", isRTL && "text-right")}>
            {getTitle()}
          </h3>

          {/* Professor */}
          <div className={cn("flex items-center gap-2 text-sm text-muted-foreground mb-3", isRTL && "flex-row-reverse")}>
            <User className="w-4 h-4" />
            <span>{t.by} {challenge.professorName}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className={cn("flex items-center justify-between pt-3 border-t", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              {/* Points */}
              <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Trophy className="w-4 h-4 text-yellow-500" />
                </motion.div>
                <span className="font-bold">{maxPoints}</span>
                <span className="text-xs text-muted-foreground">{t.points}</span>
              </div>

              {/* Time remaining */}
              <div className={cn("flex items-center gap-1 text-muted-foreground text-sm", isRTL && "flex-row-reverse")}>
                <Clock className="w-3 h-3" />
                <span>{getTimeRemaining()}</span>
              </div>
            </div>

            {/* Play button */}
            {!isCompleted && (
              <Button 
                size="sm" 
                onClick={() => onPlay(challenge.id)}
                className="gap-1 group"
              >
                <Zap className="w-4 h-4" />
                {t.play}
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Completed overlay effect */}
        {isCompleted && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
