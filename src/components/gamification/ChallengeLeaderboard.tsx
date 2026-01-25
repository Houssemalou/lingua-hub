import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Target, Star, Crown, Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ChallengeLeaderboardEntry } from '@/data/professorChallenges';

interface ChallengeLeaderboardProps {
  entries: ChallengeLeaderboardEntry[];
  currentStudentId?: string;
}

export function ChallengeLeaderboard({ entries, currentStudentId }: ChallengeLeaderboardProps) {
  const { language, isRTL } = useLanguage();

  const labels = {
    fr: {
      title: 'Classement des Défis',
      points: 'Points',
      challenges: 'Défis',
      perfect: 'Parfaits',
      you: 'Vous'
    },
    ar: {
      title: 'تصنيف التحديات',
      points: 'نقاط',
      challenges: 'تحديات',
      perfect: 'مثالي',
      you: 'أنت'
    },
    en: {
      title: 'Challenge Leaderboard',
      points: 'Points',
      challenges: 'Challenges',
      perfect: 'Perfect',
      you: 'You'
    }
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 via-gray-400/10 to-transparent';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 via-amber-600/10 to-transparent';
      default:
        return '';
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border-b">
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
          </motion.div>
          <h3 className="font-bold text-lg">{t.title}</h3>
        </div>
      </div>

      {/* Leaderboard entries */}
      <div className="divide-y">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.studentId === currentStudentId;
          
          return (
            <motion.div
              key={entry.studentId}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-4 transition-all relative",
                getRankBackground(entry.rank),
                isCurrentUser && "bg-primary/5 border-l-4 border-primary"
              )}
            >
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                {/* Rank */}
                <motion.div
                  className="shrink-0"
                  animate={entry.rank <= 3 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getRankIcon(entry.rank)}
                </motion.div>

                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-background">
                    <AvatarImage src={entry.studentAvatar} />
                    <AvatarFallback>{entry.studentName[0]}</AvatarFallback>
                  </Avatar>
                  {entry.rank === 1 && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </motion.div>
                  )}
                </div>

                {/* Info */}
                <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <span className="font-semibold truncate">{entry.studentName}</span>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">
                        {t.you}
                      </Badge>
                    )}
                  </div>
                  <div className={cn("flex items-center gap-3 text-sm text-muted-foreground mt-1", isRTL && "flex-row-reverse")}>
                    <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                      <Target className="w-3 h-3" />
                      {entry.challengesCompleted} {t.challenges}
                    </span>
                    <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                      <Flame className="w-3 h-3 text-orange-500" />
                      {entry.perfectAnswers} {t.perfect}
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className={cn("text-right shrink-0", isRTL && "text-left")}>
                  <div className="flex items-center gap-1 font-bold text-lg">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    {entry.totalPoints.toLocaleString()}
                  </div>
                  <span className="text-xs text-muted-foreground">{t.points}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
