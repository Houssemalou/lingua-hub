import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, Filter, Play, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function StudentSessions() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const sessions = getStudentSessions(currentStudent.id);
  
  const filteredSessions = sessions.filter((session) => {
    if (statusFilter === 'all') return true;
    return session.status === statusFilter;
  }).sort((a, b) => {
    // Live first, then scheduled (by date), then completed
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    if (a.status === 'scheduled' && b.status === 'completed') return -1;
    if (b.status === 'scheduled' && a.status === 'completed') return 1;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Sessions</h1>
          <p className="text-muted-foreground mt-1">View and join your assigned learning sessions</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Sessions List */}
      <motion.div variants={item} className="space-y-4">
        {filteredSessions.map((session) => (
          <Card
            key={session.id}
            variant="interactive"
            className={session.status === 'live' ? 'border-destructive/50' : ''}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    session.status === 'live' 
                      ? 'bg-destructive/20' 
                      : session.status === 'scheduled' 
                        ? 'bg-accent/20' 
                        : 'bg-muted'
                  }`}>
                    <CalendarCheck className={`w-6 h-6 ${
                      session.status === 'live' 
                        ? 'text-destructive' 
                        : session.status === 'scheduled' 
                          ? 'text-accent' 
                          : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg text-foreground">{session.roomName}</h3>
                      <Badge variant={session.status as any} className="capitalize">
                        {getStatusIcon(session.status)}
                        <span className="ml-1">{session.status}</span>
                      </Badge>
                      <Badge variant={session.level.toLowerCase() as any}>{session.level}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{session.language}</p>
                    <p className="text-sm text-foreground/80">{session.objective}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.status === 'scheduled' 
                          ? formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true })
                          : format(new Date(session.scheduledAt), 'PPp')}
                      </span>
                      <span>{session.duration} minutes</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 lg:shrink-0">
                  {session.status === 'live' && (
                    <Button 
                      variant="live"
                      onClick={() => navigate(`/student/room/${session.roomId}`)}
                    >
                      Join Now
                    </Button>
                  )}
                  {session.status === 'scheduled' && (
                    <Button 
                      variant="outline"
                      disabled={!isAfter(new Date(session.scheduledAt), new Date())}
                      onClick={() => navigate(`/student/room/${session.roomId}`)}
                    >
                      {isAfter(new Date(session.scheduledAt), new Date()) ? 'View Details' : 'Join Room'}
                    </Button>
                  )}
                  {session.status === 'completed' && (
                    <Button variant="secondary">
                      View Summary
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {filteredSessions.length === 0 && (
        <motion.div variants={item} className="text-center py-12">
          <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No sessions found</h3>
          <p className="text-muted-foreground mt-1">
            {statusFilter !== 'all' ? 'Try changing the filter' : 'You have no assigned sessions yet'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
