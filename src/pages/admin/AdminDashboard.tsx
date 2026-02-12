import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, DoorOpen, CalendarCheck, TrendingUp, Clock, Activity, FileCheck, CheckCircle, XCircle, Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { StatsService, AdminStats } from '@/services/StatsService';

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

export default function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await StatsService.getAdminStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{error || 'No data available'}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: t('dashboard.totalStudents'),
      value: stats.totalStudents,
      icon: Users,
      color: 'border-l-primary',
      trend: t('dashboard.thisMonth'),
    },
    {
      title: t('dashboard.activeRooms'),
      value: stats.activeRooms,
      icon: Activity,
      color: 'border-l-destructive',
      trend: t('dashboard.liveNow'),
      isLive: stats.activeRooms > 0,
    },
    {
      title: t('dashboard.scheduledSessions'),
      value: stats.scheduledSessions,
      icon: CalendarCheck,
      color: 'border-l-accent',
      trend: t('dashboard.thisWeek'),
    },
    {
      title: t('dashboard.completedSessions'),
      value: stats.completedSessions,
      icon: TrendingUp,
      color: 'border-l-success',
      trend: t('dashboard.allTime'),
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={item} className={cn(isRTL && "text-right")}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t('dashboard.welcomeDesc')}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} variant="stat" className={stat.color}>
            <CardContent className="p-4 sm:p-6">
              <div className={cn("flex items-start sm:items-center justify-between gap-2", isRTL && "flex-row-reverse")}>
                <div className={cn("min-w-0 flex-1", isRTL && "text-right")}>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
                  <div className={cn("flex items-baseline gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap", isRTL && "flex-row-reverse")}>
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</span>
                    {stat.isLive && (
                      <Badge variant="live" className="text-xs">LIVE</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{stat.trend}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live Rooms */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Activity className="w-5 h-5 text-destructive" />
                {t('dashboard.liveRooms')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.liveRooms.length === 0 ? (
                <p className={cn("text-muted-foreground text-center py-8", isRTL && "text-right")}>
                  {t('dashboard.noLiveRooms')}
                </p>
              ) : (
                stats.liveRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3"
                  >
                    <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                      <div className={cn(isRTL && "text-right")}>
                        <h4 className="font-semibold text-foreground">{room.name}</h4>
                        <p className="text-sm text-muted-foreground">{room.language}</p>
                      </div>
                      <Badge variant="live">LIVE</Badge>
                    </div>
                    <div className={cn("flex items-center gap-4 text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                      <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <Users className="w-4 h-4" />
                        {room.participantCount}/{room.maxStudents}
                      </span>
                      <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <Clock className="w-4 h-4" />
                        {room.duration} min
                      </span>
                      <Badge variant={room.level.toLowerCase() as any}>{room.level}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <CalendarCheck className="w-5 h-5 text-accent" />
                {t('dashboard.upcomingSessions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.upcomingSessions.length === 0 ? (
                <p className={cn("text-muted-foreground text-center py-8", isRTL && "text-right")}>
                  {t('dashboard.noUpcomingSessions') || 'No upcoming sessions'}
                </p>
              ) : (
              stats.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-lg bg-muted/50 border border-border space-y-3"
                >
                  <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                    <div className={cn(isRTL && "text-right")}>
                      <h4 className="font-semibold text-foreground">{session.name}</h4>
                      <p className="text-sm text-muted-foreground">{session.language}</p>
                    </div>
                    <Badge variant="scheduled">{t('common.scheduled')}</Badge>
                  </div>
                  <div className={cn("flex items-center gap-4 text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                    <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                      <Users className="w-4 h-4" />
                      {session.participantCount}/{session.maxStudents}
                    </span>
                    <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true })}
                    </span>
                    <Badge variant={session.level.toLowerCase() as any}>{session.level}</Badge>
                  </div>
                  <p className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
                    {format(new Date(session.scheduledAt), 'PPp')}
                  </p>
                </div>
              ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Evaluation Stats Section */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2 text-base sm:text-lg", isRTL && "flex-row-reverse")}>
              <BarChart3 className="w-5 h-5 text-accent" />
              {t('dashboard.evaluationOverview') || 'Evaluation Overview'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-sm text-muted-foreground">{t('dashboard.totalEvaluations') || 'Total Evaluations'}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.totalEvaluations}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-sm text-muted-foreground">{t('dashboard.averageScore') || 'Average Score'}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{Math.round(stats.averageEvaluationScore)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-sm text-muted-foreground">{t('dashboard.totalProfessors') || 'Total Professors'}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.totalProfessors}</p>
              </div>
            </div>
            {stats.levelDistribution.length > 0 && (
              <div className="mt-6">
                <h4 className={cn("text-sm font-medium text-muted-foreground mb-3", isRTL && "text-right")}>
                  {t('dashboard.levelDistribution') || 'Student Level Distribution'}
                </h4>
                <div className="space-y-2">
                  {stats.levelDistribution.map((ld) => (
                    <div key={ld.level} className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                      <Badge variant={ld.level.toLowerCase() as any} className="w-10 justify-center text-xs">{ld.level}</Badge>
                      <Progress value={(ld.count / stats.totalStudents) * 100} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">{ld.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Students */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2 text-base sm:text-lg", isRTL && "flex-row-reverse")}>
              <Users className="w-5 h-5 text-primary" />
              {t('dashboard.recentStudents')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.recentStudents.map((student) => (
                <div
                  key={student.id}
                  className={cn("flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors", isRTL && "flex-row-reverse")}
                >
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                    <AvatarImage src={student.avatar || undefined} />
                    <AvatarFallback className="text-xs">{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                    <h4 className="font-medium text-foreground truncate text-sm sm:text-base">{student.name}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.email}</p>
                  </div>
                  <Badge variant={student.level.toLowerCase() as any} className="text-xs shrink-0">{student.level}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}