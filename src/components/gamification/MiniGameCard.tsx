import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Timer, Trophy, Zap } from 'lucide-react';
import { MiniGame } from '@/data/gamification';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface MiniGameCardProps {
  game: MiniGame;
  onPlay: (gameId: string) => void;
}

export function MiniGameCard({ game, onPlay }: MiniGameCardProps) {
  const { language, isRTL } = useLanguage();
  
  const getName = () => {
    switch (language) {
      case 'ar': return game.nameAr;
      case 'fr': return game.nameFr;
      default: return game.name;
    }
  };
  
  const getDescription = () => {
    switch (language) {
      case 'ar': return game.descriptionAr;
      case 'fr': return game.descriptionFr;
      default: return game.description;
    }
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/20 text-green-500',
    medium: 'bg-yellow-500/20 text-yellow-500',
    hard: 'bg-red-500/20 text-red-500'
  };

  const difficultyLabels: Record<string, Record<string, string>> = {
    easy: { fr: 'Facile', ar: 'سهل', en: 'Easy' },
    medium: { fr: 'Moyen', ar: 'متوسط', en: 'Medium' },
    hard: { fr: 'Difficile', ar: 'صعب', en: 'Hard' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-2 hover:border-primary/50 transition-all">
        {/* Animated background pattern */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}
          animate={{ backgroundPosition: ['0px 0px', '20px 20px'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        
        <div className="relative p-5">
          {/* Header */}
          <div className={cn("flex items-start gap-4 mb-4", isRTL && "flex-row-reverse")}>
            <motion.div
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {game.icon}
            </motion.div>
            
            <div className={cn("flex-1", isRTL && "text-right")}>
              <h3 className="font-bold text-lg mb-1">{getName()}</h3>
              <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
                <Badge className={difficultyColors[game.difficulty]}>
                  {difficultyLabels[game.difficulty][language] || difficultyLabels[game.difficulty].en}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {Math.floor(game.timeLimit / 60)}:{(game.timeLimit % 60).toString().padStart(2, '0')}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <p className={cn("text-sm text-muted-foreground mb-4", isRTL && "text-right")}>
            {getDescription()}
          </p>
          
          {/* Footer */}
          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{game.maxPoints} XP</span>
            </div>
            
            <Button 
              onClick={() => onPlay(game.id)}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Play className="w-4 h-4" />
              {language === 'fr' ? 'Jouer' : language === 'ar' ? 'العب' : 'Play'}
            </Button>
          </div>
        </div>
        
        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 pointer-events-none"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      </Card>
    </motion.div>
  );
}
