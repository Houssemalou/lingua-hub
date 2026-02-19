import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  AlertCircle,
  Star,
  Zap,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  ProfessorChallenge,
  challengeSubjects,
  difficultyConfig,
  calculateChallengePoints
} from '@/data/professorChallenges';
import { ChallengeService } from '@/services/ChallengeService';
import confetti from 'canvas-confetti';

interface ChallengeGameProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: ProfessorChallenge | null;
  onComplete: (challengeId: string, pointsEarned: number, attempts: number) => void;
}

export function ChallengeGame({ isOpen, onClose, challenge, onComplete }: ChallengeGameProps) {
  const { language, isRTL } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [revealedCorrectAnswer, setRevealedCorrectAnswer] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const labels = {
    fr: {
      attempt: 'Tentative',
      of: 'sur',
      remaining: 'Temps restant',
      selectAnswer: 'Sélectionnez votre réponse',
      submit: 'Valider',
      tryAgain: 'Réessayer',
      correct: 'Correct!',
      incorrect: 'Incorrect',
      pointsEarned: 'Points gagnés',
      noPoints: 'Pas de points',
      firstAttempt: 'Bravo! Première tentative!',
      secondAttempt: 'Bien! Deuxième tentative!',
      thirdAttempt: 'La réponse correcte était:',
      continue: 'Continuer',
      close: 'Fermer'
    },
    ar: {
      attempt: 'محاولة',
      of: 'من',
      remaining: 'الوقت المتبقي',
      selectAnswer: 'اختر إجابتك',
      submit: 'تأكيد',
      tryAgain: 'حاول مرة أخرى',
      correct: 'صحيح!',
      incorrect: 'خطأ',
      pointsEarned: 'النقاط المكتسبة',
      noPoints: 'لا نقاط',
      firstAttempt: 'ممتاز! المحاولة الأولى!',
      secondAttempt: 'جيد! المحاولة الثانية!',
      thirdAttempt: 'الإجابة الصحيحة كانت:',
      continue: 'متابعة',
      close: 'إغلاق'
    },
    en: {
      attempt: 'Attempt',
      of: 'of',
      remaining: 'Time remaining',
      selectAnswer: 'Select your answer',
      submit: 'Submit',
      tryAgain: 'Try again',
      correct: 'Correct!',
      incorrect: 'Incorrect',
      pointsEarned: 'Points earned',
      noPoints: 'No points',
      firstAttempt: 'Amazing! First attempt!',
      secondAttempt: 'Good! Second attempt!',
      thirdAttempt: 'The correct answer was:',
      continue: 'Continue',
      close: 'Close'
    }
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  useEffect(() => {
    if (isOpen && challenge) {
      setSelectedAnswer(null);
      setAttempts(0);
      setIsCorrect(null);
      setShowResult(false);
      setTimeLeft(60);
      setSubmitting(false);
      setRevealedCorrectAnswer(null);
      setEarnedPoints(0);
    }
  }, [isOpen, challenge]);

  useEffect(() => {
    if (isOpen && !showResult && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, showResult, timeLeft]);

  if (!challenge) return null;

  const subject = challengeSubjects.find(s => s.id === challenge.subject);
  const difficulty = difficultyConfig.find(d => d.id === challenge.difficulty);

  const getQuestion = () => {
    return language === 'fr' ? challenge.questionFr : language === 'ar' ? challenge.questionAr : challenge.question;
  };

  const getOptions = () => {
    return language === 'fr' ? challenge.optionsFr : language === 'ar' ? challenge.optionsAr : challenge.options;
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || submitting) return;

    setSubmitting(true);

    const result = await ChallengeService.submitAnswer({
      challengeId: challenge.id,
      selectedAnswer,
    });

    setSubmitting(false);

    if (!result.success || !result.data) {
      // Fallback to local logic if API fails
      handleLocalSubmit();
      return;
    }

    const response = result.data;
    const newAttempts = response.attemptNumber;
    setAttempts(newAttempts);

    if (response.isCorrect) {
      setIsCorrect(true);
      setShowResult(true);
      setEarnedPoints(response.pointsEarned);
      if (response.correctAnswer !== null) {
        setRevealedCorrectAnswer(response.correctAnswer);
      }

      if (response.pointsEarned > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setTimeout(() => {
        onComplete(challenge.id, response.pointsEarned, newAttempts);
      }, 2000);
    } else {
      setIsCorrect(false);
      if (response.isFinalAttempt) {
        setShowResult(true);
        if (response.correctAnswer !== null) {
          setRevealedCorrectAnswer(response.correctAnswer);
        }
        setTimeout(() => {
          onComplete(challenge.id, 0, newAttempts);
        }, 2000);
      } else {
        setTimeout(() => {
          setIsCorrect(null);
          setSelectedAnswer(null);
        }, 1500);
      }
    }
  };

  // Fallback local submit if API is unavailable
  const handleLocalSubmit = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (selectedAnswer === challenge.correctAnswer) {
      setIsCorrect(true);
      setShowResult(true);
      setRevealedCorrectAnswer(challenge.correctAnswer);
      const points = calculateChallengePoints(challenge.basePoints, challenge.difficulty, newAttempts);
      setEarnedPoints(points);

      if (points > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setTimeout(() => {
        onComplete(challenge.id, points, newAttempts);
      }, 2000);
    } else {
      setIsCorrect(false);
      if (newAttempts >= 2) {
        setShowResult(true);
        setRevealedCorrectAnswer(challenge.correctAnswer);
        setTimeout(() => {
          onComplete(challenge.id, 0, newAttempts);
        }, 2000);
      } else {
        setTimeout(() => {
          setIsCorrect(null);
          setSelectedAnswer(null);
        }, 1500);
      }
    }
  };

  const currentPoints = calculateChallengePoints(challenge.basePoints, challenge.difficulty, attempts + 1);
  const options = getOptions();
  const correctAnswerIndex = revealedCorrectAnswer ?? (showResult ? challenge.correctAnswer : null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <span>{subject?.icon}</span>
            {language === 'fr' ? challenge.titleFr : language === 'ar' ? challenge.titleAr : challenge.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats bar */}
          <div className={cn("flex items-center justify-between flex-wrap gap-2", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {t.attempt} {attempts + 1} {t.of} 2
              </Badge>
              <Badge
                className="gap-1"
                style={{ backgroundColor: `${difficulty?.color}20`, color: difficulty?.color }}
              >
                {language === 'fr' ? difficulty?.nameFr : language === 'ar' ? difficulty?.nameAr : difficulty?.name}
              </Badge>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={cn("font-mono", timeLeft < 10 && "text-destructive")}>{timeLeft}s</span>
              <Badge variant="secondary" className="gap-1">
                <Trophy className="w-3 h-3 text-yellow-500" />
                {currentPoints} XP
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={(timeLeft / 60) * 100} className="h-2" />

          {/* Image if exists */}
          {challenge.imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-xl overflow-hidden"
            >
              <img
                src={challenge.imageUrl}
                alt="Challenge"
                className="w-full h-48 object-cover"
              />
            </motion.div>
          )}

          {/* Question */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-lg font-medium p-4 rounded-xl bg-muted/50",
              isRTL && "text-right"
            )}
          >
            {getQuestion()}
          </motion.div>

          {/* Options */}
          <div className="space-y-3">
            {options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                  isRTL && "flex-row-reverse text-right",
                  selectedAnswer === index
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                  showResult && correctAnswerIndex === index && "border-success bg-success/10",
                  showResult && selectedAnswer === index && index !== correctAnswerIndex && "border-destructive bg-destructive/10",
                  showResult && "pointer-events-none"
                )}
                onClick={() => setSelectedAnswer(index)}
                disabled={showResult || submitting}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0",
                  selectedAnswer === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                  showResult && correctAnswerIndex === index && "bg-success text-success-foreground",
                  showResult && selectedAnswer === index && index !== correctAnswerIndex && "bg-destructive text-destructive-foreground"
                )}>
                  {showResult && correctAnswerIndex === index ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : showResult && selectedAnswer === index ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </div>
                <span className="flex-1">{option}</span>
              </motion.button>
            ))}
          </div>

          {/* Result feedback */}
          <AnimatePresence>
            {isCorrect !== null && !showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "p-4 rounded-xl text-center",
                  isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  {isCorrect ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  <span className="font-bold text-lg">
                    {isCorrect ? t.correct : t.incorrect}
                  </span>
                </div>
                {!isCorrect && attempts < 2 && (
                  <p className="mt-2 text-sm">{t.tryAgain}</p>
                )}
              </motion.div>
            )}

            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-6 rounded-xl text-center",
                  isCorrect ? "bg-success/10" : "bg-muted"
                )}
              >
                {isCorrect ? (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Star className="w-16 h-16 mx-auto text-yellow-500 fill-yellow-500" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mt-4 text-success">
                      {attempts === 1 ? t.firstAttempt : t.secondAttempt}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-xl font-bold">
                        +{earnedPoints} XP
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 mx-auto text-muted-foreground" />
                    <h3 className="text-xl font-bold mt-4">{t.noPoints}</h3>
                    {correctAnswerIndex !== null && (
                      <p className="text-muted-foreground mt-2">
                        {t.thirdAttempt} <span className="font-bold text-success">{options[correctAnswerIndex]}</span>
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className={cn("flex justify-end gap-3", isRTL && "flex-row-reverse")}>
            {!showResult ? (
              <Button
                onClick={handleSubmit}
                disabled={selectedAnswer === null || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {t.submit}
              </Button>
            ) : (
              <Button onClick={onClose}>
                {t.close}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
