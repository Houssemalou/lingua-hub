import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  CheckCircle, XCircle, Edit3, Trash2, Sparkles, AlertTriangle, Check,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  ChallengeSubject, ChallengeDifficulty,
  challengeSubjects, difficultyConfig,
} from '@/data/professorChallenges';
import { AiGeneratedChallenge } from '@/services/GeminiService';
import { CreateChallengeData } from '@/services/ChallengeService';

interface AiChallengeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: AiGeneratedChallenge[];
  onEdit: (index: number, challenge: AiGeneratedChallenge) => void;
  onDelete: (index: number) => void;
  onToggleApproval: (index: number) => void;
  onSubmit: (approvedChallenges: CreateChallengeData[]) => void;
  submitting: boolean;
  approvedIndices: Set<number>;
}

interface EditableChallenge extends AiGeneratedChallenge {
  isEditing: boolean;
}

export function AiChallengeReviewModal({
  isOpen, onClose, challenges, onEdit, onDelete, onToggleApproval, onSubmit, submitting, approvedIndices,
}: AiChallengeReviewModalProps) {
  const { language, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingChallenge, setEditingChallenge] = useState<EditableChallenge | null>(null);
  const [localChallenges, setLocalChallenges] = useState<AiGeneratedChallenge[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalChallenges(challenges);
      setCurrentIndex(0);
      setEditingChallenge(null);
    }
  }, [isOpen]);

  const current = localChallenges[currentIndex];
  const isApproved = approvedIndices.has(currentIndex);

  const labels = {
    fr: {
      title: 'Défis générés par IA',
      subtitle: 'Vérifiez, modifiez et approuvez les défis avant de les soumettre',
      challenge: 'Défi',
      of: 'sur',
      approved: 'Approuvé',
      pending: 'En attente',
      edit: 'Modifier',
      delete: 'Supprimer',
      approve: 'Approuver',
      disapprove: 'Désapprouver',
      submit: 'Soumettre les défis approuvés',
      submitting: 'Soumission en cours...',
      noApproved: 'Aucun défi approuvé',
      save: 'Enregistrer',
      cancel: 'Annuler',
      titleLabel: 'Titre',
      questionLabel: 'Question',
      optionsLabel: 'Options de réponse',
      option: 'Option',
      correctAnswer: 'Bonne réponse',
      difficultyLabel: 'Difficulté',
      pointsLabel: 'Points',
      subjectLabel: 'Matière',
      summary: 'Résumé',
      approvedCount: 'approuvés',
      rejectedCount: 'rejetés',
      totalCount: 'total',
      confirmDelete: 'Supprimer ce défi ?',
      confirmDeleteDesc: 'Cette action est irréversible.',
      deletionWarning: 'Certains défis ont été supprimés car invalides',
    },
    ar: {
      title: 'التحديات المولدة بالذكاء الاصطناعي',
      subtitle: 'تحقق من التحديات وعدلها ووافق عليها قبل إرسالها',
      challenge: 'تحدي',
      of: 'من',
      approved: 'موافق عليه',
      pending: 'قيد الانتظار',
      edit: 'تعديل',
      delete: 'حذف',
      approve: 'موافقة',
      disapprove: 'رفض',
      submit: 'إرسال التحديات المعتمدة',
      submitting: 'جاري الإرسال...',
      noApproved: 'لا توجد تحديات معتمدة',
      save: 'حفظ',
      cancel: 'إلغاء',
      titleLabel: 'العنوان',
      questionLabel: 'السؤال',
      optionsLabel: 'خيارات الإجابة',
      option: 'خيار',
      correctAnswer: 'الإجابة الصحيحة',
      difficultyLabel: 'الصعوبة',
      pointsLabel: 'النقاط',
      subjectLabel: 'المادة',
      summary: 'الملخص',
      approvedCount: 'معتمد',
      rejectedCount: 'مرفوض',
      totalCount: 'المجموع',
      confirmDelete: 'حذف هذا التحدي؟',
      confirmDeleteDesc: 'هذا الإجراء لا يمكن التراجع عنه.',
      deletionWarning: 'تم حذف بعض التحديات لأنها غير صالحة',
    },
  };

  const t = labels[language as keyof typeof labels] || labels.fr;

  const handleSaveEdit = () => {
    if (!editingChallenge) return;
    const updated = [...localChallenges];
    const { isEditing, ...challenge } = editingChallenge;
    updated[currentIndex] = challenge;
    setLocalChallenges(updated);
    onEdit(currentIndex, challenge);
    setEditingChallenge(null);
  };

  const handleDelete = () => {
    const updated = localChallenges.filter((_, i) => i !== currentIndex);
    setLocalChallenges(updated);
    onDelete(currentIndex);
    if (currentIndex >= updated.length && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const getSubjectName = (subject: ChallengeSubject) => {
    const s = challengeSubjects.find(cs => cs.id === subject);
    if (!s) return subject;
    return language === 'fr' ? s.nameFr : language === 'ar' ? s.nameAr : s.name;
  };

  const getDifficultyName = (difficulty: ChallengeDifficulty) => {
    const d = difficultyConfig.find(dc => dc.id === difficulty);
    if (!d) return difficulty;
    return language === 'fr' ? d.nameFr : language === 'ar' ? d.nameAr : d.name;
  };

  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    const d = difficultyConfig.find(dc => dc.id === difficulty);
    return d?.color || 'hsl(0, 0%, 60%)';
  };

  const handleSubmit = () => {
    const approvedChallenges = localChallenges
      .filter((_, i) => approvedIndices.has(i))
      .map(c => ({
        subject: c.subject,
        difficulty: c.difficulty,
        title: c.title,
        question: c.question,
        options: c.options,
        correctAnswer: c.correctAnswer,
        basePoints: c.basePoints,
        targetLevel: c.targetLevel,
        expiresIn: c.expiresIn,
        imageUrl: undefined,
      }));

    onSubmit(approvedChallenges);
  };

  if (!current) return null;

  const approvedCount = localChallenges.filter((_, i) => approvedIndices.has(i)).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn('flex items-center gap-2 text-xl', isRTL && 'flex-row-reverse')}>
            <Sparkles className="w-5 h-5 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription className={cn(isRTL && 'text-right')}>
            {t.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className={cn('flex items-center justify-between mb-2', isRTL && 'flex-row-reverse')}>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="default">{approvedCount} {t.approvedCount}</Badge>
            <Badge variant="secondary">{localChallenges.length - approvedCount} {t.rejectedCount}</Badge>
            <Badge variant="outline">{localChallenges.length} {t.totalCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => { setCurrentIndex(currentIndex - 1); setEditingChallenge(null); }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {t.challenge} {currentIndex + 1} {t.of} {localChallenges.length}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentIndex === localChallenges.length - 1}
              onClick={() => { setCurrentIndex(currentIndex + 1); setEditingChallenge(null); }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {editingChallenge ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 border rounded-lg p-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.subjectLabel}</Label>
                  <Select
                    value={editingChallenge.subject}
                    onValueChange={(v) => setEditingChallenge({ ...editingChallenge, subject: v as ChallengeSubject })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {challengeSubjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nameFr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t.difficultyLabel}</Label>
                  <Select
                    value={editingChallenge.difficulty}
                    onValueChange={(v) => setEditingChallenge({ ...editingChallenge, difficulty: v as ChallengeDifficulty })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyConfig.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.nameFr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.titleLabel}</Label>
                <Input
                  value={editingChallenge.title}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                  className={cn(isRTL && 'text-right')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.questionLabel}</Label>
                <Textarea
                  value={editingChallenge.question}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, question: e.target.value })}
                  rows={3}
                  className={cn(isRTL && 'text-right')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.pointsLabel}</Label>
                <Input
                  type="number"
                  min={10}
                  max={200}
                  value={editingChallenge.basePoints}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, basePoints: parseInt(e.target.value) || 50 })}
                />
              </div>

              <div className="space-y-3">
                <Label>{t.optionsLabel}</Label>
                {editingChallenge.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={editingChallenge.correctAnswer === oi ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0 shrink-0"
                      onClick={() => setEditingChallenge({ ...editingChallenge, correctAnswer: oi })}
                    >
                      {editingChallenge.correctAnswer === oi ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + oi)}
                    </Button>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...editingChallenge.options];
                        newOpts[oi] = e.target.value;
                        setEditingChallenge({ ...editingChallenge, options: newOpts });
                      }}
                      placeholder={`${t.option} ${oi + 1}`}
                    />
                  </div>
                ))}
                <p className={cn('text-xs text-muted-foreground', isRTL && 'text-right')}>
                  {t.correctAnswer}: {String.fromCharCode(65 + editingChallenge.correctAnswer)}
                </p>
              </div>

              <div className={cn('flex justify-end gap-2', isRTL && 'flex-row-reverse')}>
                <Button variant="outline" onClick={() => setEditingChallenge(null)}>{t.cancel}</Button>
                <Button onClick={handleSaveEdit}>{t.save}</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="p-4 space-y-3">
                <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: getDifficultyColor(current.difficulty) }}>
                      {getDifficultyName(current.difficulty)}
                    </Badge>
                    <Badge variant="outline">{getSubjectName(current.subject)}</Badge>
                    <Badge variant="secondary">{current.basePoints} pts</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn('text-sm font-medium', isApproved ? 'text-green-600' : 'text-muted-foreground')}>
                      {isApproved ? t.approved : t.pending}
                    </span>
                    <Switch
                      checked={isApproved}
                      onCheckedChange={() => onToggleApproval(currentIndex)}
                    />
                  </div>
                </div>

                <div className={cn(isRTL && 'text-right')}>
                  <h3 className="font-semibold text-lg">{current.title}</h3>
                  <p className="text-muted-foreground mt-1">{current.question}</p>
                </div>

                <div className="space-y-2">
                  {current.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border',
                        current.correctAnswer === oi ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border',
                        isRTL && 'flex-row-reverse',
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                        current.correctAnswer === oi ? 'bg-green-500 text-white' : 'bg-muted',
                      )}>
                        {current.correctAnswer === oi ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + oi)}
                      </div>
                      <span className={cn(isRTL && 'text-right')}>{opt}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditingChallenge({ ...current, isEditing: true });
                }}>
                  <Edit3 className="w-4 h-4 mr-1" /> {t.edit}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-1" /> {t.delete}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className={cn('border-t pt-4 gap-2', isRTL && 'flex-row-reverse')}>
          <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
          <Button
            onClick={handleSubmit}
            disabled={approvedCount === 0 || submitting}
          >
            {submitting ? (
              <>{t.submitting} <span className="animate-spin ml-2">...</span></>
            ) : (
              <>{t.submit} ({approvedCount})</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AiChallengeReviewModal;
