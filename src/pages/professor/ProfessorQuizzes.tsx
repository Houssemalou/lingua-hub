import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Plus, 
  Search,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProfessorSessions } from '@/data/mockData';
import { mockQuizResults } from '@/data/quizzes';
import { QuizCreator } from '@/components/quiz/QuizCreator';
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

  const sessions = professor ? getProfessorSessions(professor.id) : [];
  const dateLocale = language === 'ar' ? ar : fr;

  // Filter quiz results for professor's sessions
  const professorSessionIds = sessions.map(s => s.id);
  const relevantQuizResults = mockQuizResults.filter(result => 
    professorSessionIds.some(id => result.sessionName.includes(id))
  );

  const filteredResults = relevantQuizResults.filter(result =>
    result.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.sessionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateQuiz = (quiz: {
    title: string;
    description: string;
    sessionId: string;
    questions: Array<{ id: string; question: string; options: string[]; correctAnswer: number }>;
  }) => {
    console.log('Quiz created:', quiz);
    setIsCreateDialogOpen(false);
  };

  // Stats
  const totalQuizzes = relevantQuizResults.length;
  const passedQuizzes = relevantQuizResults.filter(r => r.passed).length;
  const avgScore = totalQuizzes > 0 
    ? Math.round(relevantQuizResults.reduce((acc, r) => acc + r.score, 0) / totalQuizzes)
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
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isRTL ? 'إدارة الاختبارات' : 'Gestion des Quiz'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'إنشاء وإدارة اختبارات جلساتك' : 'Créer et gérer les quiz de vos sessions'}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className={cn("gap-2", isRTL && "flex-row-reverse")}>
              <Plus className="w-4 h-4" />
              {isRTL ? 'إنشاء اختبار' : 'Créer un Quiz'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إنشاء اختبار جديد' : 'Créer un nouveau Quiz'}</DialogTitle>
            </DialogHeader>
            <QuizCreator
              sessions={sessions.map(s => ({ id: s.id, name: s.roomName }))}
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
                <p className="text-xl font-bold">{totalQuizzes}</p>
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
                <p className="text-sm text-muted-foreground">{isRTL ? 'ناجحون' : 'Réussis'}</p>
                <p className="text-xl font-bold">{passedQuizzes}</p>
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

      {/* Search */}
      <motion.div variants={item}>
        <div className="relative max-w-md">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={isRTL ? 'البحث عن طالب أو جلسة...' : 'Rechercher un étudiant ou une session...'}
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
            <CardTitle>{isRTL ? 'نتائج الطلاب' : 'Résultats des Étudiants'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={cn("border-b border-border", isRTL && "text-right")}>
                    <th className="pb-3 font-medium text-muted-foreground">{isRTL ? 'الطالب' : 'Étudiant'}</th>
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
                            <img src={result.studentAvatar} alt="" className="w-8 h-8 rounded-full" />
                            <span className="font-medium">{result.studentName}</span>
                          </div>
                        </td>
                        <td className="py-3 hidden sm:table-cell text-muted-foreground">
                          {result.sessionName}
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
                              {isRTL ? 'ناجح' : 'Réussi'}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                              <XCircle className="w-3 h-3 mr-1" />
                              {isRTL ? 'راسب' : 'Échoué'}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        {isRTL ? 'لا توجد نتائج' : 'Aucun résultat'}
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
