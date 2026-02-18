import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Gamepad2, Trophy, Flame, Star, Zap,
  TrendingUp, Medal, Target, Swords,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Components
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { MiniGameCard } from '@/components/gamification/MiniGameCard';
import { DailyChallenges } from '@/components/gamification/DailyChallenges';
import { MathPuzzleGame } from '@/components/gamification/MathPuzzleGame';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import { ChallengeGame } from '@/components/gamification/ChallengeGame';
import { ChallengeLeaderboard } from '@/components/gamification/ChallengeLeaderboard';

// Data
import {
  mockAchievements,
  mockMiniGames,
  getStudentStats,
  getPointsForNextLevel,
} from '@/data/gamification';
import {
  ProfessorChallenge,
  ChallengeLeaderboardEntry
} from '@/data/professorChallenges';
import { ChallengeService, SubmitAnswerResponseData } from '@/services/ChallengeService';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function StudentGames() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('challenges');
  const [mathGameOpen, setMathGameOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [challengeGameOpen, setChallengeGameOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ProfessorChallenge | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<ProfessorChallenge[]>([]);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  const studentStats = getStudentStats(user?.id || '1');
  const pointsForNext = getPointsForNextLevel(studentStats.level);
  const currentProgress = (studentStats.points % 200) / 200 * 100;

  const fetchChallengeData = async () => {
    setLoadingChallenges(true);
    try {
      const [challengesRes, attemptsRes, leaderboardRes] = await Promise.all([
        ChallengeService.getActiveChallenges(),
        ChallengeService.getMyAttempts(),
        ChallengeService.getLeaderboard(),
      ]);

      if (challengesRes.success && challengesRes.data) {
        setActiveChallenges(challengesRes.data);
      }
      if (attemptsRes.success && attemptsRes.data) {
        const completedIds = new Set(
          attemptsRes.data
            .filter(a => a.isCorrect)
            .map(a => a.challengeId)
        );
        setCompletedChallengeIds(completedIds);
      }
      if (leaderboardRes.success && leaderboardRes.data) {
        setLeaderboard(leaderboardRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch challenge data:', error);
    } finally {
      setLoadingChallenges(false);
    }
  };

  useEffect(() => {
    fetchChallengeData();
  }, []);

  const labels = {
    fr: {
      title: 'Centre de Jeux',
      subtitle: 'Apprends en t\'amusant avec des jeux et défis',
      games: 'Jeux',
      achievements: 'Succès',
      leaderboard: 'Classement',
      challenges: 'Défis Profs',
      dailyChallenges: 'Défis du Jour',
      level: 'Niveau',
      points: 'Points',
      streak: 'Série',
      days: 'jours',
      unlockedAchievements: 'Succès débloqués',
      inProgress: 'En cours',
      pointsToNext: 'points pour le prochain niveau',
      professorChallenges: 'Défis des Professeurs',
      noChallenges: 'Aucun défi disponible',
      checkBack: 'Revenez plus tard pour de nouveaux défis!'
    },
    ar: {
      title: 'مركز الألعاب',
      subtitle: 'تعلم وأنت تستمتع بالألعاب والتحديات',
      games: 'ألعاب',
      achievements: 'الإنجازات',
      leaderboard: 'التصنيف',
      challenges: 'تحديات الأساتذة',
      dailyChallenges: 'تحديات اليوم',
      level: 'المستوى',
      points: 'نقاط',
      streak: 'سلسلة',
      days: 'أيام',
      unlockedAchievements: 'الإنجازات المفتوحة',
      inProgress: 'قيد التقدم',
      pointsToNext: 'نقطة للمستوى التالي',
      professorChallenges: 'تحديات الأساتذة',
      noChallenges: 'لا توجد تحديات متاحة',
      checkBack: 'عد لاحقاً للتحديات الجديدة!'
    },
    en: {
      title: 'Game Center',
      subtitle: 'Learn while having fun with games and challenges',
      games: 'Games',
      achievements: 'Achievements',
      leaderboard: 'Leaderboard',
      challenges: 'Prof Challenges',
      dailyChallenges: 'Daily Challenges',
      level: 'Level',
      points: 'Points',
      streak: 'Streak',
      days: 'days',
      unlockedAchievements: 'Unlocked achievements',
      inProgress: 'In progress',
      pointsToNext: 'points to next level',
      professorChallenges: 'Professor Challenges',
      noChallenges: 'No challenges available',
      checkBack: 'Check back later for new challenges!'
    }
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  const handlePlayGame = (gameId: string) => {
    const game = mockMiniGames.find(g => g.id === gameId);
    if (game) {
      setSelectedDifficulty(game.difficulty);
      setMathGameOpen(true);
    }
  };

  const handlePlayChallenge = (challengeId: string) => {
    const challenge = activeChallenges.find(c => c.id === challengeId);
    if (challenge) {
      setSelectedChallenge(challenge);
      setChallengeGameOpen(true);
    }
  };

  const handleChallengeComplete = (challengeId: string, pointsEarned: number, attempts: number) => {
    setChallengeGameOpen(false);
    toast({
      title: language === 'fr' ? 'Défi terminé!' : language === 'ar' ? 'تم التحدي!' : 'Challenge complete!',
      description: pointsEarned > 0
        ? `${language === 'fr' ? 'Tu as gagné' : language === 'ar' ? 'لقد ربحت' : 'You earned'} ${pointsEarned} XP!`
        : language === 'fr' ? 'Pas de points cette fois' : language === 'ar' ? 'لا نقاط هذه المرة' : 'No points this time',
    });
    // Refresh data after completing a challenge
    fetchChallengeData();
  };

  const handleGameComplete = (score: number) => {
    toast({
      title: language === 'fr' ? 'Jeu terminé!' : language === 'ar' ? 'انتهت اللعبة!' : 'Game complete!',
      description: `${language === 'fr' ? 'Tu as gagné' : language === 'ar' ? 'لقد ربحت' : 'You earned'} ${score} XP!`,
    });
  };

  const unlockedCount = mockAchievements.filter(a => a.unlocked).length;
  const inProgressCount = mockAchievements.filter(a => !a.unlocked && a.progress).length;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className={cn("flex flex-col gap-2", isRTL && "text-right")}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <motion.div
            className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Gamepad2 className="w-8 h-8 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-primary/20">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div className={cn(isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground">{t.level}</p>
              <p className="text-2xl font-bold">{studentStats.level}</p>
            </div>
          </div>
          <Progress value={currentProgress} className="h-1.5 mt-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {200 - (studentStats.points % 200)} {t.pointsToNext}
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div className={cn(isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground">{t.points}</p>
              <p className="text-2xl font-bold">{studentStats.points.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className={cn(isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground">{t.streak}</p>
              <p className="text-2xl font-bold">{studentStats.streak} {t.days}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Medal className="w-5 h-5 text-purple-500" />
            </div>
            <div className={cn(isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground">{t.achievements}</p>
              <p className="text-2xl font-bold">{unlockedCount}/{mockAchievements.length}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="challenges" className="gap-2">
              <Swords className="w-4 h-4" />
              <span className="hidden sm:inline">{t.challenges}</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="gap-2">
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.games}</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">{t.dailyChallenges}</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">{t.achievements}</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">{t.leaderboard}</span>
            </TabsTrigger>
          </TabsList>

          {/* Professor Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Swords className="w-5 h-5 text-primary" />
              </motion.div>
              <h2 className="text-xl font-bold">{t.professorChallenges}</h2>
              <Badge variant="secondary">{activeChallenges.length}</Badge>
            </div>

            {loadingChallenges ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-32 w-full rounded-none" />
                    <div className="p-4 space-y-3">
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-5 w-3/4" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-9 w-full rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : activeChallenges.length === 0 ? (
              <Card className="p-12 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Target className="w-16 h-16 mx-auto text-muted-foreground/50" />
                </motion.div>
                <h3 className="text-xl font-semibold mt-4">{t.noChallenges}</h3>
                <p className="text-muted-foreground mt-2">{t.checkBack}</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    studentId={user?.id || '1'}
                    onPlay={handlePlayChallenge}
                    completedChallengeIds={completedChallengeIds}
                  />
                ))}
              </div>
            )}

            {/* Challenge Leaderboard */}
            <div className="mt-8">
              <ChallengeLeaderboard
                entries={leaderboard}
                currentStudentId={user?.id}
              />
            </div>
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockMiniGames.map((game) => (
                <MiniGameCard key={game.id} game={game} onPlay={handlePlayGame} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="daily">
            {loadingChallenges ? (
              <Card className="p-8">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              </Card>
            ) : (
              <DailyChallenges
                challenges={activeChallenges.map((c) => ({
                  id: c.id,
                  title: c.title,
                  titleFr: c.titleFr || c.title,
                  titleAr: c.titleAr || c.title,
                  description: c.question,
                  descriptionFr: c.questionFr || c.question,
                  descriptionAr: c.questionAr || c.question,
                  type: 'quiz' as const,
                  subject: c.subject,
                  points: c.basePoints,
                  completed: completedChallengeIds.has(c.id),
                  expiresAt: c.expiresAt,
                }))}
                onStartChallenge={(challengeId) => {
                  const challenge = activeChallenges.find(c => c.id === challengeId);
                  if (challenge && !completedChallengeIds.has(challengeId)) {
                    setSelectedChallenge(challenge);
                    setChallengeGameOpen(true);
                  }
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {/* Stats */}
            <div className={cn("flex gap-4 flex-wrap", isRTL && "flex-row-reverse")}>
              <Badge variant="secondary" className="gap-1 text-sm py-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                {t.unlockedAchievements}: {unlockedCount}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-sm py-1">
                <Zap className="w-4 h-4 text-blue-500" />
                {t.inProgress}: {inProgressCount}
              </Badge>
            </div>

            {/* Achievement grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            {loadingChallenges ? (
              <Card className="p-8">
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              </Card>
            ) : leaderboard.length === 0 ? (
              <Card className="p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mt-4">
                  {language === 'fr' ? 'Aucun classement disponible' : language === 'ar' ? 'لا يوجد تصنيف' : 'No leaderboard data'}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {language === 'fr' ? 'Complétez des défis pour apparaître au classement !' : language === 'ar' ? 'أكمل التحديات للظهور في التصنيف!' : 'Complete challenges to appear on the leaderboard!'}
                </p>
              </Card>
            ) : (
              <ChallengeLeaderboard entries={leaderboard} currentStudentId={user?.id} />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Math Puzzle Game Modal */}
      <MathPuzzleGame
        isOpen={mathGameOpen}
        onClose={() => setMathGameOpen(false)}
        onComplete={handleGameComplete}
        difficulty={selectedDifficulty}
      />

      {/* Challenge Game Modal */}
      <ChallengeGame
        isOpen={challengeGameOpen}
        onClose={() => setChallengeGameOpen(false)}
        challenge={selectedChallenge}
        onComplete={handleChallengeComplete}
      />
    </motion.div>
  );
}
