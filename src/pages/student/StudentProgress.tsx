import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, BarChart3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatsService, StudentStats } from '@/services/StatsService';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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

const levelDescriptions: Record<string, { name: { fr: string; ar: string }; description: { fr: string; ar: string }; minScore: number }> = {
  A1: { name: { fr: 'Débutant', ar: 'مبتدئ' }, description: { fr: 'Peut comprendre des phrases et expressions de base', ar: 'يمكنه فهم العبارات والتعبيرات الأساسية' }, minScore: 0 },
  A2: { name: { fr: 'Élémentaire', ar: 'أساسي' }, description: { fr: 'Peut communiquer dans des tâches simples et routinières', ar: 'يمكنه التواصل في المهام البسيطة والروتينية' }, minScore: 20 },
  B1: { name: { fr: 'Intermédiaire', ar: 'متوسط' }, description: { fr: 'Peut faire face à la plupart des situations de voyage', ar: 'يمكنه التعامل مع معظم مواقف السفر' }, minScore: 40 },
  B2: { name: { fr: 'Intermédiaire supérieur', ar: 'فوق المتوسط' }, description: { fr: 'Peut interagir couramment avec des locuteurs natifs', ar: 'يمكنه التفاعل بطلاقة مع الناطقين الأصليين' }, minScore: 60 },
  C1: { name: { fr: 'Avancé', ar: 'متقدم' }, description: { fr: 'Peut exprimer des idées couramment et spontanément', ar: 'يمكنه التعبير عن الأفكار بطلاقة وعفوية' }, minScore: 80 },
  C2: { name: { fr: 'Maîtrise', ar: 'إتقان' }, description: { fr: 'Peut comprendre pratiquement tout ce qu\'il entend ou lit', ar: 'يمكنه فهم كل ما يسمعه أو يقرأه تقريبًا' }, minScore: 95 },
};

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function StudentProgress() {
  const [statsData, setStatsData] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isRTL } = useLanguage();
  const lang = isRTL ? 'ar' : 'fr';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await StatsService.getStudentStats();
        setStatsData(data);
      } catch (err) {
        console.error('Failed to fetch student stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !statsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const averageProgress = Math.round(statsData.overallProgress);
  const currentLevel = statsData.level;
  const currentLevelIndex = levels.indexOf(currentLevel);
  const nextLevel = levels[currentLevelIndex + 1];
  const progressToNextLevel = averageProgress - levelDescriptions[currentLevel].minScore;
  const rangeToNextLevel = nextLevel 
    ? levelDescriptions[nextLevel].minScore - levelDescriptions[currentLevel].minScore
    : 20;

  const skillDetails = [
    { 
      name: isRTL ? 'النطق' : 'Prononciation', 
      value: statsData.skills.pronunciation,
      icon: '🗣️',
      description: isRTL ? 'قدرتك على إنتاج الأصوات بدقة' : 'Votre capacité à produire des sons avec précision',
      color: 'bg-level-a1'
    },
    { 
      name: isRTL ? 'القواعد' : 'Grammaire', 
      value: statsData.skills.grammar,
      icon: '📝',
      description: isRTL ? 'فهم واستخدام قواعد اللغة' : 'Compréhension et utilisation des règles de la langue',
      color: 'bg-level-b1'
    },
    { 
      name: isRTL ? 'المفردات' : 'Vocabulaire', 
      value: statsData.skills.vocabulary,
      icon: '📚',
      description: isRTL ? 'معرفة الكلمات ومعانيها' : 'Connaissance des mots et de leurs significations',
      color: 'bg-level-b2'
    },
    { 
      name: isRTL ? 'الطلاقة' : 'Fluidité', 
      value: statsData.skills.fluency,
      icon: '💬',
      description: isRTL ? 'سلاسة وتدفق الكلام' : 'Aisance et fluidité du discours',
      color: 'bg-level-c1'
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {isRTL ? 'التقدم والمستوى' : 'Progression & Niveau'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {isRTL ? 'تتبع رحلة تعلم اللغة الخاصة بك' : 'Suivez votre parcours d\'apprentissage'}
        </p>
      </motion.div>

      {/* Current Level Card */}
      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <div className="gradient-accent p-4 sm:p-6 lg:p-8">
            <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6", isRTL && "sm:flex-row-reverse")}>
              <div className={cn("flex items-center gap-4 sm:gap-6", isRTL && "flex-row-reverse")}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl bg-sidebar-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-sidebar-primary-foreground">{currentLevel}</span>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-sidebar-primary-foreground">
                    {levelDescriptions[currentLevel].name[lang]}
                  </h2>
                  <p className="text-sidebar-primary-foreground/80 mt-1 max-w-md text-sm sm:text-base">
                    {levelDescriptions[currentLevel].description[lang]}
                  </p>
                </div>
              </div>
              <div className={cn(isRTL ? "text-right sm:text-left" : "text-left sm:text-right")}>
                <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">
                  {isRTL ? 'التقدم العام' : 'Progression globale'}
                </p>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sidebar-primary-foreground mt-1">{averageProgress}%</p>
              </div>
            </div>
          </div>
          
          {nextLevel && (
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span className="font-medium">
                    {isRTL ? `التقدم نحو ${nextLevel}` : `Progression vers ${nextLevel}`}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round((progressToNextLevel / rangeToNextLevel) * 100)}%
                  </span>
                </div>
                <Progress value={(progressToNextLevel / rangeToNextLevel) * 100} className="h-2 sm:h-3" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isRTL 
                    ? `واصل التدريب! تحتاج ${rangeToNextLevel - progressToNextLevel} نقطة إضافية للوصول إلى ${nextLevel}.`
                    : `Continuez à pratiquer ! Il vous faut ${rangeToNextLevel - progressToNextLevel} points de plus pour atteindre ${nextLevel}.`}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* CEFR Level Path */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2 text-base sm:text-lg", isRTL && "flex-row-reverse")}>
              <Award className="w-5 h-5 text-accent" />
              {isRTL ? 'مسار مستويات CECR' : 'Parcours des niveaux CECR'}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className={cn("flex items-center justify-between relative min-w-[400px] sm:min-w-0 px-2", isRTL && "flex-row-reverse")}>
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2" />
              {levels.map((level, index) => {
                const isCompleted = index < currentLevelIndex;
                const isCurrent = index === currentLevelIndex;
                const isFuture = index > currentLevelIndex;
                
                return (
                  <div key={level} className="relative flex flex-col items-center z-10">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                        isCompleted
                          ? 'bg-success text-success-foreground'
                          : isCurrent
                            ? 'bg-accent text-accent-foreground ring-2 sm:ring-4 ring-accent/30'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {level}
                    </div>
                    <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium ${
                      isCurrent ? 'text-accent' : isFuture ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {levelDescriptions[level].name[lang]}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Skill Breakdown */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <BarChart3 className="w-5 h-5 text-primary" />
              {isRTL ? 'تفصيل المهارات' : 'Détail des compétences'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {skillDetails.map((skill) => (
                <div key={skill.name} className="space-y-3">
                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <span className="text-2xl">{skill.icon}</span>
                    <div className="flex-1">
                      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                        <span className="font-medium text-foreground">{skill.name}</span>
                        <span className="text-lg font-bold text-foreground">{skill.value}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{skill.description}</p>
                    </div>
                  </div>
                  <Progress value={skill.value} className="h-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Target className="w-5 h-5 text-warning" />
              {isRTL ? 'الإنجازات الأخيرة' : 'Réalisations récentes'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: '🎯', title: isRTL ? 'الجلسة الأولى' : 'Première session', desc: isRTL ? 'أكملت أول جلسة تعلم' : 'Vous avez terminé votre première session' },
                { icon: '🔥', title: isRTL ? 'متعلم نشط' : 'Apprenant actif', desc: isRTL ? 'أكملت عدة جلسات' : 'Vous avez terminé plusieurs sessions' },
                { icon: '💬', title: isRTL ? 'محترف المحادثة' : 'Pro de la conversation', desc: isRTL ? 'شاركت في 10 محادثات' : 'Participation à 10 conversations' },
                { icon: '📚', title: isRTL ? 'بناء المفردات' : 'Bâtisseur de vocabulaire', desc: isRTL ? 'تعلمت 100 كلمة جديدة' : 'Appris 100 nouveaux mots' },
                { icon: '⭐', title: isRTL ? 'ارتقاء المستوى!' : 'Niveau supérieur !', desc: isRTL ? 'وصلت إلى المستوى B1' : 'Atteint le niveau B1' },
                { icon: '🏆', title: isRTL ? 'أفضل طالب' : 'Meilleur élève', desc: isRTL ? 'ضمن أفضل 10% هذا الشهر' : 'Dans le top 10% ce mois-ci' },
              ].map((achievement, index) => (
                <div
                  key={index}
                  className={cn("flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border", isRTL && "flex-row-reverse")}
                >
                  <span className="text-3xl">{achievement.icon}</span>
                  <div>
                    <p className="font-medium text-foreground">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
