import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarCheck, 
  Clock, 
  Users, 
  Play,
  Eye,
  Search,
  Filter,
  Bot,
  UserCircle,
  DoorOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { RoomService } from '@/services/RoomService';
import { RoomModel } from '@/models';
import { toast } from 'sonner';
import { canStartRoom, canJoinRoom, formatTimeUntilJoinable } from '@/lib/roomUtils';

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

export default function ProfessorSessions() {
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const professor = user?.professor;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sessions, setSessions] = useState<RoomModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const dateLocale = language === 'ar' ? ar : fr;

  // Refresh every 30s so countdowns stay current
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

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
        toast.error(isRTL ? 'فشل في تحميل الجلسات' : 'Échec du chargement des sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [isRTL]);

  const filteredSessions = (Array.isArray(sessions) ? sessions : []).filter((session) => {
    const matchesSearch = (session.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.language || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const handleStartAndJoinRoom = async (session: RoomModel) => {
    const startCheck = canStartRoom(session);
    if (!startCheck.canStart) {
      toast.error(startCheck.reason);
      return;
    }

    try {
      // Start the room
      const response = await RoomService.startSession(session.id);
      if (response && response.success) {
        toast.success(isRTL ? 'تم بدء الجلسة بنجاح!' : 'Session started successfully!');
        // Navigate to room
        navigate(`/professor/room/${session.id}`);
      } else {
        toast.error(response.error || (isRTL ? 'فشل في بدء الجلسة' : 'Failed to start session'));
      }
    } catch (err) {
      console.error('Error starting room:', err);
      toast.error(isRTL ? 'فشل في بدء الجلسة' : 'Failed to start session');
    }
  };

  const handleJoinRoom = (session: RoomModel) => {
    const joinCheck = canJoinRoom(session);
    if (!joinCheck.canJoin) {
      toast.error(joinCheck.reason);
      return;
    }
    navigate(`/professor/room/${session.id}`);
  };

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
          {isRTL ? 'جلساتي' : 'Mes Sessions'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRTL ? 'عرض وإدارة جلسات التدريس الخاصة بك' : 'Voir et gérer vos sessions d\'enseignement'}
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className={cn("flex flex-col sm:flex-row gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className="relative flex-1">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={isRTL ? 'البحث عن الجلسات...' : 'Rechercher des sessions...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(isRTL ? "pr-10" : "pl-10")}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            <SelectValue placeholder={isRTL ? 'الحالة' : 'Statut'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? 'جميع الحالات' : 'Tous les statuts'}</SelectItem>
            <SelectItem value="scheduled">{isRTL ? 'مجدول' : 'Planifié'}</SelectItem>
            <SelectItem value="live">{isRTL ? 'مباشر' : 'En direct'}</SelectItem>
            <SelectItem value="completed">{isRTL ? 'مكتمل' : 'Terminé'}</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Sessions Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Chargement...'}</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const startCheck = canStartRoom(session);
            const joinCheck = canJoinRoom(session);
            const statusLower = session.status.toLowerCase();
            
            return (
              <Card
                key={session.id}
                variant="interactive"
                className={cn(statusLower === 'live' && 'border-destructive/50')}
              >
                <CardHeader className="pb-3">
                  <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        statusLower === 'live' ? 'bg-destructive/20' : 'bg-muted'
                      )}>
                        <UserCircle className={cn(
                          "w-5 h-5",
                          statusLower === 'live' ? 'text-destructive' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className={isRTL ? 'text-right' : ''}>
                        <CardTitle className="text-lg">{session.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{session.language}</p>
                      </div>
                    </div>
                    <Badge variant={statusLower as any} className="capitalize">
                      {getStatusIcon(statusLower)}
                      <span className={cn(isRTL ? "mr-1" : "ml-1")}>
                        {statusLower === 'live' 
                          ? (isRTL ? 'مباشر' : 'En direct')
                          : statusLower === 'scheduled'
                          ? (isRTL ? 'مجدول' : 'Planifié')
                          : (isRTL ? 'مكتمل' : 'Terminé')}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className={cn("text-sm text-muted-foreground line-clamp-2", isRTL && "text-right")}>
                    {session.objective}
                  </p>
                  <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center gap-4 text-muted-foreground", isRTL && "flex-row-reverse")}>
                      <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <Users className="w-4 h-4" />
                        {statusLower === 'live' 
                          ? (session.joinedStudents?.length || 0)
                          : (session.invitedStudents?.length || 0)}/{session.maxStudents}
                      </span>
                      <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <Clock className="w-4 h-4" />
                        {session.duration}m
                      </span>
                    </div>
                    <Badge variant={session.level.toLowerCase() as any}>{session.level}</Badge>
                  </div>
                  <div className={cn("pt-2 border-t border-border", isRTL && "text-right")}>
                    <p className="text-xs text-muted-foreground">
                      {statusLower === 'scheduled'
                        ? `${isRTL ? 'تبدأ' : 'Commence'} ${formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true, locale: dateLocale })}`
                        : format(new Date(session.scheduledAt), 'PPp', { locale: dateLocale })}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className={cn("flex gap-2 pt-2", isRTL && "flex-row-reverse")}>
                    {statusLower === 'scheduled' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartAndJoinRoom(session);
                        }}
                        disabled={!startCheck.canStart}
                        className={cn("flex-1", !startCheck.canStart && "gap-2")}
                        variant={startCheck.canStart ? "default" : "outline"}
                      >
                        {startCheck.canStart ? (
                          <>
                            <DoorOpen className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                            {isRTL ? 'بدء الجلسة' : 'Start Session'}
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            {isRTL
                              ? `متاح بعد ${startCheck.minutesLeft} د`
                              : formatTimeUntilJoinable(session)}
                          </>
                        )}
                      </Button>
                    )}
                    {statusLower === 'live' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinRoom(session);
                        }}
                        className="flex-1"
                        variant="live"
                      >
                        <Play className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                        {isRTL ? 'انضم الآن' : 'Join Now'}
                      </Button>
                    )}
                    {statusLower === 'completed' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/professor/summaries`);
                        }}
                        className="flex-1"
                        variant="secondary"
                      >
                        <Eye className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                        {isRTL ? 'عرض الملخص' : 'View Summary'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>

      {filteredSessions.length === 0 && (
        <motion.div variants={item} className="text-center py-12">
          <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            {isRTL ? 'لا توجد جلسات' : 'Aucune session'}
          </h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || statusFilter !== 'all'
              ? (isRTL ? 'حاول تعديل الفلاتر' : 'Essayez d\'ajuster vos filtres')
              : (isRTL ? 'لم يتم تخصيص أي جلسات لك بعد' : 'Aucune session ne vous a encore été assignée')}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
