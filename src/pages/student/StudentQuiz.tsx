import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ClipboardList, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockQuizzes, mockQuizResults } from '@/data/quizzes';
import { cn } from '@/lib/utils';

const StudentQuiz = () => {
  const { t, isRTL } = useLanguage();

  // Filter quiz results for current student (using mock student id "1")
  const studentResults = mockQuizResults.filter(result => result.studentId === '1');

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('quiz.title')}</h1>
        <p className="text-muted-foreground">{t('quiz.subtitle')}</p>
      </div>

      {/* Available Quizzes */}
      <Card>
        <CardHeader className={cn("flex flex-row items-center gap-2", isRTL && "flex-row-reverse")}>
          <ClipboardList className="w-5 h-5 text-primary" />
          <CardTitle>{t('quiz.available')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockQuizzes.map((quiz) => (
              <Card key={quiz.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className={cn("flex items-start justify-between gap-4", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex-1", isRTL && "text-right")}>
                      <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                      <div className={cn("flex items-center gap-3 mt-3", isRTL && "flex-row-reverse")}>
                        <Badge variant="secondary">{quiz.language}</Badge>
                        <span className={cn("text-xs text-muted-foreground flex items-center gap-1", isRTL && "flex-row-reverse")}>
                          <Clock className="w-3 h-3" />
                          {quiz.questions.length} {t('quiz.questions')}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" className="shrink-0">
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
        <CardHeader className={cn("flex flex-row items-center gap-2", isRTL && "flex-row-reverse")}>
          <Trophy className="w-5 h-5 text-primary" />
          <CardTitle>{t('quiz.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {studentResults.length > 0 ? (
            <div className="space-y-4">
              {studentResults.map((result) => {
                const quiz = mockQuizzes.find(q => q.id === result.quizId);
                return (
                  <div
                    key={result.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border bg-card",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        result.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {result.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <h4 className="font-medium text-foreground">{quiz?.title || 'Quiz'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.completedAt).toLocaleDateString(isRTL ? 'ar' : 'fr')}
                        </p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                      <div className={cn("w-24", isRTL && "text-right")}>
                        <div className="text-sm font-medium">{result.score}%</div>
                        <Progress value={result.score} className="h-2 mt-1" />
                      </div>
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.passed ? t('quiz.passed') : t('quiz.failed')}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('quiz.noHistory')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentQuiz;
