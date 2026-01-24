import React, { useState } from 'react';
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
import { getStudentVisibleSummaries, ProfessorSessionSummary } from '@/data/professorSummaries';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  summary: ProfessorSessionSummary;
}

function SummaryCard({ summary }: SummaryCardProps) {
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
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg">{summary.roomName}</CardTitle>
                <Badge variant={summary.level.toLowerCase() as any}>{summary.level}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(summary.date), 'dd MMM yyyy', { locale: fr })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {summary.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {summary.professorName}
                </span>
              </div>
            </div>
            <div className={`flex flex-col items-center p-3 rounded-xl ${getScoreBg(summary.overallScore)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(summary.overallScore)}`}>
                {summary.overallScore}%
              </span>
              <span className="text-xs text-muted-foreground">Score</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Skills Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Prononciation', value: summary.pronunciation },
              { label: 'Grammaire', value: summary.grammar },
              { label: 'Vocabulaire', value: summary.vocabulary },
              { label: 'Fluidité', value: summary.fluency },
              { label: 'Participation', value: summary.participation },
            ].map((skill) => (
              <div key={skill.label} className="text-center p-2 rounded-lg bg-muted/50">
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
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Masquer les détails
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Voir les détails
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

                {/* Professor Feedback */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Retour du professeur
                  </h4>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={summary.professorAvatar} />
                      <AvatarFallback>{summary.professorName[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-foreground/80 italic">"{summary.professorFeedback}"</p>
                  </div>
                </div>

                {/* Strengths & Areas to Improve */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-success">
                      <Award className="w-4 h-4" />
                      Points forts
                    </h4>
                    <ul className="space-y-1">
                      {summary.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-foreground/80 flex items-start gap-2">
                          <Star className="w-3 h-3 text-success mt-1 shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-warning">
                      <Target className="w-4 h-4" />
                      À améliorer
                    </h4>
                    <ul className="space-y-1">
                      {summary.areasToImprove.map((area, index) => (
                        <li key={index} className="text-sm text-foreground/80 flex items-start gap-2">
                          <TrendingUp className="w-3 h-3 text-warning mt-1 shrink-0" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Topics Discussed */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    Sujets abordés
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.topicsDiscussed.map((topic, index) => (
                      <Badge key={index} variant="outline">{topic}</Badge>
                    ))}
                  </div>
                </div>

                {/* New Vocabulary */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Nouveau vocabulaire
                  </h4>
                  <div className="grid gap-2">
                    {summary.newVocabulary.map((vocab, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/50 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">{vocab.word}</span>
                          <span className="text-muted-foreground">—</span>
                          <span className="text-foreground/80">{vocab.translation}</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">"{vocab.example}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-warning" />
                    Recommandations
                  </h4>
                  <ul className="space-y-2">
                    {summary.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-foreground/80 flex items-start gap-2 p-2 rounded bg-warning/5">
                        <span className="font-bold text-warning">{index + 1}.</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next Session Focus */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <h4 className="font-semibold mb-1">📌 Prochain focus de session</h4>
                  <p className="text-foreground/80">{summary.nextSessionFocus}</p>
                </div>
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
  const summaries = user?.student ? getStudentVisibleSummaries(user.student.id) : [];
  
  // Calculate overall stats
  const averageScore = Math.round(
    summaries.reduce((acc, s) => acc + s.overallScore, 0) / summaries.length
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Résumés de sessions</h1>
            <p className="text-muted-foreground">
              Consultez vos performances et le feedback de chaque session
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">{summaries.length}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center px-4 py-2 rounded-lg bg-success/10">
              <div className="text-2xl font-bold text-success">{averageScore}%</div>
              <div className="text-xs text-muted-foreground">Moyenne</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summaries List */}
      <div className="space-y-4">
        {summaries.map((summary) => (
          <SummaryCard key={summary.id} summary={summary} />
        ))}
      </div>

      {summaries.length === 0 && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun résumé disponible</h3>
              <p className="text-muted-foreground">
                Les résumés apparaîtront ici après vos sessions complétées.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
