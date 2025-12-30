import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Edit2, Save, X, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { currentStudent } from '@/data/mockData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

export default function StudentProfile() {
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  
  // Use student profile from auth context if available, otherwise fallback to mock data
  const studentData = user?.student || currentStudent;
  
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    nickname: studentData.nickname,
    bio: studentData.bio,
  });

  const handleSave = () => {
    toast.success(isRTL ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profil mis à jour avec succès !');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfile({
      nickname: studentData.nickname,
      bio: studentData.bio,
    });
    setIsEditing(false);
  };

  const dateLocale = language === 'ar' ? ar : fr;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {isRTL ? 'ملفي الشخصي' : 'Mon Profil'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {isRTL ? 'إدارة إعدادات حسابك وتفضيلاتك' : 'Gérer les paramètres de votre compte et vos préférences'}
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className={cn(
              "flex flex-col sm:flex-row gap-6 sm:gap-8",
              isRTL && "sm:flex-row-reverse"
            )}>
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-accent">
                    <AvatarImage src={studentData.avatar} />
                    <AvatarFallback className="text-3xl sm:text-4xl">{studentData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <button className={cn(
                    "absolute bottom-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors",
                    isRTL ? "left-0" : "right-0"
                  )}>
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <Badge variant={studentData.level.toLowerCase() as any} className="text-sm sm:text-base px-3 sm:px-4 py-1">
                  {isRTL ? 'المستوى' : 'Niveau'} {studentData.level}
                </Badge>
              </div>

              {/* Info Section */}
              <div className={cn("flex-1 space-y-4 sm:space-y-6", isRTL && "text-right")}>
                <div className={cn(
                  "flex flex-col sm:flex-row sm:items-start justify-between gap-3",
                  isRTL && "sm:flex-row-reverse"
                )}>
                  <div className="text-center sm:text-left">
                    <h2 className={cn("text-xl sm:text-2xl font-bold text-foreground", isRTL && "sm:text-right")}>
                      {studentData.name}
                    </h2>
                    <p className={cn("text-muted-foreground text-sm sm:text-base", isRTL && "sm:text-right")} dir="ltr">
                      {studentData.email}
                    </p>
                  </div>
                  {!isEditing ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)} 
                      className={cn("gap-2 w-full sm:w-auto", isRTL && "flex-row-reverse")}
                    >
                      <Edit2 className="w-4 h-4" />
                      {isRTL ? 'تعديل الملف' : 'Modifier le profil'}
                    </Button>
                  ) : (
                    <div className={cn("flex gap-2 w-full sm:w-auto", isRTL && "flex-row-reverse")}>
                      <Button 
                        variant="outline" 
                        onClick={handleCancel} 
                        className={cn("gap-2 flex-1 sm:flex-none", isRTL && "flex-row-reverse")}
                      >
                        <X className="w-4 h-4" />
                        {isRTL ? 'إلغاء' : 'Annuler'}
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        className={cn("gap-2 flex-1 sm:flex-none", isRTL && "flex-row-reverse")}
                      >
                        <Save className="w-4 h-4" />
                        {isRTL ? 'حفظ' : 'Enregistrer'}
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">{isRTL ? 'اسم المستخدم' : 'Pseudo'}</Label>
                      <Input
                        id="nickname"
                        value={profile.nickname}
                        onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                        placeholder={isRTL ? 'اسم المستخدم الخاص بك' : 'Votre pseudo'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">{isRTL ? 'نبذة عنك' : 'Bio'}</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder={isRTL ? 'أخبرنا عن نفسك...' : 'Parlez-nous de vous...'}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'اسم المستخدم' : 'Pseudo'}</p>
                      <p className="text-foreground font-medium">@{profile.nickname}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'نبذة عنك' : 'Bio'}</p>
                      <p className="text-foreground">{profile.bio || (isRTL ? 'لا توجد نبذة بعد' : 'Pas de bio encore')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid gap-3 sm:gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-4xl font-bold text-primary">{studentData.totalSessions}</p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {isRTL ? 'جلسات' : 'Sessions'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-4xl font-bold text-accent">{studentData.hoursLearned}{isRTL ? 'س' : 'h'}</p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {isRTL ? 'ساعات' : 'Heures'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-4xl font-bold text-success">7</p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {isRTL ? 'تتابع 🔥' : 'Série 🔥'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Info */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <User className="w-5 h-5" />
              {isRTL ? 'معلومات الحساب' : 'Informations du compte'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'عضو منذ' : 'Membre depuis'}
                </p>
                <p className="text-foreground font-medium">
                  {format(new Date(studentData.joinedAt), 'dd MMMM yyyy', { locale: dateLocale })}
                </p>
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'المستوى الحالي' : 'Niveau actuel'}
                </p>
                <p className="text-foreground font-medium">{studentData.level}</p>
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground font-medium" dir="ltr">{studentData.email}</p>
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'حالة الحساب' : 'Statut du compte'}
                </p>
                <Badge variant="success">{isRTL ? 'نشط' : 'Actif'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
