import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Plus, Edit, Trash2, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { StudentService } from '@/services/StudentService';
import { getLevelLabel } from '@/lib/levelLabels';
import { toast } from 'sonner';
import { StudentModel } from '@/models';

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

export default function AdminStudents() {
  const { user } = useAuth();
  const { language, isRTL, t } = useLanguage();
  const [students, setStudents] = useState<StudentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const response = await StudentService.getAll({ createdBy: user?.id } as any);
        if (response && (response as any).success !== undefined) {
          if ((response as any).success) {
            const data = (response as any).data?.data || (response as any).data || [];
            setStudents(Array.isArray(data) ? data : []);
          } else {
            toast.error(t('errors.loadStudents') || (isRTL ? 'فشل تحميل الطلاب' : 'Failed to load students'));
          }
        } else {
          const data = (response as any)?.data || [];
          setStudents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        toast.error(isRTL ? 'فشل تحميل الطلاب' : 'Failed to load students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadStudents();
    }
  }, [user?.id, isRTL]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && student.isActive) ||
                         (statusFilter === 'inactive' && !student.isActive);
    return matchesSearch && matchesLevel && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-72 skeleton rounded" />
          <div className="h-4 w-96 mt-2 skeleton rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 skeleton rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 skeleton rounded" />
                    <div className="h-3 w-24 skeleton rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold">{t('nav.students') || (isRTL ? 'إدارة الطلاب' : 'Student Management')}</h1>
        <p className="text-muted-foreground mt-1">
          {isRTL ? 'عرض وإدارة جميع الطلاب' : 'View and manage all students'}
        </p>
      </motion.div>

      <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? 'البحث عن طالب...' : 'Search students...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={isRTL ? 'pr-10 pl-3 text-right' : 'pl-10'}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLevelFilter('all')}>
            {isRTL ? 'جميع المستويات' : 'All Levels'}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {isRTL ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? (isRTL ? 'لا توجد نتائج للبحث' : 'No results found')
                  : (isRTL ? 'لا يوجد طلاب بعد' : 'No students yet')}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback>{student.name?.charAt(0) || 'S'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{student.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{getLevelLabel(student.level)}</Badge>
                      {student.isActive ? (
                        <Badge variant="default" className="bg-green-500">{isRTL ? 'نشط' : 'Active'}</Badge>
                      ) : (
                        <Badge variant="secondary">{isRTL ? 'غير نشط' : 'Inactive'}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className={isRTL ? 'flex items-center gap-2 flex-row-reverse' : 'flex items-center gap-2'}>
              <Users className="w-5 h-5" />
              {isRTL ? 'إحصائيات الطلاب' : 'Student Statistics'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? 'إجمالي الطلاب' : 'Total Students'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{students.filter(s => s.isActive).length}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? 'نشط' : 'Active'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{students.filter(s => !s.isActive).length}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? 'غير نشط' : 'Inactive'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{new Set(students.map(s => s.level)).size}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? 'المستويات' : 'Levels'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
