import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Image, 
  Plus, 
  Trash2, 
  Trophy, 
  Zap, 
  Target,
  Sparkles,
  Upload,
  X,
  Check
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { 
  ChallengeSubject, 
  ChallengeDifficulty, 
  challengeSubjects, 
  difficultyConfig,
  calculateChallengePoints
} from '@/data/professorChallenges';
import { useToast } from '@/hooks/use-toast';

interface ChallengeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (challenge: ChallengeFormData) => void;
}

export interface ChallengeFormData {
  subject: ChallengeSubject;
  difficulty: ChallengeDifficulty;
  title: string;
  question: string;
  options: string[];
  correctAnswer: number;
  basePoints: number;
  imageUrl?: string;
  expiresIn: number; // hours
}

export function ChallengeCreator({ isOpen, onClose, onSubmit }: ChallengeCreatorProps) {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ChallengeFormData>({
    subject: 'Mathematics',
    difficulty: 'medium',
    title: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    basePoints: 50,
    expiresIn: 24
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const labels = {
    fr: {
      createChallenge: 'Créer un Défi',
      step1: 'Configuration',
      step2: 'Question',
      step3: 'Réponses',
      subject: 'Matière',
      difficulty: 'Difficulté',
      basePoints: 'Points de base',
      title: 'Titre du défi',
      question: 'Question',
      addImage: 'Ajouter une image',
      removeImage: 'Supprimer l\'image',
      options: 'Options de réponse',
      option: 'Option',
      correctAnswer: 'Réponse correcte',
      expiresIn: 'Expire dans (heures)',
      preview: 'Aperçu des points',
      firstAttempt: '1ère tentative',
      secondAttempt: '2ème tentative',
      thirdAttempt: '3ème+ tentative',
      fullPoints: 'Points complets',
      halfPoints: 'Moitié des points',
      noPoints: 'Aucun point',
      next: 'Suivant',
      back: 'Retour',
      create: 'Créer le défi',
      cancel: 'Annuler',
      titlePlaceholder: 'Ex: Défi d\'algèbre',
      questionPlaceholder: 'Écrivez votre question ici...'
    },
    ar: {
      createChallenge: 'إنشاء تحدي',
      step1: 'الإعداد',
      step2: 'السؤال',
      step3: 'الإجابات',
      subject: 'المادة',
      difficulty: 'الصعوبة',
      basePoints: 'النقاط الأساسية',
      title: 'عنوان التحدي',
      question: 'السؤال',
      addImage: 'إضافة صورة',
      removeImage: 'حذف الصورة',
      options: 'خيارات الإجابة',
      option: 'خيار',
      correctAnswer: 'الإجابة الصحيحة',
      expiresIn: 'ينتهي خلال (ساعات)',
      preview: 'معاينة النقاط',
      firstAttempt: 'المحاولة الأولى',
      secondAttempt: 'المحاولة الثانية',
      thirdAttempt: 'المحاولة 3+',
      fullPoints: 'كل النقاط',
      halfPoints: 'نصف النقاط',
      noPoints: 'لا نقاط',
      next: 'التالي',
      back: 'رجوع',
      create: 'إنشاء التحدي',
      cancel: 'إلغاء',
      titlePlaceholder: 'مثال: تحدي الجبر',
      questionPlaceholder: 'اكتب سؤالك هنا...'
    },
    en: {
      createChallenge: 'Create Challenge',
      step1: 'Setup',
      step2: 'Question',
      step3: 'Answers',
      subject: 'Subject',
      difficulty: 'Difficulty',
      basePoints: 'Base Points',
      title: 'Challenge Title',
      question: 'Question',
      addImage: 'Add Image',
      removeImage: 'Remove Image',
      options: 'Answer Options',
      option: 'Option',
      correctAnswer: 'Correct Answer',
      expiresIn: 'Expires in (hours)',
      preview: 'Points Preview',
      firstAttempt: '1st attempt',
      secondAttempt: '2nd attempt',
      thirdAttempt: '3rd+ attempt',
      fullPoints: 'Full points',
      halfPoints: 'Half points',
      noPoints: 'No points',
      next: 'Next',
      back: 'Back',
      create: 'Create Challenge',
      cancel: 'Cancel',
      titlePlaceholder: 'E.g., Algebra Challenge',
      questionPlaceholder: 'Write your question here...'
    }
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.question || formData.options.some(o => !o)) {
      toast({
        title: language === 'fr' ? 'Erreur' : language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'fr' ? 'Veuillez remplir tous les champs' : language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }
    onSubmit(formData);
    onClose();
    setFormData({
      subject: 'Mathematics',
      difficulty: 'medium',
      title: '',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      basePoints: 50,
      expiresIn: 24
    });
    setImagePreview(null);
    setStep(1);
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

  const calculatedPoints = {
    first: calculateChallengePoints(formData.basePoints, formData.difficulty, 1),
    second: calculateChallengePoints(formData.basePoints, formData.difficulty, 2),
    third: calculateChallengePoints(formData.basePoints, formData.difficulty, 3)
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            {t.createChallenge}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                step >= s 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}
              animate={step === s ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Configuration */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={cn(isRTL && "text-right block")}>{t.subject}</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(v) => setFormData({ ...formData, subject: v as ChallengeSubject })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {challengeSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          <span className="flex items-center gap-2">
                            <span>{subject.icon}</span>
                            <span>{language === 'fr' ? subject.nameFr : language === 'ar' ? subject.nameAr : subject.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={cn(isRTL && "text-right block")}>{t.difficulty}</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(v) => setFormData({ ...formData, difficulty: v as ChallengeDifficulty })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyConfig.map((diff) => (
                        <SelectItem key={diff.id} value={diff.id}>
                          <span className="flex items-center gap-2">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: diff.color }}
                            />
                            <span>{language === 'fr' ? diff.nameFr : language === 'ar' ? diff.nameAr : diff.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={cn(isRTL && "text-right block")}>{t.basePoints}</Label>
                  <Input
                    type="number"
                    min={10}
                    max={200}
                    value={formData.basePoints}
                    onChange={(e) => setFormData({ ...formData, basePoints: parseInt(e.target.value) || 50 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={cn(isRTL && "text-right block")}>{t.expiresIn}</Label>
                  <Select
                    value={String(formData.expiresIn)}
                    onValueChange={(v) => setFormData({ ...formData, expiresIn: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12h</SelectItem>
                      <SelectItem value="24">24h</SelectItem>
                      <SelectItem value="48">48h</SelectItem>
                      <SelectItem value="72">72h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Points Preview */}
              <Card className="p-4 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
                <div className={cn("flex items-center gap-2 mb-3", isRTL && "flex-row-reverse")}>
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{t.preview}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 rounded-lg bg-success/10">
                    <p className="text-xs text-muted-foreground">{t.firstAttempt}</p>
                    <p className="font-bold text-success">{calculatedPoints.first} XP</p>
                    <p className="text-xs text-success">{t.fullPoints}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-warning/10">
                    <p className="text-xs text-muted-foreground">{t.secondAttempt}</p>
                    <p className="font-bold text-warning">{calculatedPoints.second} XP</p>
                    <p className="text-xs text-warning">{t.halfPoints}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <p className="text-xs text-muted-foreground">{t.thirdAttempt}</p>
                    <p className="font-bold text-destructive">{calculatedPoints.third} XP</p>
                    <p className="text-xs text-destructive">{t.noPoints}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Question */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className={cn(isRTL && "text-right block")}>{t.title}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t.titlePlaceholder}
                  className={cn(isRTL && "text-right")}
                />
              </div>

              <div className="space-y-2">
                <Label className={cn(isRTL && "text-right block")}>{t.question}</Label>
                <Textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder={t.questionPlaceholder}
                  rows={4}
                  className={cn(isRTL && "text-right")}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className={cn(isRTL && "text-right block")}>{t.addImage}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Challenge" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-32 border-dashed flex flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-muted-foreground">{t.addImage}</span>
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Answers */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Label className={cn(isRTL && "text-right block")}>{t.options}</Label>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
                      formData.correctAnswer === index 
                        ? "border-success bg-success/5" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setFormData({ ...formData, correctAnswer: index })}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      formData.correctAnswer === index 
                        ? "bg-success text-success-foreground" 
                        : "bg-muted"
                    )}>
                      {formData.correctAnswer === index ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + index)}
                    </div>
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`${t.option} ${index + 1}`}
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </motion.div>
                ))}
              </div>
              <p className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
                {t.correctAnswer}: {t.option} {String.fromCharCode(65 + formData.correctAnswer)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className={cn("flex justify-between pt-4", isRTL && "flex-row-reverse")}>
          <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? t.cancel : t.back}
          </Button>
          <Button onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}>
            {step === 3 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t.create}
              </>
            ) : t.next}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
