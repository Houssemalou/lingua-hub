import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, Filter, Play, CheckCircle, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { RoomService } from '@/services/RoomService';
import { RoomModel } from '@/models';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { fr, ar } from 'date-fns/locale';
import { canJoinRoom } from '@/lib/roomUtils';

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
  const { isRTL, language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sessions, setSessions] = useState<RoomModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const dateLocale = language === 'ar' ? ar : fr;

  // Load sessions from backend
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const response = await RoomService.getMySessions();
        if (response && (response as any).success !== undefined) {
          if ((response as any).success) {
            setSessions((response as any).data?.data || []);
          } else {
            toast.error((response as any).message || 'Failed to load sessions');
          }
        } else {
          setSessions((response as any)?.data || []);
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
        toast.error(isRTL ? 'فشل في تحميل الجلسات' : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [isRTL]);
  
  const filteredSessions = (Array.isArray(sessions) ? sessions : []).filter((session) => {
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
      <motion.div variants={item} className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? 'جلساتي' : 'My Sessions'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'عرض والانضمام إلى جلسات التعلم المخصصة لك' : 'View and join your assigned learning sessions'}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            <SelectValue placeholder={isRTL ? 'الحالة' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? 'جميع الجلسات' : 'All Sessions'}</SelectItem>
            <SelectItem value="live">{isRTL ? 'مباشر' : 'Live'}</SelectItem>
            <SelectItem value="scheduled">{isRTL ? 'مجدول' : 'Scheduled'}</SelectItem>
            <SelectItem value="completed">{isRTL ? 'مكتمل' : 'Completed'}</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Sessions List */}
      <motion.div variants={item} className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const statusLower = session.status.toLowerCase();
            
            return (
              <Card
                key={session.id}
                variant="interactive"
                className={statusLower === 'live' ? 'border-destructive/50' : ''}
              >
                <CardContent className="p-6">
                  <div className={cn("flex flex-col lg:flex-row lg:items-center justify-between gap-4", isRTL && "lg:flex-row-reverse")}>
                    <div className={cn("flex items-start gap-4", isRTL && "flex-row-reverse")}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        statusLower === 'live' 
                          ? 'bg-destructive/20' 
                          : statusLower === 'scheduled' 
                            ? 'bg-accent/20' 
                            : 'bg-muted'
                      }`}>
                        <CalendarCheck className={`w-6 h-6 ${
                          statusLower === 'live' 
                            ? 'text-destructive' 
                            : statusLower === 'scheduled' 
                              ? 'text-accent' 
                              : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className={cn("space-y-1", isRTL && "text-right")}>
                        <div className={cn("flex items-center gap-3 flex-wrap", isRTL && "flex-row-reverse")}>
                          <h3 className="font-semibold text-lg text-foreground">{session.name}</h3>
                          <Badge variant={statusLower as any} className="capitalize">
                            {getStatusIcon(statusLower)}
                            <span className={cn(isRTL ? "mr-1" : "ml-1")}>
                              {statusLower === 'live' 
                                ? (isRTL ? 'مباشر' : 'Live')
                                : statusLower === 'scheduled'
                                ? (isRTL ? 'مجدول' : 'Scheduled')
                                : (isRTL ? 'مكتمل' : 'Completed')}
                            </span>
                          </Badge>
                          <Badge variant={session.level.toLowerCase() as any}>{session.level}</Badge>
                        </div>
                      <p className="text-sm text-muted-foreground">{session.language}</p>
                      <p className="text-sm text-foreground/80">{session.objective}</p>
                      <div className={cn("flex items-center gap-4 text-sm text-muted-foreground mt-2", isRTL && "flex-row-reverse")}>
                        <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                          <Clock className="w-4 h-4" />
                          {statusLower === 'scheduled' 
                            ? formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true, locale: dateLocale })
                            : format(new Date(session.scheduledAt), 'PPp', { locale: dateLocale })}
                        </span>
                        <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                          <Users className="w-4 h-4" />
                          {statusLower === 'live' 
                            ? (session.joinedStudents?.length || 0)
                            : (session.invitedStudents?.length || 0)}/{session.maxStudents}
                        </span>
                        <span>{session.duration} {isRTL ? 'دقيقة' : 'minutes'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn("flex gap-2 lg:shrink-0", isRTL && "flex-row-reverse")}>
                    {statusLower === 'live' && (
                      <Button 
                        variant="live"
                        onClick={() => {
                          const joinCheck = canJoinRoom(session);
                          if (!joinCheck.canJoin) {
                            toast.error(joinCheck.reason);
                            return;
                          }
                          navigate(`/student/room/${session.id}`);
                        }}
                      >
                        {isRTL ? 'انضم الآن' : 'Join Now'}
                      </Button>
                    )}
                    {statusLower === 'scheduled' && (() => {
                      const joinCheck = canJoinRoom(session);
                      return (
                        <Button 
                          variant="outline"
                          disabled={!joinCheck.canJoin}
                          onClick={() => {
                            if (!joinCheck.canJoin) {
                              toast.error(joinCheck.reason);
                              return;
                            }
                            navigate(`/student/room/${session.id}`);
                          }}
                        >
                          {joinCheck.canJoin
                            ? (isRTL ? 'انضم للغرفة' : 'Join Room')
                            : (isRTL ? 'لم يحن الوقت بعد' : 'Not yet time')}
                        </Button>
                      );
                    })()}
                    {statusLower === 'completed' && (
                        <Button variant="secondary">
                          {isRTL ? 'عرض الملخص' : 'View Summary'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>

      {filteredSessions.length === 0 && !loading && (
        <motion.div variants={item} className={cn("text-center py-12", isRTL && "text-right")}>
          <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            {isRTL ? 'لم يتم العثور على جلسات' : 'No sessions found'}
          </h3>
          <p className="text-muted-foreground mt-1">
            {statusFilter !== 'all' 
              ? (isRTL ? 'حاول تغيير الفلتر' : 'Try changing the filter')
              : (isRTL ? 'لم يتم تخصيص أي جلسات لك بعد' : 'You have no assigned sessions yet')}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
