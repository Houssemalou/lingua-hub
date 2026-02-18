import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuizModel } from '@/models/Quiz';
import { cn } from '@/lib/utils';

interface QuizTakerProps {
  quiz: QuizModel;
  onComplete: (answers: { questionId: string; selectedAnswer: number }[]) => void;
  onCancel: () => void;
}

export function QuizTaker({ quiz, onComplete, onCancel }: QuizTakerProps) {
  const { t, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : 0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] ?? -1,
    }));
    onComplete(formattedAnswers);
  }, [isSubmitting, questions, answers, onComplete]);

  // Timer
  useEffect(() => {
    if (!quiz.timeLimit) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setShowTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz.timeLimit]);

  // Auto-submit when time is up
  useEffect(() => {
    if (showTimeUp) {
      const timeout = setTimeout(() => handleSubmit(), 2000);
      return () => clearTimeout(timeout);
    }
  }, [showTimeUp, handleSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleFinishClick = () => {
    setShowConfirm(true);
  };

  const isLastQuestion = currentIndex === questions.length - 1;
  const timerDanger = quiz.timeLimit ? timeLeft < 60 : false;
  const timerWarning = quiz.timeLimit ? timeLeft < 120 && !timerDanger : false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with timer */}
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <div className={cn(isRTL && 'text-right')}>
          <h2 className="text-xl font-bold">{quiz.title}</h2>
          <p className="text-sm text-muted-foreground">
            {t('quiz.question')} {currentIndex + 1} {t('quiz.of')} {questions.length}
          </p>
        </div>
        <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
          {quiz.timeLimit && (
            <Badge
              variant="outline"
              className={cn(
                'text-base px-3 py-1.5 font-mono gap-1.5',
                timerDanger && 'border-red-500 text-red-500 animate-pulse',
                timerWarning && 'border-amber-500 text-amber-500'
              )}
            >
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowQuitConfirm(true)}>
            {isRTL ? 'خروج' : 'Quitter'}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {answeredCount}/{questions.length} {isRTL ? 'تمت الإجابة' : 'répondu(s)'}
        </p>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <h3 className={cn('text-lg font-semibold', isRTL && 'text-right')}>
            {currentQuestion.question}
          </h3>

          <div className="grid gap-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === idx;
              const letter = String.fromCharCode(65 + idx);
              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => selectAnswer(idx)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all text-left',
                    isRTL && 'text-right',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border hover:border-primary/40 bg-card'
                  )}
                >
                  <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
                    <span
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {letter}
                    </span>
                    <span className="flex-1 font-medium">{option}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {t('quiz.previous')}
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={handleFinishClick}
            disabled={isSubmitting}
            className="gap-2"
          >
            {t('quiz.submit')}
          </Button>
        ) : (
          <Button onClick={goNext} className="gap-2">
            {t('quiz.next')}
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Question indicators */}
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              'w-9 h-9 rounded-full text-sm font-medium transition-all',
              idx === currentIndex && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
              answers[q.id] !== undefined
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Confirm submit dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('quiz.submit')}</DialogTitle>
            <DialogDescription>{t('quiz.confirmSubmit')}</DialogDescription>
          </DialogHeader>
          {answeredCount < questions.length && (
            <div className={cn('flex items-center gap-2 text-amber-600 dark:text-amber-400', isRTL && 'flex-row-reverse')}>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                {isRTL
                  ? `لم تجب على ${questions.length - answeredCount} سؤال(أسئلة)`
                  : `${questions.length - answeredCount} question(s) sans réponse`}
              </span>
            </div>
          )}
          <DialogFooter className={cn(isRTL && 'flex-row-reverse')}>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {isRTL ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (isRTL ? 'جاري الإرسال...' : 'Envoi...') : t('quiz.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quit confirmation dialog */}
      <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تأكيد الخروج' : 'Confirmer la sortie'}</DialogTitle>
            <DialogDescription>
              {isRTL
                ? 'إذا غادرت الآن، سيتم إرسال إجاباتك الحالية تلقائياً ولن تتمكن من إعادة هذا الاختبار.'
                : 'Si vous quittez maintenant, vos réponses actuelles seront soumises automatiquement et vous ne pourrez pas repasser ce quiz.'}
            </DialogDescription>
          </DialogHeader>
          <div className={cn('flex items-center gap-2 text-amber-600 dark:text-amber-400', isRTL && 'flex-row-reverse')}>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              {isRTL
                ? `تم الإجابة على ${answeredCount} من ${questions.length} سؤال`
                : `${answeredCount} sur ${questions.length} question(s) répondue(s)`}
            </span>
          </div>
          <DialogFooter className={cn(isRTL && 'flex-row-reverse')}>
            <Button variant="outline" onClick={() => setShowQuitConfirm(false)}>
              {isRTL ? 'متابعة الاختبار' : 'Continuer le quiz'}
            </Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (isRTL ? 'جاري الإرسال...' : 'Envoi...') : (isRTL ? 'خروج وإرسال' : 'Quitter et soumettre')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time up dialog */}
      <Dialog open={showTimeUp} onOpenChange={() => {}}>
        <DialogContent className="text-center">
          <div className="py-6 space-y-4">
            <Clock className="w-16 h-16 mx-auto text-red-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-red-500">{t('quiz.timeUp')}</h2>
            <p className="text-muted-foreground">
              {isRTL ? 'سيتم إرسال إجاباتك تلقائياً...' : 'Vos réponses seront soumises automatiquement...'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
