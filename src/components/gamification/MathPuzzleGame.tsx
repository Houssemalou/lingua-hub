import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Timer, Trophy, Star, Sparkles, X, Check, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface MathPuzzleGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Question {
  id: number;
  expression: string;
  answer: number;
  options: number[];
}

export function MathPuzzleGame({ isOpen, onClose, onComplete, difficulty }: MathPuzzleGameProps) {
  const { language, isRTL } = useLanguage();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [showResult, setShowResult] = useState(false);

  const labels = {
    fr: { 
      title: 'Puzzle Mathématique', 
      score: 'Score', 
      streak: 'Série',
      combo: 'Combo',
      next: 'Suivant',
      finish: 'Terminer',
      excellent: 'Excellent!',
      good: 'Bien joué!',
      tryAgain: 'Continue!',
      finalScore: 'Score Final'
    },
    ar: { 
      title: 'لغز رياضي', 
      score: 'النتيجة', 
      streak: 'سلسلة',
      combo: 'كومبو',
      next: 'التالي',
      finish: 'إنهاء',
      excellent: 'ممتاز!',
      good: 'أحسنت!',
      tryAgain: 'واصل!',
      finalScore: 'النتيجة النهائية'
    },
    en: { 
      title: 'Math Puzzle', 
      score: 'Score', 
      streak: 'Streak',
      combo: 'Combo',
      next: 'Next',
      finish: 'Finish',
      excellent: 'Excellent!',
      good: 'Well done!',
      tryAgain: 'Keep going!',
      finalScore: 'Final Score'
    }
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  // Generate math questions based on difficulty
  const generateQuestions = useCallback(() => {
    const newQuestions: Question[] = [];
    const count = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10;
    
    for (let i = 0; i < count; i++) {
      let a: number, b: number, answer: number, expression: string;
      
      if (difficulty === 'easy') {
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        const op = Math.random() > 0.5 ? '+' : '-';
        answer = op === '+' ? a + b : a - b;
        expression = `${a} ${op} ${b} = ?`;
      } else if (difficulty === 'medium') {
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        const ops = ['+', '-', '×'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
        expression = `${a} ${op} ${b} = ?`;
      } else {
        a = Math.floor(Math.random() * 15) + 5;
        b = Math.floor(Math.random() * 10) + 2;
        const c = Math.floor(Math.random() * 10) + 1;
        const op1 = Math.random() > 0.5 ? '+' : '-';
        const op2 = Math.random() > 0.5 ? '×' : '+';
        if (op2 === '×') {
          answer = op1 === '+' ? a + (b * c) : a - (b * c);
          expression = `${a} ${op1} (${b} × ${c}) = ?`;
        } else {
          answer = op1 === '+' ? (a + b) + c : (a - b) + c;
          expression = `(${a} ${op1} ${b}) + ${c} = ?`;
        }
      }

      // Generate wrong options
      const options = [answer];
      while (options.length < 4) {
        const wrong = answer + (Math.floor(Math.random() * 10) - 5);
        if (wrong !== answer && !options.includes(wrong)) {
          options.push(wrong);
        }
      }
      
      // Shuffle options
      options.sort(() => Math.random() - 0.5);
      
      newQuestions.push({ id: i, expression, answer, options });
    }
    
    return newQuestions;
  }, [difficulty]);

  // Initialize game
  useEffect(() => {
    if (isOpen) {
      setQuestions(generateQuestions());
      setCurrentIndex(0);
      setScore(0);
      setTimeLeft(difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setStreak(0);
      setCombo(1);
      setShowResult(false);
    }
  }, [isOpen, generateQuestions, difficulty]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || showResult || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setShowResult(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, showResult, timeLeft]);

  const handleAnswer = (answer: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    const correct = answer === questions[currentIndex].answer;
    setIsCorrect(correct);
    
    if (correct) {
      const points = 100 * combo;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setCombo(prev => Math.min(prev + 0.5, 3));
      
      // Trigger confetti for streak milestones
      if ((streak + 1) % 3 === 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } else {
      setStreak(0);
      setCombo(1);
    }
    
    // Auto advance after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
        // Final celebration
        if (score > 500) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    }, 1000);
  };

  const handleClose = () => {
    onComplete(score);
    onClose();
  };

  const currentQuestion = questions[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header with stats */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">🧮 {t.title}</DialogTitle>
          </DialogHeader>
          
          <div className={cn("flex items-center justify-between mt-4", isRTL && "flex-row-reverse")}>
            {/* Timer */}
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Timer className={cn("w-4 h-4", timeLeft <= 10 && "text-destructive animate-pulse")} />
              <span className={cn("font-mono font-bold", timeLeft <= 10 && "text-destructive")}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            {/* Score */}
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-bold">{score}</span>
            </div>
            
            {/* Combo */}
            <Badge variant="secondary" className="gap-1">
              <Zap className="w-3 h-3" />
              x{combo.toFixed(1)}
            </Badge>
          </div>
          
          {/* Progress */}
          <Progress 
            value={((currentIndex + 1) / questions.length) * 100} 
            className="mt-3 h-2"
          />
          <p className="text-center text-xs text-muted-foreground mt-1">
            {currentIndex + 1} / {questions.length}
          </p>
        </div>

        {/* Game content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {!showResult && currentQuestion && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Question */}
                <motion.div
                  className="text-center p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <p className="text-3xl font-bold font-mono">{currentQuestion.expression}</p>
                </motion.div>

                {/* Options grid */}
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options.map((option, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        "p-4 rounded-xl text-xl font-bold border-2 transition-all",
                        selectedAnswer === null && "hover:border-primary hover:bg-primary/5",
                        selectedAnswer === option && isCorrect && "bg-success/20 border-success",
                        selectedAnswer === option && !isCorrect && "bg-destructive/20 border-destructive",
                        selectedAnswer !== null && option === currentQuestion.answer && "bg-success/20 border-success",
                        selectedAnswer !== null && selectedAnswer !== option && option !== currentQuestion.answer && "opacity-50"
                      )}
                      whileHover={selectedAnswer === null ? { scale: 1.05 } : {}}
                      whileTap={selectedAnswer === null ? { scale: 0.95 } : {}}
                    >
                      {option}
                      {selectedAnswer !== null && option === currentQuestion.answer && (
                        <Check className="inline w-5 h-5 ml-2 text-success" />
                      )}
                      {selectedAnswer === option && !isCorrect && (
                        <X className="inline w-5 h-5 ml-2 text-destructive" />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Streak indicator */}
                {streak > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <Badge className="gap-1 bg-orange-500/20 text-orange-500">
                      🔥 {t.streak}: {streak}
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Results screen */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-6xl"
                >
                  {score >= 700 ? '🏆' : score >= 400 ? '⭐' : '💪'}
                </motion.div>
                
                <div>
                  <p className="text-lg text-muted-foreground">{t.finalScore}</p>
                  <motion.p
                    className="text-5xl font-bold text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    {score}
                  </motion.p>
                </div>
                
                <p className="text-xl font-medium">
                  {score >= 700 ? t.excellent : score >= 400 ? t.good : t.tryAgain}
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleClose} size="lg" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t.finish}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
