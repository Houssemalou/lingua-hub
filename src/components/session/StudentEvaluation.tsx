import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MessageSquare, 
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EvaluationCriteria {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  score: number;
}

interface StudentEvaluationData {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  level: string;
  criteria: EvaluationCriteria[];
  comment: string;
  isSubmitted: boolean;
  isExpanded: boolean;
}

interface StudentEvaluationProps {
  students: Array<{
    id: string;
    name: string;
    avatar?: string;
    level: string;
  }>;
  onSubmitEvaluations: (evaluations: Array<{
    studentId: string;
    criteria: Record<string, number>;
    comment: string;
  }>) => void;
  isRTL?: boolean;
}

const defaultCriteria = [
  { id: 'pronunciation', name: 'Prononciation', nameAr: 'النطق', icon: '🗣️' },
  { id: 'vocabulary', name: 'Vocabulaire', nameAr: 'المفردات', icon: '📚' },
  { id: 'grammar', name: 'Grammaire', nameAr: 'القواعد', icon: '✏️' },
  { id: 'fluency', name: 'Fluidité', nameAr: 'الطلاقة', icon: '💬' },
  { id: 'participation', name: 'Participation', nameAr: 'المشاركة', icon: '🙋' },
  { id: 'comprehension', name: 'Compréhension', nameAr: 'الفهم', icon: '🧠' },
];

