import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  CheckCircle,
  GripVertical,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizCreatorProps {
  sessions: Array<{
    id: string;
    name: string;
  }>;
  onCreateQuiz: (quiz: {
    title: string;
    description: string;
    sessionId: string;
    questions: QuizQuestion[];
  }) => void;
  onCancel: () => void;
  isRTL?: boolean;
}

export function QuizCreator({
  sessions,
  onCreateQuiz,
  onCancel,
  isRTL = false,
}: QuizCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { id: '1', question: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([
      ...questions, 
      { id: newId, question: '', options: ['', '', '', ''], correctAnswer: 0 }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions];
    updated[index].question = value;
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const setCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].correctAnswer = optionIndex;
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error(isRTL ? 'يرجى إدخال عنوان الاختبار' : 'Veuillez entrer un titre');
      return;
    }

    if (!selectedSession) {
      toast.error(isRTL ? 'يرجى اختيار جلسة' : 'Veuillez sélectionner une session');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.error(
          isRTL 
            ? `يرجى إدخال نص السؤال ${i + 1}` 
            : `Veuillez entrer le texte de la question ${i + 1}`
        );
        return;
      }
      
      const filledOptions = q.options.filter(o => o.trim());
      if (filledOptions.length < 2) {
        toast.error(
          isRTL 
            ? `يرجى إدخال خيارين على الأقل للسؤال ${i + 1}` 
            : `Veuillez entrer au moins 2 options pour la question ${i + 1}`
        );
        return;
      }

      if (!q.options[q.correctAnswer]?.trim()) {
        toast.error(
          isRTL 
            ? `يرجى اختيار إجابة صحيحة للسؤال ${i + 1}` 
            : `Veuillez sélectionner une réponse correcte pour la question ${i + 1}`
        );
        return;
      }
    }

    onCreateQuiz({
      title,
      description,
      sessionId: selectedSession,
      questions,
    });

    toast.success(isRTL ? 'تم إنشاء الاختبار بنجاح!' : 'Quiz créé avec succès !');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{isRTL ? 'عنوان الاختبار' : 'Titre du quiz'}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isRTL ? 'مثال: اختبار القواعد' : 'Ex: Quiz de grammaire'}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
        <div className="space-y-2">
          <Label>{isRTL ? 'الجلسة' : 'Session'}</Label>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger>
              <SelectValue placeholder={isRTL ? 'اختر جلسة' : 'Choisir une session'} />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{isRTL ? 'الوصف (اختياري)' : 'Description (optionnel)'}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={isRTL ? 'وصف موجز للاختبار...' : 'Description brève du quiz...'}
          rows={2}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className={cn(
          "flex items-center justify-between",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <Label className="text-base">
              {isRTL ? 'الأسئلة' : 'Questions'} ({questions.length})
            </Label>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addQuestion}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {isRTL ? 'إضافة سؤال' : 'Ajouter une question'}
          </Button>
        </div>

        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="relative">
                <CardContent className="p-4 space-y-4">
                  {/* Question Header */}
                  <div className={cn(
                    "flex items-center justify-between",
                    isRTL && "flex-row-reverse"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse"
                    )}>
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                      <Badge variant="secondary">
                        {isRTL ? `سؤال ${qIndex + 1}` : `Question ${qIndex + 1}`}
                      </Badge>
                    </div>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="space-y-2">
                    <Label>{isRTL ? 'نص السؤال' : 'Texte de la question'}</Label>
                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, e.target.value)}
                      placeholder={isRTL ? 'اكتب سؤالك هنا...' : 'Écrivez votre question ici...'}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  {/* Options with Correct Answer Selection */}
                  <div className="space-y-3">
                    <Label className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse"
                    )}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {isRTL ? 'الخيارات (اختر الإجابة الصحيحة)' : 'Options (sélectionnez la bonne réponse)'}
                    </Label>
                    
                    <RadioGroup 
                      value={q.correctAnswer.toString()}
                      onValueChange={(value) => setCorrectAnswer(qIndex, parseInt(value))}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        {q.options.map((opt, optIndex) => (
                          <div 
                            key={optIndex}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
                              q.correctAnswer === optIndex 
                                ? "border-green-500 bg-green-500/10" 
                                : "border-border hover:border-muted-foreground/50",
                              isRTL && "flex-row-reverse"
                            )}
                            onClick={() => setCorrectAnswer(qIndex, optIndex)}
                          >
                            <RadioGroupItem 
                              value={optIndex.toString()} 
                              id={`q${qIndex}-opt${optIndex}`}
                              className={cn(
                                q.correctAnswer === optIndex && "border-green-500 text-green-500"
                              )}
                            />
                            <Input
                              value={opt}
                              onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                              placeholder={`${isRTL ? 'الخيار' : 'Option'} ${optIndex + 1}`}
                              className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0"
                              dir={isRTL ? 'rtl' : 'ltr'}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {q.correctAnswer === optIndex && (
                              <Badge variant="default" className="bg-green-500 shrink-0">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {isRTL ? 'صحيح' : 'Correct'}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border",
        isRTL && "sm:flex-row-reverse"
      )}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          {isRTL ? 'إلغاء' : 'Annuler'}
        </Button>
        <Button 
          type="submit"
          className="w-full sm:w-auto gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {isRTL ? 'إنشاء الاختبار' : 'Créer le Quiz'}
        </Button>
      </div>
    </form>
  );
}
