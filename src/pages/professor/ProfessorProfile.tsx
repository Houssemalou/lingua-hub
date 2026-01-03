import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  Star,
  Languages,
  BookOpen,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

export default function ProfessorProfile() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const professor = user?.professor;

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(professor?.bio || '');
  const [specialization, setSpecialization] = useState(professor?.specialization || '');

  const dateLocale = language === 'ar' ? ar : fr;

  const handleSave = () => {
    toast.success(isRTL ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profil mis à jour avec succès !');
    setIsEditing(false);
  };

  if (!professor) {
    return null;
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {isRTL ? 'ملفي الشخصي' : 'Mon Profil'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRTL ? 'إدارة معلومات حسابك' : 'Gérer les informations de votre compte'}
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <motion.div variants={item} className="lg:col-span-1">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center">
                <img
                  src={professor.avatar}
                  alt={professor.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-primary/20"
                />
                <h2 className="text-xl font-bold text-foreground">{professor.name}</h2>
                <p className="text-muted-foreground">{professor.email}</p>
                
                <div className="flex items-center justify-center gap-1 mt-3">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-lg">{professor.rating}</span>
                  <span className="text-muted-foreground">/5</span>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {professor.languages.map((lang) => (
                    <Badge key={lang} variant="secondary">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'عضو منذ' : 'Membre depuis'}
                    </p>
                    <p className="font-medium">
                      {format(new Date(professor.joinedAt), 'PP', { locale: dateLocale })}
                    </p>
                  </div>
                </div>

                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'إجمالي الجلسات' : 'Total Sessions'}
                    </p>
                    <p className="font-medium">{professor.totalSessions}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
              <CardTitle>{isRTL ? 'المعلومات الشخصية' : 'Informations personnelles'}</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                  {isRTL ? 'تعديل' : 'Modifier'}
                </Button>
              ) : (
                <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                    {isRTL ? 'حفظ' : 'Enregistrer'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <User className="w-4 h-4" />
                    {isRTL ? 'الاسم' : 'Nom'}
                  </Label>
                  <Input value={professor.name} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <Mail className="w-4 h-4" />
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <Input value={professor.email} disabled className="bg-muted/50" dir="ltr" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <BookOpen className="w-4 h-4" />
                  {isRTL ? 'التخصص' : 'Spécialisation'}
                </Label>
                {isEditing ? (
                  <Input
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                ) : (
                  <p className="p-2 bg-muted/50 rounded-md">{professor.specialization}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Languages className="w-4 h-4" />
                  {isRTL ? 'اللغات' : 'Langues'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {professor.languages.map((lang) => (
                    <Badge key={lang} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'نبذة عني' : 'Bio'}</Label>
                {isEditing ? (
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <p className="p-3 bg-muted/50 rounded-md min-h-[100px]">
                    {professor.bio || (isRTL ? 'لا توجد نبذة بعد' : 'Pas de bio encore')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
