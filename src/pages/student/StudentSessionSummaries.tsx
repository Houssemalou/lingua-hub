import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Star, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  MessageSquare,
  Target,
  Lightbulb,
  Award,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SessionSummaryService, SessionSummary } from '@/services/SessionSummaryService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

interface SummaryCardProps {
  summary: SessionSummary;
  isRTL: boolean;
  dateLocale: typeof fr;
}

function SummaryCard({ summary, isRTL, dateLocale }: SummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success/10';
    if (score >= 60) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  return (
    <motion.div variants={item}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className={cn("flex items-start justify-between gap-4", isRTL && "flex-row-reverse")}>
            <div className={cn("space-y-1 flex-1", isRTL && "text-right")}>
              <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
                <CardTitle className="text-lg">{summary.roomName}</CardTitle>
              </div>
              <div className={cn("flex items-center gap-4 text-sm text-muted-foreground flex-wrap", isRTL && "flex-row-reverse")}>
                <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <Calendar className="w-4 h-4" />
                  {format(new Date(summary.createdAt), 'dd MMM yyyy', { locale: dateLocale })}
                </span>
                <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <User className="w-4 h-4" />
                  {summary.professorName}
                </span>
              </div>
            </div>
            <div className={`flex flex-col items-center p-3 rounded-xl ${getScoreBg(summary.overallScore)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(summary.overallScore)}`}>
                {summary.overallScore}%
              </span>
              <span className="text-xs text-muted-foreground">{isRTL ? 'النتيجة' : 'Score'}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Skills Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: isRTL ? 'النطق' : 'Prononciation', value: summary.pronunciationScore },
              { label: isRTL ? 'القواعد' : 'Grammaire', value: summary.grammarScore },
              { label: isRTL ? 'المفردات' : 'Vocabulaire', value: summary.vocabularyScore },
              { label: isRTL ? 'الطلاقة' : 'Fluidité', value: summary.fluencyScore },
              { label: isRTL ? 'المشاركة' : 'Participation', value: summary.participationScore },
            ].map((skill) => (
              <div key={skill.label} className={cn("text-center p-2 rounded-lg bg-muted/50", isRTL && "text-right")}>
                <div className={`text-lg font-semibold ${getScoreColor(skill.value)}`}>
                  {skill.value}%
                </div>
                <div className="text-xs text-muted-foreground">{skill.label}</div>
              </div>
            ))}
          </div>

          {/* Expand/Collapse Button */}
          <Button 
            variant="ghost" 
            className={cn("w-full", isRTL && "flex-row-reverse")}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                {isRTL ? 'إخفاء التفاصيل' : 'Masquer les détails'}
              </>
            ) : (
              <>
                <ChevronDown className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                {isRTL ? 'عرض التفاصيل' : 'Voir les détails'}
              </>
            )}
          </Button>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 overflow-hidden"
              >
                <Separator />

                {/* Summary Text */}
                {summary.summary && (
                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <h4 className={cn("font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      <MessageSquare className="w-4 h-4 text-primary" />
                      {isRTL ? 'ملخص الجلسة' : 'Résumé de la session'}
                    </h4>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-foreground/80">{summary.summary}</p>
                    </div>
                  </div>
                )}

                {/* Strengths & Areas to Improve */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <h4 className={cn("font-semibold flex items-center gap-2 text-success", isRTL && "flex-row-reverse")}>
                      <Award className="w-4 h-4" />
                      {isRTL ? 'نقاط القوة' : 'Points forts'}
                    </h4>
                    <ul className="space-y-1">
                      {summary.strengths?.map((strength, index) => (
                        <li key={index} className={cn("text-sm text-foreground/80 flex items-start gap-2", isRTL && "flex-row-reverse")}>
                          <Star className="w-3 h-3 text-success mt-1 shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <h4 className={cn("font-semibold flex items-center gap-2 text-warning", isRTL && "flex-row-reverse")}>
                      <Target className="w-4 h-4" />
                      {isRTL ? 'نقاط التحسين' : 'À améliorer'}
                    </h4>
                    <ul className="space-y-1">
                      {summary.areasToImprove?.map((area, index) => (
                        <li key={index} className={cn("text-sm text-foreground/80 flex items-start gap-2", isRTL && "flex-row-reverse")}>
                          <TrendingUp className="w-3 h-3 text-warning mt-1 shrink-0" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key Topics */}
                {summary.keyTopics && summary.keyTopics.length > 0 && (
                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <h4 className={cn("font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      <BookOpen className="w-4 h-4 text-accent" />
                      {isRTL ? 'المواضيع الرئيسية' : 'Sujets abordés'}
                    </h4>
                    <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse")}>
                      {summary.keyTopics.map((topic, index) => (
                        <Badge key={index} variant="outline">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vocabulary Covered */}
                {summary.vocabularyCovered && summary.vocabularyCovered.length > 0 && (
                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <h4 className={cn("font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      <FileText className="w-4 h-4 text-primary" />
                      {isRTL ? 'المفردات المدروسة' : 'Vocabulaire couvert'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {summary.vocabularyCovered.map((word, index) => (
                        <Badge key={index} variant="secondary">{word}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grammar Points */}
                {summary.grammarPoints && summary.grammarPoints.length > 0 && (
                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <h4 className={cn("font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      <Lightbulb className="w-4 h-4 text-accent" />
                      {isRTL ? 'نقاط القواعد' : 'Points de grammaire'}
                    </h4>
                    <ul className="space-y-1">
                      {summary.grammarPoints.map((point, index) => (
                        <li key={index} className={cn("text-sm text-foreground/80 flex items-start gap-2", isRTL && "flex-row-reverse")}>
                          <span className="mt-1 shrink-0">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {summary.recommendations && summary.recommendations.length > 0 && (
                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <h4 className={cn("font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      <Lightbulb className="w-4 h-4 text-primary" />
                      {isRTL ? 'التوصيات' : 'Recommandations'}
                    </h4>
                    <ul className="space-y-1">
                      {summary.recommendations.map((recommendation, index) => (
                        <li key={index} className={cn("text-sm text-foreground/80 flex items-start gap-2", isRTL && "flex-row-reverse")}>
                          <Lightbulb className="w-3 h-3 text-primary mt-1 shrink-0" />
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StudentSessionSummaries() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isRTL = language === 'ar';
  const dateLocale = language === 'ar' ? ar : fr;

  useEffect(() => {
    const loadSummaries = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await SessionSummaryService.getMySessionSummaries();
        
        if (response.success && Array.isArray(response.data)) {
          setSummaries(response.data);
        } else {
          console.error('Invalid response format:', response);
          setSummaries([]);
        }
      } catch (error) {
        console.error('Error loading session summaries:', error);
        toast.error(
          isRTL 
            ? "فشل تحميل ملخصات الجلسات"
            : "Impossible de charger les résumés de sessions"
        );
        setSummaries([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSummaries();
  }, [user, isRTL]);
  
  // Calculate overall stats
  const averageScore = summaries.length > 0
    ? Math.round(summaries.reduce((acc, s) => acc + s.overallScore, 0) / summaries.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{isRTL ? 'جارٍ التحميل...' : 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
          <div className={cn(isRTL && "text-right")}>
            <h1 className="text-2xl font-bold">{isRTL ? 'ملخصات الجلسات' : 'Résumés de sessions'}</h1>
            <p className="text-muted-foreground">
              {isRTL 
                ? 'راجع أداءك وملاحظات كل جلسة'
                : 'Consultez vos performances et le feedback de chaque session'}
            </p>
          </div>
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className={cn("text-center px-4 py-2 rounded-lg bg-primary/10", isRTL && "text-right")}>
              <div className="text-2xl font-bold text-primary">{summaries.length}</div>
              <div className="text-xs text-muted-foreground">{isRTL ? 'جلسات' : 'Sessions'}</div>
            </div>
            {summaries.length > 0 && (
              <div className={cn("text-center px-4 py-2 rounded-lg bg-success/10", isRTL && "text-right")}>
                <div className="text-2xl font-bold text-success">{averageScore}%</div>
                <div className="text-xs text-muted-foreground">{isRTL ? 'المتوسط' : 'Moyenne'}</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Summaries List */}
      {summaries.length > 0 && (
        <div className="space-y-4">
          {summaries.map((summary) => (
            <SummaryCard 
              key={summary.id} 
              summary={summary} 
              isRTL={isRTL}
              dateLocale={dateLocale}
            />
          ))}
        </div>
      )}

      {summaries.length === 0 && (
        <motion.div variants={item}>
          <Card>
            <CardContent className={cn("py-12 text-center", isRTL && "text-right")}>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isRTL ? 'لا توجد ملخصات متاحة' : 'Aucun résumé disponible'}
              </h3>
              <p className="text-muted-foreground">
                {isRTL 
                  ? 'ستظهر الملخصات هنا بعد جلساتك المكتملة'
                  : 'Les résumés apparaîtront ici après vos sessions complétées.'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
