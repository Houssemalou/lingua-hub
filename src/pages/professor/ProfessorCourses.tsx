import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, BookOpen, Trash2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLevelLabel } from '@/lib/levelLabels';
import { CourseModel, LanguageLevel } from '@/models';
import { CourseService } from '@/services/CourseService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LEVELS: LanguageLevel[] = [
  'YEAR1', 'YEAR2', 'YEAR3', 'YEAR4', 'YEAR5', 'YEAR6', 'YEAR7', 'YEAR8', 'YEAR9', 'YEAR10',
  'YEAR11', 'YEAR12', 'YEAR13', 'PREPA1', 'PREPA2', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
];

export default function ProfessorCourses() {
  const { isRTL, language } = useLanguage();
  const levelLocale = language === 'ar' ? 'ar' : 'fr';
  const [courses, setCourses] = useState<CourseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [level, setLevel] = useState<LanguageLevel>('YEAR1');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [courses]
  );

  const loadCourses = useCallback(async () => {
    setLoading(true);
    const res = await CourseService.getMyCourses();
    if (res.success && res.data) {
      setCourses(res.data);
    } else {
      toast.error(res.error || (isRTL ? 'فشل في تحميل الدروس' : 'Échec du chargement des cours'));
    }
    setLoading(false);
  }, [isRTL]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || files.length === 0) {
      toast.error(isRTL ? 'الاسم والملفات مطلوبة' : 'Le nom et les fichiers sont obligatoires');
      return;
    }

    if (files.length > 3) {
      toast.error(isRTL ? 'الحد الأقصى 3 ملفات لكل درس' : 'Maximum 3 fichiers par cours');
      return;
    }

    setSubmitting(true);
    const res = await CourseService.createCourse({
      name: name.trim(),
      level,
      description: description.trim() || undefined,
      files,
    });

    if (res.success && res.data) {
      toast.success(isRTL ? 'تم رفع الدرس بنجاح' : 'Cours uploadé avec succès');
      setName('');
      setLevel('YEAR1');
      setDescription('');
      setFiles([]);
      setCourses(prev => [res.data as CourseModel, ...prev]);
    } else {
      toast.error(res.error || (isRTL ? 'فشل في رفع الدرس' : 'Échec de l\'upload du cours'));
    }
    setSubmitting(false);
  };

  const handleDelete = async (courseId: string) => {
    const res = await CourseService.deleteCourse(courseId);
    if (res.success) {
      toast.success(isRTL ? 'تم حذف الدرس' : 'Cours supprimé');
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } else {
      toast.error(res.error || (isRTL ? 'فشل في حذف الدرس' : 'Échec de suppression du cours'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className={cn('space-y-1', isRTL && 'text-right')}>
        <h1 className="text-3xl font-bold">{isRTL ? 'إدارة الدروس' : 'Gestion des cours'}</h1>
        <p className="text-muted-foreground">
          {isRTL ? 'ارفع الدروس وحدد المستوى المناسب للطلبة' : 'Uploadez vos cours et assignez un niveau adapté aux élèves'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <Upload className="w-5 h-5" />
            {isRTL ? 'رفع درس جديد' : 'Uploader un nouveau cours'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{isRTL ? 'اسم الدرس' : 'Nom du cours'}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'المستوى' : 'Niveau'}</Label>
              <Select value={level} onValueChange={(value) => setLevel(value as LanguageLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'اختر المستوى' : 'Choisir le niveau'} />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map(lvl => (
                    <SelectItem key={lvl} value={lvl}>{getLevelLabel(lvl, levelLocale)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'الملفات (حد أقصى 3)' : 'Fichiers (max 3)'}</Label>
              <Input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []).slice(0, 3);
                  setFiles(selected);
                }}
              />
              {files.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {files.map((f, idx) => (
                    <p key={`${f.name}-${idx}`}>{f.name}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{isRTL ? 'وصف (اختياري)' : 'Description (optionnelle)'}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className={cn('md:col-span-2', isRTL && 'text-left')}>
              <Button type="submit" disabled={submitting}>
                {submitting ? (isRTL ? 'جاري الرفع...' : 'Upload...') : (isRTL ? 'رفع الدرس' : 'Uploader le cours')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <BookOpen className="w-5 h-5" />
            {isRTL ? 'دروسي' : 'Mes cours'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Chargement...'}</p>
          ) : sortedCourses.length === 0 ? (
            <p className="text-muted-foreground">{isRTL ? 'لا توجد دروس بعد' : 'Aucun cours pour le moment'}</p>
          ) : (
            sortedCourses.map(course => (
              <div key={course.id} className={cn('border rounded-lg p-4 flex items-center justify-between gap-3', isRTL && 'flex-row-reverse')}>
                <div className={cn('space-y-1', isRTL && 'text-right')}>
                  <p className="font-semibold">{course.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getLevelLabel(course.level, levelLocale)} • {(course.fileNames?.length || 1)} {isRTL ? 'ملفات' : 'fichiers'}
                  </p>
                </div>
                <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                  {(course.fileUrls && course.fileUrls.length > 0 ? course.fileUrls : course.fileUrl ? [course.fileUrl] : []).map((url, idx) => (
                    <Button asChild size="sm" variant="outline" key={`${course.id}-download-${idx}`}>
                      <a href={url} target="_blank" rel="noreferrer" title={course.fileNames?.[idx] || course.fileName}>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  ))}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(course.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
