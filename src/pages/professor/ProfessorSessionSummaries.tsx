import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  CalendarClock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { RoomSessionSummaryEditor } from '@/components/professor/RoomSessionSummaryEditor';
import { RoomService } from '@/services/RoomService';
import { SessionSummaryService, SessionSummary } from '@/services/SessionSummaryService';
import { RoomModel } from '@/models';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

export default function ProfessorSessionSummaries() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<RoomModel | null>(null);
  const [sessions, setSessions] = useState<RoomModel[]>([]);
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const dateLocale = language === 'ar' ? ar : fr;

  // Load real sessions from backend
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Load professor's rooms via getMySessions
        const roomsResponse = await RoomService.getMySessions();
        
        // Handle different response formats
        let roomsArray: RoomModel[] = [];
        if (roomsResponse) {
          // If response has a data property that is an array
          if (Array.isArray(roomsResponse.data)) {
            roomsArray = roomsResponse.data;
          } 
          // If response itself is an array
          else if (Array.isArray(roomsResponse)) {
            roomsArray = roomsResponse;
          }
          // If response has nested data property
          else if (roomsResponse.data && Array.isArray((roomsResponse.data as any).data)) {
            roomsArray = (roomsResponse.data as any).data;
          }
        }
        
        setSessions(roomsArray);

        // Load summaries for these rooms
        if (roomsArray.length > 0) {
          const roomIds = roomsArray.map(r => r.id);
          const summariesResponse = await SessionSummaryService.getByRoomIds(roomIds);
          if (summariesResponse.success && summariesResponse.data) {
            const summariesArray = Array.isArray(summariesResponse.data) 
              ? summariesResponse.data 
              : [];
            setSummaries(summariesArray);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(isRTL ? 'فشل في تحميل البيانات' : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, isRTL]);

  const availableSessions = Array.isArray(sessions) ? sessions.filter((session) => {
    if (!searchQuery) return true;
    return session.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           session.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           session.level?.toLowerCase().includes(searchQuery.toLowerCase());
  }) : [];

  const handleCreateNew = () => {
    setIsCreateDialogOpen(true);
  };

  const handleSelectSession = (session: RoomModel) => {
    setSelectedSession(session);
  };

  const handleSummaryCreated = async () => {
    // Reload summaries after creation
    if (!user?.id) return;
    
    try {
      if (Array.isArray(sessions) && sessions.length > 0) {
        const roomIds = sessions.map(r => r.id);
        const summariesResponse = await SessionSummaryService.getByRoomIds(roomIds);
        if (summariesResponse.success && summariesResponse.data) {
          const summariesArray = Array.isArray(summariesResponse.data) 
            ? summariesResponse.data 
            : [];
          setSummaries(summariesArray);
        }
      }
    } catch (error) {
      console.error('Error reloading summaries:', error);
    }
    
    setSelectedSession(null);
    setIsCreateDialogOpen(false);
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
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
          <div className={isRTL ? "text-right" : ""}>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isRTL ? 'ملخصات الجلسات' : 'Résumés de Sessions'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? 'اكتب ملخصات مهنية لطلابك' : 'Rédigez des résumés professionnels pour vos sessions'}
            </p>
          </div>
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">{Array.isArray(summaries) ? summaries.length : 0}</div>
              <div className="text-xs text-muted-foreground">{isRTL ? 'ملخصات' : 'Résumés'}</div>
            </div>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'ملخص جديد' : 'Nouveau résumé'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item}>
        <div className="relative">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={isRTL ? 'البحث عن جلسة...' : 'Rechercher une session...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(isRTL ? "pr-10" : "pl-10")}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
      </motion.div>

      {/* Create New Summary Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'إنشاء ملخص جديد' : 'Créer un nouveau résumé'}
            </DialogTitle>
          </DialogHeader>
          
          {!selectedSession ? (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                {isRTL ? 'اختر جلسة لإنشاء ملخص لها:' : 'Sélectionnez une session pour créer un résumé :'}
              </p>
              {loading ? (
                <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-44" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-10 rounded-full" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
                  {availableSessions.length > 0 ? (
                    availableSessions.map((session) => {
                      const getStatusConfig = (status: string) => {
                        switch (status.toLowerCase()) {
                          case 'completed':
                            return { 
                              icon: CheckCircle, 
                              label: isRTL ? 'مكتملة' : 'Terminée', 
                              variant: 'default' as const,
                              className: 'bg-success text-success-foreground'
                            };
                          case 'live':
                            return { 
                              icon: PlayCircle, 
                              label: isRTL ? 'مباشر' : 'En direct', 
                              variant: 'destructive' as const,
                              className: 'bg-destructive animate-pulse'
                            };
                          case 'scheduled':
                          default:
                            return { 
                              icon: CalendarClock, 
                              label: isRTL ? 'مجدولة' : 'Programmée', 
                              variant: 'secondary' as const,
                              className: ''
                            };
                        }
                      };
                      const statusConfig = getStatusConfig(session.status);
                      const StatusIcon = statusConfig.icon;
                      
                      // Check if summary already exists for this session
                      const existingSummary = Array.isArray(summaries) 
                        ? summaries.find(s => s.roomId === session.id) 
                        : null;
                      
                      return (
                        <Card
                          key={session.id}
                          variant="interactive"
                          className="cursor-pointer"
                          onClick={() => handleSelectSession(session)}
                        >
                          <CardContent className="p-4">
                            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                              <div>
                                <h4 className="font-medium">{session.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {session.scheduledAt ? format(new Date(session.scheduledAt), 'PPp', { locale: dateLocale }) : 'Date non définie'}
                                </p>
                              </div>
                              <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
                                {existingSummary && (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    {isRTL ? 'موجود' : 'Existant'}
                                  </Badge>
                                )}
                                <Badge variant={statusConfig.variant} className={cn("gap-1", statusConfig.className)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig.label}
                                </Badge>
                                <Badge variant="secondary">{session.language}</Badge>
                                <Badge variant={session.level.toLowerCase() as any}>{session.level}</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      {isRTL ? 'لا توجد جلسات' : 'Aucune session disponible'}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Room Session Summary Editor */}
      {selectedSession && (
        <RoomSessionSummaryEditor
          roomId={selectedSession.id}
          roomName={selectedSession.name}
          language={selectedSession.language}
          level={selectedSession.level}
          isOpen={!!selectedSession}
          onClose={() => {
            setSelectedSession(null);
            setIsCreateDialogOpen(false);
          }}
          onSaved={handleSummaryCreated}
          isRTL={isRTL}
        />
      )}
    </motion.div>
  );
}
