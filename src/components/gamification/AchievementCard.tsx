import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lock, Check } from 'lucide-react';
import { Achievement } from '@/data/gamification';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: Achievement;
  compact?: boolean;
}

export function AchievementCard({ achievement, compact = false }: AchievementCardProps) {
  const { language, isRTL } = useLanguage();
  
  const getName = () => {
    switch (language) {
      case 'ar': return achievement.nameAr;
      case 'fr': return achievement.nameFr;
      default: return achievement.name;
    }
  };
  
  const getDescription = () => {
    switch (language) {
      case 'ar': return achievement.descriptionAr;
      case 'fr': return achievement.descriptionFr;
      default: return achievement.description;
    }
  };

  const categoryColors: Record<string, string> = {
    learning: 'bg-blue-500/20 text-blue-500',
    social: 'bg-purple-500/20 text-purple-500',
    streak: 'bg-orange-500/20 text-orange-500',
    mastery: 'bg-yellow-500/20 text-yellow-500',
    special: 'bg-pink-500/20 text-pink-500'
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-xl border",
          achievement.unlocked 
            ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30" 
            : "bg-muted/50 border-border opacity-60"
        )}
      >
        <div className={cn(
          "text-2xl p-2 rounded-lg",
          achievement.unlocked ? "bg-primary/20" : "bg-muted"
        )}>
          {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{getName()}</p>
          <p className="text-xs text-muted-foreground">+{achievement.points} XP</p>
        </div>
        {achievement.unlocked && (
          <Check className="w-4 h-4 text-primary" />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "relative overflow-hidden p-4",
        achievement.unlocked 
          ? "bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20" 
          : "bg-muted/30 border-border"
      )}>
        {/* Unlock glow effect */}
        {achievement.unlocked && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        <div className={cn("relative flex gap-4", isRTL && "flex-row-reverse")}>
          {/* Icon */}
          <motion.div
            className={cn(
              "flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-3xl",
              achievement.unlocked 
                ? "bg-gradient-to-br from-primary/20 to-accent/20" 
                : "bg-muted"
            )}
            animate={achievement.unlocked ? { 
              boxShadow: ['0 0 20px rgba(var(--primary), 0.2)', '0 0 30px rgba(var(--primary), 0.4)', '0 0 20px rgba(var(--primary), 0.2)']
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {achievement.unlocked ? achievement.icon : <Lock className="w-8 h-8 text-muted-foreground" />}
          </motion.div>
          
          {/* Content */}
          <div className={cn("flex-1", isRTL && "text-right")}>
            <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
              <h3 className="font-bold text-lg">{getName()}</h3>
              <Badge className={cn("text-xs", categoryColors[achievement.category])}>
                +{achievement.points} XP
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{getDescription()}</p>
            
            {/* Progress bar for incomplete achievements */}
            {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
              <div className="space-y-1">
                <Progress 
                  value={(achievement.progress / achievement.maxProgress) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {achievement.progress} / {achievement.maxProgress}
                </p>
              </div>
            )}
            
            {/* Unlocked badge */}
            {achievement.unlocked && (
              <div className={cn("flex items-center gap-1 text-primary text-sm", isRTL && "flex-row-reverse")}>
                <Check className="w-4 h-4" />
                <span>{language === 'fr' ? 'Débloqué' : language === 'ar' ? 'مفتوح' : 'Unlocked'}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