export function StudentEvaluation({
  students,
  onSubmitEvaluations,
  isRTL = false,
}: StudentEvaluationProps) {
  const [evaluations, setEvaluations] = useState<StudentEvaluationData[]>(
    students.map(student => ({
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      level: student.level,
      criteria: defaultCriteria.map(c => ({ ...c, score: 50 })),
      comment: '',
      isSubmitted: false,
      isExpanded: false,
    }))
  );

  const updateCriteriaScore = (studentId: string, criteriaId: string, score: number) => {
    setEvaluations(prev => prev.map(e => {
      if (e.studentId === studentId) {
        return {
          ...e,
          criteria: e.criteria.map(c => 
            c.id === criteriaId ? { ...c, score } : c
          ),
        };
      }
      return e;
    }));
  };

  const updateComment = (studentId: string, comment: string) => {
    setEvaluations(prev => prev.map(e => 
      e.studentId === studentId ? { ...e, comment } : e
    ));
  };

  const toggleExpanded = (studentId: string) => {
    setEvaluations(prev => prev.map(e => 
      e.studentId === studentId ? { ...e, isExpanded: !e.isExpanded } : e
    ));
  };

  const submitEvaluation = (studentId: string) => {
    const evaluation = evaluations.find(e => e.studentId === studentId);
    if (!evaluation) return;

    setEvaluations(prev => prev.map(e => 
      e.studentId === studentId ? { ...e, isSubmitted: true } : e
    ));

    toast.success(
      isRTL 
        ? `تم حفظ تقييم ${evaluation.studentName}` 
        : `Évaluation de ${evaluation.studentName} enregistrée`
    );
  };

  const submitAllEvaluations = () => {
    const formattedEvaluations = evaluations.map(e => ({
      studentId: e.studentId,
      criteria: e.criteria.reduce((acc, c) => ({ ...acc, [c.id]: c.score }), {}),
      comment: e.comment,
    }));

    onSubmitEvaluations(formattedEvaluations);
    setEvaluations(prev => prev.map(e => ({ ...e, isSubmitted: true })));
    
    toast.success(
      isRTL 
        ? 'تم حفظ جميع التقييمات بنجاح' 
        : 'Toutes les évaluations ont été enregistrées'
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getAverageScore = (criteria: EvaluationCriteria[]) => {
    return Math.round(criteria.reduce((acc, c) => acc + c.score, 0) / criteria.length);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
        isRTL && "sm:flex-row-reverse"
      )}>
        <div className={isRTL ? 'text-right' : ''}>
          <h3 className="text-lg font-semibold">
            {isRTL ? 'تقييم الطلاب' : 'Évaluation des étudiants'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isRTL 
              ? `${students.length} طالب للتقييم` 
              : `${students.length} étudiant(s) à évaluer`
            }
          </p>
        </div>
        <Button onClick={submitAllEvaluations} className="gap-2">
          <Check className="w-4 h-4" />
          {isRTL ? 'حفظ جميع التقييمات' : 'Enregistrer tout'}
        </Button>
      </div>

      {/* Student Evaluations */}
      <div className="space-y-3">
        {evaluations.map((evaluation) => (
          <Collapsible 
            key={evaluation.studentId}
            open={evaluation.isExpanded}
            onOpenChange={() => toggleExpanded(evaluation.studentId)}
          >
            <Card className={cn(
              "transition-all",
              evaluation.isSubmitted && "border-green-500/30 bg-green-500/5"
            )}>
              <CollapsibleTrigger asChild>
                <CardContent className="p-4 cursor-pointer hover:bg-muted/30">
                  <div className={cn(
                    "flex items-center gap-3",
                    isRTL && "flex-row-reverse"
                  )}>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={evaluation.studentAvatar} />
                      <AvatarFallback>{evaluation.studentName.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                      <div className={cn(
                        "flex items-center gap-2",
                        isRTL && "flex-row-reverse justify-end"
                      )}>
                        <p className="font-medium">{evaluation.studentName}</p>
                        <Badge variant="outline" className="text-xs">
                          {evaluation.level}
                        </Badge>
                        {evaluation.isSubmitted && (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            {isRTL ? 'تم' : 'Fait'}
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm",
                        getScoreColor(getAverageScore(evaluation.criteria))
                      )}>
                        {isRTL ? 'المعدل: ' : 'Moyenne: '}
                        <span className="font-bold">{getAverageScore(evaluation.criteria)}%</span>
                      </p>
                    </div>

                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse"
                    )}>
                      {/* Preview stars */}
                      <div className="hidden sm:flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "w-4 h-4",
                              getAverageScore(evaluation.criteria) >= star * 20
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      {evaluation.isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 px-4 border-t border-border">
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-4"
                  >
                    {/* Criteria Sliders */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {evaluation.criteria.map((criterion) => (
                        <div key={criterion.id} className="space-y-2">
                          <div className={cn(
                            "flex items-center justify-between",
                            isRTL && "flex-row-reverse"
                          )}>
                            <span className="text-sm font-medium">
                              {criterion.icon} {isRTL ? criterion.nameAr : criterion.name}
                            </span>
                            <span className={cn(
                              "text-sm font-bold",
                              getScoreColor(criterion.score)
                            )}>
                              {criterion.score}%
                            </span>
                          </div>
                          <Slider
                            value={[criterion.score]}
                            onValueChange={([value]) => 
                              updateCriteriaScore(evaluation.studentId, criterion.id, value)
                            }
                            max={100}
                            step={5}
                            className="w-full"
                            disabled={evaluation.isSubmitted}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                      <label className={cn(
                        "text-sm font-medium flex items-center gap-2",
                        isRTL && "flex-row-reverse"
                      )}>
                        <MessageSquare className="w-4 h-4" />
                        {isRTL ? 'تعليق' : 'Commentaire'}
                      </label>
                      <Textarea
                        value={evaluation.comment}
                        onChange={(e) => updateComment(evaluation.studentId, e.target.value)}
                        placeholder={isRTL ? 'أضف ملاحظاتك هنا...' : 'Ajoutez vos remarques ici...'}
                        rows={2}
                        disabled={evaluation.isSubmitted}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    {/* Submit Button */}
                    {!evaluation.isSubmitted && (
                      <div className={cn("flex justify-end", isRTL && "justify-start")}>
                        <Button 
                          size="sm" 
                          onClick={() => submitEvaluation(evaluation.studentId)}
                          className="gap-2"
                        >
                          <Check className="w-4 h-4" />
                          {isRTL ? 'حفظ التقييم' : 'Enregistrer'}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
