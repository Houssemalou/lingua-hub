import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { StudentService } from '@/services/StudentService';

interface StudentData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: string;
  totalSessions: number;
  skills: { pronunciation: number; grammar: number; vocabulary: number; fluency: number } | null;
}

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
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // Only fetch students created by this admin
        const adminId = user?.id;
        const response = adminId ? await StudentService.getAll({ createdBy: adminId } as any) : [];
        // Normalize different possible response shapes:
        // - PaginatedResponse: { data: [...] }
        // - direct array: [ ... ]
        // - ApiResponse wrapper: { data: { data: [...] } } (some backends)
        let rawList: any[] = [];

        if (Array.isArray(response)) {
          rawList = response as any[];
        } else if (Array.isArray((response as any).data)) {
          rawList = (response as any).data;
        } else if (Array.isArray((response as any).data?.data)) {
          rawList = (response as any).data.data;
        } else {
          console.warn('Unexpected students response shape:', response);
          rawList = [];
        }

        const mapped = rawList.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email || '',
          avatar: s.avatar || '',
          level: s.level || 'A1',
          totalSessions: s.totalSessions || 0,
          skills: s.skills || null,
        }));

        setStudents(mapped);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [user?.id]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getAverageSkill = (skills: { pronunciation: number; grammar: number; vocabulary: number; fluency: number } | null) => {
    if (!skills) return 0;
    return Math.round((skills.pronunciation + skills.grammar + skills.vocabulary + skills.fluency) / 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      <motion.div variants={item} className={cn(isRTL && "text-right")}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('students.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('students.subtitle')}</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className={cn("flex flex-col sm:flex-row gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={cn("relative flex-1", isRTL && "text-right")}>
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={t('students.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(isRTL ? "pr-10 text-right" : "pl-10")}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className={cn("w-full sm:w-40", isRTL && "flex-row-reverse")}>
            <Filter className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            <SelectValue placeholder={t('students.allLevels')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('students.allLevels')}</SelectItem>
            <SelectItem value="A1">A1</SelectItem>
            <SelectItem value="A2">A2</SelectItem>
            <SelectItem value="B1">B1</SelectItem>
            <SelectItem value="B2">B2</SelectItem>
            <SelectItem value="C1">C1</SelectItem>
            <SelectItem value="C2">C2</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Students Grid - Simplified Cards */}
      <motion.div variants={item} className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredStudents.map((student) => (
          <Card key={student.id} variant="interactive" className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className={cn("flex flex-col items-center text-center gap-2 sm:gap-3")}>
                <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback className="text-sm sm:text-base">{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <h3 className="font-semibold text-foreground text-sm sm:text-base truncate w-full">
                  {student.name}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {filteredStudents.length === 0 && (
        <motion.div variants={item} className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground">{t('students.noResults')}</h3>
          <p className="text-muted-foreground mt-1">{t('students.noResultsHint')}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
