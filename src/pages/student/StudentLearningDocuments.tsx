import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Download, FileCheck2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLevelLabel } from '@/lib/levelLabels';
import { LearningDocumentCategory, LearningDocumentCommentModel, LearningDocumentModel, LearningDocumentSubject } from '@/models';
import { LearningDocumentService } from '@/services/LearningDocumentService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SubjectTiles } from '@/components/learning-documents/SubjectTiles';
import { getLearningDocumentSubjectInfo } from '@/data/learningDocumentSubjects';

const CATEGORY_LABEL: Record<LearningDocumentCategory, { fr: string; ar: string }> = {
  COURSE: { fr: 'Cours', ar: 'الدروس' },
  HOMEWORK: { fr: 'Devoirs', ar: 'الواجبات' },
  EXERCISE: { fr: 'Exercices', ar: 'التمارين' },
};

export default function StudentLearningDocuments() {
  const { isRTL } = useLanguage();
  const [documents, setDocuments] = useState<LearningDocumentModel[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<LearningDocumentSubject | null>(null);
  const [commentsByDocument, setCommentsByDocument] = useState<Record<string, LearningDocumentCommentModel[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [unseenByDocument, setUnseenByDocument] = useState<Record<string, boolean>>({});
  const [visibleCommentsByDocument, setVisibleCommentsByDocument] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const COMMENTS_PAGE_SIZE = 5;
  const COMMENTS_SEEN_STORAGE_KEY = 'learning_documents_comments_seen_at';

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      const res = await LearningDocumentService.getStudentDocuments();
      if (res.success && res.data) {
        const docs = res.data;
        setDocuments(docs);

        const seenMap = getSeenCommentsMap();
        const unseenMap: Record<string, boolean> = {};
        const commentsMap: Record<string, LearningDocumentCommentModel[]> = {};

        const responses = await Promise.all(
          docs.map(async (doc) => {
            const commentsRes = await LearningDocumentService.getComments(doc.id);
            return { docId: doc.id, res: commentsRes };
          })
        );

        responses.forEach(({ docId, res: commentsRes }) => {
          if (commentsRes.success && commentsRes.data) {
            commentsMap[docId] = commentsRes.data;
            const latestCommentAt = commentsRes.data[0]?.createdAt;
            const seenAt = seenMap[docId];
            if (latestCommentAt && (!seenAt || new Date(latestCommentAt) > new Date(seenAt))) {
              unseenMap[docId] = true;
            }
          }
        });

        setCommentsByDocument(commentsMap);
        setUnseenByDocument(unseenMap);
      } else {
        toast.error(res.error || (isRTL ? 'تعذر تحميل الموارد' : 'Impossible de charger les ressources'));
      }
      setLoading(false);
    };

    loadDocuments();
  }, [isRTL]);

  const selectedSubjectDocuments = useMemo(
    () => documents.filter((doc) => !selectedSubject || (doc.subject || 'OTHER') === selectedSubject),
    [documents, selectedSubject]
  );

  const groupedByCategory = useMemo(() => {
    return selectedSubjectDocuments.reduce<Record<LearningDocumentCategory, LearningDocumentModel[]>>(
      (acc, doc) => {
        acc[doc.category].push(doc);
        return acc;
      },
      { COURSE: [], HOMEWORK: [], EXERCISE: [] }
    );
  }, [selectedSubjectDocuments]);

  const subjectCounts = useMemo(
    () =>
      documents.reduce<Partial<Record<LearningDocumentSubject, number>>>((acc, doc) => {
        const subject = (doc.subject || 'OTHER') as LearningDocumentSubject;
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {}),
    [documents]
  );

  const activeSubjectInfo = selectedSubject ? getLearningDocumentSubjectInfo(selectedSubject) : null;

  const sortByLevel = (docs: LearningDocumentModel[]) =>
    [...docs].sort((a, b) => {
      if (a.level === b.level) return (b.createdAt || '').localeCompare(a.createdAt || '');
      return a.level.localeCompare(b.level);
    });

  const getSeenCommentsMap = (): Record<string, string> => {
    try {
      const raw = localStorage.getItem(COMMENTS_SEEN_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, string>;
      return parsed || {};
    } catch {
      return {};
    }
  };

  const markCommentsAsSeen = (documentId: string, latestCommentAt?: string) => {
    if (!latestCommentAt) return;

    const map = getSeenCommentsMap();
    map[documentId] = latestCommentAt;
    localStorage.setItem(COMMENTS_SEEN_STORAGE_KEY, JSON.stringify(map));
    setUnseenByDocument((prev) => ({ ...prev, [documentId]: false }));
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
      markCommentsAsSeen(documentId, res.data[0]?.createdAt);
    } else {
      toast.error(res.error || (isRTL ? 'فشل تحميل التعليقات' : 'Echec chargement commentaires'));
    }

    setLoadingComments((prev) => ({ ...prev, [documentId]: false }));
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
    } catch {
      toast.error(isRTL ? 'فشل التنزيل' : 'Échec du téléchargement');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className={cn('space-y-1', isRTL && 'text-right')}>
        <h1 className="text-3xl font-bold">{isRTL ? 'مكتبة الطالب' : 'Bibliotheque etudiante'}</h1>
        <p className="text-muted-foreground">
          {isRTL
            ? 'كل الوثائق المعروضة تخص مستواك ومن نفس المؤسسة: دروس، واجبات، تمارين، وتصحيحات.'
            : 'Toutes les ressources de votre niveau et de votre etablissement: cours, devoirs, exercices et corrections.'}
        </p>
      </div>

      <SubjectTiles
        activeSubject={selectedSubject}
        counts={subjectCounts}
        onSelect={setSelectedSubject}
        onClear={() => setSelectedSubject(null)}
        title={isRTL ? 'اختر المادة' : 'Choisissez une matière'}
        description={isRTL ? 'اضغط على مادة لعرض مواردها فقط.' : 'Cliquez sur une matière pour afficher uniquement ses ressources.'}
      />

      {!selectedSubject ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{isRTL ? 'اختر مادة من الأعلى لعرض الموارد.' : 'Sélectionnez une matière ci-dessus pour afficher les ressources.'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
              <BookOpen className="w-5 h-5" />
              {activeSubjectInfo?.nameFr}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Chargement...'}</p>
            ) : selectedSubjectDocuments.length === 0 ? (
              <p className="text-muted-foreground">{isRTL ? 'لا توجد موارد متاحة في هذه المادة' : 'Aucune ressource disponible dans cette matière'}</p>
            ) : (
              <Tabs defaultValue="COURSE" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="COURSE">{isRTL ? CATEGORY_LABEL.COURSE.ar : CATEGORY_LABEL.COURSE.fr}</TabsTrigger>
                  <TabsTrigger value="HOMEWORK">{isRTL ? CATEGORY_LABEL.HOMEWORK.ar : CATEGORY_LABEL.HOMEWORK.fr}</TabsTrigger>
                  <TabsTrigger value="EXERCISE">{isRTL ? CATEGORY_LABEL.EXERCISE.ar : CATEGORY_LABEL.EXERCISE.fr}</TabsTrigger>
                </TabsList>

                {(['COURSE', 'HOMEWORK', 'EXERCISE'] as LearningDocumentCategory[]).map((category) => (
                  <TabsContent key={category} value={category} className="space-y-3">
                    {sortByLevel(groupedByCategory[category]).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'لا توجد عناصر في هذا القسم' : 'Aucun element dans cette categorie'}
                      </p>
                    ) : (
                      sortByLevel(groupedByCategory[category]).map((doc) => (
                        <div key={doc.id} className={cn('border rounded-lg p-4 space-y-3', isRTL && 'text-right')}>
                          <div className={cn('flex items-start justify-between gap-3', isRTL && 'flex-row-reverse')}>
                            <div>
                              <p className="font-semibold">{doc.title}</p>
                              <p className="text-sm text-muted-foreground">{getLevelLabel(doc.level)}</p>
                            </div>
                            <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                              {unseenByDocument[doc.id] && (
                                <Badge variant="destructive">{isRTL ? 'تعليق جديد' : 'Nouveau commentaire'}</Badge>
                              )}
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </div>

                          {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}

                          {doc.category !== 'COURSE' && !doc.correctionFileUrl && doc.correctionAvailableAt && (
                            <p className="text-xs text-muted-foreground">
                              {isRTL ? 'التصحيح سيكون متاحا يوم: ' : 'Correction disponible le: '}
                              {new Date(doc.correctionAvailableAt).toLocaleString(isRTL ? 'ar-TN' : 'fr-FR')}
                            </p>
                          )}

                          <div className={cn('flex items-center gap-2 flex-wrap', isRTL && 'flex-row-reverse')}>
                            {doc.fileUrl && (
                              <Button size="sm" variant="outline" onClick={() => handleDownload(doc.fileUrl!, doc.fileName || 'document')}>
                                <Download className="w-4 h-4 mr-1" />
                                {isRTL ? 'تنزيل الملف' : 'Télécharger'}
                              </Button>
                            )}

                            {doc.correctionFileUrl && (
                              <Button size="sm" variant="outline" onClick={() => handleDownload(doc.correctionFileUrl!, doc.correctionFileName || 'correction')}>
                                <FileCheck2 className="w-4 h-4 mr-1" />
                                {isRTL ? 'تنزيل التصحيح' : 'Télécharger correction'}
                              </Button>
                            )}

                            <Button size="sm" variant="ghost" onClick={() => loadComments(doc.id)}>
                              {isRTL ? 'عرض التعليقات' : 'Voir commentaires'}
                            </Button>
                          </div>

                          {(commentsByDocument[doc.id] || []).length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                              {(commentsByDocument[doc.id] || [])
                                .slice(0, visibleCommentsByDocument[doc.id] || COMMENTS_PAGE_SIZE)
                                .map((comment) => (
                                  <div key={comment.id} className="rounded-md border p-2 text-sm">
                                    <p className="font-medium">{comment.professorName || (isRTL ? 'الأستاذ' : 'Professeur')}</p>
                                    {!!comment.createdAt && (
                                      <p className="text-xs text-muted-foreground">{formatCommentDate(comment.createdAt)}</p>
                                    )}
                                    <p className="text-muted-foreground">{comment.content}</p>
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
                      ))
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
