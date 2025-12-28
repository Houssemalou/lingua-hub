import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { currentStudent } from '@/data/mockData';

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

const levelDescriptions: Record<string, { name: string; description: string; minScore: number }> = {
  A1: { name: 'Beginner', description: 'Can understand basic phrases and expressions', minScore: 0 },
  A2: { name: 'Elementary', description: 'Can communicate in simple, routine tasks', minScore: 20 },
  B1: { name: 'Intermediate', description: 'Can deal with most travel situations', minScore: 40 },
  B2: { name: 'Upper Intermediate', description: 'Can interact fluently with native speakers', minScore: 60 },
  C1: { name: 'Advanced', description: 'Can express ideas fluently and spontaneously', minScore: 80 },
  C2: { name: 'Mastery', description: 'Can understand virtually everything heard or read', minScore: 95 },
};

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function StudentProgress() {
  const averageProgress = Math.round(
    (currentStudent.skills.pronunciation + 
     currentStudent.skills.grammar + 
     currentStudent.skills.vocabulary + 
     currentStudent.skills.fluency) / 4
  );

  const currentLevelIndex = levels.indexOf(currentStudent.level);
  const nextLevel = levels[currentLevelIndex + 1];
  const progressToNextLevel = averageProgress - levelDescriptions[currentStudent.level].minScore;
  const rangeToNextLevel = nextLevel 
    ? levelDescriptions[nextLevel].minScore - levelDescriptions[currentStudent.level].minScore
    : 20;

  const skillDetails = [
    { 
      name: 'Pronunciation', 
      value: currentStudent.skills.pronunciation,
      icon: '🗣️',
      description: 'Your ability to produce sounds accurately',
      color: 'bg-level-a1'
    },
    { 
      name: 'Grammar', 
      value: currentStudent.skills.grammar,
      icon: '📝',
      description: 'Understanding and using language rules',
      color: 'bg-level-b1'
    },
    { 
      name: 'Vocabulary', 
      value: currentStudent.skills.vocabulary,
      icon: '📚',
      description: 'Knowledge of words and their meanings',
      color: 'bg-level-b2'
    },
    { 
      name: 'Fluency', 
      value: currentStudent.skills.fluency,
      icon: '💬',
      description: 'Smoothness and flow of speech',
      color: 'bg-level-c1'
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Progress & Level</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Track your language learning journey</p>
      </motion.div>

      {/* Current Level Card */}
      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <div className="gradient-accent p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl bg-sidebar-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-sidebar-primary-foreground">{currentStudent.level}</span>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-sidebar-primary-foreground">
                    {levelDescriptions[currentStudent.level].name}
                  </h2>
                  <p className="text-sidebar-primary-foreground/80 mt-1 max-w-md text-sm sm:text-base">
                    {levelDescriptions[currentStudent.level].description}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sidebar-primary-foreground/70 text-xs sm:text-sm">Overall Progress</p>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sidebar-primary-foreground mt-1">{averageProgress}%</p>
              </div>
            </div>
          </div>
          
          {nextLevel && (
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress to {nextLevel}</span>
                  <span className="text-muted-foreground">
                    {Math.round((progressToNextLevel / rangeToNextLevel) * 100)}%
                  </span>
                </div>
                <Progress value={(progressToNextLevel / rangeToNextLevel) * 100} className="h-2 sm:h-3" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Keep practicing! You need {rangeToNextLevel - progressToNextLevel} more points to reach {nextLevel}.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* CEFR Level Path */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Award className="w-5 h-5 text-accent" />
              CEFR Level Path
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="flex items-center justify-between relative min-w-[400px] sm:min-w-0 px-2">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2" />
              {levels.map((level, index) => {
                const isCompleted = index < currentLevelIndex;
                const isCurrent = index === currentLevelIndex;
                const isFuture = index > currentLevelIndex;
                
                return (
                  <div key={level} className="relative flex flex-col items-center z-10">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                        isCompleted
                          ? 'bg-success text-success-foreground'
                          : isCurrent
                            ? 'bg-accent text-accent-foreground ring-2 sm:ring-4 ring-accent/30'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {level}
                    </div>
                    <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium ${
                      isCurrent ? 'text-accent' : isFuture ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {levelDescriptions[level].name}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Skill Breakdown */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Skill Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {skillDetails.map((skill) => (
                <div key={skill.name} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{skill.name}</span>
                        <span className="text-lg font-bold text-foreground">{skill.value}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{skill.description}</p>
                    </div>
                  </div>
                  <Progress value={skill.value} className="h-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-warning" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: '🎯', title: 'First Session', desc: 'Completed your first learning session' },
                { icon: '🔥', title: '7 Day Streak', desc: 'Practiced for 7 consecutive days' },
                { icon: '💬', title: 'Conversation Pro', desc: 'Participated in 10 conversations' },
                { icon: '📚', title: 'Vocabulary Builder', desc: 'Learned 100 new words' },
                { icon: '⭐', title: 'Level Up!', desc: 'Reached B1 level' },
                { icon: '🏆', title: 'Top Student', desc: 'Ranked in top 10% this month' },
              ].map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border"
                >
                  <span className="text-3xl">{achievement.icon}</span>
                  <div>
                    <p className="font-medium text-foreground">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
