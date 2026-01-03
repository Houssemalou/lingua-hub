import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProfessorSessions } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

  const sessions = professor ? getProfessorSessions(professor.id) : [];
  const dateLocale = language === 'ar' ? ar : fr;

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.language.toLowerCase().includes(searchQuery.toLowerCase());
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
        {filteredSessions.map((session) => (
          <Card
            key={session.id}
            variant="interactive"
            className={cn(session.status === 'live' && 'border-destructive/50')}
            onClick={() => navigate(`/professor/room/${session.roomId}`)}
          >
            <CardHeader className="pb-3">
              <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    session.status === 'live' ? 'bg-destructive/20' : 'bg-muted'
                  )}>
                    <UserCircle className={cn(
                      "w-5 h-5",
                      session.status === 'live' ? 'text-destructive' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <CardTitle className="text-lg">{session.roomName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{session.language}</p>
                  </div>
                </div>
                <Badge variant={session.status as any} className="capitalize">
                  {getStatusIcon(session.status)}
                  <span className={cn(isRTL ? "mr-1" : "ml-1")}>
                    {session.status === 'live' 
                      ? (isRTL ? 'مباشر' : 'En direct')
                      : session.status === 'scheduled'
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
                    {session.participantsCount}
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
                  {session.status === 'scheduled'
                    ? `${isRTL ? 'تبدأ' : 'Commence'} ${formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true, locale: dateLocale })}`
                    : format(new Date(session.scheduledAt), 'PPp', { locale: dateLocale })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
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
