import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, BookOpen, Bell, ChevronRight, Loader2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { fr, arSA } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { StatsService, StudentStats } from '@/services/StatsService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [statsData, setStatsData] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await StatsService.getStudentStats();
        setStatsData(data);
      } catch (err) {
        console.error('Failed to fetch student stats:', err);
        setError(isRTL ? 'فشل في تحميل إحصائيات لوحة التحكم' : 'Échec du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isRTL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{error || (isRTL ? 'لا توجد بيانات متاحة' : 'Aucune donnée disponible')}</p>
      </div>
    );
  }

  const studentName = user?.student?.name?.split(' ')[0] || (isRTL ? 'طالب' : 'Étudiant');

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Welcome Header */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl gradient-accent p-4 sm:p-6 lg:p-8">
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-sidebar-primary-foreground">
            {isRTL ? `مرحبًا بعودتك، ${studentName}! 👋` : `Bon retour, ${studentName} ! 👋`}
          </h1>
          <p className="text-sidebar-primary-foreground/80 mt-2 max-w-xl text-sm sm:text-base">
            {isRTL
              ? 'أنت تحرز تقدمًا رائعًا! واصل العمل المميز في رحلة تعلم اللغة.'
              : 'Vous progressez bien ! Continuez votre excellent travail dans votre parcours d\'apprentissage.'}
          </p>
          <div className={cn("flex flex-wrap items-center gap-4 sm:gap-6 mt-4 sm:mt-6", isRTL && "flex-row-reverse")}>
            <div>
              <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">
                {isRTL ? 'المستوى الحالي' : 'Niveau actuel'}
              </p>
              <Badge variant={statsData.level.toLowerCase() as any} className="mt-1 text-sm sm:text-base px-2 sm:px-3 py-1">
                {statsData.level}
              </Badge>
            </div>
            <div>
              <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">
                {isRTL ? 'ساعات التعلم' : 'Heures apprises'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-sidebar-primary-foreground mt-1">{statsData.hoursLearned}h</p>
            </div>
            <div>
              <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">
                {isRTL ? 'الجلسات المكتملة' : 'Sessions terminées'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-sidebar-primary-foreground mt-1">{statsData.totalSessions}</p>
            </div>
          </div>
        </div>
        <div className={cn("absolute top-1/2 -translate-y-1/2 opacity-20 hidden sm:block", isRTL ? "left-4 sm:left-8" : "right-4 sm:right-8")}>
          <BookOpen className="w-32 sm:w-40 lg:w-48 h-32 sm:h-40 lg:h-48" />
        </div>
      </motion.div>

      {/* Live Session Alert */}
      {statsData.liveRooms.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 sm:p-6">
              <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
                <div className={cn("flex items-center gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse shrink-0">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">
                      {isRTL ? 'جلسة قيد التقدم!' : 'Session en cours !'}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {isRTL
                        ? `${statsData.liveRooms[0].name} جارية الآن`
                        : `${statsData.liveRooms[0].name} est en cours`}
                    </p>
                  </div>
                </div>
                <Button variant="live" size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/student/room/${statsData.liveRooms[0].id}`)}>
                  {isRTL ? 'انضم الآن' : 'Rejoindre'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="stat" className={cn(isRTL ? "border-r-accent border-r-4" : "border-l-accent")}>
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'الجلسات القادمة' : 'Sessions à venir'}</p>
                <p className="text-3xl font-bold mt-2">{statsData.upcomingSessions}</p>
              </div>
              <CalendarCheck className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className={cn(isRTL ? "border-r-primary border-r-4" : "border-l-primary")}>
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'التقدم العام' : 'Progression globale'}</p>
                <p className="text-3xl font-bold mt-2">{Math.round(statsData.overallProgress)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className={cn(isRTL ? "border-r-success border-r-4" : "border-l-success")}>
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'مكتملة' : 'Terminées'}</p>
                <p className="text-3xl font-bold mt-2">{statsData.completedSessions}</p>
              </div>
              <Clock className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className={cn(isRTL ? "border-r-warning border-r-4" : "border-l-warning")}>
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'إجمالي الجلسات' : 'Total des sessions'}</p>
                <p className="text-3xl font-bold mt-2">{statsData.totalSessions}</p>
              </div>
              <span className="text-3xl">🎯</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Sessions */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
              <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <CalendarCheck className="w-5 h-5 text-accent" />
                {isRTL ? 'الجلسات القادمة' : 'Sessions à venir'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/sessions')}>
                {isRTL ? 'عرض الكل' : 'Voir tout'}
                <ChevronRight className={cn("w-4 h-4", isRTL ? "mr-1 rotate-180" : "ml-1")} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsData.upcomingSessionsList.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {isRTL ? 'لا توجد جلسات قادمة مجدولة' : 'Aucune session à venir programmée'}
                </p>
              ) : (
                statsData.upcomingSessionsList.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg bg-muted/50 border border-border space-y-2"
                  >
                    <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                      <div>
                        <h4 className="font-semibold text-foreground">{session.name}</h4>
                        <p className="text-sm text-muted-foreground">{session.language}</p>
                      </div>
                      <Badge variant={session.level.toLowerCase() as any}>{session.level}</Badge>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-1">{session.objective}</p>
                    <div className={cn("flex items-center gap-4 text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                      <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true, locale: isRTL ? arSA : fr })}
                      </span>
                      <span>{session.duration} {isRTL ? 'دقيقة' : 'min'}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
