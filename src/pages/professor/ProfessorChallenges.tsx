import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Edit,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ChallengeCreator, ChallengeFormData } from '@/components/professor/ChallengeCreator';
import { 
  mockProfessorChallenges, 
  mockStudentAttempts,
  mockChallengeLeaderboard,
  challengeSubjects,
  difficultyConfig,
  calculateChallengePoints,
  ProfessorChallenge
} from '@/data/professorChallenges';
import { ChallengeLeaderboard } from '@/components/gamification/ChallengeLeaderboard';

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
  const [challenges, setChallenges] = useState<ProfessorChallenge[]>(mockProfessorChallenges);
  const [activeTab, setActiveTab] = useState('active');

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
      challengeCreated: 'Défi créé avec succès!'
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
      challengeCreated: 'تم إنشاء التحدي بنجاح!'
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
      challengeCreated: 'Challenge created successfully!'
    }
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  const handleCreateChallenge = (formData: ChallengeFormData) => {
    const newChallenge: ProfessorChallenge = {
      id: `pc-${Date.now()}`,
      professorId: user?.id || 'prof-1',
      professorName: user?.professor?.name || 'Professor',
      subject: formData.subject,
      difficulty: formData.difficulty,
      title: formData.title,
      titleFr: formData.title,
      titleAr: formData.title,
      question: formData.question,
      questionFr: formData.question,
      questionAr: formData.question,
      options: formData.options,
      optionsFr: formData.options,
      optionsAr: formData.options,
      correctAnswer: formData.correctAnswer,
      basePoints: formData.basePoints,
      imageUrl: formData.imageUrl,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + formData.expiresIn * 60 * 60 * 1000).toISOString(),
      isActive: true
    };

    setChallenges([newChallenge, ...challenges]);
    toast({
      title: t.challengeCreated,
      description: formData.title
    });
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

  const getParticipantCount = (challengeId: string) => {
    return mockStudentAttempts.filter(a => a.challengeId === challengeId).length;
  };

  const activeChallenges = challenges.filter(c => c.isActive && new Date(c.expiresAt) > new Date());

  // Stats
  const totalParticipants = new Set(mockStudentAttempts.map(a => a.studentId)).size;
  const successfulAttempts = mockStudentAttempts.filter(a => a.isCorrect).length;
  const successRate = mockStudentAttempts.length > 0 
    ? Math.round((successfulAttempts / mockStudentAttempts.length) * 100) 
    : 0;
  const averageScore = mockStudentAttempts.length > 0
    ? Math.round(mockStudentAttempts.reduce((sum, a) => sum + a.pointsEarned, 0) / mockStudentAttempts.length)
    : 0;

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
              <p className="text-2xl font-bold">{activeChallenges.length}</p>
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
              <p className="text-2xl font-bold">{totalParticipants}</p>
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
              <p className="text-2xl font-bold">{averageScore} XP</p>
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
              <p className="text-2xl font-bold">{successRate}%</p>
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
                  const participants = getParticipantCount(challenge.id);
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
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive">
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
            <ChallengeLeaderboard entries={mockChallengeLeaderboard} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Challenge Creator Modal */}
      <ChallengeCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onSubmit={handleCreateChallenge}
      />
    </motion.div>
  );
}
