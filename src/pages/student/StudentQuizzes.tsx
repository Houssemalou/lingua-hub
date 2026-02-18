import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  BarChart3,
  Ban,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuizService } from '@/services/QuizService';
import { QuizModel, QuizResultModel } from '@/models/Quiz';
import { QuizTaker } from '@/components/quiz/QuizTaker';
import { QuizResultView } from '@/components/quiz/QuizResultView';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

type ViewMode = 'list' | 'taking' | 'results';

export default function StudentQuizzes() {
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const dateLocale = language === 'ar' ? ar : fr;
  const studentId = user?.student?.id || user?.id || '';

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Data
  const [quizzes, setQuizzes] = useState<QuizModel[]>([]);
  const [results, setResults] = useState<QuizResultModel[]>([]);

  // Active quiz/result for taking/viewing
  const [activeQuiz, setActiveQuiz] = useState<QuizModel | null>(null);
  const [activeResult, setActiveResult] = useState<QuizResultModel | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [quizzesRes, resultsRes] = await Promise.all([
        QuizService.getAll({ isPublished: true }),
        studentId ? QuizService.getStudentResults(studentId) : Promise.resolve({ success: true, data: [] as QuizResultModel[] }),
      ]);

      const allQuizzes = quizzesRes.data || [];
      setQuizzes(allQuizzes);

      if (resultsRes.success && Array.isArray(resultsRes.data)) {
        setResults(resultsRes.data);
      } else if (resultsRes.success && resultsRes.data) {
        setResults(resultsRes.data as unknown as QuizResultModel[]);
      }
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      toast.error(isRTL ? 'فشل تحميل البيانات' : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, isRTL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived data
  const takenQuizIds = new Set(results.map((r) => r.quizId));
  const passedCount = results.filter((r) => r.passed).length;
  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + (r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : 0), 0) /
            results.length
        )
      : 0;

  // Filtered
  const filteredAvailable = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.sessionName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredResults = results.filter(
    (r) =>
      (r.quizTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.sessionName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Start quiz
  const handleStartQuiz = async (quizId: string) => {
    try {
      const response = await QuizService.getById(quizId);
      if (response.success && response.data) {
        setActiveQuiz(response.data);
        setViewMode('taking');
      } else {
        toast.error(isRTL ? 'فشل تحميل الاختبار' : 'Impossible de charger le quiz');
      }
    } catch {
      toast.error(isRTL ? 'فشل تحميل الاختبار' : 'Impossible de charger le quiz');
    }
  };

  // Submit quiz
  const handleQuizComplete = async (answers: { questionId: string; selectedAnswer: number }[]) => {
    if (!activeQuiz) return;
    try {
      const response = await QuizService.submit({
        quizId: activeQuiz.id,
        answers,
      });
      if (response.success && response.data) {
        setActiveResult(response.data);
        setViewMode('results');
        toast.success(isRTL ? 'تم إرسال الاختبار!' : 'Quiz soumis avec succès !');
        fetchData();
      } else {
        toast.error(response.error || (isRTL ? 'فشل إرسال الاختبار' : 'Erreur lors de la soumission'));
        setViewMode('list');
      }
    } catch {
      toast.error(isRTL ? 'فشل إرسال الاختبار' : 'Erreur lors de la soumission');
      setViewMode('list');
    }
  };

  // View past result
  const handleViewResult = (result: QuizResultModel) => {
    setActiveResult(result);
    const matchingQuiz = quizzes.find((q) => q.id === result.quizId) || null;
    setActiveQuiz(matchingQuiz);
    setViewMode('results');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setActiveQuiz(null);
    setActiveResult(null);
  };

  // ----- TAKING view -----
  if (viewMode === 'taking' && activeQuiz) {
    return (
      <div className="py-4">
        <QuizTaker
          quiz={activeQuiz}
          onComplete={handleQuizComplete}
          onCancel={handleBackToList}
        />
      </div>
    );
  }

  // ----- RESULTS view -----
  if (viewMode === 'results' && activeResult) {
    return (
      <div className="py-4">
        <QuizResultView
          result={activeResult}
          quiz={activeQuiz}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  // ----- LIST view -----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <div className={cn(isRTL && 'text-right')}>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('quiz.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('quiz.subtitle')}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div className={cn(isRTL && 'text-right')}>
                <p className="text-sm text-muted-foreground">{t('quiz.quizzesTaken')}</p>
                <p className="text-xl font-bold">{results.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-4">
            <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-500" />
              </div>
              <div className={cn(isRTL && 'text-right')}>
                <p className="text-sm text-muted-foreground">{t('quiz.passed')}</p>
                <p className="text-xl font-bold">{passedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
          <CardContent className="p-4">
            <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
              <div className={cn(isRTL && 'text-right')}>
                <p className="text-sm text-muted-foreground">{t('quiz.avgScore')}</p>
                <p className="text-xl font-bold">{avgScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div variants={item}>
        <div className="relative max-w-md">
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground',
              isRTL ? 'right-3' : 'left-3'
            )}
          />
          <Input
            placeholder={isRTL ? 'البحث عن اختبار...' : 'Rechercher un quiz...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(isRTL ? 'pr-10' : 'pl-10')}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="available" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              {t('quiz.available')}
              {filteredAvailable.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {filteredAvailable.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Trophy className="w-4 h-4" />
              {t('quiz.history')}
              {filteredResults.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {filteredResults.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Available quizzes */}
          <TabsContent value="available">
            {filteredAvailable.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('quiz.noAvailable')}</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {isRTL
                      ? 'سيظهر هنا اختبارات جديدة عندما ينشرها أساتذتك'
                      : 'De nouveaux quiz apparaîtront ici quand vos professeurs les publieront'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvailable.map((quiz) => {
                  const isExpired = takenQuizIds.has(quiz.id);
                  return (
                    <motion.div key={quiz.id} variants={item}>
                      <Card className={cn(
                        'h-full flex flex-col transition-shadow',
                        isExpired ? 'opacity-75' : 'hover:shadow-lg'
                      )}>
                        <CardContent className="p-5 flex flex-col flex-1">
                          <div className="flex-1 space-y-3">
                            <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                              <h3 className={cn('font-semibold text-lg line-clamp-2', isRTL && 'text-right')}>
                                {quiz.title}
                              </h3>
                              {isExpired && (
                                <Badge className="bg-red-500/10 text-red-500 border-red-500/30 gap-1">
                                  <Ban className="w-3 h-3" />
                                  {isRTL ? 'منتهي' : 'Expiré'}
                                </Badge>
                              )}
                            </div>
                            {quiz.sessionName && (
                              <p className={cn('text-sm text-muted-foreground', isRTL && 'text-right')}>
                                {t('quiz.session')}: {quiz.sessionName}
                              </p>
                            )}
                            <div className={cn('flex items-center gap-3 flex-wrap', isRTL && 'flex-row-reverse')}>
                              <Badge variant="secondary">
                                {quiz.questions.length} {t('quiz.questions')}
                              </Badge>
                              {quiz.timeLimit && (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="w-3 h-3" />
                                  {quiz.timeLimit} {t('quiz.minutes')}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {isExpired ? (
                            <div className="w-full mt-4 py-2.5 px-4 rounded-md bg-red-500/10 border border-red-500/20 text-center">
                              <p className="text-sm font-medium text-red-500 flex items-center justify-center gap-2">
                                <Ban className="w-4 h-4" />
                                {isRTL ? 'لقد أجريت هذا الاختبار بالفعل. لا يمكنك إعادته.' : 'Vous avez déjà passé ce quiz. Vous ne pouvez pas le repasser.'}
                              </p>
                            </div>
                          ) : (
                            <Button
                              className="w-full mt-4 gap-2"
                              onClick={() => handleStartQuiz(quiz.id)}
                            >
                              {t('quiz.start')}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            {filteredResults.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('quiz.noHistory')}</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredResults.map((result) => {
                  const scorePercent =
                    result.totalQuestions > 0
                      ? Math.round((result.score / result.totalQuestions) * 100)
                      : 0;

                  return (
                    <motion.div key={result.id} variants={item}>
                      <Card
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewResult(result)}
                      >
                        <CardContent className="p-4">
                          <div
                            className={cn(
                              'flex items-center justify-between gap-4',
                              isRTL && 'flex-row-reverse'
                            )}
                          >
                            <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                              <h4 className="font-medium truncate">
                                {result.quizTitle || result.sessionName || '-'}
                              </h4>
                              <div
                                className={cn(
                                  'flex items-center gap-2 text-sm text-muted-foreground mt-1',
                                  isRTL && 'flex-row-reverse'
                                )}
                              >
                                {result.sessionName && <span>{result.sessionName}</span>}
                                <span>•</span>
                                <span>
                                  {format(new Date(result.completedAt), 'PP', {
                                    locale: dateLocale,
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
                              <span
                                className={cn(
                                  'text-xl font-bold',
                                  result.passed ? 'text-emerald-500' : 'text-red-500'
                                )}
                              >
                                {scorePercent}%
                              </span>
                              <Badge
                                className={cn(
                                  result.passed
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-600 border-red-500/30'
                                )}
                              >
                                {result.passed ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {result.passed ? t('quiz.passed') : t('quiz.failed')}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
