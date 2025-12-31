import React from 'react';
import { motion } from 'framer-motion';
import { Users, DoorOpen, CalendarCheck, TrendingUp, Clock, Activity, FileCheck, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockStudents, mockRooms } from '@/data/mockData';
import { mockQuizResults } from '@/data/quizzes';
import { format, formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

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
  
  const totalStudents = mockStudents.length;
  const activeRooms = mockRooms.filter(r => r.status === 'live').length;
  const scheduledSessions = mockRooms.filter(r => r.status === 'scheduled').length;
  const completedSessions = mockRooms.filter(r => r.status === 'completed').length;

  const upcomingSessions = mockRooms
    .filter(r => r.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  const liveRooms = mockRooms.filter(r => r.status === 'live');

  const stats = [
    {
      title: t('dashboard.totalStudents'),
      value: totalStudents,
      icon: Users,
      color: 'border-l-primary',
      trend: t('dashboard.thisMonth'),
    },
    {
      title: t('dashboard.activeRooms'),
      value: activeRooms,
      icon: Activity,
      color: 'border-l-destructive',
      trend: t('dashboard.liveNow'),
      isLive: activeRooms > 0,
    },
    {
      title: t('dashboard.scheduledSessions'),
      value: scheduledSessions,
      icon: CalendarCheck,
      color: 'border-l-accent',
      trend: t('dashboard.thisWeek'),
    },
    {
      title: t('dashboard.completedSessions'),
      value: completedSessions,
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
        {stats.map((stat) => (
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
              {liveRooms.length === 0 ? (
                <p className={cn("text-muted-foreground text-center py-8", isRTL && "text-right")}>
                  {t('dashboard.noLiveRooms')}
                </p>
              ) : (
                liveRooms.map((room) => (
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
                        {room.joinedStudents.length}/{room.maxStudents}
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
              {upcomingSessions.map((session) => (
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
                      {session.invitedStudents.length}/{session.maxStudents}
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
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quiz Results Section */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2 text-base sm:text-lg", isRTL && "flex-row-reverse")}>
              <FileCheck className="w-5 h-5 text-accent" />
              {t('dashboard.quizResults')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockQuizResults.length === 0 ? (
              <p className={cn("text-muted-foreground text-center py-8", isRTL && "text-right")}>
                {t('dashboard.noQuizResults')}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn("border-b border-border", isRTL && "text-right")}>
                      <th className={cn("py-3 px-2 text-xs sm:text-sm font-medium text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                        {t('quiz.student')}
                      </th>
                      <th className={cn("py-3 px-2 text-xs sm:text-sm font-medium text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                        {t('quiz.session')}
                      </th>
                      <th className={cn("py-3 px-2 text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell", isRTL ? "text-right" : "text-left")}>
                        {t('rooms.language')}
                      </th>
                      <th className={cn("py-3 px-2 text-xs sm:text-sm font-medium text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                        {t('quiz.score')}
                      </th>
                      <th className={cn("py-3 px-2 text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell", isRTL ? "text-right" : "text-left")}>
                        {t('quiz.date')}
                      </th>
                      <th className={cn("py-3 px-2 text-xs sm:text-sm font-medium text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                        {t('quiz.results')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockQuizResults.map((result) => (
                      <tr key={result.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2">
                          <div className={cn("flex items-center gap-2 sm:gap-3", isRTL && "flex-row-reverse")}>
                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                              <AvatarImage src={result.studentAvatar} />
                              <AvatarFallback className="text-xs">{result.studentName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[80px] sm:max-w-[120px]">
                              {result.studentName}
                            </span>
                          </div>
                        </td>
                        <td className={cn("py-3 px-2 text-xs sm:text-sm text-muted-foreground truncate max-w-[100px] sm:max-w-[150px]", isRTL && "text-right")}>
                          {result.sessionName}
                        </td>
                        <td className={cn("py-3 px-2 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell", isRTL && "text-right")}>
                          {result.language}
                        </td>
                        <td className="py-3 px-2">
                          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <Progress value={result.score} className="h-2 w-12 sm:w-16" />
                            <span className="text-xs sm:text-sm font-medium text-foreground">{result.score}%</span>
                          </div>
                        </td>
                        <td className={cn("py-3 px-2 text-xs sm:text-sm text-muted-foreground hidden md:table-cell", isRTL && "text-right")}>
                          {format(new Date(result.completedAt), 'PP')}
                        </td>
                        <td className="py-3 px-2">
                          {result.passed ? (
                            <Badge variant="success" className={cn("flex items-center gap-1 w-fit text-xs", isRTL && "flex-row-reverse")}>
                              <CheckCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">{t('quiz.passed').split('!')[0]}</span>
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className={cn("flex items-center gap-1 w-fit text-xs", isRTL && "flex-row-reverse")}>
                              <XCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">{t('quiz.failed').split('.')[0]}</span>
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              {mockStudents.slice(0, 6).map((student) => (
                <div
                  key={student.id}
                  className={cn("flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors", isRTL && "flex-row-reverse")}
                >
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted shrink-0"
                  />
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