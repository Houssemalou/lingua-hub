import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Award, 
  Target, 
  BookOpen, 
  FileText, 
  Lightbulb,
  Star,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VocabularyItem {
  word: string;
  translation: string;
  example: string;
}

interface SessionSummaryFormData {
  overallScore: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  participation: number;
  professorFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  topicsDiscussed: string[];
  newVocabulary: VocabularyItem[];
  grammarPoints: string[];
  recommendations: string[];
  nextSessionFocus: string;
}

interface SessionSummaryEditorProps {
  studentId: string;
  studentName: string;
  sessionId: string;
  roomName: string;
  language: string;
  level: string;
  onSave: (data: SessionSummaryFormData) => void;
  onCancel: () => void;
  isRTL?: boolean;
  initialData?: Partial<SessionSummaryFormData>;
}

const defaultFormData: SessionSummaryFormData = {
  overallScore: 70,
  pronunciation: 70,
  grammar: 70,
  vocabulary: 70,
  fluency: 70,
  participation: 70,
  professorFeedback: '',
  strengths: [''],
  areasToImprove: [''],
  topicsDiscussed: [''],
  newVocabulary: [{ word: '', translation: '', example: '' }],
  grammarPoints: [''],
  recommendations: [''],
  nextSessionFocus: '',
};

