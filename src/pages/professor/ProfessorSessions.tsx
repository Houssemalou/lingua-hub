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
  Video,
  Download,
  AlertTriangle,
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
import { getLevelLabel, normalizeLevelToYear } from '@/lib/levelLabels';
import { createRoomSchema } from '@/lib/validation';
import { FieldError } from '@/components/ui/field-error';
import { RoomService } from '@/services/RoomService';
import { RecordingService, SessionRecording } from '@/services/RecordingService';
import { RoomModel, CreateRoomDTO, StudentModel } from '@/models';
import { toast } from 'sonner';
import { StudentService } from '@/services/StudentService';
import { canStartRoom, canJoinRoom, formatTimeUntilJoinable } from '@/lib/roomUtils';
import { getFriendlyErrorMessage } from '@/lib/errorMessages';

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

// same lists as admin so professor can pick (school years)
const levels = ['YEAR1','YEAR2','YEAR3','YEAR4','YEAR5','YEAR6','YEAR7','YEAR8','YEAR9','YEAR10','YEAR11','YEAR12','YEAR13','PREPA1','PREPA2'];
// languages/subjects kept per requirements
const languages = ['Français', 'Anglais', 'Arabe', 'Allemand', 'Espagnol', 'Mathématiques', 'Physique', 'Science', 'Informatique', 'Mécanique', 'Électrique'];


