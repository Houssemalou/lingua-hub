import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, Shield, User, Sun, Moon, Languages, ArrowLeft, ArrowRight, Check, KeyRound, BookOpen } from 'lucide-react';
import { avatarOptions } from '@/data/avatars';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'signup';
type SignupRole = 'admin' | 'student' | 'professor' | null;
type StudentStep = 'role' | 'avatar' | 'info' | 'token';
type ProfessorStep = 'role' | 'avatar' | 'info' | 'token';

const levelOptions: Array<'A1' | 'A2' | 'B1' | 'B2'> = ['A1', 'A2', 'B1', 'B2'];

export default function AuthPage() {
  const { isAuthenticated, login, signupAdmin, signupStudent, signupProfessor, user } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [signupRole, setSignupRole] = useState<SignupRole>(null);
  const [studentStep, setStudentStep] = useState<StudentStep>('role');
  const [professorStep, setProfessorStep] = useState<ProfessorStep>('role');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0].url);
  const [accessToken, setAccessToken] = useState('');
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2'>('A1');
  const [uniqueCode, setUniqueCode] = useState('');
  // Professor-specific fields
  const [languages, setLanguages] = useState<string[]>(['Français']);
  const [specialization, setSpecialization] = useState('');

  // Redirection après login réussi uniquement
  useEffect(() => {
    if (justLoggedIn && isAuthenticated && user) {
      const dashboardPath = user.role === 'admin' 
        ? '/admin/dashboard' 
        : user.role === 'professor' 
        ? '/professor/dashboard' 
        : '/student/dashboard';
      navigate(dashboardPath, { replace: true });
    }
  }, [justLoggedIn, isAuthenticated, user, navigate]);

  // Commenté pour permettre la connexion avec plusieurs profils dans différents onglets
  // if (isAuthenticated && user) {
  //   const dashboardPath = user.role === 'admin' 
  //     ? '/admin/dashboard' 
  //     : user.role === 'professor' 
  //     ? '/professor/dashboard' 
  //     : '/student/dashboard';
  //   return <Navigate to={dashboardPath} replace />;
  // }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error || 'Erreur de connexion');
    } else {
      setJustLoggedIn(true);
    }
    setLoading(false);
  };

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await signupAdmin({
      name,
      email,
      password,
      accessToken,
    });
    if (result.success) {
      // Redirect to login after successful signup
      resetForm();
      setMode('login');
    } else {
      setError(result.error || (isRTL ? 'خطأ في التسجيل' : 'Erreur lors de l\'inscription'));
    }
    setLoading(false);
  };

  const handleStudentSignup = async () => {
    setLoading(true);
    setError('');
    
    const result = await signupStudent({
      uniqueCode,
      password,
      name,
      nickname,
      bio,
      avatar: selectedAvatar,
      accessToken,
      level,
    });
    
    if (result.success) {
      // Redirect to login after successful signup
      resetForm();
      setMode('login');
    } else {
      setError(result.error || (isRTL ? 'خطأ في التسجيل' : 'Erreur lors de l\'inscription'));
    }
    setLoading(false);
  };

  const handleProfessorSignup = async () => {
    setLoading(true);
    setError('');
    
    const result = await signupProfessor({
      email,
      password,
      name,
      bio,
      avatar: selectedAvatar,
      languages,
      specialization,
      accessToken,
    });
    
    if (result.success) {
      resetForm();
      setMode('login');
    } else {
      setError(result.error || (isRTL ? 'خطأ في التسجيل' : 'Erreur lors de l\'inscription'));
    }
    setLoading(false);
  };

  const resetForm = () => {
    setMode('login');
    setSignupRole(null);
    setStudentStep('role');
    setProfessorStep('role');
    setEmail('');
    setPassword('');
    setName('');
    setNickname('');
    setBio('');
    setSelectedAvatar(avatarOptions[0].url);
    setAccessToken('');
    setLevel('A1');
    setUniqueCode('');
    setLanguages(['Français']);
    setSpecialization('');
    setError('');
  };

  const renderLogin = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-md mx-auto glass-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{isRTL ? 'تسجيل الدخول' : 'Connexion'}</CardTitle>
          <CardDescription>
            {isRTL ? 'أدخل بيانات الاعتماد الخاصة بك للوصول إلى حسابك' : 'Entrez vos identifiants pour accéder à votre compte'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{isRTL ? 'اسم المستخدم' : 'Nom d\'utilisateur'}</Label>
              <Input
                id="username"
                type="text"
                placeholder={isRTL ? 'votre nom d\'utilisateur' : 'votre nom d\'utilisateur'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{isRTL ? 'كلمة المرور' : 'Mot de passe'}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (isRTL ? 'جاري التحميل...' : 'Chargement...') : (isRTL ? 'تسجيل الدخول' : 'Se connecter')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'ليس لديك حساب؟' : 'Pas encore de compte ?'}
              <Button
                variant="link"
                className="px-2"
                onClick={() => setMode('signup')}
              >
                {isRTL ? 'إنشاء حساب' : 'S\'inscrire'}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderRoleSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-lg mx-auto glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isRTL ? 'إنشاء حساب' : 'Créer un compte'}</CardTitle>
          <CardDescription>
            {isRTL ? 'اختر نوع حسابك' : 'Choisissez votre type de compte'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSignupRole('admin');
                setStudentStep('info');
              }}
              className="p-6 rounded-xl border-2 border-border hover:border-primary bg-card transition-all text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{isRTL ? 'مشرف' : 'Administrateur'}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {isRTL ? 'إدارة الطلاب والغرف والجلسات' : 'Gérer les étudiants, salles et sessions'}
              </p>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSignupRole('professor');
                setProfessorStep('avatar');
              }}
              className="p-6 rounded-xl border-2 border-border hover:border-secondary bg-card transition-all text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-secondary/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{isRTL ? 'أستاذ' : 'Professeur'}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {isRTL ? 'تقديم الجلسات وإدارة الطلاب' : 'Animer les sessions et gérer vos étudiants'}
              </p>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSignupRole('student');
                setStudentStep('avatar');
              }}
              className="p-6 rounded-xl border-2 border-border hover:border-accent bg-card transition-all text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-accent/10 flex items-center justify-center">
                <User className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg">{isRTL ? 'طالب' : 'Étudiant'}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {isRTL ? 'الانضمام إلى الجلسات وتتبع تقدمك' : 'Rejoindre les sessions et suivre vos progrès'}
              </p>
            </motion.button>
          </div>
          
          <div className="text-center pt-4">
            <Button variant="ghost" onClick={resetForm}>
              {isRTL ? 'العودة لتسجيل الدخول' : 'Retour à la connexion'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderAdminSignup = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-md mx-auto glass-card">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-fit gap-2", isRTL && "flex-row-reverse")}
            onClick={() => {
              setSignupRole(null);
              setStudentStep('role');
            }}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? 'رجوع' : 'Retour'}
          </Button>
          <CardTitle className="text-2xl">{isRTL ? 'حساب المشرف' : 'Compte Administrateur'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{isRTL ? 'الاسم الكامل' : 'Nom complet'}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{isRTL ? 'كلمة المرور' : 'Mot de passe'}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">{isRTL ? 'رمز الوصول' : 'Token d\'accès'}</Label>
              <Input
                id="accessToken"
                type="text"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={isRTL ? 'أدخل رمز الوصول' : 'Entrez le token d\'accès'}
                required
                dir="ltr"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !name || !email || !password || !accessToken}>
              {loading ? (isRTL ? 'جاري الإنشاء...' : 'Création...') : (isRTL ? 'إنشاء الحساب' : 'Créer le compte')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderAvatarSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-2xl mx-auto glass-card">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-fit gap-2", isRTL && "flex-row-reverse")}
            onClick={() => {
              setSignupRole(null);
              setStudentStep('role');
            }}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? 'رجوع' : 'Retour'}
          </Button>
          <CardTitle className="text-2xl">{isRTL ? 'اختر صورتك الرمزية' : 'Choisissez votre avatar'}</CardTitle>
          <CardDescription>
            {isRTL ? 'اختر صورة تمثلك' : 'Sélectionnez une image qui vous représente'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
            {avatarOptions.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAvatar(avatar.url)}
                className={cn(
                  "relative p-2 rounded-xl border-2 transition-all",
                  selectedAvatar === avatar.url
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className="w-full aspect-square rounded-lg"
                />
                {selectedAvatar === avatar.url && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          <Button
            className="w-full"
            onClick={() => setStudentStep('info')}
          >
            {isRTL ? 'التالي' : 'Continuer'}
            {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStudentInfo = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-md mx-auto glass-card">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-fit gap-2", isRTL && "flex-row-reverse")}
            onClick={() => setStudentStep('avatar')}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? 'رجوع' : 'Retour'}
          </Button>
          <div className="flex items-center gap-4">
            <img src={selectedAvatar} alt="Avatar" className="w-16 h-16 rounded-xl" />
            <div>
              <CardTitle className="text-2xl">{isRTL ? 'معلوماتك الشخصية' : 'Vos informations'}</CardTitle>
              <CardDescription>
                {isRTL ? 'أكمل ملفك الشخصي' : 'Complétez votre profil'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{isRTL ? 'الاسم الكامل' : 'Nom complet'}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">{isRTL ? 'اسم المستخدم' : 'Pseudo'}</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={isRTL ? 'كيف تريد أن تظهر' : 'Comment voulez-vous apparaître'}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uniqueCode">{isRTL ? 'رمز الوصول الفريد' : 'Code d\'accès unique'}</Label>
            <Input
              id="uniqueCode"
              type="text"
              value={uniqueCode}
              onChange={(e) => setUniqueCode(e.target.value)}
              placeholder={isRTL ? 'أدخل رمز الوصول الفريد' : 'Entrez votre code d\'accès unique'}
              required
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{isRTL ? 'كلمة المرور' : 'Mot de passe'}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>{isRTL ? 'مستواك الحالي' : 'Votre niveau actuel'}</Label>
            <div className="grid grid-cols-4 gap-2">
              {levelOptions.map((l) => (
                <Button
                  key={l}
                  type="button"
                  variant={level === l ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLevel(l)}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">{isRTL ? 'نبذة عنك' : 'Bio'}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={isRTL ? 'أخبرنا عن نفسك وأهداف التعلم الخاصة بك...' : 'Parlez-nous de vous et de vos objectifs d\'apprentissage...'}
              rows={3}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => setStudentStep('token')}
            disabled={!name || !nickname || !uniqueCode || !password}
          >
            {isRTL ? 'التالي' : 'Continuer'}
            {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderTokenValidation = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-md mx-auto glass-card">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-fit gap-2", isRTL && "flex-row-reverse")}
            onClick={() => setStudentStep('info')}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? 'رجوع' : 'Retour'}
          </Button>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-warning/10 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-warning" />
          </div>
          <CardTitle className="text-2xl text-center">{isRTL ? 'رمز الوصول' : 'Token d\'accès'}</CardTitle>
          <CardDescription className="text-center">
            {isRTL ? 'أدخل رمز الوصول الذي قدمه لك المشرف' : 'Entrez le token d\'accès fourni par votre administrateur'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">{isRTL ? 'رمز الوصول' : 'Token'}</Label>
            <Input
              id="token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              className="text-center text-lg tracking-wider"
              dir="ltr"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Button
            className="w-full"
            onClick={handleStudentSignup}
            disabled={loading || !accessToken}
          >
            {loading ? (isRTL ? 'جاري الإنشاء...' : 'Création...') : (isRTL ? 'إنشاء الحساب' : 'Créer mon compte')}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {isRTL ? 'إذا لم يكن لديك رمز، اتصل بمشرفك' : 'Si vous n\'avez pas de token, contactez votre administrateur'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderProfessorAvatarSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-2xl mx-auto glass-card">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-fit gap-2", isRTL && "flex-row-reverse")}
            onClick={() => {
              setSignupRole(null);
              setProfessorStep('role');
            }}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? 'رجوع' : 'Retour'}
          </Button>
          <CardTitle className="text-2xl">{isRTL ? 'اختر صورتك الرمزية' : 'Choisissez votre avatar'}</CardTitle>
          <CardDescription>
            {isRTL ? 'اختر صورة تمثلك كأستاذ' : 'Sélectionnez une image qui vous représente en tant que professeur'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
            {avatarOptions.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAvatar(avatar.url)}
                className={cn(
                  "relative p-2 rounded-xl border-2 transition-all",
                  selectedAvatar === avatar.url
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className="w-full aspect-square rounded-lg"
                />
                {selectedAvatar === avatar.url && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          <Button
            className="w-full"
            onClick={() => setProfessorStep('info')}
          >
            {isRTL ? 'التالي' : 'Continuer'}
            {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderProfessorInfo = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-md mx-auto glass-card">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-fit gap-2", isRTL && "flex-row-reverse")}
            onClick={() => setProfessorStep('avatar')}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? 'رجوع' : 'Retour'}
          </Button>
          <div className="flex items-center gap-4">
            <img src={selectedAvatar} alt="Avatar" className="w-16 h-16 rounded-xl" />
            <div>
              <CardTitle className="text-2xl">{isRTL ? 'معلوماتك المهنية' : 'Vos informations professionnelles'}</CardTitle>
              <CardDescription>
                {isRTL ? 'أكمل ملفك الشخصي كأستاذ' : 'Complétez votre profil professeur'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prof-name">{isRTL ? 'الاسم الكامل' : 'Nom complet'}</Label>
            <Input
              id="prof-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-email">Email</Label>
            <Input
              id="prof-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-password">{isRTL ? 'كلمة المرور' : 'Mot de passe'}</Label>
            <Input
              id="prof-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-specialization">{isRTL ? 'التخصص' : 'Spécialisation'}</Label>
            <Input
              id="prof-specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder={isRTL ? 'مثال: المحادثة، القواعد...' : 'Ex: Conversation, Grammaire...'}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{isRTL ? 'اللغات التي تدرسها' : 'Langues enseignées'}</Label>
            <div className="flex flex-wrap gap-2">
              {['Français', 'Anglais', 'Espagnol', 'Arabe', 'Allemand'].map((lang) => (
                <Button
                  key={lang}
                  type="button"
                  variant={languages.includes(lang) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (languages.includes(lang)) {
                      setLanguages(languages.filter(l => l !== lang));
                    } else {
                      setLanguages([...languages, lang]);
                    }
                  }}
                >
                  {lang}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-bio">{isRTL ? 'نبذة عنك' : 'Bio'}</Label>
            <Textarea
              id="prof-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={isRTL ? 'أخبرنا عن خبرتك في التدريس...' : 'Parlez-nous de votre expérience d\'enseignement...'}
              rows={3}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => setProfessorStep('token')}
            disabled={!name || !email || !password || !specialization || languages.length === 0}
          >
            {isRTL ? 'التالي' : 'Continuer'}
            {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderProfessorTokenValidation = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-md mx-auto glass-card">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-fit gap-2", isRTL && "flex-row-reverse")}
            onClick={() => setProfessorStep('info')}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? 'رجوع' : 'Retour'}
          </Button>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/10 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-secondary-foreground" />
          </div>
          <CardTitle className="text-2xl text-center">{isRTL ? 'رمز وصول الأستاذ' : 'Token d\'accès Professeur'}</CardTitle>
          <CardDescription className="text-center">
            {isRTL ? 'أدخل رمز الوصول الخاص بالأساتذة' : 'Entrez le token d\'accès professeur fourni par l\'administrateur'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prof-token">{isRTL ? 'رمز الوصول' : 'Token'}</Label>
            <Input
              id="prof-token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="PROF-XXXX-XXXX"
              className="text-center text-lg tracking-wider"
              dir="ltr"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Button
            className="w-full"
            onClick={handleProfessorSignup}
            disabled={loading || !accessToken}
          >
            {loading ? (isRTL ? 'جاري الإنشاء...' : 'Création...') : (isRTL ? 'إنشاء الحساب' : 'Créer mon compte')}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {isRTL ? 'رموز الأستاذ تبدأ بـ PROF' : 'Les tokens professeur commencent par PROF (ex: PROF2024)'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderContent = () => {
    if (mode === 'login') return renderLogin();
    
    if (signupRole === null) return renderRoleSelection();
    
    if (signupRole === 'admin') return renderAdminSignup();
    
    // Professor signup flow
    if (signupRole === 'professor') {
      switch (professorStep) {
        case 'avatar':
          return renderProfessorAvatarSelection();
        case 'info':
          return renderProfessorInfo();
        case 'token':
          return renderProfessorTokenValidation();
        default:
          return renderRoleSelection();
      }
    }
    
    // Student signup flow
    switch (studentStep) {
      case 'avatar':
        return renderAvatarSelection();
      case 'info':
        return renderStudentInfo();
      case 'token':
        return renderTokenValidation();
      default:
        return renderRoleSelection();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">LangSchool AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
          >
            <Languages className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        © 2024 LangSchool AI. {isRTL ? 'جميع الحقوق محفوظة' : 'Tous droits réservés'}
      </footer>
    </div>
  );
}
