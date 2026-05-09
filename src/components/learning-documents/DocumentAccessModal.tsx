import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { LearningDocumentService } from '@/services/LearningDocumentService';
import { DocumentAccessModel, DocumentAccessResponse } from '@/models';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { Search, Users, ChevronLeft, ChevronRight, Calendar, Clock, ArrowUpDown } from 'lucide-react';

interface DocumentAccessModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

const PAGE_SIZE = 10;

export function DocumentAccessModal({
  open,
  onClose,
  documentId,
  documentTitle,
}: DocumentAccessModalProps) {
  const { language, isRTL } = useLanguage();
  const dateLocale = language === 'ar' ? ar : fr;

  const [accessData, setAccessData] = useState<DocumentAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAccessData = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    const res = await LearningDocumentService.getDocumentAccess(documentId, page, PAGE_SIZE);
    if (res.success && res.data) {
      setAccessData(res.data);
    } else {
      setError(res.error || (isRTL ? 'فشل في تحميل البيانات' : 'Échec du chargement des données'));
    }

    setLoading(false);
  }, [documentId, isRTL]);

  useEffect(() => {
    if (open && documentId) {
      setCurrentPage(1);
      fetchAccessData(1);
    }
  }, [open, documentId, fetchAccessData]);

  const filteredStudents = accessData?.data.filter(student =>
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const dateA = new Date(a.accessedAt).getTime();
    const dateB = new Date(b.accessedAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalPages = accessData?.totalPages || 1;
  const totalStudents = accessData?.total || 0;
  const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalStudents);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchAccessData(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchAccessData(newPage);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: dateLocale });
    } catch {
      return dateString;
    }
  };

  const formatFullDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat(isRTL ? 'ar-TN' : 'fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <Users className="w-5 h-5" />
            {isRTL ? 'قائمة التلاميذ الذين فتحوا الوثيقة' : 'Liste des élèves ayant ouvert le document'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal">
            {documentTitle}
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'البحث عن تلميذ...' : 'Rechercher un élève...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn('pl-10', isRTL && 'pr-10 pl-3 text-right')}
              />
            </div>
            <Badge variant="secondary">
              {totalStudents} {isRTL ? 'تلميذ' : 'élève(s)'}
            </Badge>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={() => fetchAccessData(currentPage)}>
                  {isRTL ? 'إعادة المحاولة' : 'Réessayer'}
                </Button>
              </div>
            ) : sortedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? (isRTL ? 'لا توجد نتائج للبحث' : 'Aucun résultat pour cette recherche')
                    : (isRTL ? 'لا يوجد تلاميذ فتحوا هذه الوثيقة بعد' : 'Aucun élève n\'a encore ouvert ce document')}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn(isRTL && 'text-right')}>
                        {isRTL ? 'التلميذ' : 'Élève'}
                      </TableHead>
                      <TableHead className={cn(isRTL && 'text-right')}>
                        {isRTL ? 'المستوى' : 'Niveau'}
                      </TableHead>
                      <TableHead className={cn(isRTL && 'text-right')}>
                        {isRTL ? 'تاريخ الفتح' : 'Date d\'ouverture'}
                      </TableHead>
                      <TableHead className={cn(isRTL && 'text-right')}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleSortOrder}
                          className={cn('h-8 px-2', isRTL && 'flex-row-reverse')}
                        >
                          {isRTL ? 'وقت الفتح' : 'Temps écoulé'}
                          <ArrowUpDown className="w-3 h-3 ml-1" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className={cn(isRTL && 'text-right')}>
                          <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={student.studentAvatar} />
                              <AvatarFallback>
                                {student.studentName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(isRTL && 'text-right')}>
                              <p className="font-medium text-sm">{student.studentName}</p>
                              {student.level && (
                                <p className="text-xs text-muted-foreground">
                                  {student.level}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={cn(isRTL && 'text-right')}>
                          {student.level ? (
                            <Badge variant="outline">{student.level}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className={cn(isRTL && 'text-right')}>
                          <div className={cn('flex items-center gap-1.5', isRTL && 'flex-row-reverse')}>
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm" title={formatFullDate(student.accessedAt)}>
                              {formatDate(student.accessedAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={cn(isRTL && 'text-right')}>
                          <div className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', isRTL && 'flex-row-reverse')}>
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(student.accessedAt)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {!loading && !error && sortedStudents.length > 0 && (
            <div className={cn('flex items-center justify-between pt-4 border-t', isRTL && 'flex-row-reverse')}>
              <div className="text-sm text-muted-foreground">
                {isRTL ? 'عرض' : 'Affichage'} {startIndex}-{endIndex} {isRTL ? 'من' : 'de'} {totalStudents}
              </div>
              <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  {isRTL ? 'التالي' : 'Précédent'}
                </Button>
                <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          fetchAccessData(pageNum);
                        }}
                        className="w-9 h-9"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  {isRTL ? 'السابق' : 'Suivant'}
                  {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
