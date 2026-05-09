import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Download, Eye, FilePenLine, FileText, Save, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLevelLabel } from '@/lib/levelLabels';
import {
  CreateLearningDocumentDTO,
  LanguageLevel,
  LearningDocumentCategory,
  LearningDocumentCommentModel,
  LearningDocumentModel,
  LearningDocumentSubject,
  UpdateLearningDocumentDTO,
} from '@/models';
import { LearningDocumentService } from '@/services/LearningDocumentService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SubjectTiles } from '@/components/learning-documents/SubjectTiles';
import { getLearningDocumentSubjectInfo } from '@/data/learningDocumentSubjects';
import { DocumentAccessModal } from '@/components/learning-documents/DocumentAccessModal';

const LEVELS: LanguageLevel[] = [
  'YEAR1', 'YEAR2', 'YEAR3', 'YEAR4', 'YEAR5', 'YEAR6', 'YEAR7', 'YEAR8', 'YEAR9', 'YEAR10',
  'YEAR11', 'YEAR12', 'YEAR13', 'PREPA1', 'PREPA2', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2',
];

const CATEGORY_LABEL: Record<LearningDocumentCategory, { fr: string; ar: string }> = {
  COURSE: { fr: 'Cours', ar: 'الدروس' },
  HOMEWORK: { fr: 'Devoirs', ar: 'الواجبات' },
  EXERCISE: { fr: 'Exercices', ar: 'التمارين' },
};

interface FormState {
  title: string;
  category: LearningDocumentCategory;
  subject: LearningDocumentSubject;
  level: LanguageLevel;
  description: string;
  isPublished: boolean;
  file?: File;
  correctionFile?: File;
  correctionAvailableAt?: string;
}

const defaultFormState: FormState = {
  title: '',
  category: 'COURSE',
  subject: 'ARABIC',
  level: 'YEAR1',
  description: '',
  isPublished: true,
  correctionAvailableAt: '',
};

