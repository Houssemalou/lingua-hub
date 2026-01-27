import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  Users, 
  GraduationCap, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

interface GeneratedToken {
  id: string;
  token: string;
  role: 'student' | 'professor';
  createdAt: Date;
  used: boolean;
}

// Mock existing tokens
const mockExistingTokens: GeneratedToken[] = [
  { id: '1', token: 'STUDENT2024', role: 'student', createdAt: new Date('2024-01-01'), used: true },
  { id: '2', token: 'LANG-ABC123', role: 'student', createdAt: new Date('2024-01-05'), used: false },
  { id: '3', token: 'PROF2024', role: 'professor', createdAt: new Date('2024-01-01'), used: true },
  { id: '4', token: 'TEACHER-ABC', role: 'professor', createdAt: new Date('2024-01-10'), used: false },
];

const generateRandomToken = (prefix: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix + '-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const AccessTokenGenerator: React.FC = () => {
  const { isRTL } = useLanguage();
  const [tokens, setTokens] = useState<GeneratedToken[]>(mockExistingTokens);
  const [studentCount, setStudentCount] = useState(5);
  const [professorCount, setProfessorCount] = useState(3);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  const generateTokens = (role: 'student' | 'professor', count: number) => {
    const prefix = role === 'student' ? 'STU' : 'PROF';
    const newTokens: GeneratedToken[] = [];
    
    for (let i = 0; i < count; i++) {
      newTokens.push({
        id: `${Date.now()}-${i}`,
        token: generateRandomToken(prefix),
        role,
        createdAt: new Date(),
        used: false,
      });
    }
    
    setTokens(prev => [...prev, ...newTokens]);
    toast.success(
      isRTL 
        ? `تم إنشاء ${count} رمز ${role === 'student' ? 'طالب' : 'أستاذ'}` 
        : `${count} token${count > 1 ? 's' : ''} ${role === 'student' ? 'étudiant' : 'professeur'} généré${count > 1 ? 's' : ''}`
    );
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success(isRTL ? 'تم نسخ الرمز' : 'Token copié');
  };

  const deleteToken = (id: string) => {
    setTokens(prev => prev.filter(t => t.id !== id));
    toast.success(isRTL ? 'تم حذف الرمز' : 'Token supprimé');
  };

  const toggleSelectToken = (id: string) => {
    setSelectedTokens(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAllTokens = (role: 'student' | 'professor') => {
    const roleTokens = tokens.filter(t => t.role === role && !t.used).map(t => t.id);
    setSelectedTokens(prev => {
      const otherRoleSelected = prev.filter(id => {
        const token = tokens.find(t => t.id === id);
        return token?.role !== role;
      });
      return [...otherRoleSelected, ...roleTokens];
    });
  };

  const exportToPDF = (role: 'student' | 'professor') => {
    const roleTokens = tokens.filter(t => t.role === role && !t.used);
    
    if (roleTokens.length === 0) {
      toast.error(isRTL ? 'لا توجد رموز للتصدير' : 'Aucun token à exporter');
      return;
    }

    const doc = new jsPDF();
    const title = role === 'student' 
      ? (isRTL ? 'رموز الوصول للطلاب' : 'Tokens d\'accès Étudiants')
      : (isRTL ? 'رموز الوصول للأساتذة' : 'Tokens d\'accès Professeurs');

    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text(title, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`LinguaAI - ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

    // Tokens table
    doc.setFontSize(12);
    doc.setTextColor(0);
    
    let y = 50;
    const lineHeight = 12;
    
    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 6, 170, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('#', 25, y);
    doc.text('Token', 40, y);
    doc.text(isRTL ? 'تاريخ الإنشاء' : 'Date de création', 120, y);
    
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    
    roleTokens.forEach((token, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y - 6, 170, 10, 'F');
      }
      
      doc.text(`${index + 1}`, 25, y);
      doc.setFont('courier', 'normal');
      doc.text(token.token, 40, y);
      doc.setFont('helvetica', 'normal');
      doc.text(token.createdAt.toLocaleDateString(), 120, y);
      
      y += lineHeight;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      isRTL ? 'هذا المستند سري - لا تشاركه' : 'Document confidentiel - Ne pas partager',
      105,
      285,
      { align: 'center' }
    );

    doc.save(`tokens-${role}-${Date.now()}.pdf`);
    toast.success(isRTL ? 'تم تصدير PDF' : 'PDF exporté avec succès');
  };

  const exportSelectedToPDF = () => {
    if (selectedTokens.length === 0) {
      toast.error(isRTL ? 'لم يتم تحديد أي رمز' : 'Aucun token sélectionné');
      return;
    }

    const selectedTokensData = tokens.filter(t => selectedTokens.includes(t.id));
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text(isRTL ? 'رموز الوصول المحددة' : 'Tokens d\'accès sélectionnés', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`LinguaAI - ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

    let y = 50;
    const lineHeight = 12;
    
    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 6, 170, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('#', 25, y);
    doc.text('Token', 40, y);
    doc.text('Rôle', 100, y);
    doc.text('Date', 140, y);
    
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    
    selectedTokensData.forEach((token, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y - 6, 170, 10, 'F');
      }
      
      doc.text(`${index + 1}`, 25, y);
      doc.setFont('courier', 'normal');
      doc.text(token.token, 40, y);
      doc.setFont('helvetica', 'normal');
      doc.text(token.role === 'student' ? 'Étudiant' : 'Professeur', 100, y);
      doc.text(token.createdAt.toLocaleDateString(), 140, y);
      
      y += lineHeight;
    });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      isRTL ? 'هذا المستند سري' : 'Document confidentiel',
      105,
      285,
      { align: 'center' }
    );

    doc.save(`tokens-selected-${Date.now()}.pdf`);
    setSelectedTokens([]);
    toast.success(isRTL ? 'تم تصدير PDF' : 'PDF exporté avec succès');
  };

  const studentTokens = tokens.filter(t => t.role === 'student');
  const professorTokens = tokens.filter(t => t.role === 'professor');
  const availableStudentTokens = studentTokens.filter(t => !t.used).length;
  const availableProfessorTokens = professorTokens.filter(t => !t.used).length;

  const TokenCard = ({ token }: { token: GeneratedToken }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        token.used 
          ? "bg-muted/50 opacity-60" 
          : "bg-card hover:border-primary/50",
        selectedTokens.includes(token.id) && "border-primary ring-2 ring-primary/20"
      )}
    >
      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
        <input
          type="checkbox"
          checked={selectedTokens.includes(token.id)}
          onChange={() => toggleSelectToken(token.id)}
          disabled={token.used}
          className="w-4 h-4 rounded border-gray-300"
        />
        <div className={isRTL ? "text-right" : ""}>
          <code className="font-mono text-sm font-semibold text-foreground">
            {token.token}
          </code>
          <p className="text-xs text-muted-foreground">
            {token.createdAt.toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        {token.used ? (
          <Badge variant="secondary" className="text-xs">
            {isRTL ? 'مستخدم' : 'Utilisé'}
          </Badge>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => copyToken(token.token)}
            >
              {copiedToken === token.token ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => deleteToken(token.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Key className="w-5 h-5 text-primary" />
          {isRTL ? 'إدارة رموز الوصول' : 'Gestion des tokens d\'accès'}
        </CardTitle>
        <CardDescription>
          {isRTL 
            ? 'إنشاء وإدارة رموز الوصول للطلاب والأساتذة' 
            : 'Générez et gérez les tokens d\'accès pour les étudiants et professeurs'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
            <Users className="w-6 h-6 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{studentTokens.length}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'رموز الطلاب' : 'Tokens étudiants'}</p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-600 dark:text-green-400 mb-2" />
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{availableStudentTokens}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'متاح' : 'Disponibles'}</p>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center">
            <GraduationCap className="w-6 h-6 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{professorTokens.length}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'رموز الأساتذة' : 'Tokens professeurs'}</p>
          </div>
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-orange-600 dark:text-orange-400 mb-2" />
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{availableProfessorTokens}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'متاح' : 'Disponibles'}</p>
          </div>
        </div>

        {/* Selected tokens actions */}
        <AnimatePresence>
          {selectedTokens.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between"
            >
              <span className="text-sm font-medium">
                {selectedTokens.length} {isRTL ? 'رمز محدد' : 'token(s) sélectionné(s)'}
              </span>
              <Button size="sm" onClick={exportSelectedToPDF}>
                <Download className="w-4 h-4 mr-2" />
                {isRTL ? 'تصدير المحدد' : 'Exporter sélection'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="students" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Users className="w-4 h-4" />
              {isRTL ? 'الطلاب' : 'Étudiants'}
            </TabsTrigger>
            <TabsTrigger value="professors" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <GraduationCap className="w-4 h-4" />
              {isRTL ? 'الأساتذة' : 'Professeurs'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            {/* Generate Section */}
            <div className={cn("flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg", isRTL && "sm:flex-row-reverse")}>
              <div className="flex-1">
                <Label htmlFor="student-count" className="text-sm mb-2 block">
                  {isRTL ? 'عدد الرموز' : 'Nombre de tokens'}
                </Label>
                <Input
                  id="student-count"
                  type="number"
                  min={1}
                  max={50}
                  value={studentCount}
                  onChange={(e) => setStudentCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-full"
                />
              </div>
              <div className={cn("flex gap-2 items-end", isRTL && "flex-row-reverse")}>
                <Button onClick={() => generateTokens('student', studentCount)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {isRTL ? 'إنشاء' : 'Générer'}
                </Button>
                <Button variant="outline" onClick={() => exportToPDF('student')}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="ghost" size="icon" onClick={() => selectAllTokens('student')}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Token List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {studentTokens.map(token => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </AnimatePresence>
              {studentTokens.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{isRTL ? 'لا توجد رموز للطلاب' : 'Aucun token étudiant'}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="professors" className="space-y-4">
            {/* Generate Section */}
            <div className={cn("flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg", isRTL && "sm:flex-row-reverse")}>
              <div className="flex-1">
                <Label htmlFor="professor-count" className="text-sm mb-2 block">
                  {isRTL ? 'عدد الرموز' : 'Nombre de tokens'}
                </Label>
                <Input
                  id="professor-count"
                  type="number"
                  min={1}
                  max={50}
                  value={professorCount}
                  onChange={(e) => setProfessorCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-full"
                />
              </div>
              <div className={cn("flex gap-2 items-end", isRTL && "flex-row-reverse")}>
                <Button onClick={() => generateTokens('professor', professorCount)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {isRTL ? 'إنشاء' : 'Générer'}
                </Button>
                <Button variant="outline" onClick={() => exportToPDF('professor')}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="ghost" size="icon" onClick={() => selectAllTokens('professor')}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Token List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {professorTokens.map(token => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </AnimatePresence>
              {professorTokens.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{isRTL ? 'لا توجد رموز للأساتذة' : 'Aucun token professeur'}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
