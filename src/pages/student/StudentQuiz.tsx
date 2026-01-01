import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ClipboardList, CheckCircle, XCircle, Clock, Trophy, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockQuizzes, mockQuizResults } from '@/data/quizzes';
import { cn } from '@/lib/utils';
import { QuizModal } from '@/components/quiz/QuizModal';
import { toast } from 'sonner';

const StudentQuiz = () => {
  const { t, isRTL } = useLanguage();
  const [selectedQuiz, setSelectedQuiz] = useState<typeof mockQuizzes[0] | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  // Filter quiz results for current student (using mock student id "1")
  const studentResults = mockQuizResults.filter(result => result.studentId === '1');

  const handleStartQuiz = (quiz: typeof mockQuizzes[0]) => {
    setSelectedQuiz(quiz);
    setQuizOpen(true);
  };

  const handleQuizComplete = (score: number) => {
    toast.success(
      isRTL 
        ? `تم إكمال الاختبار! نتيجتك: ${score}%` 
        : `Quiz terminé ! Score: ${score}%`
    );
  };

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('quiz.title')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t('quiz.subtitle')}</p>
      </div>

      {/* Available Quizzes */}
      <Card>
        <CardHeader className={cn("flex flex-row items-center gap-2 pb-4", isRTL && "flex-row-reverse")}>
          <ClipboardList className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{t('quiz.available')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockQuizzes.map((quiz) => (
              <Card key={quiz.id} className="border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className={isRTL ? "text-right" : ""}>
                      <h3 className="font-semibold text-foreground line-clamp-1">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quiz.description}</p>
                    </div>
                    
                    <div className={cn("flex flex-wrap items-center gap-2", isRTL && "flex-row-reverse")}>
                      <Badge variant="secondary" className="text-xs">{quiz.language}</Badge>
                      <span className={cn("text-xs text-muted-foreground flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <Clock className="w-3 h-3" />
                        {quiz.questions.length} {t('quiz.questions')}
                      </span>
                    </div>

                    <Button 
                      onClick={() => handleStartQuiz(quiz)}
                      className={cn("w-full flex items-center justify-center gap-2", isRTL && "flex-row-reverse")}
                    >
                      <Play className="w-4 h-4" />
                      {t('quiz.start')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiz History */}
      <Card>
        <CardHeader className={cn("flex flex-row items-center gap-2 pb-4", isRTL && "flex-row-reverse")}>
          <Trophy className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{t('quiz.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {studentResults.length > 0 ? (
            <div className="space-y-3">
              {studentResults.map((result) => {
                const quiz = mockQuizzes.find(q => q.id === result.quizId);
                return (
                  <div
                    key={result.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-card gap-4",
                      isRTL && "sm:flex-row-reverse"
                    )}
                  >
                    <div className={cn("flex items-center gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        result.passed ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                      )}>
                        {result.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <h4 className="font-medium text-foreground text-sm sm:text-base">{quiz?.title || 'Quiz'}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(result.completedAt).toLocaleDateString(isRTL ? 'ar' : 'fr')}
                        </p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
                      <div className={cn("w-20 sm:w-24", isRTL && "text-right")}>
                        <div className="text-sm font-medium">{result.score}%</div>
                        <Progress value={result.score} className="h-2 mt-1" />
                      </div>
                      <Badge variant={result.passed ? "default" : "destructive"} className="shrink-0">
                        {result.passed ? t('quiz.passed') : t('quiz.failed')}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('quiz.noHistory')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz Modal */}
      {selectedQuiz && (
        <QuizModal
          quiz={selectedQuiz}
          isOpen={quizOpen}
          onClose={() => setQuizOpen(false)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

export default StudentQuiz;