export default function ProfessorLearningDocuments() {
  const { isRTL } = useLanguage();
  const [documents, setDocuments] = useState<LearningDocumentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<LearningDocumentSubject | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [commentsByDocument, setCommentsByDocument] = useState<Record<string, LearningDocumentCommentModel[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentValue, setEditingCommentValue] = useState('');
  const [visibleCommentsByDocument, setVisibleCommentsByDocument] = useState<Record<string, number>>({});
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const [selectedDocumentForAccess, setSelectedDocumentForAccess] = useState<{ id: string; title: string } | null>(null);

  const COMMENTS_PAGE_SIZE = 5;

  const sortedDocuments = useMemo(
    () => [...documents].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [documents]
  );

  const selectedSubjectDocuments = useMemo(
    () => (selectedSubject ? sortedDocuments.filter((doc) => (doc.subject || 'OTHER') === selectedSubject) : []),
    [selectedSubject, sortedDocuments]
  );

  const subjectCounts = useMemo(
    () =>
      sortedDocuments.reduce<Partial<Record<LearningDocumentSubject, number>>>((acc, doc) => {
        const subject = (doc.subject || 'OTHER') as LearningDocumentSubject;
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {}),
    [sortedDocuments]
  );

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    const res = await LearningDocumentService.getMyDocuments();
    if (res.success && res.data) {
      setDocuments(res.data);
    } else {
      toast.error(res.error || (isRTL ? 'تعذر تحميل الملفات' : 'Impossible de charger les documents'));
    }
    setLoading(false);
  }, [isRTL]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const resetForm = () => {
    setForm(defaultFormState);
    setEditingId(null);
    setSelectedSubject(null);
  };

  const selectSubject = (subject: LearningDocumentSubject) => {
    setSelectedSubject(subject);
    setForm((prev) => ({
      ...prev,
      subject,
    }));
  };

  const startEditing = (doc: LearningDocumentModel) => {
    const nextSubject = (doc.subject || 'ARABIC') as LearningDocumentSubject;
    setSelectedSubject(nextSubject);
    setEditingId(doc.id);
    setForm({
      title: doc.title,
      category: doc.category,
      subject: nextSubject,
      level: doc.level,
      description: doc.description || '',
      isPublished: doc.isPublished,
      correctionAvailableAt: doc.correctionAvailableAt ? doc.correctionAvailableAt.slice(0, 16) : '',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error(isRTL ? 'العنوان مطلوب' : 'Le titre est obligatoire');
      return;
    }

    if (!editingId && !form.file) {
      toast.error(isRTL ? 'الملف الرئيسي مطلوب' : 'Le fichier principal est requis');
      return;
    }

    setSubmitting(true);

    if (editingId) {
      const payload: UpdateLearningDocumentDTO = {
        title: form.title.trim(),
        category: form.category,
        subject: form.subject,
        level: form.level,
        description: form.description.trim() || undefined,
        isPublished: form.isPublished,
        file: form.file,
        correctionAvailableAt: form.category === 'COURSE' || !form.correctionAvailableAt
          ? undefined
          : form.correctionAvailableAt,
        correctionFile: form.category === 'COURSE' ? undefined : form.correctionFile,
      };

      const res = await LearningDocumentService.updateDocument(editingId, payload);
      if (res.success && res.data) {
        toast.success(isRTL ? 'تم تحديث الوثيقة' : 'Document mis a jour');
        setDocuments((prev) => prev.map((doc) => (doc.id === editingId ? res.data! : doc)));
        setForm((prev) => ({ ...defaultFormState, subject: prev.subject }));
        setEditingId(null);
      } else {
        toast.error(res.error || (isRTL ? 'فشل التحديث' : 'Echec de la mise a jour'));
      }
    } else {
      const payload: CreateLearningDocumentDTO = {
        title: form.title.trim(),
        category: form.category,
        subject: form.subject,
        level: form.level,
        description: form.description.trim() || undefined,
        isPublished: form.isPublished,
        file: form.file!,
        correctionAvailableAt: form.category === 'COURSE' || !form.correctionAvailableAt
          ? undefined
          : form.correctionAvailableAt,
        correctionFile: form.category === 'COURSE' ? undefined : form.correctionFile,
      };

      const res = await LearningDocumentService.createDocument(payload);
      if (res.success && res.data) {
        toast.success(isRTL ? 'تم رفع الوثيقة' : 'Document ajoute avec succes');
        setDocuments((prev) => [res.data!, ...prev]);
        setForm((prev) => ({ ...defaultFormState, subject: prev.subject }));
        setEditingId(null);
      } else {
        toast.error(res.error || (isRTL ? 'فشل الرفع' : 'Echec de l upload'));
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const res = await LearningDocumentService.deleteDocument(id);
    if (res.success) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success(isRTL ? 'تم حذف الوثيقة' : 'Document supprime');
      if (editingId === id) {
        resetForm();
      }
    } else {
      toast.error(res.error || (isRTL ? 'فشل الحذف' : 'Echec de suppression'));
    }
  };

  const handleRemoveCorrection = async (doc: LearningDocumentModel) => {
    const res = await LearningDocumentService.updateDocument(doc.id, { removeCorrection: true });
    if (res.success && res.data) {
      setDocuments((prev) => prev.map((item) => (item.id === doc.id ? res.data! : item)));
      toast.success(isRTL ? 'تم حذف التصحيح' : 'Correction supprimee');
    } else {
      toast.error(res.error || (isRTL ? 'فشل حذف التصحيح' : 'Echec suppression correction'));
    }
  };

  const groupedByCategory = useMemo(() => {
    return selectedSubjectDocuments.reduce<Record<LearningDocumentCategory, LearningDocumentModel[]>>(
      (acc, doc) => {
        acc[doc.category].push(doc);
        return acc;
      },
      { COURSE: [], HOMEWORK: [], EXERCISE: [] }
    );
  }, [selectedSubjectDocuments]);

  useEffect(() => {
    if (!selectedSubject) return;
    const timer = window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedSubject]);

  const activeSubjectInfo = selectedSubject ? getLearningDocumentSubjectInfo(selectedSubject) : null;

  const loadComments = async (documentId: string) => {
    if (loadingComments[documentId]) return;

    setLoadingComments((prev) => ({ ...prev, [documentId]: true }));
    const res = await LearningDocumentService.getComments(documentId);
    if (res.success && res.data) {
      setCommentsByDocument((prev) => ({ ...prev, [documentId]: res.data! }));
      setVisibleCommentsByDocument((prev) => ({
        ...prev,
        [documentId]: Math.max(prev[documentId] || COMMENTS_PAGE_SIZE, COMMENTS_PAGE_SIZE),
      }));
    } else {
      toast.error(res.error || (isRTL ? 'فشل تحميل التعليقات' : 'Echec chargement commentaires'));
    }
    setLoadingComments((prev) => ({ ...prev, [documentId]: false }));
  };

  const handleAddComment = async (documentId: string) => {
    const content = (commentInputs[documentId] || '').trim();
    if (!content) {
      toast.error(isRTL ? 'اكتب تعليقاً أولاً' : 'Veuillez saisir un commentaire');
      return;
    }

    const res = await LearningDocumentService.addComment(documentId, content);
    if (res.success && res.data) {
      setCommentsByDocument((prev) => ({
        ...prev,
        [documentId]: [res.data!, ...(prev[documentId] || [])],
      }));
      setCommentInputs((prev) => ({ ...prev, [documentId]: '' }));
      toast.success(isRTL ? 'تمت إضافة التعليق' : 'Commentaire ajoute');
    } else {
      toast.error(res.error || (isRTL ? 'فشل إضافة التعليق' : 'Echec ajout commentaire'));
    }
  };

  const handleStartEditComment = (comment: LearningDocumentCommentModel) => {
    setEditingCommentId(comment.id);
    setEditingCommentValue(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentValue('');
  };

  const handleUpdateComment = async (documentId: string, commentId: string) => {
    const content = editingCommentValue.trim();
    if (!content) {
      toast.error(isRTL ? 'المحتوى مطلوب' : 'Le contenu est obligatoire');
      return;
    }

    const res = await LearningDocumentService.updateComment(documentId, commentId, content);
    if (res.success && res.data) {
      setCommentsByDocument((prev) => ({
        ...prev,
        [documentId]: (prev[documentId] || []).map((item) => (item.id === commentId ? res.data! : item)),
      }));
      toast.success(isRTL ? 'تم تحديث التعليق' : 'Commentaire mis a jour');
      handleCancelEditComment();
    } else {
      toast.error(res.error || (isRTL ? 'فشل تحديث التعليق' : 'Echec mise a jour commentaire'));
    }
  };

  const handleDeleteComment = async (documentId: string, commentId: string) => {
    const res = await LearningDocumentService.deleteComment(documentId, commentId);
    if (res.success) {
      setCommentsByDocument((prev) => ({
        ...prev,
        [documentId]: (prev[documentId] || []).filter((item) => item.id !== commentId),
      }));
      toast.success(isRTL ? 'تم حذف التعليق' : 'Commentaire supprime');
      if (editingCommentId === commentId) {
        handleCancelEditComment();
      }
    } else {
      toast.error(res.error || (isRTL ? 'فشل حذف التعليق' : 'Echec suppression commentaire'));
    }
  };

  const formatCommentDate = (value?: string) => {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat(isRTL ? 'ar-TN' : 'fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const showMoreComments = (documentId: string, total: number) => {
    setVisibleCommentsByDocument((prev) => ({
      ...prev,
      [documentId]: Math.min((prev[documentId] || COMMENTS_PAGE_SIZE) + COMMENTS_PAGE_SIZE, total),
    }));
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error(isRTL ? 'فشل التنزيل' : 'Échec du téléchargement');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className={cn('space-y-1', isRTL && 'text-right')}>
        <h1 className="text-3xl font-bold">{isRTL ? 'مكتبة الأستاذ' : 'Bibliotheque du professeur'}</h1>
        <p className="text-muted-foreground">
          {isRTL
            ? 'نظم الدروس والواجبات والتمارين حسب المستوى مع إمكانية إضافة التصحيح.'
            : 'Organisez cours, devoirs et exercices par niveau avec correction en option.'}
        </p>
      </div>

      <SubjectTiles
        activeSubject={selectedSubject}
        counts={subjectCounts}
        onSelect={selectSubject}
        onClear={resetForm}
        title={isRTL ? 'اختر المادة' : 'Choisissez une matière'}
        description={isRTL ? 'انقر على مادة لفتح نموذج الإضافة وعرض الموارد المرتبطة بها.' : 'Cliquez sur une matière pour ouvrir le formulaire et voir les ressources associées.'}
      />

      {selectedSubject && (
        <Card ref={formSectionRef}>
          <CardHeader>
            <CardTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
              {editingId ? <FilePenLine className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
              {editingId
                ? (isRTL ? 'تحديث وثيقة' : 'Mettre a jour un document')
                : (isRTL ? 'إضافة وثيقة جديدة' : 'Ajouter un nouveau document')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'المادة المختارة:' : 'Matière sélectionnée:'} {activeSubjectInfo?.nameFr}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{isRTL ? 'العنوان' : 'Titre'}</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>{isRTL ? 'المادة' : 'Matière'}</Label>
                <Select
                  value={form.subject}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, subject: value as LearningDocumentSubject }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['ARABIC', 'FRENCH', 'ENGLISH', 'MATHEMATICS', 'SCIENCE', 'HISTORY_GEOGRAPHY', 'CIVIC_EDUCATION', 'ISLAMIC_EDUCATION', 'TECHNOLOGY', 'ARTS'] as LearningDocumentSubject[]).map((subject) => {
                      const info = getLearningDocumentSubjectInfo(subject);
                      return (
                        <SelectItem key={subject} value={subject}>
                          {info.icon} {isRTL ? info.nameAr : info.nameFr}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'النوع' : 'Type'}</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => {
                    const nextCategory = value as LearningDocumentCategory;
                    setForm((prev) => ({
                      ...prev,
                      category: nextCategory,
                      correctionFile: nextCategory === 'COURSE' ? undefined : prev.correctionFile,
                      correctionAvailableAt: nextCategory === 'COURSE' ? '' : prev.correctionAvailableAt,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COURSE">{isRTL ? CATEGORY_LABEL.COURSE.ar : CATEGORY_LABEL.COURSE.fr}</SelectItem>
                    <SelectItem value="HOMEWORK">{isRTL ? CATEGORY_LABEL.HOMEWORK.ar : CATEGORY_LABEL.HOMEWORK.fr}</SelectItem>
                    <SelectItem value="EXERCISE">{isRTL ? CATEGORY_LABEL.EXERCISE.ar : CATEGORY_LABEL.EXERCISE.fr}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'المستوى' : 'Niveau'}</Label>
                <Select value={form.level} onValueChange={(value) => setForm((prev) => ({ ...prev, level: value as LanguageLevel }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>{getLevelLabel(lvl)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'الملف الرئيسي' : 'Fichier principal'}</Label>
                <Input
                  type="file"
                  onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] }))}
                />
              </div>

              {form.category !== 'COURSE' && (
                <>
                  <div className="space-y-2">
                    <Label>{isRTL ? 'ملف التصحيح (اختياري)' : 'Fichier correction (optionnel)'}</Label>
                    <Input
                      type="file"
                      onChange={(e) => setForm((prev) => ({ ...prev, correctionFile: e.target.files?.[0] }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'إتاحة التصحيح للتلاميذ ابتداءً من' : 'Correction disponible pour les eleves a partir du'}</Label>
                    <Input
                      type="datetime-local"
                      value={form.correctionAvailableAt || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, correctionAvailableAt: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className={cn('flex items-center gap-3 md:col-span-2', isRTL && 'flex-row-reverse')}>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
                />
                <span className="text-sm text-muted-foreground">
                  {isRTL ? 'مرئي للتلاميذ' : 'Visible pour les eleves'}
                </span>
              </div>

              <div className={cn('flex items-center gap-2 md:col-span-2', isRTL && 'flex-row-reverse')}>
                <Button type="submit" disabled={submitting}>
                  {editingId
                    ? (submitting ? (isRTL ? 'جاري الحفظ...' : 'Sauvegarde...') : (isRTL ? 'حفظ التعديلات' : 'Sauvegarder'))
                    : (submitting ? (isRTL ? 'جاري الرفع...' : 'Upload...') : (isRTL ? 'رفع الوثيقة' : 'Uploader'))}
                  <Save className="w-4 h-4 ml-2" />
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => resetForm()}>
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <BookOpen className="w-5 h-5" />
            {isRTL ? 'مواردي التعليمية' : 'Mes ressources pedagogiques'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Chargement...'}</p>
          ) : sortedDocuments.length === 0 ? (
            <p className="text-muted-foreground">{isRTL ? 'لا توجد وثائق بعد' : 'Aucun document pour le moment'}</p>
          ) : (
            <Tabs defaultValue="COURSE" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="COURSE">{isRTL ? CATEGORY_LABEL.COURSE.ar : CATEGORY_LABEL.COURSE.fr}</TabsTrigger>
                <TabsTrigger value="HOMEWORK">{isRTL ? CATEGORY_LABEL.HOMEWORK.ar : CATEGORY_LABEL.HOMEWORK.fr}</TabsTrigger>
                <TabsTrigger value="EXERCISE">{isRTL ? CATEGORY_LABEL.EXERCISE.ar : CATEGORY_LABEL.EXERCISE.fr}</TabsTrigger>
              </TabsList>

              {(['COURSE', 'HOMEWORK', 'EXERCISE'] as LearningDocumentCategory[]).map((category) => (
                <TabsContent key={category} value={category} className="space-y-3">
                  {groupedByCategory[category].length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'لا توجد عناصر في هذا القسم' : 'Aucun element dans cette categorie'}
                    </p>
                  ) : (
                    groupedByCategory[category].map((doc) => (
                      <div key={doc.id} className={cn('border rounded-lg p-4 space-y-3', isRTL && 'text-right')}>
                        <div className={cn('flex items-start justify-between gap-3', isRTL && 'flex-row-reverse')}>
                          <div className="space-y-1">
                            <p className="font-semibold">{doc.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {getLevelLabel(doc.level)} • {doc.isPublished ? (isRTL ? 'منشور' : 'Publie') : (isRTL ? 'مخفي' : 'Brouillon')}
                            </p>
                          </div>
                          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                            <Button size="sm" variant="outline" onClick={() => startEditing(doc)}>
                              <FilePenLine className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setSelectedDocumentForAccess({ id: doc.id, title: doc.title })}>
                              <Eye className="w-4 h-4 mr-1" />
                              {isRTL ? 'رؤية التلاميذ' : 'Voir élèves'}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}

                        {doc.category !== 'COURSE' && doc.correctionAvailableAt && (
                          <p className="text-xs text-muted-foreground">
                            {isRTL ? 'التصحيح متاح للتلاميذ ابتداءً من: ' : 'Correction disponible pour les eleves a partir du: '}
                            {new Date(doc.correctionAvailableAt).toLocaleString(isRTL ? 'ar-TN' : 'fr-FR')}
                          </p>
                        )}

                        <div className={cn('flex items-center flex-wrap gap-2', isRTL && 'flex-row-reverse')}>
                          {doc.fileUrl && (
                            <Button size="sm" variant="outline" onClick={() => handleDownload(doc.fileUrl!, doc.fileName || 'document')}>
                              <Download className="w-4 h-4 mr-1" />
                              {isRTL ? 'تنزيل الملف' : 'Télécharger'}
                            </Button>
                          )}

                          {doc.correctionFileUrl && (
                            <Button size="sm" variant="outline" onClick={() => handleDownload(doc.correctionFileUrl!, doc.correctionFileName || 'correction')}>
                              <FileText className="w-4 h-4 mr-1" />
                              {isRTL ? 'تنزيل التصحيح' : 'Télécharger correction'}
                            </Button>
                          )}

                          {doc.correctionFileUrl && (
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveCorrection(doc)}>
                              {isRTL ? 'حذف التصحيح' : 'Supprimer correction'}
                            </Button>
                          )}
                        </div>

                        <div className="pt-2 border-t space-y-2">
                          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                            <Input
                              placeholder={isRTL ? 'اكتب تعليقاً للطلبة...' : 'Ajouter un commentaire pour les eleves...'}
                              value={commentInputs[doc.id] || ''}
                              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                            />
                            <Button size="sm" onClick={() => handleAddComment(doc.id)}>
                              {isRTL ? 'إضافة' : 'Ajouter'}
                            </Button>
                          </div>

                          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                            <Button size="sm" variant="outline" onClick={() => loadComments(doc.id)}>
                              {isRTL ? 'عرض التعليقات' : 'Voir commentaires'}
                            </Button>
                            {loadingComments[doc.id] && (
                              <span className="text-xs text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Chargement...'}</span>
                            )}
                          </div>

                          {(commentsByDocument[doc.id] || []).length > 0 && (
                            <div className="space-y-2">
                              {(commentsByDocument[doc.id] || [])
                                .slice(0, visibleCommentsByDocument[doc.id] || COMMENTS_PAGE_SIZE)
                                .map((comment) => (
                                <div key={comment.id} className="rounded-md border p-2 text-sm">
                                  <p className="font-medium">{comment.professorName || (isRTL ? 'الأستاذ' : 'Professeur')}</p>
                                  {!!comment.createdAt && (
                                    <p className="text-xs text-muted-foreground">{formatCommentDate(comment.createdAt)}</p>
                                  )}
                                  {editingCommentId === comment.id ? (
                                    <div className="space-y-2">
                                      <Input
                                        value={editingCommentValue}
                                        onChange={(e) => setEditingCommentValue(e.target.value)}
                                      />
                                      <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                                        <Button size="sm" onClick={() => handleUpdateComment(doc.id, comment.id)}>
                                          {isRTL ? 'حفظ' : 'Sauvegarder'}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancelEditComment}>
                                          {isRTL ? 'إلغاء' : 'Annuler'}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-muted-foreground">{comment.content}</p>
                                      <div className={cn('flex items-center gap-2 pt-1', isRTL && 'flex-row-reverse')}>
                                        <Button size="sm" variant="outline" onClick={() => handleStartEditComment(comment)}>
                                          {isRTL ? 'تعديل' : 'Modifier'}
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteComment(doc.id, comment.id)}>
                                          {isRTL ? 'حذف' : 'Supprimer'}
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}

                              {(commentsByDocument[doc.id] || []).length > (visibleCommentsByDocument[doc.id] || COMMENTS_PAGE_SIZE) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => showMoreComments(doc.id, (commentsByDocument[doc.id] || []).length)}
                                >
                                  {isRTL ? 'عرض المزيد' : 'Voir plus'}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <DocumentAccessModal
        open={!!selectedDocumentForAccess}
        onClose={() => setSelectedDocumentForAccess(null)}
        documentId={selectedDocumentForAccess?.id || ''}
        documentTitle={selectedDocumentForAccess?.title || ''}
      />
    </motion.div>
  );
}
