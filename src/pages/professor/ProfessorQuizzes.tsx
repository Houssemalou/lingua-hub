import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Plus, 
  Search,
  Users,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProfessorSessions, getStudentById } from '@/data/mockData';
import { mockQuizResults } from '@/data/quizzes';
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

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function ProfessorQuizzes() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const professor = user?.professor;

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);

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

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    if (field === 'question') {
      updated[index].question = value;
    } else if (field === 'correctAnswer') {
      updated[index].correctAnswer = value;
    } else if (field.startsWith('option')) {
      const optionIndex = parseInt(field.replace('option', ''));
      updated[index].options[optionIndex] = value;
    }
    setQuestions(updated);
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(isRTL ? 'تم إنشاء الاختبار بنجاح!' : 'Quiz créé avec succès !');
    setIsCreateDialogOpen(false);
    setQuizTitle('');
    setQuizDescription('');
    setSelectedSession('');
    setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إنشاء اختبار جديد' : 'Créer un nouveau Quiz'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateQuiz} className="space-y-6 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isRTL ? 'عنوان الاختبار' : 'Titre du quiz'}</Label>
                  <Input
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder={isRTL ? 'مثال: اختبار القواعد' : 'Ex: Quiz de grammaire'}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'الجلسة' : 'Session'}</Label>
                  <Select value={selectedSession} onValueChange={setSelectedSession} required>
                    <SelectTrigger>
                      <SelectValue placeholder={isRTL ? 'اختر جلسة' : 'Choisir une session'} />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.roomName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder={isRTL ? 'وصف موجز للاختبار...' : 'Description brève du quiz...'}
                  rows={2}
                />
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <Label>{isRTL ? 'الأسئلة' : 'Questions'}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="w-4 h-4 mr-1" />
                    {isRTL ? 'إضافة سؤال' : 'Ajouter'}
                  </Button>
                </div>
                
                {questions.map((q, qIndex) => (
                  <Card key={qIndex} className="p-4">
                    <div className={cn("flex items-center justify-between mb-3", isRTL && "flex-row-reverse")}>
                      <span className="font-medium text-sm">
                        {isRTL ? `السؤال ${qIndex + 1}` : `Question ${qIndex + 1}`}
                      </span>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Input
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        placeholder={isRTL ? 'نص السؤال' : 'Texte de la question'}
                        required
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correctAnswer === optIndex}
                              onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                              className="w-4 h-4"
                            />
                            <Input
                              value={opt}
                              onChange={(e) => updateQuestion(qIndex, `option${optIndex}`, e.target.value)}
                              placeholder={`${isRTL ? 'الخيار' : 'Option'} ${optIndex + 1}`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className={cn("flex justify-end gap-3", isRTL && "flex-row-reverse")}>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button type="submit">
                  {isRTL ? 'إنشاء الاختبار' : 'Créer le Quiz'}
                </Button>
              </div>
            </form>
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
