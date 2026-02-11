import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Award,
  Target,
  Lightbulb,
  Send,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  X,
  FileText,
  Calendar,
  Globe,
  GraduationCap,
  Mic,
  BookOpen,
  type Icon as LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { EvaluationService, EvaluationData, StudentData, CreateEvaluationData } from '@/services/EvaluationService';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const LANGUAGES = [
  { value: 'French', label: 'Français', labelAr: 'الفرنسية', icon: '🇫🇷' },
  { value: 'English', label: 'Anglais', labelAr: 'الإنجليزية', icon: '🇬🇧' },
  { value: 'German', label: 'Allemand', labelAr: 'الألمانية', icon: '🇩🇪' },
  { value: 'Spanish', label: 'Espagnol', labelAr: 'الإسبانية', icon: '🇪🇸' },
  { value: 'Italian', label: 'Italien', labelAr: 'الإيطالية', icon: '🇮🇹' },
  { value: 'Arabic', label: 'Arabe', labelAr: 'العربية', icon: '🇸🇦' },
  { value: 'Portuguese', label: 'Portugais', labelAr: 'البرتغالية', icon: '🇵🇹' },
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function getLevelColor(level: string) {
  switch (level) {
    case 'A1': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'A2': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'B1': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'B2': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'C1': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'C2': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function getScoreGradient(score: number) {
  if (score >= 80) return 'from-emerald-500 to-teal-500';
  if (score >= 60) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-pink-500';
}

// ============================================
// Evaluate Dialog Component
// ============================================
function EvaluateStudentDialog({
  student,
  isRTL,
  onSuccess,
}: {
  student: StudentData;
  isRTL: boolean;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState('');
  const [pronunciation, setPronunciation] = useState(50);
  const [grammar, setGrammar] = useState(50);
  const [vocabulary, setVocabulary] = useState(50);
  const [fluency, setFluency] = useState(50);
  const [assignedLevel, setAssignedLevel] = useState('');
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasToImprove, setAreasToImprove] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overallScore = Math.round((pronunciation + grammar + vocabulary + fluency) / 4);

  const handleSubmit = async () => {
    if (!language) {
      toast.error(isRTL ? 'يرجى اختيار اللغة' : 'Veuillez sélectionner une langue');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: CreateEvaluationData = {
        studentId: student.id,
        language,
        pronunciation,
        grammar,
        vocabulary,
        fluency,
        assignedLevel: assignedLevel || undefined,
        feedback: feedback || undefined,
        strengths: strengths ? strengths.split('\n').filter(s => s.trim()) : undefined,
        areasToImprove: areasToImprove ? areasToImprove.split('\n').filter(s => s.trim()) : undefined,
      };

      const response = await EvaluationService.create(data);
      if (response.success) {
        toast.success(isRTL ? 'تم إنشاء التقييم بنجاح' : 'Évaluation créée avec succès');
        setOpen(false);
        resetForm();
        onSuccess();
      } else {
        toast.error(response.error || (isRTL ? 'خطأ' : 'Erreur'));
      }
    } catch {
      toast.error(isRTL ? 'خطأ غير متوقع' : 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLanguage('');
    setPronunciation(50);
    setGrammar(50);
    setVocabulary(50);
    setFluency(50);
    setAssignedLevel('');
    setFeedback('');
    setStrengths('');
    setAreasToImprove('');
  };

  const skillSliders = [
    { label: isRTL ? 'النطق' : 'Prononciation', labelIcon: Mic, value: pronunciation, setter: setPronunciation, color: 'bg-violet-500' },
    { label: isRTL ? 'القواعد' : 'Grammaire', labelIcon: BookOpen, value: grammar, setter: setGrammar, color: 'bg-blue-500' },
    { label: isRTL ? 'المفردات' : 'Vocabulaire', labelIcon: FileText, value: vocabulary, setter: setVocabulary, color: 'bg-teal-500' },
    { label: isRTL ? 'الطلاقة' : 'Fluidité', labelIcon: TrendingUp, value: fluency, setter: setFluency, color: 'bg-amber-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          {isRTL ? 'تقييم' : 'Évaluer'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={student.avatar || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                {student.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(isRTL && "text-right")}>
              <span>{isRTL ? 'تقييم' : 'Évaluer'} {student.name}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {isRTL ? 'المستوى الحالي' : 'Niveau actuel'}: <Badge className={getLevelColor(student.level)}>{student.level}</Badge>
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language selection */}
          <div className="space-y-2">
            <Label className={cn(isRTL && "text-right block")}>{isRTL ? 'اللغة' : 'Langue'} *</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر اللغة' : 'Sélectionner la langue'} /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <span className="flex items-center gap-2">
                      <span>{lang.icon}</span>
                      <span>{isRTL ? lang.labelAr : lang.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Score section */}
          <div className="space-y-4">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <Label className="text-base font-semibold">{isRTL ? 'المهارات' : 'Compétences'}</Label>
              <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", `bg-gradient-to-r ${getScoreGradient(overallScore)} text-white`)}>
                <Award className="w-4 h-4" />
                <span className="font-bold text-sm">{overallScore}%</span>
              </div>
            </div>

            {skillSliders.map(({ label, labelIcon: Icon, value, setter, color }) => (
              <div key={label} className="space-y-2">
                <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span className={cn("flex items-center gap-1.5 font-medium", isRTL && "flex-row-reverse")}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </span>
                  <span className={cn("font-bold tabular-nums", getScoreColor(value))}>{value}%</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={(v) => setter(v[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Level assignment */}
          <div className="space-y-2">
            <Label className={cn(isRTL && "text-right block")}>
              {isRTL ? 'تغيير المستوى (اختياري)' : 'Changer le niveau (optionnel)'}
            </Label>
            <Select value={assignedLevel} onValueChange={setAssignedLevel}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? 'المستوى الحالي محفوظ' : 'Garder le niveau actuel'} />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map(level => (
                  <SelectItem key={level} value={level}>
                    <span className="flex items-center gap-2">
                      <Badge className={cn("text-xs", getLevelColor(level))}>{level}</Badge>
                      {level === student.level && (
                        <span className="text-xs text-muted-foreground">({isRTL ? 'حالي' : 'actuel'})</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label className={cn(isRTL && "text-right block")}>{isRTL ? 'ملاحظات' : 'Commentaire'}</Label>
            <Textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder={isRTL ? 'أدخل ملاحظاتك...' : 'Entrez vos remarques...'}
              rows={3}
              className={cn(isRTL && "text-right")}
            />
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <Label className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
              <Star className="w-4 h-4 text-emerald-500" />
              {isRTL ? 'نقاط القوة' : 'Points forts'}
            </Label>
            <Textarea
              value={strengths}
              onChange={e => setStrengths(e.target.value)}
              placeholder={isRTL ? 'نقطة واحدة في كل سطر...' : 'Un point par ligne...'}
              rows={2}
              className={cn(isRTL && "text-right")}
            />
          </div>

          {/* Areas to improve */}
          <div className="space-y-2">
            <Label className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
              <Target className="w-4 h-4 text-amber-500" />
              {isRTL ? 'نقاط التحسين' : 'À améliorer'}
            </Label>
            <Textarea
              value={areasToImprove}
              onChange={e => setAreasToImprove(e.target.value)}
              placeholder={isRTL ? 'نقطة واحدة في كل سطر...' : 'Un point par ligne...'}
              rows={2}
              className={cn(isRTL && "text-right")}
            />
          </div>
        </div>

        <DialogFooter className={cn(isRTL && "flex-row-reverse")}>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {isRTL ? 'إلغاء' : 'Annuler'}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            <Send className="w-4 h-4" />
            {isSubmitting 
              ? (isRTL ? 'جارٍ الإرسال...' : 'Envoi...') 
              : (isRTL ? 'إرسال التقييم' : 'Envoyer l\'évaluation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Change Level Dialog Component
// ============================================
function ChangeLevelDialog({
  student,
  isRTL,
  onSuccess,
}: {
  student: StudentData;
  isRTL: boolean;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newLevel, setNewLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newLevel) {
      toast.error(isRTL ? 'يرجى اختيار المستوى الجديد' : 'Veuillez sélectionner le nouveau niveau');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await EvaluationService.updateStudentLevel({
        studentId: student.id,
        newLevel,
      });
      if (response.success) {
        toast.success(
          isRTL 
            ? `تم تحديث مستوى ${student.name} إلى ${newLevel}` 
            : `Niveau de ${student.name} mis à jour vers ${newLevel}`
        );
        setOpen(false);
        setNewLevel('');
        onSuccess();
      } else {
        toast.error(response.error || (isRTL ? 'خطأ' : 'Erreur'));
      }
    } catch {
      toast.error(isRTL ? 'خطأ غير متوقع' : 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5" />
          {isRTL ? 'مستوى' : 'Niveau'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={cn(isRTL && "text-right")}>
            {isRTL ? 'تغيير المستوى' : 'Changer le niveau'}
          </DialogTitle>
          <DialogDescription className={cn(isRTL && "text-right")}>
            {isRTL 
              ? `المستوى الحالي لـ ${student.name}: ${student.level}` 
              : `Niveau actuel de ${student.name} : ${student.level}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="grid grid-cols-6 gap-2">
            {LEVELS.map(level => (
              <button
                key={level}
                onClick={() => setNewLevel(level)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200",
                  newLevel === level 
                    ? "border-primary shadow-lg scale-105" 
                    : "border-transparent hover:border-muted-foreground/20",
                  getLevelColor(level)
                )}
              >
                <span className="text-lg font-bold">{level}</span>
                {level === student.level && (
                  <span className="text-[10px] mt-0.5 opacity-70">{isRTL ? 'حالي' : 'actuel'}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className={cn(isRTL && "flex-row-reverse")}>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {isRTL ? 'إلغاء' : 'Annuler'}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !newLevel}>
            {isSubmitting ? (isRTL ? 'جارٍ التحديث...' : 'Mise à jour...') : (isRTL ? 'تأكيد' : 'Confirmer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Evaluation History Card
// ============================================
function EvaluationCard({ evaluation, isRTL, dateLocale }: { evaluation: EvaluationData; isRTL: boolean; dateLocale: typeof fr }) {
  const [expanded, setExpanded] = useState(false);
  const langInfo = LANGUAGES.find(l => l.value === evaluation.language);

  return (
    <motion.div variants={item}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className={cn("flex items-center justify-between gap-3", isRTL && "flex-row-reverse")}>
            {/* Student info */}
            <div className={cn("flex items-center gap-3 flex-1 min-w-0", isRTL && "flex-row-reverse")}>
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={evaluation.studentAvatar || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-accent/80 text-white text-sm">
                  {evaluation.studentName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className={cn("min-w-0", isRTL && "text-right")}>
                <p className="font-semibold text-sm truncate">{evaluation.studentName}</p>
                <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                  <span>{langInfo?.icon} {isRTL ? langInfo?.labelAr : langInfo?.label}</span>
                  <span>•</span>
                  <span>{format(new Date(evaluation.createdAt), 'dd MMM yyyy', { locale: dateLocale })}</span>
                </div>
              </div>
            </div>

            {/* Score and level change */}
            <div className={cn("flex items-center gap-2 shrink-0", isRTL && "flex-row-reverse")}>
              {evaluation.assignedLevel && (
                <Badge className={cn("text-xs", getLevelColor(evaluation.assignedLevel))}>
                  {evaluation.assignedLevel}
                </Badge>
              )}
              <div className={cn("px-2.5 py-1 rounded-full text-sm font-bold bg-gradient-to-r text-white", getScoreGradient(evaluation.overallScore))}>
                {evaluation.overallScore}%
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    { label: isRTL ? 'النطق' : 'Pronon.', value: evaluation.pronunciation },
                    { label: isRTL ? 'القواعد' : 'Gramm.', value: evaluation.grammar },
                    { label: isRTL ? 'المفردات' : 'Vocab.', value: evaluation.vocabulary },
                    { label: isRTL ? 'الطلاقة' : 'Fluid.', value: evaluation.fluency },
                  ].map(skill => (
                    <div key={skill.label} className="text-center p-2 rounded-lg bg-muted/50">
                      <div className={cn("text-lg font-bold", getScoreColor(skill.value))}>{skill.value}%</div>
                      <div className="text-xs text-muted-foreground">{skill.label}</div>
                    </div>
                  ))}
                </div>

                {evaluation.feedback && (
                  <div className={cn("p-3 rounded-lg bg-muted/30 mb-2", isRTL && "text-right")}>
                    <p className="text-sm text-foreground/80">{evaluation.feedback}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-2">
                  {evaluation.strengths?.length > 0 && (
                    <div className={cn("space-y-1", isRTL && "text-right")}>
                      <p className={cn("text-xs font-semibold text-emerald-600 flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <Star className="w-3 h-3" /> {isRTL ? 'نقاط القوة' : 'Points forts'}
                      </p>
                      {evaluation.strengths.map((s, i) => (
                        <p key={i} className="text-xs text-foreground/70">• {s}</p>
                      ))}
                    </div>
                  )}
                  {evaluation.areasToImprove?.length > 0 && (
                    <div className={cn("space-y-1", isRTL && "text-right")}>
                      <p className={cn("text-xs font-semibold text-amber-600 flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <Target className="w-3 h-3" /> {isRTL ? 'للتحسين' : 'À améliorer'}
                      </p>
                      {evaluation.areasToImprove.map((a, i) => (
                        <p key={i} className="text-xs text-foreground/70">• {a}</p>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// Main Page
// ============================================
export default function ProfessorEvaluations() {
  const { user } = useAuth();
  const { language: uiLang } = useLanguage();
  const isRTL = uiLang === 'ar';
  const dateLocale = uiLang === 'ar' ? ar : fr;

  const [students, setStudents] = useState<StudentData[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [activeTab, setActiveTab] = useState<'students' | 'history'>('students');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, evalsRes] = await Promise.all([
        EvaluationService.getAllStudents(),
        EvaluationService.getMyCreatedEvaluations(),
      ]);

      if (studentsRes.success && Array.isArray(studentsRes.data)) {
        setStudents(studentsRes.data);
      }
      if (evalsRes.success && Array.isArray(evalsRes.data)) {
        setEvaluations(evalsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats
  const totalEvaluations = evaluations.length;
  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length)
    : 0;
  const uniqueStudentsEvaluated = new Set(evaluations.map(e => e.studentId)).size;

  // Filtered students
  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered evaluations
  const filteredEvaluations = evaluations.filter(e => {
    if (filterLanguage !== 'all' && e.language !== filterLanguage) return false;
    if (searchQuery && !e.studentName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">{isRTL ? 'جارٍ التحميل...' : 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
          <div className={cn(isRTL && "text-right")}>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {isRTL ? 'تقييم الطلاب' : 'Évaluation des étudiants'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'قيّم مهارات طلابك وتابع تقدمهم' : 'Évaluez les compétences de vos étudiants et suivez leur progression'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20"><Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
            <div>
              <p className="text-2xl font-bold">{uniqueStudentsEvaluated}</p>
              <p className="text-xs text-muted-foreground">{isRTL ? 'طلاب تم تقييمهم' : 'Étudiants évalués'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-200/50 dark:border-violet-800/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/20"><FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
            <div>
              <p className="text-2xl font-bold">{totalEvaluations}</p>
              <p className="text-xs text-muted-foreground">{isRTL ? 'تقييمات' : 'Évaluations'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-200/50 dark:border-emerald-800/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20"><Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div>
              <p className="text-2xl font-bold">{avgScore}%</p>
              <p className="text-xs text-muted-foreground">{isRTL ? 'متوسط النتيجة' : 'Score moyen'}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Switcher + Search */}
      <motion.div variants={item}>
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-3", isRTL && "sm:flex-row-reverse")}>
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('students')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'students' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                <GraduationCap className="w-4 h-4" />
                {isRTL ? 'الطلاب' : 'Étudiants'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'history' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                <Calendar className="w-4 h-4" />
                {isRTL ? 'السجل' : 'Historique'}
              </span>
            </button>
          </div>

          <div className={cn("flex items-center gap-2 flex-1", isRTL && "flex-row-reverse")}>
            <div className="relative flex-1 max-w-sm">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'بحث...' : 'Rechercher...'}
                className={cn("h-9", isRTL ? "pr-9" : "pl-9")}
              />
            </div>

            {activeTab === 'history' && (
              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger className="w-[140px] h-9">
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'كل اللغات' : 'Toutes'}</SelectItem>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.icon} {isRTL ? lang.labelAr : lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </motion.div>

      {/* ========== Students Tab ========== */}
      {activeTab === 'students' && (
        <div className="grid gap-3">
          {filteredStudents.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">{isRTL ? 'لا يوجد طلاب' : 'Aucun étudiant trouvé'}</h3>
                <p className="text-sm text-muted-foreground">{isRTL ? 'لم يتم العثور على طلاب' : 'Aucun résultat pour votre recherche'}</p>
              </CardContent>
            </Card>
          )}
          {filteredStudents.map(student => (
            <motion.div key={student.id} variants={item}>
              <Card className="hover:shadow-md transition-all hover:border-primary/30">
                <CardContent className="p-4">
                  <div className={cn("flex items-center justify-between gap-4", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center gap-3 flex-1 min-w-0", isRTL && "flex-row-reverse")}>
                      <Avatar className="w-11 h-11 shrink-0 ring-2 ring-primary/10">
                        <AvatarImage src={student.avatar || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                          {student.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn("min-w-0", isRTL && "text-right")}>
                        <p className="font-semibold truncate">{student.name}</p>
                        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                          <Badge className={cn("text-xs", getLevelColor(student.level))}>{student.level}</Badge>
                          <span>@{student.nickname}</span>
                          {student.totalSessions > 0 && (
                            <>
                              <span>•</span>
                              <span>{student.totalSessions} {isRTL ? 'جلسة' : 'sessions'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={cn("flex items-center gap-2 shrink-0", isRTL && "flex-row-reverse")}>
                      <ChangeLevelDialog student={student} isRTL={isRTL} onSuccess={loadData} />
                      <EvaluateStudentDialog student={student} isRTL={isRTL} onSuccess={loadData} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ========== History Tab ========== */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {filteredEvaluations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">{isRTL ? 'لا توجد تقييمات' : 'Aucune évaluation'}</h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'ابدأ بتقييم طلابك' : 'Commencez par évaluer vos étudiants'}
                </p>
              </CardContent>
            </Card>
          )}
          {filteredEvaluations.map(evaluation => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} isRTL={isRTL} dateLocale={dateLocale} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
