import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CalendarCheck,
  Clock,
  TrendingUp,
  Play,
  Star,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { StatsService, ProfessorStats } from '@/services/StatsService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const professor = user?.professor;
  const [statsData, setStatsData] = useState<ProfessorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateLocale = language === 'ar' ? ar : fr;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await StatsService.getProfessorStats();
        setStatsData(data);
      } catch (err) {
        console.error('Failed to fetch professor stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Two column grid skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{error || 'No data available'}</p>
      </div>
    );
  }

  const stats = [
    {
      title: isRTL ? 'إجمالي الطلاب' : 'Total Étudiants',
      value: statsData.totalStudents,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: isRTL ? 'الجلسات القادمة' : 'Sessions à venir',
      value: statsData.upcomingSessions,
      icon: CalendarCheck,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: isRTL ? 'الجلسات المكتملة' : 'Sessions terminées',
      value: statsData.completedSessions,
      icon: Clock,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: isRTL ? 'التقييم' : 'Note',
      value: statsData.rating || 0,
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      suffix: '/5',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {isRTL ? 'مرحباً' : 'Bienvenue'}, {professor?.name || 'Professeur'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRTL ? 'إليك ملخص نشاطك التعليمي' : 'Voici un résumé de votre activité pédagogique'}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {stat.value}{stat.suffix || ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Live Sessions Alert */}
      {statsData.liveRooms.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 sm:p-6">
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                    <Play className="w-6 h-6 text-destructive" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <h3 className="font-semibold text-foreground">
                      {isRTL ? 'جلسة جارية!' : 'Session en cours !'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {statsData.liveRooms[0].name} - {statsData.liveRooms[0].language}
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full sm:w-auto"
                  onClick={() => navigate(`/professor/room/${statsData.liveRooms[0].id}`)}
                >
                  {isRTL ? 'انضم الآن' : 'Rejoindre'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Sessions */}
        <motion.div variants={item}>
          <Card className="glass-card h-full">
            <CardHeader className={`flex flex-row items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-lg">
                {isRTL ? 'الجلسات القادمة' : 'Sessions à venir'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/professor/sessions')}>
                {isRTL ? 'عرض الكل' : 'Voir tout'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {statsData.upcomingSessionsList.length > 0 ? (
                statsData.upcomingSessionsList.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer ${isRTL ? 'text-right' : ''}`}
                    onClick={() => navigate(`/professor/room/${session.id}`)}
                  >
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <h4 className="font-medium text-foreground">{session.name}</h4>
                      <Badge variant="outline">{session.level}</Badge>
                    </div>
                    <div className={`flex items-center gap-4 mt-2 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true, locale: dateLocale })}
                      </span>
                      <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Users className="w-3 h-3" />
                        {session.participantCount} {isRTL ? 'طلاب' : 'étudiants'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {isRTL ? 'لا توجد جلسات قادمة' : 'Aucune session à venir'}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* My Students */}
        <motion.div variants={item}>
          <Card className="glass-card h-full">
            <CardHeader className={`flex flex-row items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-lg">
                {isRTL ? 'طلابي' : 'Mes Étudiants'}
              </CardTitle>
              <Badge variant="secondary">{statsData.totalStudents}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {statsData.myStudents.length > 0 ? (
                statsData.myStudents.slice(0, 5).map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={student.avatar || undefined} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'المستوى' : 'Niveau'} {student.level}
                        </p>
                      </div>
                      <Badge variant={student.level.toLowerCase() as any}>{student.level}</Badge>
                    </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {isRTL ? 'لا يوجد طلاب بعد' : 'Aucun étudiant pour le moment'}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