export function SessionSummaryEditor({
  studentId,
  studentName,
  sessionId,
  roomName,
  language,
  level,
  onSave,
  onCancel,
  isRTL = false,
  initialData,
}: SessionSummaryEditorProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SessionSummaryFormData>({
    ...defaultFormData,
    ...initialData,
  });

  const handleScoreChange = (field: keyof SessionSummaryFormData, value: number[]) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }));
  };

  const handleArrayAdd = (field: 'strengths' | 'areasToImprove' | 'topicsDiscussed' | 'grammarPoints' | 'recommendations') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const handleArrayRemove = (field: 'strengths' | 'areasToImprove' | 'topicsDiscussed' | 'grammarPoints' | 'recommendations', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleArrayChange = (
    field: 'strengths' | 'areasToImprove' | 'topicsDiscussed' | 'grammarPoints' | 'recommendations',
    index: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleVocabularyAdd = () => {
    setFormData(prev => ({
      ...prev,
      newVocabulary: [...prev.newVocabulary, { word: '', translation: '', example: '' }],
    }));
  };

  const handleVocabularyRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      newVocabulary: prev.newVocabulary.filter((_, i) => i !== index),
    }));
  };

  const handleVocabularyChange = (index: number, field: keyof VocabularyItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      newVocabulary: prev.newVocabulary.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = () => {
    // Filter out empty entries
    const cleanedData: SessionSummaryFormData = {
      ...formData,
      strengths: formData.strengths.filter(s => s.trim() !== ''),
      areasToImprove: formData.areasToImprove.filter(s => s.trim() !== ''),
      topicsDiscussed: formData.topicsDiscussed.filter(s => s.trim() !== ''),
      grammarPoints: formData.grammarPoints.filter(s => s.trim() !== ''),
      recommendations: formData.recommendations.filter(s => s.trim() !== ''),
      newVocabulary: formData.newVocabulary.filter(v => v.word.trim() !== ''),
    };

    if (!cleanedData.professorFeedback.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Erreur',
        description: isRTL ? 'يرجى إضافة تعليق للطالب' : 'Veuillez ajouter un commentaire pour l\'étudiant',
        variant: 'destructive',
      });
      return;
    }

    onSave(cleanedData);
    toast({
      title: isRTL ? 'تم الحفظ' : 'Résumé enregistré',
      description: isRTL ? 'تم حفظ ملخص الجلسة بنجاح' : 'Le résumé de la session a été enregistré avec succès',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const renderScoreSlider = (
    label: string,
    field: keyof SessionSummaryFormData,
    icon: React.ReactNode
  ) => (
    <div className="space-y-2">
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <Label className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          {icon}
          {label}
        </Label>
        <span className={cn("font-bold text-lg", getScoreColor(formData[field] as number))}>
          {formData[field] as number}%
        </span>
      </div>
      <Slider
        value={[formData[field] as number]}
        onValueChange={(value) => handleScoreChange(field, value)}
        max={100}
        step={1}
        className="w-full"
      />
    </div>
  );

  const renderArrayField = (
    label: string,
    field: 'strengths' | 'areasToImprove' | 'topicsDiscussed' | 'grammarPoints' | 'recommendations',
    icon: React.ReactNode,
    placeholder: string
  ) => (
    <div className="space-y-3">
      <Label className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        {icon}
        {label}
      </Label>
      {formData[field].map((item, index) => (
        <div key={index} className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
          <Input
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            placeholder={placeholder}
            dir={isRTL ? "rtl" : "ltr"}
          />
          {formData[field].length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleArrayRemove(field, index)}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleArrayAdd(field)}
        className={cn("gap-1", isRTL && "flex-row-reverse")}
      >
        <Plus className="w-4 h-4" />
        {isRTL ? 'إضافة' : 'Ajouter'}
      </Button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-h-[80vh] overflow-y-auto p-1"
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between flex-wrap gap-4", isRTL && "flex-row-reverse")}>
        <div>
          <h2 className="text-xl font-bold">
            {isRTL ? 'ملخص الجلسة لـ' : 'Résumé de session pour'} {studentName}
          </h2>
          <div className={cn("flex items-center gap-2 mt-1 flex-wrap", isRTL && "flex-row-reverse")}>
            <Badge variant="outline">{roomName}</Badge>
            <Badge variant="secondary">{language}</Badge>
            <Badge variant="outline">{level}</Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Performance Scores */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2 text-lg", isRTL && "flex-row-reverse")}>
            <Star className="w-5 h-5 text-warning" />
            {isRTL ? 'تقييم الأداء' : 'Évaluation des performances'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {renderScoreSlider(
              isRTL ? 'الدرجة الإجمالية' : 'Score global',
              'overallScore',
              <GraduationCap className="w-4 h-4 text-primary" />
            )}
            {renderScoreSlider(
              isRTL ? 'النطق' : 'Prononciation',
              'pronunciation',
              <span className="w-4 h-4 text-center">🎤</span>
            )}
            {renderScoreSlider(
              isRTL ? 'القواعد' : 'Grammaire',
              'grammar',
              <span className="w-4 h-4 text-center">📝</span>
            )}
            {renderScoreSlider(
              isRTL ? 'المفردات' : 'Vocabulaire',
              'vocabulary',
              <span className="w-4 h-4 text-center">📚</span>
            )}
            {renderScoreSlider(
              isRTL ? 'الطلاقة' : 'Fluidité',
              'fluency',
              <span className="w-4 h-4 text-center">💬</span>
            )}
            {renderScoreSlider(
              isRTL ? 'المشاركة' : 'Participation',
              'participation',
              <span className="w-4 h-4 text-center">🙋</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professor Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2 text-lg", isRTL && "flex-row-reverse")}>
            <MessageSquare className="w-5 h-5 text-primary" />
            {isRTL ? 'تعليق المعلم' : 'Commentaire du professeur'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.professorFeedback}
            onChange={(e) => setFormData(prev => ({ ...prev, professorFeedback: e.target.value }))}
            placeholder={isRTL 
              ? 'اكتب تعليقك المفصل حول أداء الطالب في هذه الجلسة...'
              : 'Rédigez votre commentaire détaillé sur la performance de l\'étudiant pendant cette session...'
            }
            className="min-h-[120px]"
            dir={isRTL ? "rtl" : "ltr"}
          />
        </CardContent>
      </Card>

      {/* Strengths & Areas to Improve */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2 text-lg text-success", isRTL && "flex-row-reverse")}>
              <Award className="w-5 h-5" />
              {isRTL ? 'نقاط القوة' : 'Points forts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderArrayField(
              '',
              'strengths',
              null,
              isRTL ? 'نقطة قوة...' : 'Point fort...'
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2 text-lg text-warning", isRTL && "flex-row-reverse")}>
              <Target className="w-5 h-5" />
              {isRTL ? 'نقاط للتحسين' : 'Points à améliorer'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderArrayField(
              '',
              'areasToImprove',
              null,
              isRTL ? 'نقطة للتحسين...' : 'Point à améliorer...'
            )}
          </CardContent>
        </Card>
      </div>

      {/* Topics Discussed */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2 text-lg", isRTL && "flex-row-reverse")}>
            <BookOpen className="w-5 h-5 text-accent" />
            {isRTL ? 'المواضيع المناقشة' : 'Sujets abordés'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderArrayField(
            '',
            'topicsDiscussed',
            null,
            isRTL ? 'موضوع...' : 'Sujet...'
          )}
        </CardContent>
      </Card>

      {/* New Vocabulary */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2 text-lg", isRTL && "flex-row-reverse")}>
            <FileText className="w-5 h-5 text-primary" />
            {isRTL ? 'المفردات الجديدة' : 'Nouveau vocabulaire'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.newVocabulary.map((vocab, index) => (
            <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <Badge variant="outline">#{index + 1}</Badge>
                {formData.newVocabulary.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVocabularyRemove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isRTL ? 'الكلمة' : 'Mot'}
                  </Label>
                  <Input
                    value={vocab.word}
                    onChange={(e) => handleVocabularyChange(index, 'word', e.target.value)}
                    placeholder={isRTL ? 'الكلمة الجديدة' : 'Nouveau mot'}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isRTL ? 'الترجمة' : 'Traduction'}
                  </Label>
                  <Input
                    value={vocab.translation}
                    onChange={(e) => handleVocabularyChange(index, 'translation', e.target.value)}
                    placeholder={isRTL ? 'الترجمة' : 'Traduction'}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {isRTL ? 'مثال' : 'Exemple'}
                </Label>
                <Input
                  value={vocab.example}
                  onChange={(e) => handleVocabularyChange(index, 'example', e.target.value)}
                  placeholder={isRTL ? 'جملة مثال...' : 'Phrase d\'exemple...'}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleVocabularyAdd}
            className={cn("gap-1", isRTL && "flex-row-reverse")}
          >
            <Plus className="w-4 h-4" />
            {isRTL ? 'إضافة كلمة' : 'Ajouter un mot'}
          </Button>
        </CardContent>
      </Card>

      {/* Grammar Points */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2 text-lg", isRTL && "flex-row-reverse")}>
            <span className="text-lg">📝</span>
            {isRTL ? 'نقاط القواعد' : 'Points de grammaire'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderArrayField(
            '',
            'grammarPoints',
            null,
            isRTL ? 'نقطة قواعد...' : 'Point de grammaire...'
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2 text-lg", isRTL && "flex-row-reverse")}>
            <Lightbulb className="w-5 h-5 text-warning" />
            {isRTL ? 'التوصيات' : 'Recommandations'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderArrayField(
            '',
            'recommendations',
            null,
            isRTL ? 'توصية...' : 'Recommandation...'
          )}
        </CardContent>
      </Card>

      {/* Next Session Focus */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2 text-lg", isRTL && "flex-row-reverse")}>
            <span className="text-lg">📌</span>
            {isRTL ? 'تركيز الجلسة القادمة' : 'Focus de la prochaine session'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={formData.nextSessionFocus}
            onChange={(e) => setFormData(prev => ({ ...prev, nextSessionFocus: e.target.value }))}
            placeholder={isRTL 
              ? 'ما يجب التركيز عليه في الجلسة القادمة...'
              : 'Ce sur quoi se concentrer lors de la prochaine session...'
            }
            dir={isRTL ? "rtl" : "ltr"}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className={cn("flex gap-3 pt-4 sticky bottom-0 bg-background py-4 border-t border-border", isRTL && "flex-row-reverse")}>
        <Button onClick={handleSubmit} className="gap-2 flex-1">
          <Save className="w-4 h-4" />
          {isRTL ? 'حفظ الملخص' : 'Enregistrer le résumé'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          {isRTL ? 'إلغاء' : 'Annuler'}
        </Button>
      </div>
    </motion.div>
  );
}
