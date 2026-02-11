import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Award,
  Target,
  Globe,
  Mic,
  BookOpen,
  GraduationCap,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { EvaluationService, EvaluationData } from '@/services/EvaluationService';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const LANGUAGES = [
  { value: 'French', label: 'Français', labelAr: 'الفرنسية', icon: '🇫🇷' },
  { value: 'English', label: 'Anglais', labelAr: 'الإنجليزية', icon: '🇬🇧' },
  { value: 'German', label: 'Allemand', labelAr: 'الألمانية', icon: '🇩🇪' },
  { value: 'Spanish', label: 'Espagnol', labelAr: 'الإسبانية', icon: '🇪🇸' },
  { value: 'Italian', label: 'Italien', labelAr: 'الإيطالية', icon: '🇮🇹' },
  { value: 'Arabic', label: 'Arabe', labelAr: 'العربية', icon: '🇸🇦' },
  { value: 'Portuguese', label: 'Portugais', labelAr: 'البرتغالية', icon: '🇵🇹' },
];

function getLevelColor(level: string) {
  switch (level) {
    case 'A1': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'A2': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'B1': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'B2': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'C1': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'C2': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function getScoreGradient(score: number) {
  if (score >= 80) return 'from-emerald-500 to-teal-500';
  if (score >= 60) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-pink-500';
}

function getProgressColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

// ============================================
// Evaluation Detail Card
// ============================================
function EvaluationDetailCard({ evaluation, isRTL, dateLocale }: {
  evaluation: EvaluationData;
  isRTL: boolean;
  dateLocale: typeof fr;
}) {
  const [expanded, setExpanded] = useState(false);
  const langInfo = LANGUAGES.find(l => l.value === evaluation.language);

  const skills = [
    { label: isRTL ? 'النطق' : 'Prononciation', icon: Mic, value: evaluation.pronunciation, color: 'text-violet-600 dark:text-violet-400' },
    { label: isRTL ? 'القواعد' : 'Grammaire', icon: BookOpen, value: evaluation.grammar, color: 'text-blue-600 dark:text-blue-400' },
    { label: isRTL ? 'المفردات' : 'Vocabulaire', icon: FileText, value: evaluation.vocabulary, color: 'text-teal-600 dark:text-teal-400' },
    { label: isRTL ? 'الطلاقة' : 'Fluidité', icon: TrendingUp, value: evaluation.fluency, color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <motion.div variants={item}>
      <Card className="overflow-hidden hover:shadow-lg transition-all border-l-4" style={{
        borderLeftColor: evaluation.overallScore >= 80 ? 'rgb(16, 185, 129)' : evaluation.overallScore >= 60 ? 'rgb(245, 158, 11)' : 'rgb(239, 68, 68)'
      }}>
        <CardContent className="p-5">
          {/* Header */}
          <div className={cn("flex items-center justify-between gap-3 mb-4", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="text-2xl">{langInfo?.icon}</div>
              <div className={cn(isRTL && "text-right")}>
                <p className="font-semibold">{isRTL ? langInfo?.labelAr : langInfo?.label}</p>
                <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(evaluation.createdAt), 'EEEE dd MMMM yyyy', { locale: dateLocale })}
                  <span>•</span>
                  <span>{isRTL ? 'بواسطة' : 'Par'} {evaluation.professorName}</span>
                </div>
              </div>
            </div>

            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              {evaluation.assignedLevel && (
                <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full", getLevelColor(evaluation.assignedLevel))}>
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{evaluation.assignedLevel}</span>
                </div>
              )}
              <div className={cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-white font-bold bg-gradient-to-r", getScoreGradient(evaluation.overallScore))}>
                <Award className="w-4 h-4" />
                {evaluation.overallScore}%
              </div>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {skills.map(({ label, icon: Icon, value, color }) => (
              <div key={label} className="relative p-3 rounded-xl bg-muted/40 overflow-hidden">
                <div className={cn("flex items-center justify-between mb-2", isRTL && "flex-row-reverse")}>
                  <Icon className={cn("w-4 h-4", color)} />
                  <span className={cn("text-lg font-bold tabular-nums", getScoreColor(value))}>{value}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", getProgressColor(value))} style={{ width: `${value}%` }} />
                </div>
                <p className={cn("text-xs text-muted-foreground mt-1.5", isRTL && "text-right")}>{label}</p>
              </div>
            ))}
          </div>

          {/* Expand details */}
          <Button variant="ghost" size="sm" className={cn("w-full mt-3", isRTL && "flex-row-reverse")} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {expanded ? (isRTL ? 'إخفاء التفاصيل' : 'Masquer') : (isRTL ? 'عرض التفاصيل' : 'Voir détails')}
          </Button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />

                {/* Feedback */}
                {evaluation.feedback && (
                  <div className={cn("p-4 rounded-xl bg-muted/30 mb-4", isRTL && "text-right")}>
                    <p className={cn("text-xs font-semibold text-primary mb-1 flex items-center gap-1", isRTL && "flex-row-reverse")}>
                      <FileText className="w-3 h-3" />
                      {isRTL ? 'ملاحظات الأستاذ' : 'Commentaire du professeur'}
                    </p>
                    <p className="text-sm text-foreground/80">{evaluation.feedback}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  {evaluation.strengths?.length > 0 && (
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <p className={cn("text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                        <Star className="w-4 h-4" />
                        {isRTL ? 'نقاط القوة' : 'Points forts'}
                      </p>
                      <ul className="space-y-1">
                        {evaluation.strengths.map((s, i) => (
                          <li key={i} className={cn("text-sm text-foreground/70 flex items-start gap-2", isRTL && "flex-row-reverse")}>
                            <span className="text-emerald-500 mt-0.5">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas to improve */}
                  {evaluation.areasToImprove?.length > 0 && (
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <p className={cn("text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                        <Target className="w-4 h-4" />
                        {isRTL ? 'نقاط التحسين' : 'À améliorer'}
                      </p>
                      <ul className="space-y-1">
                        {evaluation.areasToImprove.map((a, i) => (
                          <li key={i} className={cn("text-sm text-foreground/70 flex items-start gap-2", isRTL && "flex-row-reverse")}>
                            <span className="text-amber-500 mt-0.5">→</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// Main Page
// ============================================
export default function StudentEvaluations() {
  const { user } = useAuth();
  const { language: uiLang } = useLanguage();
  const isRTL = uiLang === 'ar';
  const dateLocale = uiLang === 'ar' ? ar : fr;

  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterLanguage, setFilterLanguage] = useState('all');

  useEffect(() => {
    const loadEvaluations = async () => {
      setIsLoading(true);
      try {
        const response = await EvaluationService.getMyEvaluations();
        if (response.success && Array.isArray(response.data)) {
          setEvaluations(response.data);
        }
      } catch (error) {
        console.error('Error loading evaluations:', error);
        toast.error(isRTL ? 'فشل تحميل التقييمات' : 'Impossible de charger les évaluations');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvaluations();
  }, [isRTL]);

  // Filtered evaluations
  const filteredEvaluations = filterLanguage === 'all'
    ? evaluations
    : evaluations.filter(e => e.language === filterLanguage);

  // Stats
  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length)
    : 0;

  const avgPronunciation = evaluations.length > 0 ? Math.round(evaluations.reduce((s, e) => s + e.pronunciation, 0) / evaluations.length) : 0;
  const avgGrammar = evaluations.length > 0 ? Math.round(evaluations.reduce((s, e) => s + e.grammar, 0) / evaluations.length) : 0;
  const avgVocabulary = evaluations.length > 0 ? Math.round(evaluations.reduce((s, e) => s + e.vocabulary, 0) / evaluations.length) : 0;
  const avgFluency = evaluations.length > 0 ? Math.round(evaluations.reduce((s, e) => s + e.fluency, 0) / evaluations.length) : 0;

  // Unique languages evaluated
  const evaluatedLanguages = [...new Set(evaluations.map(e => e.language))];

  // Current level from user context
  const currentLevel = user?.student?.level || 'A1';

  // Latest level assignment
  const latestLevelChange = evaluations.find(e => e.assignedLevel);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">{isRTL ? 'جارٍ التحميل...' : 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
          <div className={cn(isRTL && "text-right")}>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {isRTL ? 'تقييماتي' : 'Mes évaluations'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'تابع تقدمك عبر تقييمات أساتذتك' : 'Suivez votre progression à travers les évaluations de vos professeurs'}
            </p>
          </div>
          <Badge className={cn("text-base px-4 py-1.5 font-bold", getLevelColor(currentLevel))}>
            <GraduationCap className="w-4 h-4 mr-1.5" />
            {isRTL ? 'المستوى' : 'Niveau'}: {currentLevel}
          </Badge>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 text-center">
            <div className={cn("text-3xl font-bold", getScoreColor(avgScore))}>{avgScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">{isRTL ? 'المعدل العام' : 'Score moyen'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">{evaluations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{isRTL ? 'تقييمات' : 'Évaluations'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-500/5">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{evaluatedLanguages.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{isRTL ? 'لغات' : 'Langues'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {latestLevelChange?.assignedLevel || currentLevel}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{isRTL ? 'المستوى' : 'Niveau'}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Skills Radar */}
      {evaluations.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <BarChart3 className="w-5 h-5 text-primary" />
                {isRTL ? 'متوسط المهارات' : 'Moyenne des compétences'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: isRTL ? 'النطق' : 'Prononciation', icon: Mic, value: avgPronunciation, color: 'violet' },
                  { label: isRTL ? 'القواعد' : 'Grammaire', icon: BookOpen, value: avgGrammar, color: 'blue' },
                  { label: isRTL ? 'المفردات' : 'Vocabulaire', icon: FileText, value: avgVocabulary, color: 'teal' },
                  { label: isRTL ? 'الطلاقة' : 'Fluidité', icon: TrendingUp, value: avgFluency, color: 'amber' },
                ].map(skill => (
                  <div key={skill.label} className="text-center space-y-2">
                    <div className="relative mx-auto w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          className="stroke-muted"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          className={`stroke-${skill.color}-500`}
                          strokeWidth="3"
                          strokeDasharray={`${skill.value}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn("text-lg font-bold", getScoreColor(skill.value))}>{skill.value}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{skill.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filter */}
      <motion.div variants={item}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <h2 className="font-semibold">{isRTL ? 'التقييمات' : 'Évaluations'}</h2>
          <Select value={filterLanguage} onValueChange={setFilterLanguage}>
            <SelectTrigger className="w-[160px] h-9">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? 'كل اللغات' : 'Toutes les langues'}</SelectItem>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.icon} {isRTL ? lang.labelAr : lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredEvaluations.length}</Badge>
        </div>
      </motion.div>

      {/* Evaluations List */}
      <div className="space-y-4">
        {filteredEvaluations.length === 0 && (
          <motion.div variants={item}>
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {isRTL ? 'لا توجد تقييمات بعد' : 'Aucune évaluation encore'}
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {isRTL
                    ? 'ستظهر التقييمات هنا عندما يقوم أساتذتك بتقييم أدائك'
                    : 'Les évaluations apparaîtront ici lorsque vos professeurs évalueront vos performances'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {filteredEvaluations.map(evaluation => (
          <EvaluationDetailCard
            key={evaluation.id}
            evaluation={evaluation}
            isRTL={isRTL}
            dateLocale={dateLocale}
          />
        ))}
      </div>
    </motion.div>
  );
}
