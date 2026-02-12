import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileCheck, CheckCircle, Search, Users, Trophy, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { StatsService, AdminStats } from '@/services/StatsService';

const AdminQuizResults = () => {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const adminStats = await StatsService.getAdminStats();
        setStats(adminStats);
        
        // Try to fetch evaluations list - this may not be available for admin
        // We'll use the stats data primarily
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Filter recent students based on search
  const filteredStudents = stats.recentStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('nav.quizResults') || 'Evaluations & Results'}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t('quizResults.subtitle') || 'Overview of evaluations and student performance'}</p>
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
                <p className="text-xl sm:text-2xl font-bold">{stats.totalEvaluations}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('quizResults.totalQuizzes') || 'Total Evaluations'}</p>
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
                <p className="text-xl sm:text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.totalStudents') || 'Students Evaluated'}</p>
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
                <p className="text-xl sm:text-2xl font-bold">{Math.round(stats.averageEvaluationScore)}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('quizResults.average') || 'Average Score'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Distribution */}
      {stats.levelDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t('dashboard.levelDistribution') || 'Level Distribution'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.levelDistribution.map((ld) => (
                <div key={ld.level} className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <Badge variant={ld.level.toLowerCase() as any} className="w-12 justify-center">{ld.level}</Badge>
                  <Progress value={stats.totalStudents > 0 ? (ld.count / stats.totalStudents) * 100 : 0} className="h-3 flex-1" />
                  <span className="text-sm font-medium text-foreground w-12 text-right">{ld.count} {t('students.students') || 'students'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
        <Input
          placeholder={t('quizResults.search') || 'Search students...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn("w-full", isRTL ? "pr-10 text-right" : "pl-10")}
        />
      </div>

      {/* Students Performance */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('dashboard.recentStudents') || 'Student Performance'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-4",
                    isRTL && "sm:flex-row-reverse"
                  )}
                >
                  {/* Student Info */}
                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={student.avatar || undefined} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={isRTL ? "text-right" : ""}>
                      <h4 className="font-medium text-foreground text-sm sm:text-base">{student.name}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>

                  {/* Result Info */}
                  <div className={cn("flex flex-wrap items-center gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
                    <Badge variant={student.level.toLowerCase() as any}>{student.level}</Badge>
                    <div className={cn("w-20 sm:w-24", isRTL && "text-right")}>
                      <div className="text-xs sm:text-sm font-medium mb-1">{Math.round(student.averageSkill)}%</div>
                      <Progress value={student.averageSkill} className="h-1.5 sm:h-2" />
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {student.totalSessions} sessions
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noQuizResults') || 'No results found'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuizResults;
