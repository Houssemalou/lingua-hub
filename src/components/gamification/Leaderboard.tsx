import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, TrendingUp } from 'lucide-react';
import { LeaderboardEntry } from '@/data/gamification';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentStudentId?: string;
}

export function Leaderboard({ entries, currentStudentId }: LeaderboardProps) {
  const { language, isRTL } = useLanguage();

  const labels = {
    fr: { title: 'Classement', points: 'points', level: 'Niv.', streak: 'jours' },
    ar: { title: 'لوحة المتصدرين', points: 'نقطة', level: 'مستوى', streak: 'أيام' },
    en: { title: 'Leaderboard', points: 'points', level: 'Lvl.', streak: 'days' }
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3: return <Trophy className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-300/10 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-orange-500/10 border-amber-600/30';
      default: return 'bg-card border-border';
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="relative p-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/20 to-primary/5"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <div className={cn("relative flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">{t.title}</h3>
        </div>
      </div>
      
      {/* Entries */}
      <div className="p-4 space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.studentId}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
              getRankBg(entry.rank),
              entry.studentId === currentStudentId && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
          >
            {/* Rank */}
            <div className="w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>
            
            {/* Avatar */}
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={entry.studentAvatar} alt={entry.studentName} />
              <AvatarFallback>{entry.studentName.charAt(0)}</AvatarFallback>
            </Avatar>
            
            {/* Info */}
            <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
              <p className="font-medium truncate">{entry.studentName}</p>
              <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                <span>{t.level} {entry.level}</span>
                <span>•</span>
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span>{entry.streak} {t.streak}</span>
                </div>
              </div>
            </div>
            
            {/* Points */}
            <div className={cn("text-right", isRTL && "text-left")}>
              <p className="font-bold text-lg">{entry.points.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t.points}</p>
            </div>
            
            {/* Highlight for top 3 */}
            {entry.rank <= 3 && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  background: entry.rank === 1 
                    ? 'linear-gradient(90deg, rgba(234,179,8,0.1), transparent)' 
                    : entry.rank === 2 
                    ? 'linear-gradient(90deg, rgba(156,163,175,0.1), transparent)'
                    : 'linear-gradient(90deg, rgba(217,119,6,0.1), transparent)'
                }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
