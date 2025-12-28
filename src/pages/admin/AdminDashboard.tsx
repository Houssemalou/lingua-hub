import React from 'react';
import { motion } from 'framer-motion';
import { Users, DoorOpen, CalendarCheck, TrendingUp, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockStudents, mockRooms } from '@/data/mockData';
import { format, formatDistanceToNow } from 'date-fns';

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
      title: 'Total Students',
      value: totalStudents,
      icon: Users,
      color: 'border-l-primary',
      trend: '+12% this month',
    },
    {
      title: 'Active Rooms',
      value: activeRooms,
      icon: Activity,
      color: 'border-l-destructive',
      trend: 'Live now',
      isLive: activeRooms > 0,
    },
    {
      title: 'Scheduled Sessions',
      value: scheduledSessions,
      icon: CalendarCheck,
      color: 'border-l-accent',
      trend: 'This week',
    },
    {
      title: 'Completed Sessions',
      value: completedSessions,
      icon: TrendingUp,
      color: 'border-l-success',
      trend: 'All time',
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
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with your language school.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} variant="stat" className={stat.color}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                    {stat.isLive && (
                      <Badge variant="live">LIVE</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-muted-foreground" />
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
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-destructive" />
                Live Rooms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {liveRooms.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No active rooms at the moment
                </p>
              ) : (
                liveRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{room.name}</h4>
                        <p className="text-sm text-muted-foreground">{room.language}</p>
                      </div>
                      <Badge variant="live">LIVE</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {room.joinedStudents.length}/{room.maxStudents}
                      </span>
                      <span className="flex items-center gap-1">
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
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-accent" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-lg bg-muted/50 border border-border space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{session.name}</h4>
                      <p className="text-sm text-muted-foreground">{session.language}</p>
                    </div>
                    <Badge variant="scheduled">Scheduled</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {session.invitedStudents.length}/{session.maxStudents}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true })}
                    </span>
                    <Badge variant={session.level.toLowerCase() as any}>{session.level}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(session.scheduledAt), 'PPp')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Students */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockStudents.slice(0, 6).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                >
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-12 h-12 rounded-full bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{student.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                  </div>
                  <Badge variant={student.level.toLowerCase() as any}>{student.level}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
