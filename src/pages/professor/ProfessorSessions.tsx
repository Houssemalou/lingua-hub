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
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { RoomService } from '@/services/RoomService';
import { RoomModel, CreateRoomDTO, StudentModel } from '@/models';
import { toast } from 'sonner';
import { StudentService } from '@/services/StudentService';
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

// same lists as admin so professor can pick
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];
const scienceSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
const allSubjects = [...languages, ...scienceSubjects];


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

  // creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomLanguage, setRoomLanguage] = useState('');
  const [roomLevel, setRoomLevel] = useState('A1');
  const [roomDuration, setRoomDuration] = useState<string>('30');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [maxStudents, setMaxStudents] = useState<number>(6);
  const [objective, setObjective] = useState('');
  const [creating, setCreating] = useState(false);
  const [students, setStudents] = useState<StudentModel[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

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

  // load students for inviting (professor can invite students when creating a session)
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const studentsResponse = await StudentService.getAll();
        if (studentsResponse && (studentsResponse as any).success !== undefined) {
          if ((studentsResponse as any).success) {
            setStudents((studentsResponse as any).data?.data || []);
          } else {
            console.error('Failed to load students', studentsResponse);
          }
        } else {
          setStudents((studentsResponse as any)?.data || []);
        }
      } catch (err) {
        console.error('Error loading students:', err);
      }
    };
    loadStudents();
  }, []);

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName || !roomLanguage || !roomLevel || !scheduledAt) {
      toast.error(isRTL ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const payload: CreateRoomDTO = {
        name: roomName,
        language: roomLanguage,
        level: roomLevel as any,
        objective,
        scheduledAt,
        duration: Number(roomDuration),
        maxStudents,
        animatorType: 'professor',
        professorId: professor?.id,
        invitedStudents: selectedStudents,
      };

      const res = await RoomService.create(payload);
      if ((res as any).success) {
        const rawData = (res as any).data;
        const created = (rawData?.data || rawData) as RoomModel;
        setSessions(prev => [created, ...prev]);
        toast.success(isRTL ? 'تم إنشاء الجلسة بنجاح!' : 'Session créée avec succès !');
        // Reset form
        setRoomName('');
        setRoomLanguage('');
        setRoomLevel('A1');
        setRoomDuration('30');
        setScheduledAt('');
        setMaxStudents(6);
        setObjective('');
        setSelectedStudents([]);
        setIsCreateDialogOpen(false);
      } else {
        toast.error((res as any).message || (res as any).error || (isRTL ? 'فشل في إنشاء الجلسة' : 'Failed to create session'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isRTL ? 'فشل في إنشاء الجلسة' : 'Failed to create session'));
      console.error('Create session error:', err);
    } finally {
      setCreating(false);
    }
  };

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
        <Button className={cn("gap-2", isRTL && "flex-row-reverse")} onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          {isRTL ? 'إنشاء جلسة' : 'Créer une session'}
        </Button>
      </motion.div>

      {/* Create Session Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إنشاء جلسة جديدة' : 'Créer une nouvelle session'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRoom} className="space-y-6 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{isRTL ? 'اسم الجلسة' : 'Nom de la session'}</Label>
                <Input id="name" placeholder={isRTL ? 'مثال: نادي المحادثة الإسبانية' : 'ex: Club de conversation espagnol'} required value={roomName} onChange={(e) => setRoomName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">{isRTL ? 'اللغة' : 'Langue'}</Label>
                <Select value={roomLanguage} onValueChange={setRoomLanguage} required>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر لغة' : 'Sélectionner une langue'} />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">{isRTL ? 'المستوى' : 'Niveau'}</Label>
                <Select value={roomLevel} onValueChange={setRoomLevel} required>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر مستوى' : 'Sélectionner un niveau'} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{isRTL ? 'المدة (دقائق)' : 'Durée (minutes)'}</Label>
                <Select value={roomDuration} onValueChange={setRoomDuration} required>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر المدة' : 'Sélectionner la durée'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 {isRTL ? 'دقيقة' : 'minutes'}</SelectItem>
                    <SelectItem value="45">45 {isRTL ? 'دقيقة' : 'minutes'}</SelectItem>
                    <SelectItem value="60">60 {isRTL ? 'دقيقة' : 'minutes'}</SelectItem>
                    <SelectItem value="90">90 {isRTL ? 'دقيقة' : 'minutes'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">{isRTL ? 'التاريخ والوقت' : 'Date & Heure'}</Label>
                <Input id="date" type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStudents">{isRTL ? 'الحد الأقصى للطلاب' : 'Max Étudiants'}</Label>
                <Input id="maxStudents" type="number" min="1" max="20" value={maxStudents} onChange={(e) => setMaxStudents(Number(e.target.value))} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">{isRTL ? 'هدف الجلسة' : 'Objectif de la session'}</Label>
              <Textarea
                id="objective"
                placeholder={isRTL ? 'صف ما سيتعلمه أو يمارسه الطلاب...' : 'Décrivez ce que les étudiants vont apprendre ou pratiquer...'}
                rows={3}
                required
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>{isRTL ? 'دعوة الطلاب' : 'Inviter des étudiants'}</Label>
              <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto p-1">
                {students.length > 0 ? (
                  students.map((student) => (
                    <label
                      key={student.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <img src={student.avatar} alt="" className="w-8 h-8 rounded-full" />
                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                        <p className="text-sm font-medium truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.level}</p>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{isRTL ? 'لا يوجد طلاب متاحين' : 'Aucun étudiant disponible'}</p>
                  </div>
                )}
              </div>
              {selectedStudents.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedStudents.length} {isRTL ? 'طالب(طلاب) محدد' : 'étudiant(s) sélectionné(s)'}
                </p>
              )}
            </div>
            <div className={cn("flex justify-end gap-3", isRTL && "flex-row-reverse")}>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {isRTL ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (isRTL ? 'جارٍ الإنشاء...' : 'Création...') : (isRTL ? 'إنشاء' : 'Créer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sessions Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-5 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-32 mt-2" />
                  <Skeleton className="h-10 w-full rounded" />
                </CardContent>
              </Card>
            ))}
          </>
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
