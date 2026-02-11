import React, { useState, useEffect } from 'react';
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
  X,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SessionSummaryService, CreateSessionSummaryData, SessionSummary } from '@/services/SessionSummaryService';

interface RoomSessionSummaryEditorProps {
  roomId: string;
  roomName: string;
  language: string;
  level: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  isRTL?: boolean;
}

const defaultFormData = {
  overallScore: 70,
  pronunciation: 70,
  grammar: 70,
  vocabulary: 70,
  fluency: 70,
  participation: 70,
  summary: '',
  strengths: [''],
  areasToImprove: [''],
  keyTopics: [''],
  vocabularyCovered: [''],
  grammarPoints: [''],
  recommendations: [''],
  nextSessionFocus: '',
};

export function RoomSessionSummaryEditor({
  roomId,
  roomName,
  language,
  level,
  isOpen,
  onClose,
  onSaved,
  isRTL = false,
}: RoomSessionSummaryEditorProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [existingSummary, setExistingSummary] = useState<SessionSummary | null>(null);

  const loadExistingSummary = async () => {
    if (!roomId) return;
    const response = await SessionSummaryService.getByRoomId(roomId);
    if (response.success && response.data) {
      setExistingSummary(response.data);
      setFormData({
        overallScore: response.data.overallScore,
        pronunciation: response.data.pronunciationScore,
        grammar: response.data.grammarScore,
        vocabulary: response.data.vocabularyScore,
        fluency: response.data.fluencyScore,
        participation: response.data.participationScore,
        summary: response.data.summary,
        strengths: response.data.strengths.length > 0 ? response.data.strengths : [''],
        areasToImprove: response.data.areasToImprove.length > 0 ? response.data.areasToImprove : [''],
        keyTopics: response.data.keyTopics.length > 0 ? response.data.keyTopics : [''],
        vocabularyCovered: response.data.vocabularyCovered.length > 0 ? response.data.vocabularyCovered : [''],
        grammarPoints: response.data.grammarPoints.length > 0 ? response.data.grammarPoints : [''],
        recommendations: response.data.recommendations.length > 0 ? response.data.recommendations : [''],
        nextSessionFocus: response.data.nextSessionFocus,
      });
    }
  };

  useEffect(() => {
    if (isOpen && roomId) {
      loadExistingSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, roomId]);

  const handleScoreChange = (field: keyof typeof formData, value: number[]) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }));
  };

  const handleArrayAdd = (field: 'strengths' | 'areasToImprove' | 'keyTopics' | 'vocabularyCovered' | 'grammarPoints' | 'recommendations') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const handleArrayRemove = (field: 'strengths' | 'areasToImprove' | 'keyTopics' | 'vocabularyCovered' | 'grammarPoints' | 'recommendations', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleArrayChange = (
    field: 'strengths' | 'areasToImprove' | 'keyTopics' | 'vocabularyCovered' | 'grammarPoints' | 'recommendations',
    index: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.summary.trim()) {
      toast.error(isRTL ? 'يرجى إضافة ملخص للجلسة' : 'Veuillez ajouter un résumé de la session');
      return;
    }

    setLoading(true);

    const data: CreateSessionSummaryData = {
      roomId,
      summary: formData.summary,
      keyTopics: formData.keyTopics.filter(s => s.trim() !== ''),
      vocabularyCovered: formData.vocabularyCovered.filter(s => s.trim() !== ''),
      grammarPoints: formData.grammarPoints.filter(s => s.trim() !== ''),
      strengths: formData.strengths.filter(s => s.trim() !== ''),
      areasToImprove: formData.areasToImprove.filter(s => s.trim() !== ''),
      recommendations: formData.recommendations.filter(s => s.trim() !== ''),
      nextSessionFocus: formData.nextSessionFocus,
      overallScore: formData.overallScore,
      pronunciationScore: formData.pronunciation,
      grammarScore: formData.grammar,
      vocabularyScore: formData.vocabulary,
      fluencyScore: formData.fluency,
      participationScore: formData.participation,
    };

    const response = await SessionSummaryService.createOrUpdate(data);

    setLoading(false);

    if (response.success) {
      toast.success(
        existingSummary 
          ? (isRTL ? 'تم تحديث الملخص بنجاح' : 'Résumé mis à jour avec succès')
          : (isRTL ? 'تم  حفظ الملخص بنجاح' : 'Résumé enregistré avec succès')
      );
      onSaved?.();
      onClose();
    } else {
      toast.error(response.error || (isRTL ? 'فشل في حفظ الملخص' : 'Échec de l\'enregistrement du résumé'));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderScoreSlider = (
    label: string,
    field: keyof typeof defaultFormData,
    icon: React.ReactNode
  ) => (
    <div className="space-y-2">
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <Label className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          {icon}
          <span className="text-sm">{label}</span>
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
    field: 'strengths' | 'areasToImprove' | 'keyTopics' | 'vocabularyCovered' | 'grammarPoints' | 'recommendations',
    icon: React.ReactNode,
    placeholder: string
  ) => (
    <div className="space-y-3">
      {label && (
        <Label className={cn("flex items-center gap-2 font-semibold", isRTL && "flex-row-reverse")}>
          {icon}
          {label}
        </Label>
      )}
      {formData[field].map((item, index) => (
        <div key={index} className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
          <Input
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            placeholder={placeholder}
            dir={isRTL ? "rtl" : "ltr"}
            className="flex-1"
          />
          {formData[field].length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleArrayRemove(field, index)}
              className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2 text-xl", isRTL && "flex-row-reverse")}>
            <Users className="w-6 h-6 text-primary" />
            {isRTL ? 'ملخص الجلسة' : 'Résumé de la session'}
          </DialogTitle>
          <div className={cn("flex items-center gap-2 mt-2 flex-wrap", isRTL && "flex-row-reverse")}>
            <Badge variant="outline">{roomName}</Badge>
            <Badge variant="secondary">{language}</Badge>
            <Badge variant="outline">{level}</Badge>
            {existingSummary && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                {isRTL ? 'موجود' : 'Existant'}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Separator />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Overall Summary */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2 text-base", isRTL && "flex-row-reverse")}>
                <FileText className="w-5 h-5 text-primary" />
                {isRTL ? 'ملخص عام للجلسة' : 'Résumé général de la session'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder={isRTL 
                  ? 'اكتب ملخصًا عامًا لهذه الجلسة ...'
                  : 'Rédigez un résumé général de cette session pour tous les étudiants...'
                }
                className="min-h-[120px]"
                dir={isRTL ? "rtl" : "ltr"}
              />
            </CardContent>
          </Card>

          {/* Performance Scores */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2 text-base", isRTL && "flex-row-reverse")}>
                <Star className="w-5 h-5 text-yellow-500" />
                {isRTL ? 'تقييم الأداء العام' : 'Évaluation performance globale'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {renderScoreSlider(
                  isRTL ? 'الدرجة الإجمالية' : 'Score global',
                  'overallScore',
                  <span className="text-base">🎯</span>
                )}
                {renderScoreSlider(
                  isRTL ? 'النطق' : 'Prononciation',
                  'pronunciation',
                  <span className="text-base">🎤</span>
                )}
                {renderScoreSlider(
                  isRTL ? 'القواعد' : 'Grammaire',
                  'grammar',
                  <span className="text-base">📝</span>
                )}
                {renderScoreSlider(
                  isRTL ? 'المفردات' : 'Vocabulaire',
                  'vocabulary',
                  <span className="text-base">📚</span>
                )}
                {renderScoreSlider(
                  isRTL ? 'الطلاقة' : 'Fluidité',
                  'fluency',
                  <span className="text-base">💬</span>
                )}
                {renderScoreSlider(
                  isRTL ? 'المشاركة' : 'Participation',
                  'participation',
                  <span className="text-base">🙋</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Areas to Improve */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2 text-base text-green-700", isRTL && "flex-row-reverse")}>
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
                <CardTitle className={cn("flex items-center gap-2 text-base text-orange-700", isRTL && "flex-row-reverse")}>
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

          {/* Key Topics */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2 text-base", isRTL && "flex-row-reverse")}>
                <BookOpen className="w-5 h-5 text-blue-600" />
                {isRTL ? 'المواضيع الرئيسية' : 'Sujets principaux abordés'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderArrayField(
                '',
                'keyTopics',
                null,
                isRTL ? 'موضوع...' : 'Sujet...'
              )}
            </CardContent>
          </Card>

          {/* Vocabulary & Grammar */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2 text-base", isRTL && "flex-row-reverse")}>
                  <span className="text-lg">📖</span>
                  {isRTL ? 'المفردات المغطاة' : 'Vocabulaire couvert'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderArrayField(
                  '',
                  'vocabularyCovered',
                  null,
                  isRTL ? 'كلمة...' : 'Mot...'
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2 text-base", isRTL && "flex-row-reverse")}>
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
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2 text-base", isRTL && "flex-row-reverse")}>
                <Lightbulb className="w-5 h-5 text-yellow-600" />
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
              <CardTitle className={cn("flex items-center gap-2 text-base", isRTL && "flex-row-reverse")}>
                <span className="text-lg">📌</span>
                {isRTL ? 'تركيز الجلسة القادمة' : 'Focus de la prochaine session'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.nextSessionFocus}
                onChange={(e) => setFormData(prev => ({ ...prev, nextSessionFocus: e.target.value }))}
                placeholder={isRTL 
                  ? 'ما يجب التركيز عليه في الجلسة القادمة...'
                  : 'Ce sur quoi se concentrer lors de la prochaine session...'
                }
                className="min-h-[80px]"
                dir={isRTL ? "rtl" : "ltr"}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className={cn("flex gap-3 pt-4", isRTL && "flex-row-reverse")}>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2 flex-1">
              <Save className="w-4 h-4" />
              {loading 
                ? (isRTL ? 'جارٍ الحفظ...' : 'Enregistrement...') 
                : existingSummary
                  ? (isRTL ? 'تحديث الملخص' : 'Mettre à jour')
                  : (isRTL ? 'حفظ الملخص' : 'Enregistrer')
              }
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {isRTL ? 'إلغاء' : 'Annuler'}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
