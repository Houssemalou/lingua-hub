import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Quiz, QuizQuestion } from '@/data/quizzes';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle2, XCircle, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
}

export function QuizModal({ quiz, isOpen, onClose, onComplete }: QuizModalProps) {
  const { isRTL } = useLanguage();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Calculate score and complete
      const correctCount = answers.reduce((count, answer, index) => {
        return count + (answer === quiz.questions[index].correctAnswer ? 1 : 0);
      }, selectedAnswer === currentQuestion.correctAnswer ? 1 : 0);
      
      const score = Math.round((correctCount / quiz.questions.length) * 100);
      setIsCompleted(true);
      onComplete(score);
    }
  };

  const handleClose = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setIsCompleted(false);
    onClose();
  };

  const getScoreMessage = () => {
    const correctCount = answers.filter((answer, index) => answer === quiz.questions[index].correctAnswer).length;
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    
    if (score >= 80) return isRTL ? 'ممتاز! 🎉' : 'Excellent ! 🎉';
    if (score >= 60) return isRTL ? 'جيد جداً! 👏' : 'Très bien ! 👏';
    if (score >= 40) return isRTL ? 'يمكنك التحسن 💪' : 'Peut mieux faire 💪';
    return isRTL ? 'استمر في الممارسة 📚' : 'Continue à pratiquer 📚';
  };

  const correctCount = answers.filter((answer, index) => answer === quiz.questions[index].correctAnswer).length;
  const score = Math.round((correctCount / quiz.questions.length) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="b1">{quiz.language}</Badge>
            {quiz.sessionName}
          </DialogTitle>
          <DialogDescription>
            {isRTL ? 'أكمل هذا الاختبار لتعزيز ما تعلمته' : 'Complétez ce quiz pour renforcer vos apprentissages'}
          </DialogDescription>
        </DialogHeader>

        {!isCompleted ? (
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRTL ? `السؤال ${currentQuestionIndex + 1} من ${quiz.questions.length}` : `Question ${currentQuestionIndex + 1} sur ${quiz.questions.length}`}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
                
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswer;
                    const showCorrect = showResult && isCorrect;
                    const showIncorrect = showResult && isSelected && !isCorrect;
                    
                    return (
                      <motion.button
                        key={index}
                        whileHover={!showResult ? { scale: 1.01 } : {}}
                        whileTap={!showResult ? { scale: 0.99 } : {}}
                        onClick={() => handleSelectAnswer(index)}
                        disabled={showResult}
                        className={cn(
                          "w-full p-4 rounded-lg border-2 text-left transition-all",
                          isRTL && "text-right",
                          !showResult && isSelected && "border-primary bg-primary/5",
                          !showResult && !isSelected && "border-border hover:border-primary/50 bg-card",
                          showCorrect && "border-success bg-success/10",
                          showIncorrect && "border-destructive bg-destructive/10"
                        )}
                      >
                        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                          <span className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                            !showResult && isSelected && "bg-primary text-primary-foreground",
                            !showResult && !isSelected && "bg-muted",
                            showCorrect && "bg-success text-success-foreground",
                            showIncorrect && "bg-destructive text-destructive-foreground"
                          )}>
                            {showCorrect ? <CheckCircle2 className="w-5 h-5" /> : 
                             showIncorrect ? <XCircle className="w-5 h-5" /> : 
                             String.fromCharCode(65 + index)}
                          </span>
                          <span className="flex-1">{option}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
              {!showResult ? (
                <Button
                  className="flex-1"
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                >
                  {isRTL ? 'تأكيد' : 'Valider'}
                </Button>
              ) : (
                <Button
                  className="flex-1 gap-2"
                  onClick={handleNext}
                >
                  {currentQuestionIndex < quiz.questions.length - 1 
                    ? (isRTL ? 'التالي' : 'Suivant')
                    : (isRTL ? 'إنهاء' : 'Terminer')}
                  {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{getScoreMessage()}</h3>
              <p className="text-muted-foreground mt-2">
                {isRTL 
                  ? `حصلت على ${correctCount} من ${quiz.questions.length} صحيحة`
                  : `Vous avez obtenu ${correctCount} sur ${quiz.questions.length} bonnes réponses`}
              </p>
            </div>
            <div className="w-32 mx-auto">
              <div className="text-4xl font-bold text-primary">{score}%</div>
            </div>
            <Button onClick={handleClose} className="w-full">
              {isRTL ? 'إغلاق' : 'Fermer'}
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
