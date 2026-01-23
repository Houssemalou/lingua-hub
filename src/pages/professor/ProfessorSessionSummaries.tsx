import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Search,
  Filter,
  Edit,
  Eye,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProfessorSessions, getStudentById } from '@/data/mockData';
import { getProfessorSessionSummaries, ProfessorSessionSummary } from '@/data/professorSummaries';
import { SessionSummaryEditor } from '@/components/professor/SessionSummaryEditor';
import { format } from 'date-fns';
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

interface SummaryCardProps {
  summary: ProfessorSessionSummary;
  isRTL: boolean;
  onEdit: (summary: ProfessorSessionSummary) => void;
}

function SummaryCard({ summary, isRTL, dateLocale, onEdit }: SummaryCardProps & { dateLocale: typeof fr }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const student = getStudentById(summary.studentId);

  return (
    <motion.div variants={item}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className={cn("flex items-start justify-between gap-4", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <Avatar className="w-12 h-12">
                <AvatarImage src={student?.avatar} />
                <AvatarFallback>{student?.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className={isRTL ? "text-right" : ""}>
                <CardTitle className="text-lg">{student?.name || 'Étudiant'}</CardTitle>
                <div className={cn("flex items-center gap-2 flex-wrap mt-1", isRTL && "flex-row-reverse")}>
                  <Badge variant="outline">{summary.roomName}</Badge>
                  <Badge variant={summary.level.toLowerCase() as any}>{summary.level}</Badge>
                </div>
              </div>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              {summary.isPublished ? (
                <Badge variant="default" className="gap-1 bg-success">
                  <CheckCircle className="w-3 h-3" />
                  {isRTL ? 'منشور' : 'Publié'}
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {isRTL ? 'مسودة' : 'Brouillon'}
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={() => onEdit(summary)}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className={cn("flex items-center gap-4 text-sm text-muted-foreground flex-wrap", isRTL && "flex-row-reverse")}>
            <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              <Calendar className="w-4 h-4" />
              {format(new Date(summary.date), 'dd MMM yyyy', { locale: dateLocale })}
            </span>
            <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              <Clock className="w-4 h-4" />
              {summary.duration} min
            </span>
          </div>

          {/* Quick Score Overview */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center px-3 py-2 rounded-lg bg-primary/10">
              <div className="text-xl font-bold text-primary">{summary.overallScore}%</div>
              <div className="text-xs text-muted-foreground">{isRTL ? 'الدرجة' : 'Score'}</div>
            </div>
            {summary.professorFeedback && (
              <p className={cn("text-sm text-muted-foreground italic flex-1 line-clamp-2", isRTL && "text-right")}>
                "{summary.professorFeedback.slice(0, 100)}..."
              </p>
            )}
          </div>

          {/* Expand Button */}
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                {isRTL ? 'إخفاء التفاصيل' : 'Masquer les détails'}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                {isRTL ? 'عرض التفاصيل' : 'Voir les détails'}
              </>
            )}
          </Button>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 overflow-hidden"
              >
                <Separator />
                
                {/* Skills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: isRTL ? 'النطق' : 'Prononciation', value: summary.pronunciation },
                    { label: isRTL ? 'القواعد' : 'Grammaire', value: summary.grammar },
                    { label: isRTL ? 'المفردات' : 'Vocabulaire', value: summary.vocabulary },
                    { label: isRTL ? 'الطلاقة' : 'Fluidité', value: summary.fluency },
                    { label: isRTL ? 'المشاركة' : 'Participation', value: summary.participation },
                  ].map((skill) => (
                    <div key={skill.label} className="text-center p-2 rounded-lg bg-muted/50">
                      <div className={cn(
                        "text-lg font-semibold",
                        skill.value >= 80 ? 'text-success' : skill.value >= 60 ? 'text-warning' : 'text-destructive'
                      )}>
                        {skill.value}%
                      </div>
                      <div className="text-xs text-muted-foreground">{skill.label}</div>
                    </div>
                  ))}
                </div>

                {/* Strengths & Areas */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {summary.strengths.length > 0 && (
                    <div className="space-y-2">
                      <h4 className={cn("font-semibold text-success flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        {isRTL ? 'نقاط القوة' : 'Points forts'}
                      </h4>
                      <ul className="space-y-1">
                        {summary.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-foreground/80">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary.areasToImprove.length > 0 && (
                    <div className="space-y-2">
                      <h4 className={cn("font-semibold text-warning flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        {isRTL ? 'نقاط للتحسين' : 'À améliorer'}
                      </h4>
                      <ul className="space-y-1">
                        {summary.areasToImprove.map((s, i) => (
                          <li key={i} className="text-sm text-foreground/80">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Next Focus */}
                {summary.nextSessionFocus && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <h4 className={cn("font-semibold mb-1", isRTL && "text-right")}>
                      📌 {isRTL ? 'تركيز الجلسة القادمة' : 'Focus prochaine session'}
                    </h4>
                    <p className={cn("text-sm text-foreground/80", isRTL && "text-right")}>
                      {summary.nextSessionFocus}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ProfessorSessionSummaries() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const professor = user?.professor;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingSummary, setEditingSummary] = useState<ProfessorSessionSummary | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{ id: string; roomName: string; language: string; level: string; students: string[] } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const dateLocale = language === 'ar' ? ar : fr;
  const sessions = professor ? getProfessorSessions(professor.id) : [];
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const summaries = professor ? getProfessorSessionSummaries(professor.id) : [];

  const filteredSummaries = summaries.filter((summary) => {
    const student = getStudentById(summary.studentId);
    const matchesSearch = 
      student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.roomName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'published' && summary.isPublished) ||
      (statusFilter === 'draft' && !summary.isPublished);
    return matchesSearch && matchesStatus;
  });

  const handleEditSummary = (summary: ProfessorSessionSummary) => {
    setEditingSummary(summary);
  };

  const handleSaveSummary = (data: any) => {
    console.log('Saving summary:', data);
    setEditingSummary(null);
    setIsCreateDialogOpen(false);
    setSelectedSession(null);
    setSelectedStudent(null);
  };

  const handleCreateNew = () => {
    setIsCreateDialogOpen(true);
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      // Get students from the room
      const room = sessions.find(s => s.roomId === session.roomId);
      setSelectedSession({
        id: session.id,
        roomName: session.roomName,
        language: session.language,
        level: session.level,
        students: room ? [] : [] // In real app, get from room.joinedStudents
      });
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
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
          <div className={isRTL ? "text-right" : ""}>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isRTL ? 'ملخصات الجلسات' : 'Résumés de Sessions'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? 'اكتب ملخصات مهنية لطلابك' : 'Rédigez des résumés professionnels pour vos étudiants'}
            </p>
          </div>
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">{summaries.length}</div>
              <div className="text-xs text-muted-foreground">{isRTL ? 'ملخصات' : 'Résumés'}</div>
            </div>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'ملخص جديد' : 'Nouveau résumé'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className={cn("flex flex-col sm:flex-row gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className="relative flex-1">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={isRTL ? 'البحث عن طالب أو جلسة...' : 'Rechercher un étudiant ou une session...'}
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
            <SelectItem value="all">{isRTL ? 'الكل' : 'Tous'}</SelectItem>
            <SelectItem value="published">{isRTL ? 'منشور' : 'Publiés'}</SelectItem>
            <SelectItem value="draft">{isRTL ? 'مسودة' : 'Brouillons'}</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Summaries List */}
      <div className="space-y-4">
        {filteredSummaries.map((summary) => (
          <SummaryCard
            key={summary.id}
            summary={summary}
            isRTL={isRTL}
            dateLocale={dateLocale}
            onEdit={handleEditSummary}
          />
        ))}
      </div>

      {filteredSummaries.length === 0 && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isRTL ? 'لا توجد ملخصات' : 'Aucun résumé'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? (isRTL ? 'حاول تعديل الفلاتر' : 'Essayez d\'ajuster vos filtres')
                  : (isRTL ? 'ابدأ بكتابة ملخص لجلساتك المكتملة' : 'Commencez par rédiger un résumé pour vos sessions terminées')}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={handleCreateNew} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {isRTL ? 'إنشاء ملخص' : 'Créer un résumé'}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Edit Summary Dialog */}
      <Dialog open={!!editingSummary} onOpenChange={() => setEditingSummary(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'تعديل الملخص' : 'Modifier le résumé'}
            </DialogTitle>
          </DialogHeader>
          {editingSummary && (
            <SessionSummaryEditor
              studentId={editingSummary.studentId}
              studentName={getStudentById(editingSummary.studentId)?.name || 'Étudiant'}
              sessionId={editingSummary.sessionId}
              roomName={editingSummary.roomName}
              language={editingSummary.language}
              level={editingSummary.level}
              onSave={handleSaveSummary}
              onCancel={() => setEditingSummary(null)}
              isRTL={isRTL}
              initialData={editingSummary}
            />
          )}
        </DialogContent>
      </Dialog>

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
              <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
                {completedSessions.length > 0 ? (
                  completedSessions.map((session) => (
                    <Card
                      key={session.id}
                      variant="interactive"
                      className="cursor-pointer"
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <CardContent className="p-4">
                        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                          <div>
                            <h4 className="font-medium">{session.roomName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(session.scheduledAt), 'PPp', { locale: dateLocale })}
                            </p>
                          </div>
                          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <Badge variant="secondary">{session.language}</Badge>
                            <Badge variant={session.level.toLowerCase() as any}>{session.level}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {isRTL ? 'لا توجد جلسات مكتملة' : 'Aucune session terminée'}
                  </p>
                )}
              </div>
            </div>
          ) : !selectedStudent ? (
            <div className="space-y-4 py-4">
              <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <p className="text-muted-foreground">
                  {isRTL ? 'اختر طالبًا:' : 'Sélectionnez un étudiant :'}
                </p>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                  {isRTL ? 'رجوع' : 'Retour'}
                </Button>
              </div>
              <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
                {/* Mock students for demo */}
                {['1', '2', '3'].map((studentId) => {
                  const student = getStudentById(studentId);
                  if (!student) return null;
                  return (
                    <Card
                      key={studentId}
                      variant="interactive"
                      className="cursor-pointer"
                      onClick={() => setSelectedStudent(studentId)}
                    >
                      <CardContent className="p-4">
                        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                          <Avatar>
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback>{student.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <SessionSummaryEditor
              studentId={selectedStudent}
              studentName={getStudentById(selectedStudent)?.name || 'Étudiant'}
              sessionId={selectedSession.id}
              roomName={selectedSession.roomName}
              language={selectedSession.language}
              level={selectedSession.level}
              onSave={handleSaveSummary}
              onCancel={() => {
                setSelectedStudent(null);
                setSelectedSession(null);
                setIsCreateDialogOpen(false);
              }}
              isRTL={isRTL}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
