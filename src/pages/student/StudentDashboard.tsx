import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, BookOpen, Bell, ChevronRight, Loader2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { StatsService, StudentStats } from '@/services/StatsService';
import { useAuth } from '@/contexts/AuthContext';

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

  if (error || !statsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{error || 'No data available'}</p>
      </div>
    );
  }

  const studentName = user?.student?.name?.split(' ')[0] || 'Student';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Header */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl gradient-accent p-4 sm:p-6 lg:p-8">
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-sidebar-primary-foreground">
            Welcome back, {studentName}! 👋
          </h1>
          <p className="text-sidebar-primary-foreground/80 mt-2 max-w-xl text-sm sm:text-base">
            You're making great progress! Keep up the amazing work on your language learning journey.
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 sm:mt-6">
            <div>
              <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">Current Level</p>
              <Badge variant={statsData.level.toLowerCase() as any} className="mt-1 text-sm sm:text-base px-2 sm:px-3 py-1">
                {statsData.level}
              </Badge>
            </div>
            <div>
              <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">Hours Learned</p>
              <p className="text-xl sm:text-2xl font-bold text-sidebar-primary-foreground mt-1">{statsData.hoursLearned}h</p>
            </div>
            <div>
              <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">Sessions Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-sidebar-primary-foreground mt-1">{statsData.totalSessions}</p>
            </div>
          </div>
        </div>
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 opacity-20 hidden sm:block">
          <BookOpen className="w-32 sm:w-40 lg:w-48 h-32 sm:h-40 lg:h-48" />
        </div>
      </motion.div>

      {/* Live Session Alert */}
      {statsData.liveRooms.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse shrink-0">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Session in Progress!</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{statsData.liveRooms[0].name} is happening now</p>
                  </div>
                </div>
                <Button variant="live" size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/student/room/${statsData.liveRooms[0].id}`)}>
                  Join Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="stat" className="border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
                <p className="text-3xl font-bold mt-2">{statsData.upcomingSessions}</p>
              </div>
              <CalendarCheck className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className="border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-3xl font-bold mt-2">{Math.round(statsData.overallProgress)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className="border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">{statsData.completedSessions}</p>
              </div>
              <Clock className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className="border-l-warning">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Study Streak</p>
                <p className="text-3xl font-bold mt-2">7 days</p>
              </div>
              <span className="text-3xl">🔥</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Sessions */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-accent" />
                Upcoming Sessions
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/sessions')}>
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsData.upcomingSessionsList.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No upcoming sessions scheduled
                </p>
              ) : (
                statsData.upcomingSessionsList.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg bg-muted/50 border border-border space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{session.name}</h4>
                        <p className="text-sm text-muted-foreground">{session.language}</p>
                      </div>
                      <Badge variant={session.level.toLowerCase() as any}>{session.level}</Badge>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-1">{session.objective}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true })}
                      </span>
                      <span>{session.duration} min</span>
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
