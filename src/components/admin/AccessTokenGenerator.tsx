import React, { useState, useEffect } from 'react';
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
import { AuthService } from '@/services/AuthService';

interface GeneratedToken {
  token: string;
  role: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  expiresAt: string;
  createdAt: string;
}

export const AccessTokenGenerator: React.FC = () => {
  const { isRTL } = useLanguage();
  const [studentTokens, setStudentTokens] = useState<GeneratedToken[]>([]);
  const [professorTokens, setProfessorTokens] = useState<GeneratedToken[]>([]);
  const [adminTokens, setAdminTokens] = useState<GeneratedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  // Load tokens on component mount
  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const [studentRes, professorRes, adminRes] = await Promise.all([
        AuthService.getAvailableAccessTokens('STUDENT'),
        AuthService.getAvailableAccessTokens('PROFESSOR'),
        AuthService.getAvailableAccessTokens('ADMIN'),
      ]);

      if (studentRes.success) setStudentTokens(studentRes.data.map(token => ({ ...token, role: token.role as 'STUDENT' })));
      if (professorRes.success) setProfessorTokens(professorRes.data.map(token => ({ ...token, role: token.role as 'PROFESSOR' })));
      if (adminRes.success) setAdminTokens(adminRes.data.map(token => ({ ...token, role: token.role as 'ADMIN' })));
    } catch (error) {
      toast.error(isRTL ? 'فشل في تحميل الرموز' : 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async (role: 'STUDENT' | 'PROFESSOR' | 'ADMIN') => {
    setLoading(true);
    try {
      const response = await AuthService.generateAccessToken(role);
      if (response.success) {
        const newToken = response.data;
        const typedToken: GeneratedToken = {
          ...newToken,
          role: newToken.role as 'STUDENT' | 'PROFESSOR' | 'ADMIN'
        };
        if (role === 'STUDENT') {
          setStudentTokens(prev => [...prev, typedToken]);
        } else if (role === 'PROFESSOR') {
          setProfessorTokens(prev => [...prev, typedToken]);
        } else {
          setAdminTokens(prev => [...prev, typedToken]);
        }
        toast.success(isRTL ? 'تم إنشاء الرمز بنجاح' : 'Token generated successfully');
      } else {
        toast.error(response.error || 'Failed to generate token');
      }
    } catch (error) {
      toast.error(isRTL ? 'فشل في إنشاء الرمز' : 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success(isRTL ? 'تم نسخ الرمز' : 'Token copié');
  };

  const toggleSelectToken = (token: string) => {
    setSelectedTokens(prev => 
      prev.includes(token) ? prev.filter(t => t !== token) : [...prev, token]
    );
  };

  const selectAllTokens = (role: 'STUDENT' | 'PROFESSOR' | 'ADMIN') => {
    const roleTokens = getTokensByRole(role).map(t => t.token);
    setSelectedTokens(prev => {
      const otherRoleSelected = prev.filter(token => {
        const tokenRole = getTokenRole(token);
        return tokenRole !== role;
      });
      return [...otherRoleSelected, ...roleTokens];
    });
  };

  const getTokensByRole = (role: 'STUDENT' | 'PROFESSOR' | 'ADMIN'): GeneratedToken[] => {
    switch (role) {
      case 'STUDENT': return studentTokens;
      case 'PROFESSOR': return professorTokens;
      case 'ADMIN': return adminTokens;
      default: return [];
    }
  };

  const getTokenRole = (token: string): 'STUDENT' | 'PROFESSOR' | 'ADMIN' | null => {
    if (studentTokens.some(t => t.token === token)) return 'STUDENT';
    if (professorTokens.some(t => t.token === token)) return 'PROFESSOR';
    if (adminTokens.some(t => t.token === token)) return 'ADMIN';
    return null;
  };

  const exportToPDF = (role: 'STUDENT' | 'PROFESSOR' | 'ADMIN') => {
    const roleTokens = getTokensByRole(role);
    
    if (roleTokens.length === 0) {
      toast.error(isRTL ? 'لا توجد رموز للتصدير' : 'Aucun token à exporter');
      return;
    }

    const doc = new jsPDF();
    const title = role === 'STUDENT' 
      ? (isRTL ? 'رموز الوصول للطلاب' : 'Tokens d\'accès Étudiants')
      : role === 'PROFESSOR'
      ? (isRTL ? 'رموز الوصول للأساتذة' : 'Tokens d\'accès Professeurs')
      : (isRTL ? 'رموز الوصول للإداريين' : 'Tokens d\'accès Administrateurs');

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
      doc.text(new Date(token.createdAt).toLocaleDateString(), 120, y);
      
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

    doc.save(`tokens-${role.toLowerCase()}-${Date.now()}.pdf`);
    toast.success(isRTL ? 'تم تصدير PDF' : 'PDF exporté avec succès');
  };

  const exportSelectedToPDF = () => {
    if (selectedTokens.length === 0) {
      toast.error(isRTL ? 'لم يتم تحديد أي رمز' : 'Aucun token sélectionné');
      return;
    }

    const selectedTokensData = [
      ...studentTokens.filter(t => selectedTokens.includes(t.token)),
      ...professorTokens.filter(t => selectedTokens.includes(t.token)),
      ...adminTokens.filter(t => selectedTokens.includes(t.token)),
    ];
    
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
      const roleText = token.role === 'STUDENT' ? 'Étudiant' : token.role === 'PROFESSOR' ? 'Professeur' : 'Administrateur';
      doc.text(roleText, 100, y);
      doc.text(new Date(token.createdAt).toLocaleDateString(), 140, y);
      
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

  const availableStudentTokens = studentTokens.length;
  const availableProfessorTokens = professorTokens.length;
  const availableAdminTokens = adminTokens.length;

  const TokenCard = ({ token, role }: { token: GeneratedToken; role: 'STUDENT' | 'PROFESSOR' | 'ADMIN' }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        "bg-card hover:border-primary/50",
        selectedTokens.includes(token.token) && "border-primary ring-2 ring-primary/20"
      )}
    >
      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
        <input
          type="checkbox"
          checked={selectedTokens.includes(token.token)}
          onChange={() => toggleSelectToken(token.token)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <div className={isRTL ? "text-right" : ""}>
          <code className="font-mono text-sm font-semibold text-foreground">
            {token.token}
          </code>
          <p className="text-xs text-muted-foreground">
            {new Date(token.createdAt).toLocaleDateString()} • Expires: {new Date(token.expiresAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        <Badge variant="outline" className="text-xs">
          {role}
        </Badge>
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
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center">
            <GraduationCap className="w-6 h-6 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{professorTokens.length}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'رموز الأساتذة' : 'Tokens professeurs'}</p>
          </div>
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-center">
            <Key className="w-6 h-6 mx-auto text-orange-600 dark:text-orange-400 mb-2" />
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{adminTokens.length}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'رموز الإداريين' : 'Tokens admins'}</p>
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
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="students" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Users className="w-4 h-4" />
              {isRTL ? 'الطلاب' : 'Étudiants'}
            </TabsTrigger>
            <TabsTrigger value="professors" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <GraduationCap className="w-4 h-4" />
              {isRTL ? 'الأساتذة' : 'Professeurs'}
            </TabsTrigger>
            <TabsTrigger value="admins" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Key className="w-4 h-4" />
              {isRTL ? 'الإداريون' : 'Admins'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            {/* Generate Section */}
            <div className={cn("flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg", isRTL && "sm:flex-row-reverse")}>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'انقر على الزر لإنشاء رمز وصول جديد للطلاب' : 'Cliquez sur le bouton pour générer un nouveau token d\'accès pour les étudiants'}
                </p>
              </div>
              <div className={cn("flex gap-2 items-end", isRTL && "flex-row-reverse")}>
                <Button 
                  onClick={() => generateToken('STUDENT')} 
                  disabled={loading}
                  className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isRTL ? 'إنشاء رمز طالب' : 'Générer token étudiant'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => selectAllTokens('STUDENT')}
                  className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isRTL ? 'تحديد الكل' : 'Tout sélectionner'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => exportToPDF('STUDENT')}
                  className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  <Download className="w-4 h-4" />
                  {isRTL ? 'تصدير PDF' : 'Exporter PDF'}
                </Button>
              </div>
            </div>

            {/* Token List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {studentTokens.map(token => (
                  <TokenCard key={token.token} token={token} role="STUDENT" />
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
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'انقر على الزر لإنشاء رمز وصول جديد للأساتذة' : 'Cliquez sur le bouton pour générer un nouveau token d\'accès pour les professeurs'}
                </p>
              </div>
              <div className={cn("flex gap-2 items-end", isRTL && "flex-row-reverse")}>
                <Button 
                  onClick={() => generateToken('PROFESSOR')} 
                  disabled={loading}
                  className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isRTL ? 'إنشاء رمز أستاذ' : 'Générer token professeur'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => selectAllTokens('PROFESSOR')}
                  className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isRTL ? 'تحديد الكل' : 'Tout sélectionner'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => exportToPDF('PROFESSOR')}
                  className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  <Download className="w-4 h-4" />
                  {isRTL ? 'تصدير PDF' : 'Exporter PDF'}
                </Button>
              </div>
            </div>

            {/* Token List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {professorTokens.map(token => (
                  <TokenCard key={token.token} token={token} role="PROFESSOR" />
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

          <TabsContent value="admins" className="space-y-4">
            {/* Generate Section */}
            <div className={cn("flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg", isRTL && "sm:flex-row-reverse")}>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'انقر على الزر لإنشاء رمز وصول جديد للإداريين' : 'Cliquez sur le bouton pour générer un nouveau token d\'accès pour les administrateurs'}
                </p>
              </div>
              <div className={cn("flex gap-2 items-end", isRTL && "flex-row-reverse")}>
                <Button 
                  onClick={() => generateToken('ADMIN')} 
                  disabled={loading}
                  className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isRTL ? 'إنشاء رمز إداري' : 'Générer token admin'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => selectAllTokens('ADMIN')}
                  className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isRTL ? 'تحديد الكل' : 'Tout sélectionner'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => exportToPDF('ADMIN')}
                  className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  <Download className="w-4 h-4" />
                  {isRTL ? 'تصدير PDF' : 'Exporter PDF'}
                </Button>
              </div>
            </div>

            {/* Token List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {adminTokens.map(token => (
                  <TokenCard key={token.token} token={token} role="ADMIN" />
                ))}
              </AnimatePresence>
              {adminTokens.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{isRTL ? 'لا توجد رموز للإداريين' : 'Aucun token admin'}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
