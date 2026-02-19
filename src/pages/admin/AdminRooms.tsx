import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Users, Clock, DoorOpen, Play, Eye, Bot, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { RoomService } from '@/services/RoomService';
import { ProfessorService } from '@/services/ProfessorService';
import { StudentService } from '@/services/StudentService';
import { RoomModel, ProfessorModel, StudentModel, CreateRoomDTO } from '@/models';

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

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];
const scienceSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
const allSubjects = [...languages, ...scienceSubjects];

export default function AdminRooms() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [animatorType, setAnimatorType] = useState<'ai' | 'professor'>('professor');
  const [selectedProfessor, setSelectedProfessor] = useState<string>('');

  // Form fields (controlled)
  const [roomName, setRoomName] = useState('');
  const [roomLanguage, setRoomLanguage] = useState('');
  const [roomLevel, setRoomLevel] = useState('A1');
  const [roomDuration, setRoomDuration] = useState<string>('30');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [maxStudents, setMaxStudents] = useState<number>(6);
  const [objective, setObjective] = useState('');
  const [creating, setCreating] = useState(false);

  // State for backend data
  const [rooms, setRooms] = useState<RoomModel[]>([]);
  const [professors, setProfessors] = useState<ProfessorModel[]>([]);
  const [students, setStudents] = useState<StudentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load my rooms (filtered by role)
        const roomsResponse = await RoomService.getMySessions();
        if (roomsResponse && (roomsResponse as any).success !== undefined) {
          if ((roomsResponse as any).success) {
            // Backend returns a PageResponse: { data: T[], total, page, limit, totalPages }
            setRooms((roomsResponse as any).data?.data || []);
          } else {
            setError((roomsResponse as any).message || (roomsResponse as any).error || 'Failed to load rooms');
          }
        } else {
          // Fallback for non-wrapped responses
          setRooms((roomsResponse as any)?.data || []);
        }

        // Load professors
        const professorsResponse = await ProfessorService.getAll();
        if (professorsResponse && (professorsResponse as any).success !== undefined) {
          if ((professorsResponse as any).success) {
            setProfessors((professorsResponse as any).data?.data || []);
          } else {
            setError((professorsResponse as any).message || (professorsResponse as any).error || 'Failed to load professors');
          }
        } else {
          setProfessors((professorsResponse as any)?.data || []);
        }

        // Load students
        const studentsResponse = await StudentService.getAll();
        if (studentsResponse && (studentsResponse as any).success !== undefined) {
          if ((studentsResponse as any).success) {
            setStudents((studentsResponse as any).data?.data || []);
          } else {
            setError((studentsResponse as any).message || (studentsResponse as any).error || 'Failed to load students');
          }
        } else {
          setStudents((studentsResponse as any)?.data || []);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredRooms = (Array.isArray(rooms) ? rooms : []).filter((room) => {
    const matchesSearch = (
      (room.name || '').toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.language || '').toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || (typeof room.status === 'string' && room.status.toLowerCase() === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (professors.length === 0) {
      toast.error(isRTL ? 'لا يمكن إنشاء غرفة بدون أساتذة' : 'Cannot create a room without professors');
      return;
    }

    if (!roomName || !roomLanguage || !roomLevel || !scheduledAt || !selectedProfessor) {
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
        professorId: selectedProfessor,
        invitedStudents: selectedStudents,
      };

      const res = await RoomService.create(payload);
      if ((res as any).success) {
        const rawData = (res as any).data;
        const created = (rawData?.data || rawData) as RoomModel;
        // Prepend to list
        setRooms(prev => [created, ...prev]);
        toast.success(isRTL ? 'تم إنشاء الغرفة بنجاح!' : 'Salle créée avec succès !');
        // Reset form
        setRoomName('');
        setRoomLanguage('');
        setRoomLevel('A1');
        setRoomDuration('30');
        setScheduledAt('');
        setMaxStudents(6);
        setObjective('');
        setSelectedStudents([]);
        setSelectedProfessor('');
        setIsCreateDialogOpen(false);
      } else {
        toast.error((res as any).message || (res as any).error || (isRTL ? 'فشل في إنشاء الغرفة' : 'Failed to create room'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isRTL ? 'فشل في إنشاء الغرفة' : 'Failed to create room'));
      console.error('Create room error:', err);
    } finally {
      setCreating(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

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

  const getAnimatorInfo = (room: RoomModel) => {
    if (room.animatorType === 'ai') {
      return { icon: Bot, label: 'Agent AI', color: 'text-primary' };
    }
    const professor = professors.find(p => p.id === room.professorId);
    return { 
      icon: UserCircle, 
      label: professor?.name || 'Professeur', 
      color: 'text-accent' 
    };
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
            {isRTL ? 'إدارة الغرف' : 'Gestion des Salles'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'إنشاء وإدارة غرف تعلم اللغات الخاصة بك' : 'Créer et gérer vos salles d\'apprentissage'}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className={cn("gap-2", isRTL && "flex-row-reverse")}>
              <Plus className="w-4 h-4" />
              {isRTL ? 'إنشاء غرفة' : 'Créer une Salle'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إنشاء غرفة جديدة' : 'Créer une nouvelle Salle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRoom} className="space-y-6 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{isRTL ? 'اسم الغرفة' : 'Nom de la salle'}</Label>
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

              {/* Animator Type Selection */}
              <div className="space-y-3">
                <Label>{isRTL ? 'نوع المنشط' : 'Type d\'animateur'}</Label>
                <RadioGroup
                  value={animatorType}
                  onValueChange={(value) => setAnimatorType(value as 'ai' | 'professor')}
                  className="grid grid-cols-2 gap-4"
                >

                  <label
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      "border-accent bg-accent/5"
                    )}
                  >
                    <RadioGroupItem value="professor" id="professor" checked={true} />
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">{isRTL ? 'أستاذ' : 'Professeur'}</p>
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? 'جلسة يقودها أستاذ' : 'Session animée par un professeur'}
                      </p>
                    </div>
                  </label>
                </RadioGroup>

                {/* Professor Selection */}
                {animatorType === 'professor' && (
                  <div className="space-y-2 mt-4">
                    <Label>{isRTL ? 'اختر الأستاذ' : 'Sélectionner le professeur'}</Label>
                    <Select value={selectedProfessor} onValueChange={setSelectedProfessor} required disabled={professors.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder={professors.length === 0 ? (isRTL ? 'لا يوجد أساتذة' : 'Aucun professeur') : (isRTL ? 'اختر أستاذًا' : 'Choisir un professeur')} />
                      </SelectTrigger>
                      <SelectContent>
                        {professors.length > 0 ? (
                          professors.map((prof) => (
                            <SelectItem key={prof.id} value={prof.id}>
                              <div className="flex items-center gap-2">
                                <img src={prof.avatar} alt="" className="w-6 h-6 rounded-full" />
                                <span>{prof.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({prof.languages.slice(0, 2).join(', ')})
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__no_professor__" disabled>
                            {isRTL ? 'لا يوجد أساتذة متاحين' : 'Aucun professeur disponible'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {professors.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">{isRTL ? 'لا يوجد أساتذة. أضف أستاذًا أولاً.' : 'No professors available. Please add a professor first.'}</p>
                    )}
                  </div>
                )}
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
                <Button type="submit" disabled={creating || professors.length === 0 || selectedProfessor === ''}>
                  {creating ? (isRTL ? 'جاري الإنشاء...' : 'Creating...') : (isRTL ? 'إنشاء الغرفة' : 'Créer la Salle')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className={cn("flex flex-col sm:flex-row gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className="relative flex-1">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={isRTL ? 'البحث عن الغرف...' : 'Rechercher des salles...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(isRTL ? "pr-10" : "pl-10")}
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

      {/* Loading and Error States */}
      {loading && (
        <motion.div variants={item} className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isRTL ? 'جاري تحميل البيانات...' : 'Chargement des données...'}
          </p>
        </motion.div>
      )}

      {error && (
        <motion.div variants={item} className="text-center py-12">
          <div className="w-12 h-12 text-destructive mx-auto mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement'}
          </h3>
          <p className="text-muted-foreground">{error}</p>
        </motion.div>
      )}

      {/* Rooms Grid */}
      {!loading && !error && (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => {
          const animator = getAnimatorInfo(room);
          return (
            <Card
              key={room.id}
              variant="interactive"
              className={room.status === 'live' ? 'border-destructive/50' : ''}
              onClick={() => navigate(`/admin/rooms/${room.id}`)}
            >
              <CardHeader className="pb-3">
                <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      room.status === 'live' ? 'bg-destructive/20' : 'bg-muted'
                    }`}>
                      <DoorOpen className={`w-5 h-5 ${
                        room.status === 'live' ? 'text-destructive' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{room.language}</p>
                    </div>
                  </div>
                  <Badge variant={room.status as any} className="capitalize">
                    {getStatusIcon(room.status)}
                    <span className={cn(isRTL ? "mr-1" : "ml-1")}>{room.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className={cn("text-sm text-muted-foreground line-clamp-2", isRTL && "text-right")}>{room.objective}</p>
                
                {/* Animator Badge */}
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <animator.icon className={`w-4 h-4 ${animator.color}`} />
                  <span className="text-sm text-muted-foreground">{animator.label}</span>
                </div>

                <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <div className={cn("flex items-center gap-4 text-muted-foreground", isRTL && "flex-row-reverse")}>
                    <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                      <Users className="w-4 h-4" />
                      {room.status === 'live' 
                        ? (room.joinedStudents?.length || 0) 
                        : (room.invitedStudents?.length || 0)}/{room.maxStudents}
                    </span>
                    <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                      <Clock className="w-4 h-4" />
                      {room.duration}m
                    </span>
                  </div>
                  <Badge variant="outline">{room.level || 'N/A'}</Badge>
                </div>
                <div className={cn("pt-2 border-t border-border", isRTL && "text-right")}>
                  <p className="text-xs text-muted-foreground">
                    {room.status === 'scheduled'
                      ? `${isRTL ? 'تبدأ' : 'Commence'} ${formatDistanceToNow(new Date(room.scheduledAt), { addSuffix: true })}`
                      : format(new Date(room.scheduledAt), 'PPp')}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>
      )}


      {filteredRooms.length === 0 && (
        <motion.div variants={item} className="text-center py-12">
          <DoorOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            {isRTL ? 'لم يتم العثور على غرف' : 'Aucune salle trouvée'}
          </h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || statusFilter !== 'all'
              ? (isRTL ? 'حاول تعديل الفلاتر' : 'Essayez d\'ajuster vos filtres')
              : (isRTL ? 'أنشئ غرفتك الأولى للبدء' : 'Créez votre première salle pour commencer')}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