export default function ProfessorSessions() {
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const professor = user?.professor;

  const getLanguageDisplay = (lang: string) => {
    if (!isRTL) return lang;
    const map: Record<string, string> = {
      'Français': 'الفرنسية',
      'Anglais': 'الإنجليزية',
      'Arabe': 'العربية',
      'Allemand': 'الألمانية',
      'Mathématiques': 'الرياضيات',
      'Science': 'العلوم',
      'Informatique': 'المعلوميات',
      'Physique': 'الفيزياء',
      'Mécanique': 'الميكانيك',
      'Électrique': 'الكهرباء',
      'Espagnol': 'الإسبانية',
    };
    return map[lang] || lang;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sessions, setSessions] = useState<RoomModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomLanguage, setRoomLanguage] = useState('');
  const [roomLevel, setRoomLevel] = useState('');
  const [roomDuration, setRoomDuration] = useState<string>('30');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [maxStudents, setMaxStudents] = useState<number>(6);
  const [objective, setObjective] = useState('');
  const [creating, setCreating] = useState(false);
  const [students, setStudents] = useState<StudentModel[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [inviteFilterLevel, setInviteFilterLevel] = useState<string>('');
  const [roomFieldErrors, setRoomFieldErrors] = useState<Record<string, string>>({});
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [selectedSessionName, setSelectedSessionName] = useState('');
  const [selectedRoomName, setSelectedRoomName] = useState('');

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
            toast.error(getFriendlyErrorMessage((response as any).message, isRTL));
          }
        } else {
          setSessions((response as any)?.data || []);
        }
      } catch {
        // handle sessions load error
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
        // Load only students created by the same admin who created this professor.
        const studentsResponse = await StudentService.getAll({ createdBy: professor!.createdBy } as any);
        if (studentsResponse && (studentsResponse as any).success !== undefined) {
          if ((studentsResponse as any).success) {
            setStudents((studentsResponse as any).data?.data || []);
          } else {
            // handle failed student load response
          }
        } else {
          setStudents((studentsResponse as any)?.data || []);
        }
      } catch {
        // handle students load error
      }
    };

    // Only attempt to load when we know the professor's creator (admin) id.
    if (professor && professor.createdBy) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [professor?.createdBy]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Set default level when language changes if none selected
  useEffect(() => {
    if (!roomLevel) {
      setRoomLevel('YEAR1');
    }
  }, [roomLanguage]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoomFieldErrors({});

    if (scheduledAt && new Date(scheduledAt) <= new Date()) {
      setRoomFieldErrors({ scheduledAt: isRTL ? 'يجب أن يكون تاريخ الجلسة في المستقبل' : 'La date de la session doit être dans le futur' });
      return;
    }

    const parsed = createRoomSchema.safeParse({ roomName, roomLanguage, roomLevel, scheduledAt });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach(err => {
        const field = err.path[0] as string;
        if (!errs[field]) errs[field] = err.message;
      });
      setRoomFieldErrors(errs);
      return;
    }

    setCreating(true);
    try {
      // make sure we send the actual professor primary key.  auth context
      // initially stores the user id when logging in, so we refreshed the
      // profile during login (see AuthContext) to grab the real professor.id.
      // If the backend still treats this value as a user foreign key, the bug
      // needs to be addressed server-side (EasyLearn).  For now we just
      // forward whatever is available here.
      const payload: CreateRoomDTO = {
        name: roomName,
        language: roomLanguage,
        level: normalizeLevelToYear(roomLevel) as any,
        objective,
        scheduledAt,
        duration: Number(roomDuration),
        maxStudents,
        animatorType: 'professor',
        // Some auth profiles may not have the full `professor` record loaded yet;
        // fall back to the top-level `user.id` so the backend receives an identifier.
        professorId: professor?.id || user?.id,
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
        setRoomLevel('YEAR1');
        setRoomDuration('30');
        setScheduledAt('');
        setMaxStudents(6);
        setObjective('');
        setSelectedStudents([]);
        setIsCreateDialogOpen(false);
      } else {
        toast.error(getFriendlyErrorMessage((res as any).message || (res as any).error, isRTL));
      }
} catch {
        // handle create session error
        toast.error(getFriendlyErrorMessage(err, isRTL));
      } finally {
      setCreating(false);
    }
  };

  const filteredSessions = (Array.isArray(sessions) ? sessions : []).filter((session) => {
    const matchesSearch = (session.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.language || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (typeof session.status === 'string' && session.status.toLowerCase() === statusFilter);
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
    const startCheck = canStartRoom(session, isRTL);
    if (!startCheck.canStart) {
      toast.error(startCheck.reason);
      return;
    }

    try {
      // Start the room
      const response = await RoomService.startSession(session.id);
      if (response && response.success) {
        toast.success(isRTL ? 'تم بدء الجلسة بنجاح!' : 'Session démarrée avec succès !');
        // Navigate to room
        navigate(`/professor/room/${session.id}`);
      } else {
        toast.error(getFriendlyErrorMessage(response.error, isRTL));
      }
} catch {
        // handle room start error
        toast.error(getFriendlyErrorMessage(err, isRTL));
      }
  };

  const handleJoinRoom = (session: RoomModel) => {
    const joinCheck = canJoinRoom(session, isRTL);
    if (!joinCheck.canJoin) {
      toast.error(joinCheck.reason);
      return;
    }
    navigate(`/professor/room/${session.id}`);
  };

  const handleViewRecording = async (session: RoomModel) => {
    const roomName = session.livekitRoomName;
    if (!roomName) {
      toast.error(isRTL ? 'لا يوجد اسم غرفة لايف كيت' : 'Aucun nom de salle LiveKit disponible');
      return;
    }
    setSelectedSessionName(session.name);
    setSelectedRoomName(roomName);
    setRecordingDialogOpen(true);
    setLoadingRecordings(true);
    setRecordings([]);
    try {
      const res = await RecordingService.getRecordingsByRoomName(roomName);
      if (res.success && res.data) {
        setRecordings(res.data);
        if (res.data.length === 0) {
          toast.info(isRTL ? 'لا توجد تسجيلات لهذه الجلسة' : 'Aucun enregistrement trouvé pour cette session');
      }
      } else {
        toast.error(res.error || (isRTL ? 'فشل في جلب التسجيلات' : 'Échec du chargement des enregistrements'));
      }
    } catch {
      toast.error(isRTL ? 'فشل في جلب التسجيلات' : 'Échec du chargement des enregistrements');
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handleDownloadRecording = async (rec: SessionRecording) => {
    try {
      const res = await RecordingService.getDownloadUrl(selectedRoomName, rec.id);
      if (res.success && res.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = res.data.downloadUrl;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error(res.error || (isRTL ? 'فشل في تحميل التسجيل' : 'Échec du téléchargement'));
      }
    } catch {
      toast.error(isRTL ? 'فشل في تحميل التسجيل' : 'Échec du téléchargement');
    }
  };

  const getExpirationInfo = (rec: SessionRecording) => {
    if (!rec.expiresAt) return null;
    const expiresAt = new Date(rec.expiresAt);
    const now = new Date();
    if (expiresAt <= now) return null;
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    if (diffDays > 0) {
      return isRTL
        ? `متبقي ${diffDays} يوم و ${remainingHours} ساعة`
        : `${diffDays}j ${remainingHours}h restants`;
    }
    return isRTL
      ? `متبقي ${diffHours} ساعة`
      : `${diffHours}h restantes`;
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
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) setRoomFieldErrors({}); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إنشاء جلسة جديدة' : 'Créer une nouvelle session'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRoom} className="space-y-6 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{isRTL ? 'اسم الجلسة' : 'Nom de la session'}</Label>
                <Input id="name" placeholder={isRTL ? 'مثال: نادي المحادثة الإسبانية' : 'ex: Club de conversation espagnol'} required value={roomName} onChange={(e) => { setRoomName(e.target.value); setRoomFieldErrors(prev => ({ ...prev, roomName: '' })); }} className={roomFieldErrors.roomName ? 'border-destructive' : ''} />
                <FieldError message={roomFieldErrors.roomName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">{isRTL ? 'المادة' : 'Matière'}</Label>
                <Select value={roomLanguage} onValueChange={(val) => { setRoomLanguage(val); setRoomFieldErrors(prev => ({ ...prev, roomLanguage: '' })); }} required>
                  <SelectTrigger className={roomFieldErrors.roomLanguage ? 'border-destructive' : ''}>
                    <SelectValue placeholder={isRTL ? 'اختر مادة' : 'Choisir matière'} />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang}>{getLanguageDisplay(lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={roomFieldErrors.roomLanguage} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">{isRTL ? 'المستوى' : 'Niveau'}</Label>
                <Select value={roomLevel} onValueChange={(val) => { setRoomLevel(val); setRoomFieldErrors(prev => ({ ...prev, roomLevel: '' })); }} required>
                  <SelectTrigger className={roomFieldErrors.roomLevel ? 'border-destructive' : ''}>
                    <SelectValue placeholder={isRTL ? 'اختر مستوى' : 'Sélectionner un niveau'} />
                  </SelectTrigger>
                  <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>{getLevelLabel(level)}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FieldError message={roomFieldErrors.roomLevel} />
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
                <Input id="date" type="datetime-local" required value={scheduledAt} onChange={(e) => { setScheduledAt(e.target.value); setRoomFieldErrors(prev => ({ ...prev, scheduledAt: '' })); }} className={roomFieldErrors.scheduledAt ? 'border-destructive' : ''} />
                <FieldError message={roomFieldErrors.scheduledAt} />
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
              <div className="flex items-center gap-3 mb-2">
                <Select value={inviteFilterLevel} onValueChange={setInviteFilterLevel}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder={isRTL ? 'تصفية حسب المستوى' : 'Filtrer par niveau'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{isRTL ? 'كل المستويات' : 'Tous les niveaux'}</SelectItem>
                    {levels.map((lv) => (
                      <SelectItem key={lv} value={lv}>{getLevelLabel(lv)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto p-1">
                {students.length > 0 ? (
                  students
                    .filter(s => {
                      // Filter by professor type: FORMATEUR sees only FORMATION students, PROF_PREPA sees only PREPA, others see SCOLAIRE
                      const profType = professor?.professorType;
                      if (profType === 'FORMATEUR' && s.studentType !== 'FORMATION') return false;
                      if (profType === 'PROF_PREPA' && s.studentType !== 'PREPA') return false;
                      if (profType && profType !== 'FORMATEUR' && profType !== 'PROF_PREPA' && s.studentType && s.studentType !== 'SCOLAIRE') return false;
                      // Filter by level
                      if (inviteFilterLevel && inviteFilterLevel !== '__all__' && s.level !== inviteFilterLevel) return false;
                      return true;
                    })
                    .map((student) => (
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
                          <p className="text-xs text-muted-foreground">{getLevelLabel(student.level)}</p>
                        </div>
                      </label>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      {professor && !professor.createdBy ? (
                        <p>
                          {isRTL
                            ? 'لم يتم ربط حساب الأستاذ بمُنشئ (createdBy). يرجى الاتصال بالمسؤول.'
                            : 'Votre profil professeur n\'est pas lié à un administrateur (createdBy). Contactez votre admin.'}
                        </p>
                      ) : (
                        <p>{isRTL ? 'لا يوجد طلاب متاحين' : 'Aucun étudiant disponible'}</p>
                      )}
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
            const startCheck = canStartRoom(session, isRTL);
            const joinCheck = canJoinRoom(session, isRTL);
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
                    <Badge variant={session.level.toLowerCase() as any}>{getLevelLabel(session.level)}</Badge>
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
                            {isRTL ? 'بدء الجلسة' : 'Démarrer la session'}
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            {isRTL
                              ? `متاح بعد ${startCheck.minutesLeft} د`
                              : formatTimeUntilJoinable(session, isRTL)}
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
                        {isRTL ? 'انضم الآن' : 'Rejoindre maintenant'}
                      </Button>
                    )}
                    {statusLower === 'completed' && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRecording(session);
                          }}
                          variant="outline"
                          size="icon"
                          title={isRTL ? 'مشاهدة التسجيل' : 'Voir l\'enregistrement'}
                        >
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/professor/summaries`);
                          }}
                          className="flex-1"
                          variant="secondary"
                        >
                          <Eye className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                          {isRTL ? 'عرض الملخص' : 'Voir le résumé'}
                        </Button>
                      </>
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

      {/* Recording Dialog */}
      <Dialog open={recordingDialogOpen} onOpenChange={setRecordingDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? `تسجيلات: ${selectedSessionName}` : `Enregistrements: ${selectedSessionName}`}
            </DialogTitle>
          </DialogHeader>

          {/* Expiration warning banner */}
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {isRTL
                ? 'التسجيلات متاحة لمدة 3 أيام فقط بعد الجلسة. قم بتحميلها قبل انتهاء الصلاحية.'
                : "Les enregistrements sont disponibles pendant 3 jours seulement après la session. Téléchargez-les avant l'expiration."}
            </span>
          </div>

          <div className="mt-2 space-y-4">
            {loadingRecordings ? (
              <p className="text-center text-muted-foreground py-8">
                {isRTL ? 'جاري التحميل...' : 'Chargement...'}
              </p>
            ) : recordings.length === 0 ? (
              <div className="text-center py-8">
                <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {isRTL ? 'لا توجد تسجيلات متاحة' : 'Aucun enregistrement disponible'}
                </p>
              </div>
            ) : (
              recordings.map((rec) => {
                const expirationText = getExpirationInfo(rec);
                return (
                  <div key={rec.id} className="rounded-lg border border-border overflow-hidden">
                    <video
                      src={rec.recordingUrl}
                      controls
                      className="w-full max-h-[500px] bg-black"
                      controlsList="nodownload"
                    />
                    <div className={cn("flex items-center justify-between p-3 bg-muted/50", isRTL && "flex-row-reverse")}>
                      {expirationText && (
                        <div className={cn("flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400", isRTL && "flex-row-reverse")}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{expirationText}</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadRecording(rec)}
                        className={cn("gap-1.5", isRTL && "flex-row-reverse")}
                      >
                        <Download className="w-4 h-4" />
                        {isRTL ? 'تحميل' : 'Télécharger'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
