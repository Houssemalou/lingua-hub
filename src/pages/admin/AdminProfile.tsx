import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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

export default function AdminProfile() {
  const { user, updateUser } = useAuth();
  const { isRTL } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');

  const handleEdit = () => {
    setName(user?.name || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setIsEditing(false);
  };

  const handleSave = () => {
    if (name.trim()) {
      updateUser({ name: name.trim() });
      toast.success(isRTL ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profil mis à jour avec succès !');
      setIsEditing(false);
    }
  };

  if (!user) {
    return null;
  }

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
                <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/20">
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {(user.name || user.email || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-foreground">{user.name || user.email}</h2>
                <p className="text-muted-foreground">{user.email}</p>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {isRTL ? 'مدير' : 'Administrateur'}
                  </Badge>
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
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit3 className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                  {isRTL ? 'تعديل' : 'Modifier'}
                </Button>
              ) : (
                <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
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
                  {isEditing ? (
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  ) : (
                    <Input value={user.name || ''} disabled className="bg-muted/50" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <Mail className="w-4 h-4" />
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <Input value={user.email} disabled className="bg-muted/50" dir="ltr" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <ShieldCheck className="w-4 h-4" />
                  {isRTL ? 'الدور' : 'Rôle'}
                </Label>
                <p className="p-2 bg-muted/50 rounded-md">
                  {isRTL ? 'مدير النظام' : 'Administrateur'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
