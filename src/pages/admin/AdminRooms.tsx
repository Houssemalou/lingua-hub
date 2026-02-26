import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, Play, Eye, Bot, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// Dialog (create room) removed for admin UI
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { getLevelLabel } from '@/lib/levelLabels';
import { RoomService } from '@/services/RoomService';
import { ProfessorService } from '@/services/ProfessorService';
import { RoomModel, ProfessorModel } from '@/models';

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

const levels = ['YEAR1','YEAR2','YEAR3','YEAR4','YEAR5','YEAR6','YEAR7','YEAR8','YEAR9'];
// allowed language/subject options
const languages = ['Français', 'Anglais', 'Arabe', 'Allemand', 'Mathématiques', 'Science', 'Informatique'];
const levelEnabledLanguages = ['Français', 'Anglais', 'Arabe', 'Allemand'];

export default function AdminRooms() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  

  // State for backend data
  const [rooms, setRooms] = useState<RoomModel[]>([]);
  const [professors, setProfessors] = useState<ProfessorModel[]>([]);
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

        // (students are not loaded in admin rooms; admin cannot invite/create sessions here)

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
              {isRTL ? 'إدارة غرف التعلم' : 'Gérer les salles d\'apprentissage'}
            </p>
          </div>
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
                  <Badge variant="outline">{getLevelLabel(room.level) || 'N/A'}</Badge>
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
