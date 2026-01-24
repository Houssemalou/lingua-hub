import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import { DailyChallenge } from '@/data/gamification';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface DailyChallengesProps {
  challenges: DailyChallenge[];
  onStartChallenge: (challengeId: string) => void;
}

export function DailyChallenges({ challenges, onStartChallenge }: DailyChallengesProps) {
  const { language, isRTL } = useLanguage();

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getTitle = (challenge: DailyChallenge) => {
    switch (language) {
      case 'ar': return challenge.titleAr;
      case 'fr': return challenge.titleFr;
      default: return challenge.title;
    }
  };

  const getDescription = (challenge: DailyChallenge) => {
    switch (language) {
      case 'ar': return challenge.descriptionAr;
      case 'fr': return challenge.descriptionFr;
      default: return challenge.description;
    }
  };

  const labels = {
    fr: { daily: 'Défis du jour', remaining: 'Temps restant', start: 'Commencer', completed: 'Terminé' },
    ar: { daily: 'تحديات اليوم', remaining: 'الوقت المتبقي', start: 'ابدأ', completed: 'مكتمل' },
    en: { daily: 'Daily Challenges', remaining: 'Time remaining', start: 'Start', completed: 'Completed' }
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  return (
    <Card className="overflow-hidden">
      {/* Header with animated gradient */}
      <div className="relative p-4 bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-orange-500/10">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-yellow-500/20 to-orange-500/5"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <div className={cn("relative flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap className="w-5 h-5 text-yellow-500" />
          </motion.div>
          <h3 className="font-bold text-lg">{t.daily}</h3>
        </div>
      </div>
      
      {/* Challenges list */}
      <div className="p-4 space-y-3">
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all",
              challenge.completed 
                ? "bg-success/5 border-success/30" 
                : "bg-card hover:border-primary/50"
            )}
          >
            <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
              {/* Status icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                challenge.completed ? "bg-success/20" : "bg-primary/10"
              )}>
                {challenge.completed ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  challenge.type === 'quiz' ? '📝' : 
                  challenge.type === 'exercise' ? '✏️' : 
                  challenge.type === 'session' ? '🎓' : '🎯'
                )}
              </div>
              
              {/* Content */}
              <div className={cn("flex-1", isRTL && "text-right")}>
                <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                  <h4 className="font-semibold">{getTitle(challenge)}</h4>
                  <Badge variant="secondary" className="text-xs">
                    +{challenge.points} XP
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{getDescription(challenge)}</p>
                
                {/* Time remaining or completed status */}
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  {challenge.completed ? (
                    <span className="text-sm text-success font-medium">{t.completed} ✓</span>
                  ) : (
                    <>
                      <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                        <Clock className="w-3 h-3" />
                        <span>{t.remaining}: {getTimeRemaining(challenge.expiresAt)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-primary hover:bg-primary/10"
                        onClick={() => onStartChallenge(challenge.id)}
                      >
                        {t.start}
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Progress indicator for completed */}
            {challenge.completed && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-success pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
