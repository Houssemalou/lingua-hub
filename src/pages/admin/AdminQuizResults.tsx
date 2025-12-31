import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileCheck, CheckCircle, XCircle, Search } from 'lucide-react';
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
        <h1 className="text-2xl font-bold text-foreground">{t('nav.quizResults')}</h1>
        <p className="text-muted-foreground">{t('quizResults.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-2xl font-bold">{totalQuizzes}</p>
                <p className="text-sm text-muted-foreground">{t('quizResults.totalQuizzes')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-2xl font-bold">{passedQuizzes}</p>
                <p className="text-sm text-muted-foreground">{t('quizResults.passedQuizzes')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">{averageScore}%</span>
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-2xl font-bold">{t('quizResults.avgScore')}</p>
                <p className="text-sm text-muted-foreground">{t('quizResults.average')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
        <Input
          placeholder={t('quizResults.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(isRTL ? "pr-10 text-right" : "pl-10")}
        />
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quizResults.allResults')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <div
                  key={result.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                    <Avatar>
                      <AvatarImage src={result.student?.avatar} />
                      <AvatarFallback>{result.student?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={isRTL ? "text-right" : ""}>
                      <h4 className="font-medium text-foreground">{result.student?.name}</h4>
                      <p className="text-sm text-muted-foreground">{result.quiz?.title}</p>
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-6", isRTL && "flex-row-reverse")}>
                    <Badge variant="outline">{result.quiz?.language}</Badge>
                    <div className={cn("w-28", isRTL && "text-right")}>
                      <div className="text-sm font-medium mb-1">{result.score}%</div>
                      <Progress value={result.score} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground min-w-[100px]">
                      {new Date(result.completedAt).toLocaleDateString(isRTL ? 'ar' : 'fr')}
                    </div>
                    <Badge variant={result.passed ? "default" : "destructive"}>
                      {result.passed ? (
                        <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                          <CheckCircle className="w-3 h-3" />
                          {t('quiz.passed')}
                        </span>
                      ) : (
                        <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                          <XCircle className="w-3 h-3" />
                          {t('quiz.failed')}
                        </span>
                      )}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('dashboard.noQuizResults')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuizResults;
