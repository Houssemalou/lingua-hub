import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuizModel, QuizResultModel } from '@/models/Quiz';
import { cn } from '@/lib/utils';

interface QuizResultViewProps {
  result: QuizResultModel;
  quiz: QuizModel | null;
  onBack: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function QuizResultView({ result, quiz, onBack }: QuizResultViewProps) {
  const { t, isRTL } = useLanguage();

  // score is already a percentage from the backend
  const scorePercent = result.score;
  const correctCount = result.totalQuestions > 0
    ? Math.round((result.score * result.totalQuestions) / 100)
    : 0;
  const passed = result.passed;

  const getMessage = () => {
    if (scorePercent >= 80) return isRTL ? 'ممتاز!' : 'Excellent !';
    if (scorePercent >= 60) return isRTL ? 'جيد!' : 'Bien !';
    return isRTL ? 'يمكن التحسن' : 'À améliorer';
  };

  const scoreColor = passed ? 'text-emerald-500' : 'text-red-500';
  const scoreBg = passed ? 'from-emerald-500/20 to-teal-500/20' : 'from-red-500/20 to-pink-500/20';
  const scoreStroke = passed ? 'stroke-emerald-500' : 'stroke-red-500';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Back button */}
      <motion.div variants={item}>
        <Button
          variant="ghost"
          onClick={onBack}
          className={cn('gap-2', isRTL && 'flex-row-reverse')}
        >
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('quiz.backToList')}
        </Button>
      </motion.div>

      {/* Score Card */}
      <motion.div variants={item}>
        <Card className={cn('overflow-hidden bg-gradient-to-br', scoreBg)}>
          <CardContent className="py-10 flex flex-col items-center space-y-4">
            {/* Circular score */}
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className="stroke-muted/30"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className={scoreStroke}
                  strokeWidth="3"
                  strokeDasharray={`${scorePercent}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-4xl font-bold', scoreColor)}>{scorePercent}%</span>
              </div>
            </div>

            {/* Badge */}
            <Badge
              className={cn(
                'text-base px-4 py-1.5',
                passed
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-600 border-red-500/30'
              )}
            >
              {passed ? (
                <Trophy className="w-4 h-4 mr-1.5" />
              ) : (
                <XCircle className="w-4 h-4 mr-1.5" />
              )}
              {passed ? t('quiz.passed') : t('quiz.failed')}
            </Badge>

            <p className="text-lg font-semibold">{getMessage()}</p>

            {/* Stats row */}
            <div className={cn('flex items-center gap-6 text-sm', isRTL && 'flex-row-reverse')}>
              <div className="text-center">
                <p className="font-bold text-lg">{correctCount}/{result.totalQuestions}</p>
                <p className="text-muted-foreground">{isRTL ? 'إجابات صحيحة' : 'Bonnes réponses'}</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="font-bold text-lg">{scorePercent}%</p>
                <p className="text-muted-foreground">{t('quiz.score')}</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className={cn('font-bold text-lg', scoreColor)}>
                  {passed ? (isRTL ? 'ناجح' : 'Réussi') : (isRTL ? 'راسب' : 'Échoué')}
                </p>
                <p className="text-muted-foreground">{isRTL ? 'الحالة' : 'Statut'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Answer Review */}
      {quiz && result.answers && (
        <motion.div variants={item} className="space-y-4">
          <h3 className={cn('text-lg font-semibold flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <Award className="w-5 h-5 text-primary" />
            {t('quiz.review')}
          </h3>

          {quiz.questions.map((question, qIdx) => {
            const studentAnswer = result.answers?.find((a) => a.questionId === question.id);
            const isCorrect = studentAnswer?.isCorrect ?? false;
            const selectedIdx = studentAnswer?.selectedAnswer ?? -1;

            return (
              <Card
                key={question.id}
                className={cn(
                  'border-l-4',
                  isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'
                )}
              >
                <CardContent className="p-5 space-y-3">
                  <div className={cn('flex items-start gap-3', isRTL && 'flex-row-reverse')}>
                    <span
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        isCorrect
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-red-500/10 text-red-600'
                      )}
                    >
                      {qIdx + 1}
                    </span>
                    <p className={cn('font-medium flex-1', isRTL && 'text-right')}>
                      {question.question}
                    </p>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                  </div>

                  <div className="grid gap-2">
                    {question.options.map((option, oIdx) => {
                      const isStudentChoice = oIdx === selectedIdx;
                      const isCorrectOption = oIdx === question.correctAnswer;

                      return (
                        <div
                          key={oIdx}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                            isRTL && 'flex-row-reverse',
                            isCorrectOption && 'bg-emerald-500/10 border border-emerald-500/30',
                            isStudentChoice && !isCorrectOption && 'bg-red-500/10 border border-red-500/30',
                            !isCorrectOption && !isStudentChoice && 'bg-muted/30'
                          )}
                        >
                          <span
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                              isCorrectOption && 'bg-emerald-500 text-white',
                              isStudentChoice && !isCorrectOption && 'bg-red-500 text-white',
                              !isCorrectOption && !isStudentChoice && 'bg-muted text-muted-foreground'
                            )}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1">{option}</span>
                          {isStudentChoice && (
                            <span className="text-xs text-muted-foreground">
                              ({t('quiz.yourAnswer')})
                            </span>
                          )}
                          {isCorrectOption && !isStudentChoice && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              ({t('quiz.correctAnswer')})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
