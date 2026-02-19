import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Plus,
  Trophy,
  Target,
  Users,
  Zap,
  Clock,
  BarChart3,
  Eye,
  Trash2,
  Sparkles,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ChallengeCreator, ChallengeFormData } from '@/components/professor/ChallengeCreator';
import {
  challengeSubjects,
  difficultyConfig,
  calculateChallengePoints,
  ProfessorChallenge,
  ChallengeLeaderboardEntry
} from '@/data/professorChallenges';
import { ChallengeLeaderboard } from '@/components/gamification/ChallengeLeaderboard';
import { ChallengeService, ChallengeStatsData } from '@/services/ChallengeService';

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

export default function ProfessorChallenges() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [challenges, setChallenges] = useState<ProfessorChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [stats, setStats] = useState<ChallengeStatsData | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [viewChallenge, setViewChallenge] = useState<ProfessorChallenge | null>(null);
  const [deleteChallenge, setDeleteChallenge] = useState<ProfessorChallenge | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const labels = {
    fr: {
      title: 'Gestion des Défis',
      subtitle: 'Créez des défis stimulants pour vos élèves',
      createChallenge: 'Créer un Défi',
      activeChallenges: 'Défis Actifs',
      statistics: 'Statistiques',
      leaderboard: 'Classement',
      noChallenges: 'Aucun défi créé',
      createFirst: 'Créez votre premier défi pour engager vos élèves!',
      totalChallenges: 'Total des défis',
      totalParticipants: 'Participants',
      averageScore: 'Score moyen',
      successRate: 'Taux de réussite',
      expires: 'Expire',
      participants: 'participants',
      by: 'Par',
      points: 'points',
      delete: 'Supprimer',
      view: 'Voir',
      challengeCreated: 'Défi créé avec succès!',
      challengeDeleted: 'Défi supprimé avec succès!',
      loading: 'Chargement...',
      question: 'Question',
      options: 'Options de réponse',
      correctAnswer: 'Réponse correcte',
      createdAt: 'Créé le',
      expiresAt: 'Expire le',
      challengeDetails: 'Détails du défi',
      deleteConfirmTitle: 'Supprimer le défi',
      deleteConfirmMessage: 'Êtes-vous sûr de vouloir supprimer ce défi ? Cette action est irréversible.',
      cancel: 'Annuler',
      confirmDelete: 'Supprimer',
    },
    ar: {
      title: 'إدارة التحديات',
      subtitle: 'أنشئ تحديات محفزة لطلابك',
      createChallenge: 'إنشاء تحدي',
      activeChallenges: 'التحديات النشطة',
      statistics: 'الإحصائيات',
      leaderboard: 'التصنيف',
      noChallenges: 'لا توجد تحديات',
      createFirst: 'أنشئ أول تحدي لإشراك طلابك!',
      totalChallenges: 'إجمالي التحديات',
      totalParticipants: 'المشاركون',
      averageScore: 'متوسط النقاط',
      successRate: 'معدل النجاح',
      expires: 'ينتهي',
      participants: 'مشاركين',
      by: 'من',
      points: 'نقاط',
      delete: 'حذف',
      view: 'عرض',
      challengeCreated: 'تم إنشاء التحدي بنجاح!',
      challengeDeleted: 'تم حذف التحدي بنجاح!',
      loading: 'جار التحميل...',
      question: 'السؤال',
      options: 'خيارات الإجابة',
      correctAnswer: 'الإجابة الصحيحة',
      createdAt: 'تاريخ الإنشاء',
      expiresAt: 'تاريخ الانتهاء',
      challengeDetails: 'تفاصيل التحدي',
      deleteConfirmTitle: 'حذف التحدي',
      deleteConfirmMessage: 'هل أنت متأكد من حذف هذا التحدي؟ لا يمكن التراجع عن هذا الإجراء.',
      cancel: 'إلغاء',
      confirmDelete: 'حذف',
    },
    en: {
      title: 'Challenge Management',
      subtitle: 'Create engaging challenges for your students',
      createChallenge: 'Create Challenge',
      activeChallenges: 'Active Challenges',
      statistics: 'Statistics',
      leaderboard: 'Leaderboard',
      noChallenges: 'No challenges created',
      createFirst: 'Create your first challenge to engage your students!',
      totalChallenges: 'Total challenges',
      totalParticipants: 'Participants',
      averageScore: 'Average score',
      successRate: 'Success rate',
      expires: 'Expires',
      participants: 'participants',
      by: 'By',
      points: 'points',
      delete: 'Delete',
      view: 'View',
      challengeCreated: 'Challenge created successfully!',
      challengeDeleted: 'Challenge deleted successfully!',
      loading: 'Loading...',
      question: 'Question',
      options: 'Answer Options',
      correctAnswer: 'Correct Answer',
      createdAt: 'Created at',
      expiresAt: 'Expires at',
      challengeDetails: 'Challenge Details',
      deleteConfirmTitle: 'Delete Challenge',
      deleteConfirmMessage: 'Are you sure you want to delete this challenge? This action cannot be undone.',
      cancel: 'Cancel',
      confirmDelete: 'Delete',
    }
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [challengesRes, statsRes, leaderboardRes] = await Promise.all([
        ChallengeService.getMyChallenges(),
        ChallengeService.getStats(),
        ChallengeService.getLeaderboard(),
      ]);

      if (challengesRes.success && challengesRes.data) {
        setChallenges(challengesRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (leaderboardRes.success && leaderboardRes.data) {
        setLeaderboard(leaderboardRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch challenge data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateChallenge = async (formData: ChallengeFormData) => {
    const result = await ChallengeService.create({
      subject: formData.subject,
      difficulty: formData.difficulty,
      title: formData.title,
      question: formData.question,
      options: formData.options,
      correctAnswer: formData.correctAnswer,
      basePoints: formData.basePoints,
      imageUrl: formData.imageUrl,
      expiresIn: formData.expiresIn,
    });

    if (result.success) {
      toast({
        title: t.challengeCreated,
        description: formData.title
      });
      fetchData();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create challenge',
        variant: 'destructive'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteChallenge) return;
    setIsDeleting(true);
    try {
      const result = await ChallengeService.delete(deleteChallenge.id);
      if (result.success) {
        toast({
          title: t.challengeDeleted,
        });
        fetchData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete challenge',
          variant: 'destructive'
        });
      }
    } finally {
      setIsDeleting(false);
      setDeleteChallenge(null);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return language === 'fr' ? `${days}j` : language === 'ar' ? `${days} أيام` : `${days}d`;
    }
    return `${hours}h`;
  };

  const getSubjectInfo = (subjectId: string) => {
    return challengeSubjects.find(s => s.id === subjectId);
  };

  const getDifficultyInfo = (diffId: string) => {
    return difficultyConfig.find(d => d.id === diffId);
  };

  const activeChallenges = challenges.filter(c => c.isActive && new Date(c.expiresAt) > new Date());

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-full rounded-lg" />
        {/* Challenge cards skeleton */}
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
                <div className="flex justify-between pt-3 border-t">
                  <Skeleton className="h-3 w-20" />
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={cn(isRTL && "text-right")}>
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <motion.div
              className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">{t.title}</h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setIsCreatorOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.createChallenge}
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-primary/20">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className={cn(isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground">{t.totalChallenges}</p>
              <p className="text-2xl font-bold">{stats?.activeChallenges ?? activeChallenges.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className={cn(isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground">{t.totalParticipants}</p>
              <p className="text-2xl font-bold">{stats?.totalParticipants ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div className={cn(isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground">{t.averageScore}</p>
              <p className="text-2xl font-bold">{stats?.averageScore ?? 0} XP</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-green-500/20">
              <BarChart3 className="w-5 h-5 text-green-500" />
            </div>
            <div className={cn(isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground">{t.successRate}</p>
              <p className="text-2xl font-bold">{stats?.successRate ?? 0}%</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active" className="gap-2">
              <Zap className="w-4 h-4" />
              {t.activeChallenges}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="w-4 h-4" />
              {t.leaderboard}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeChallenges.length === 0 ? (
              <Card className="p-12 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Target className="w-16 h-16 mx-auto text-muted-foreground/50" />
                </motion.div>
                <h3 className="text-xl font-semibold mt-4">{t.noChallenges}</h3>
                <p className="text-muted-foreground mt-2">{t.createFirst}</p>
                <Button
                  className="mt-4 gap-2"
                  onClick={() => setIsCreatorOpen(true)}
                >
                  <Sparkles className="w-4 h-4" />
                  {t.createChallenge}
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeChallenges.map((challenge, index) => {
                  const subject = getSubjectInfo(challenge.subject);
                  const difficulty = getDifficultyInfo(challenge.difficulty);
                  const participants = challenge.participantCount ?? 0;
                  const maxPoints = calculateChallengePoints(challenge.basePoints, challenge.difficulty, 1);

                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-all">
                        {challenge.imageUrl && (
                          <div className="h-32 overflow-hidden">
                            <img
                              src={challenge.imageUrl}
                              alt={challenge.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
                            <Badge style={{ backgroundColor: `${subject?.color}20`, color: subject?.color }}>
                              {subject?.icon} {language === 'fr' ? subject?.nameFr : language === 'ar' ? subject?.nameAr : subject?.name}
                            </Badge>
                            <Badge variant="outline" style={{ borderColor: difficulty?.color, color: difficulty?.color }}>
                              {language === 'fr' ? difficulty?.nameFr : language === 'ar' ? difficulty?.nameAr : difficulty?.name}
                            </Badge>
                          </div>

                          <h3 className={cn("font-semibold text-lg mb-2", isRTL && "text-right")}>
                            {language === 'fr' ? challenge.titleFr : language === 'ar' ? challenge.titleAr : challenge.title}
                          </h3>

                          <div className={cn("flex items-center gap-4 text-sm text-muted-foreground mb-3", isRTL && "flex-row-reverse")}>
                            <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              {maxPoints} {t.points}
                            </span>
                            <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                              <Users className="w-4 h-4" />
                              {participants} {t.participants}
                            </span>
                          </div>

                          <div className={cn("flex items-center justify-between pt-3 border-t", isRTL && "flex-row-reverse")}>
                            <span className={cn("flex items-center gap-1 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                              <Clock className="w-3 h-3" />
                              {t.expires} {getTimeRemaining(challenge.expiresAt)}
                            </span>
                            <div className={cn("flex gap-1", isRTL && "flex-row-reverse")}>
                              <Button size="sm" variant="ghost" onClick={() => setViewChallenge(challenge)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => setDeleteChallenge(challenge)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <ChallengeLeaderboard entries={leaderboard} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Challenge Creator Modal */}
      <ChallengeCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onSubmit={handleCreateChallenge}
      />

      {/* Challenge Detail Dialog */}
      <Dialog open={!!viewChallenge} onOpenChange={(open) => !open && setViewChallenge(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {viewChallenge && (() => {
            const subject = getSubjectInfo(viewChallenge.subject);
            const difficulty = getDifficultyInfo(viewChallenge.difficulty);
            const maxPoints = calculateChallengePoints(viewChallenge.basePoints, viewChallenge.difficulty, 1);
            const challengeTitle = language === 'fr' ? viewChallenge.titleFr : language === 'ar' ? viewChallenge.titleAr : viewChallenge.title;
            const challengeQuestion = language === 'fr' ? viewChallenge.questionFr : language === 'ar' ? viewChallenge.questionAr : viewChallenge.question;
            const challengeOptions = language === 'fr' ? (viewChallenge.optionsFr?.length ? viewChallenge.optionsFr : viewChallenge.options) : language === 'ar' ? (viewChallenge.optionsAr?.length ? viewChallenge.optionsAr : viewChallenge.options) : viewChallenge.options;

            return (
              <>
                <DialogHeader>
                  <DialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <HelpCircle className="w-5 h-5 text-primary" />
                    {t.challengeDetails}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Image */}
                  {viewChallenge.imageUrl && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={viewChallenge.imageUrl}
                        alt={challengeTitle}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  {/* Title + Badges */}
                  <div>
                    <h3 className={cn("text-lg font-bold mb-2", isRTL && "text-right")}>{challengeTitle || viewChallenge.title}</h3>
                    <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
                      <Badge style={{ backgroundColor: `${subject?.color}20`, color: subject?.color }}>
                        {subject?.icon} {language === 'fr' ? subject?.nameFr : language === 'ar' ? subject?.nameAr : subject?.name}
                      </Badge>
                      <Badge variant="outline" style={{ borderColor: difficulty?.color, color: difficulty?.color }}>
                        {language === 'fr' ? difficulty?.nameFr : language === 'ar' ? difficulty?.nameAr : difficulty?.name}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        {maxPoints} XP
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="w-3 h-3" />
                        {viewChallenge.participantCount ?? 0}
                      </Badge>
                    </div>
                  </div>

                  {/* Question */}
                  <div>
                    <p className={cn("text-sm font-medium text-muted-foreground mb-1", isRTL && "text-right")}>{t.question}</p>
                    <Card className="p-3 bg-muted/50">
                      <p className={cn("text-sm", isRTL && "text-right")}>{challengeQuestion || viewChallenge.question}</p>
                    </Card>
                  </div>

                  {/* Options */}
                  <div>
                    <p className={cn("text-sm font-medium text-muted-foreground mb-2", isRTL && "text-right")}>{t.options}</p>
                    <div className="space-y-2">
                      {challengeOptions.map((option, index) => {
                        const isCorrect = index === viewChallenge.correctAnswer;
                        return (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                              isCorrect
                                ? "border-green-500/50 bg-green-500/10"
                                : "border-border bg-muted/30",
                              isRTL && "flex-row-reverse"
                            )}
                          >
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                              isCorrect
                                ? "bg-green-500 text-white"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {isCorrect ? <CheckCircle className="w-4 h-4" /> : String.fromCharCode(65 + index)}
                            </div>
                            <span className={cn("text-sm flex-1", isRTL && "text-right")}>{option}</span>
                            {isCorrect && (
                              <Badge className="bg-green-500/20 text-green-600 border-0 text-xs shrink-0">
                                {t.correctAnswer}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className={cn("flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t flex-wrap", isRTL && "flex-row-reverse")}>
                    <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                      <Clock className="w-3 h-3" />
                      {t.createdAt}: {new Date(viewChallenge.createdAt).toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en')}
                    </span>
                    <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                      <Clock className="w-3 h-3" />
                      {t.expiresAt}: {new Date(viewChallenge.expiresAt).toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en')}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteChallenge} onOpenChange={(open) => !open && setDeleteChallenge(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              {t.deleteConfirmTitle}
            </DialogTitle>
            <DialogDescription className={cn("pt-2", isRTL && "text-right")}>
              {t.deleteConfirmMessage}
            </DialogDescription>
          </DialogHeader>
          {deleteChallenge && (
            <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50 border", isRTL && "flex-row-reverse")}>
              {deleteChallenge.imageUrl && (
                <img src={deleteChallenge.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              )}
              <div className={cn("min-w-0", isRTL && "text-right")}>
                <p className="font-medium text-sm truncate">
                  {language === 'fr' ? deleteChallenge.titleFr : language === 'ar' ? deleteChallenge.titleAr : deleteChallenge.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getSubjectInfo(deleteChallenge.subject)?.icon}{' '}
                  {language === 'fr' ? getSubjectInfo(deleteChallenge.subject)?.nameFr : language === 'ar' ? getSubjectInfo(deleteChallenge.subject)?.nameAr : getSubjectInfo(deleteChallenge.subject)?.name}
                  {' · '}
                  {deleteChallenge.participantCount ?? 0} {t.participants}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className={cn("gap-2 sm:gap-0", isRTL && "flex-row-reverse")}>
            <Button variant="outline" onClick={() => setDeleteChallenge(null)} disabled={isDeleting}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting} className="gap-2">
              <Trash2 className="w-4 h-4" />
              {t.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
