import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Mail, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockStudents } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getAverageSkill = (skills: { pronunciation: number; grammar: number; vocabulary: number; fluency: number }) => {
    return Math.round((skills.pronunciation + skills.grammar + skills.vocabulary + skills.fluency) / 4);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage and view all enrolled students</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="A1">A1</SelectItem>
            <SelectItem value="A2">A2</SelectItem>
            <SelectItem value="B1">B1</SelectItem>
            <SelectItem value="B2">B2</SelectItem>
            <SelectItem value="C1">C1</SelectItem>
            <SelectItem value="C2">C2</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Students Grid */}
      <motion.div variants={item} className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card key={student.id} variant="interactive">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <Avatar className="w-12 h-12 sm:w-14 sm:h-14 shrink-0">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">{student.name}</h3>
                    <Badge variant={student.level.toLowerCase() as any} className="text-xs">{student.level}</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">@{student.nickname}</p>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{getAverageSkill(student.skills)}%</span>
                </div>
                <Progress value={getAverageSkill(student.skills)} className="h-1.5 sm:h-2" />
              </div>

              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{student.totalSessions} sessions</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground">
                  <span>{student.hoursLearned}h learned</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs sm:text-sm h-8 sm:h-9">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Contact</span>
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 text-xs sm:text-sm h-8 sm:h-9">
                  <span className="sm:hidden">View</span>
                  <span className="hidden sm:inline">View Profile</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {filteredStudents.length === 0 && (
        <motion.div variants={item} className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground">No students found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </motion.div>
      )}
    </motion.div>
  );
}
