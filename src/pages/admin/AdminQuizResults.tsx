import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileCheck, CheckCircle, XCircle, Search, Users, Trophy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockQuizzes, mockQuizResults } from '@/data/quizzes';
import { mockStudents } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const AdminQuizResults = () => {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = React.useState('');

  // Enrich quiz results with student and quiz data
  const enrichedResults = mockQuizResults.map(result => {
    const student = mockStudents.find(s => s.id === result.studentId);
    const quiz = mockQuizzes.find(q => q.id === result.quizId);
    return { ...result, student, quiz };
  });

  // Filter results based on search
  const filteredResults = enrichedResults.filter(result => 
    result.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.quiz?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalQuizzes = mockQuizResults.length;
  const passedQuizzes = mockQuizResults.filter(r => r.passed).length;
  const averageScore = Math.round(mockQuizResults.reduce((acc, r) => acc + r.score, 0) / totalQuizzes);

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('nav.quizResults')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t('quizResults.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-xl sm:text-2xl font-bold">{totalQuizzes}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('quizResults.totalQuizzes')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-xl sm:text-2xl font-bold">{passedQuizzes}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('quizResults.passedQuizzes')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-xl sm:text-2xl font-bold">{averageScore}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('quizResults.average')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
        <Input
          placeholder={t('quizResults.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn("w-full", isRTL ? "pr-10 text-right" : "pl-10")}
        />
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('quizResults.allResults')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <div
                  key={result.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-4",
                    isRTL && "sm:flex-row-reverse"
                  )}
                >
                  {/* Student Info */}
                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={result.student?.avatar} />
                      <AvatarFallback>{result.student?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={isRTL ? "text-right" : ""}>
                      <h4 className="font-medium text-foreground text-sm sm:text-base">{result.student?.name}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{result.quiz?.title}</p>
                    </div>
                  </div>

                  {/* Result Info */}
                  <div className={cn("flex flex-wrap items-center gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
                    <Badge variant="outline" className="text-xs">{result.quiz?.language}</Badge>
                    <div className={cn("w-20 sm:w-24", isRTL && "text-right")}>
                      <div className="text-xs sm:text-sm font-medium mb-1">{result.score}%</div>
                      <Progress value={result.score} className="h-1.5 sm:h-2" />
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                      {new Date(result.completedAt).toLocaleDateString(isRTL ? 'ar' : 'fr')}
                    </div>
                    <Badge variant={result.passed ? "default" : "destructive"} className="shrink-0">
                      <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        {result.passed ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">{t('quiz.passed')}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">{t('quiz.failed')}</span>
                          </>
                        )}
                      </span>
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noQuizResults')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuizResults;
