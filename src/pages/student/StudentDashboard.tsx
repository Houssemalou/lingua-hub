import React from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, TrendingUp, BookOpen, Bell, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { currentStudent, getStudentSessions } from '@/data/mockData';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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
  const sessions = getStudentSessions(currentStudent.id);
  const upcomingSessions = sessions
    .filter(s => s.status === 'scheduled' && isAfter(new Date(s.scheduledAt), new Date()))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const liveSessions = sessions.filter(s => s.status === 'live');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const averageProgress = Math.round(
    (currentStudent.skills.pronunciation + 
     currentStudent.skills.grammar + 
     currentStudent.skills.vocabulary + 
     currentStudent.skills.fluency) / 4
  );

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
            Welcome back, {currentStudent.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-sidebar-primary-foreground/80 mt-2 max-w-xl text-sm sm:text-base">
            You're making great progress! Keep up the amazing work on your language learning journey.
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 sm:mt-6">
            <div>
              <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">Current Level</p>
              <Badge variant={currentStudent.level.toLowerCase() as any} className="mt-1 text-sm sm:text-base px-2 sm:px-3 py-1">
                {currentStudent.level}
              </Badge>
            </div>
            <div>
              <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">Hours Learned</p>
              <p className="text-xl sm:text-2xl font-bold text-sidebar-primary-foreground mt-1">{currentStudent.hoursLearned}h</p>
            </div>
            <div>
              <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">Sessions Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-sidebar-primary-foreground mt-1">{currentStudent.totalSessions}</p>
            </div>
          </div>
        </div>
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 opacity-20 hidden sm:block">
          <BookOpen className="w-32 sm:w-40 lg:w-48 h-32 sm:h-40 lg:h-48" />
        </div>
      </motion.div>

      {/* Live Session Alert */}
      {liveSessions.length > 0 && (
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
                    <p className="text-muted-foreground text-xs sm:text-sm">{liveSessions[0].roomName} is happening now</p>
                  </div>
                </div>
                <Button variant="live" size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/student/room/${liveSessions[0].roomId}`)}>
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
                <p className="text-3xl font-bold mt-2">{upcomingSessions.length}</p>
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
                <p className="text-3xl font-bold mt-2">{averageProgress}%</p>
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
                <p className="text-3xl font-bold mt-2">{completedSessions.length}</p>
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
              {upcomingSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No upcoming sessions scheduled
                </p>
              ) : (
                upcomingSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg bg-muted/50 border border-border space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{session.roomName}</h4>
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

        {/* Progress Overview */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Skill Progress
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/progress')}>
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(currentStudent.skills).map(([skill, value]) => (
                <div key={skill} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{skill}</span>
                    <span className="text-sm text-muted-foreground">{value}%</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
