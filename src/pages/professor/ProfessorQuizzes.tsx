import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Trash2,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuizCreator } from '@/components/quiz/QuizCreator';
import { QuizService } from '@/services/QuizService';
import { RoomService } from '@/services/RoomService';
import { QuizModel, QuizResultModel } from '@/models/Quiz';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

export default function ProfessorQuizzes() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const professor = user?.professor;

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Data state
  const [quizzes, setQuizzes] = useState<QuizModel[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResultModel[]>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; name: string; language: string }>>([]);

  // Loading / error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateLocale = language === 'ar' ? ar : fr;

  // Fetch quizzes and their results
  const fetchData = useCallback(async () => {
    if (!professor?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch professor's quizzes
      const quizzesResponse = await QuizService.getAll({ createdBy: professor.id });
      const fetchedQuizzes = quizzesResponse.data || [];
      setQuizzes(fetchedQuizzes);

      // Fetch results for each quiz (frontend aggregation)
      const allResults: QuizResultModel[] = [];
      await Promise.all(
        fetchedQuizzes.map(async (quiz) => {
          try {
            const resultsResponse = await QuizService.getQuizResults(quiz.id);
            if (resultsResponse.success && resultsResponse.data) {
              // Enrich results with quiz info for display
              const enriched = resultsResponse.data.map(r => ({
                ...r,
                sessionName: r.sessionName || quiz.sessionName || quiz.title,
                language: r.language || quiz.language || '',
                studentAvatar: r.studentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.studentName)}`,
              }));
              allResults.push(...enriched);
            }
          } catch {
            // Skip individual quiz result failures
          }
        })
      );
      setQuizResults(allResults);
    } catch (err) {
      console.error('Error fetching quiz data:', err);
      setError(isRTL ? 'فشل في تحميل البيانات' : 'Erreur lors du chargement des donnees');
    } finally {
      setIsLoading(false);
    }
  }, [professor?.id, isRTL]);

  // Fetch sessions for the quiz creator dropdown
  const fetchSessions = useCallback(async () => {
    try {
      const response = await RoomService.getMySessions();
      const raw = response as any;
      const sessionList = raw?.data?.data || raw?.data || [];
      if (Array.isArray(sessionList)) {
        const completed = sessionList.filter((s: any) => s.status?.toLowerCase() === 'completed');
        setSessions(completed.map((s: any) => ({ id: s.id, name: s.name || s.roomName, language: s.language || '' })));
      }
    } catch {
      // Sessions fetch failure is non-critical
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSessions();
  }, [fetchData, fetchSessions]);

  // Create quiz
  const handleCreateQuiz = async (quiz: {
    title: string;
    description: string;
    sessionId: string;
    questions: Array<{ id: string; question: string; options: string[]; correctAnswer: number }>;
  }) => {
    try {
      const session = sessions.find(s => s.id === quiz.sessionId);
      const response = await QuizService.create({
        title: quiz.title,
        description: quiz.description,
        sessionId: quiz.sessionId,
        language: session?.language || '',
        questions: quiz.questions.map(({ question, options, correctAnswer }) => ({
          question,
          options,
          correctAnswer,
        })),
      });

      if (response.success) {
        toast.success(isRTL ? 'تم إنشاء الاختبار بنجاح!' : 'Quiz cree avec succes !');
        setIsCreateDialogOpen(false);
        fetchData();
      } else {
        toast.error(response.error || (isRTL ? 'فشل إنشاء الاختبار' : 'Erreur lors de la creation du quiz'));
      }
    } catch {
      toast.error(isRTL ? 'فشل إنشاء الاختبار' : 'Erreur lors de la creation du quiz');
    }
  };

  // Delete quiz
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const response = await QuizService.delete(quizId);
      if (response.success) {
        toast.success(isRTL ? 'تم حذف الاختبار' : 'Quiz supprime');
        fetchData();
      } else {
        toast.error(response.error || (isRTL ? 'فشل حذف الاختبار' : 'Erreur lors de la suppression'));
      }
    } catch {
      toast.error(isRTL ? 'فشل حذف الاختبار' : 'Erreur lors de la suppression');
    }
  };

  // Publish quiz
  const handlePublishQuiz = async (quizId: string) => {
    try {
      const response = await QuizService.publish(quizId);
      if (response.success) {
        toast.success(isRTL ? 'تم نشر الاختبار' : 'Quiz publie');
        fetchData();
      } else {
        toast.error(response.error || (isRTL ? 'فشل نشر الاختبار' : 'Erreur lors de la publication'));
      }
    } catch {
      toast.error(isRTL ? 'فشل نشر الاختبار' : 'Erreur lors de la publication');
    }
  };

  // Filter results by search query
  const filteredResults = quizResults.filter(result =>
    result.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (result.sessionName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (result.quizTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalResults = quizResults.length;
  const passedResults = quizResults.filter(r => r.passed).length;
  const avgScore = totalResults > 0
    ? Math.round(quizResults.reduce((acc, r) => acc + r.score, 0) / totalResults)
    : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Quiz list skeleton */}
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-56" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Search skeleton */}
        <Skeleton className="h-10 w-full max-w-md" />
        {/* Table skeleton */}
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-8 border-b pb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-16" />
                ))}
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-8 py-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-20 hidden md:block" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" onClick={fetchData}>
            {isRTL ? 'إعادة المحاولة' : 'Reessayer'}
          </Button>
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
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isRTL ? 'إدارة الاختبارات' : 'Gestion des Quiz'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'إنشاء وإدارة اختبارات جلساتك' : 'Creer et gerer les quiz de vos sessions'}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className={cn("gap-2", isRTL && "flex-row-reverse")}>
              <Plus className="w-4 h-4" />
              {isRTL ? 'إنشاء اختبار' : 'Creer un Quiz'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إنشاء اختبار جديد' : 'Creer un nouveau Quiz'}</DialogTitle>
            </DialogHeader>
            <QuizCreator
              sessions={sessions}
              onCreateQuiz={handleCreateQuiz}
              onCancel={() => setIsCreateDialogOpen(false)}
              isRTL={isRTL}
            />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm text-muted-foreground">{isRTL ? 'إجمالي الاختبارات' : 'Total Quiz'}</p>
                <p className="text-xl font-bold">{quizzes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm text-muted-foreground">{isRTL ? 'ناجحون' : 'Reussis'}</p>
                <p className="text-xl font-bold">{passedResults}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm text-muted-foreground">{isRTL ? 'متوسط النتيجة' : 'Score moyen'}</p>
                <p className="text-xl font-bold">{avgScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quiz List */}
      {quizzes.length > 0 && (
        <motion.div variants={item}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{isRTL ? 'اختباراتي' : 'Mes Quiz'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("flex-1", isRTL ? 'text-right' : '')}>
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <span className="font-medium">{quiz.title}</span>
                        <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                          {quiz.isPublished
                            ? (isRTL ? 'منشور' : 'Publie')
                            : (isRTL ? 'مسودة' : 'Brouillon')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quiz.sessionName || quiz.description}
                        {quiz.questions && ` - ${quiz.questions.length} ${isRTL ? 'أسئلة' : 'questions'}`}
                      </p>
                    </div>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      {!quiz.isPublished && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublishQuiz(quiz.id)}
                          className="gap-1"
                        >
                          <Send className="w-3 h-3" />
                          {isRTL ? 'نشر' : 'Publier'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الاختبار؟' : 'Etes-vous sur de vouloir supprimer ce quiz ?')) {
                            handleDeleteQuiz(quiz.id);
                          }
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search */}
      <motion.div variants={item}>
        <div className="relative max-w-md">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={isRTL ? 'البحث عن طالب أو جلسة...' : 'Rechercher un etudiant ou une session...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(isRTL ? "pr-10" : "pl-10")}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
      </motion.div>

      {/* Results */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{isRTL ? 'نتائج الطلاب' : 'Resultats des Etudiants'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={cn("border-b border-border", isRTL && "text-right")}>
                    <th className="pb-3 font-medium text-muted-foreground">{isRTL ? 'الطالب' : 'Etudiant'}</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">{isRTL ? 'الجلسة' : 'Session'}</th>
                    <th className="pb-3 font-medium text-muted-foreground">{isRTL ? 'النتيجة' : 'Score'}</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">{isRTL ? 'التاريخ' : 'Date'}</th>
                    <th className="pb-3 font-medium text-muted-foreground">{isRTL ? 'الحالة' : 'Statut'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                      <tr key={result.id} className={cn("border-b border-border/50", isRTL && "text-right")}>
                        <td className="py-3">
                          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <img
                              src={result.studentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(result.studentName)}`}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                            <span className="font-medium">{result.studentName}</span>
                          </div>
                        </td>
                        <td className="py-3 hidden sm:table-cell text-muted-foreground">
                          {result.sessionName || result.quizTitle || '-'}
                        </td>
                        <td className="py-3">
                          <span className={cn(
                            "font-bold",
                            result.score >= 70 ? "text-green-500" : "text-red-500"
                          )}>
                            {result.score}%
                          </span>
                        </td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">
                          {format(new Date(result.completedAt), 'PP', { locale: dateLocale })}
                        </td>
                        <td className="py-3">
                          {result.passed ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {isRTL ? 'ناجح' : 'Reussi'}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                              <XCircle className="w-3 h-3 mr-1" />
                              {isRTL ? 'راسب' : 'Echoue'}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        {isRTL ? 'لا توجد نتائج' : 'Aucun resultat'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
