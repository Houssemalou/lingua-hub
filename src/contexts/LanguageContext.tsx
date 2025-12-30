import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.rooms': 'Salles',
    'nav.students': 'Étudiants',
    'nav.sessions': 'Sessions',
    'nav.progress': 'Progression',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    'nav.student': 'Étudiant',
    'nav.lightMode': 'Mode clair',
    'nav.darkMode': 'Mode sombre',
    'nav.level': 'Niveau',
    'nav.logout': 'Déconnexion',
    
    // Auth
    'auth.login': 'Connexion',
    'auth.signup': 'Inscription',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.name': 'Nom complet',
    'auth.nickname': 'Pseudo',
    'auth.bio': 'Bio',
    'auth.level': 'Niveau',
    'auth.accessToken': "Token d'accès",
    'auth.createAccount': 'Créer un compte',
    'auth.loginButton': 'Se connecter',
    'auth.noAccount': 'Pas encore de compte ?',
    'auth.hasAccount': 'Déjà un compte ?',
    'auth.chooseRole': 'Choisissez votre type de compte',
    'auth.admin': 'Administrateur',
    'auth.student': 'Étudiant',
    'auth.adminDesc': 'Gérer les étudiants, salles et sessions',
    'auth.studentDesc': 'Rejoindre les sessions et suivre vos progrès',
    'auth.chooseAvatar': 'Choisissez votre avatar',
    'auth.selectImage': 'Sélectionnez une image qui vous représente',
    'auth.yourInfo': 'Vos informations',
    'auth.completeProfile': 'Complétez votre profil',
    'auth.currentLevel': 'Votre niveau actuel',
    'auth.bioPlaceholder': "Parlez-nous de vous et de vos objectifs d'apprentissage...",
    'auth.tokenTitle': "Token d'accès",
    'auth.tokenDesc': "Entrez le token d'accès fourni par votre administrateur",
    'auth.noToken': "Si vous n'avez pas de token, contactez votre administrateur",
    'auth.back': 'Retour',
    'auth.continue': 'Continuer',
    'auth.loading': 'Chargement...',
    'auth.creating': 'Création...',
    'auth.backToLogin': 'Retour à la connexion',
    'auth.signupSuccess': 'Compte créé avec succès ! Connectez-vous maintenant.',
    'auth.allRightsReserved': 'Tous droits réservés',
    
    // Admin Students
    'students.title': 'Étudiants',
    'students.subtitle': 'Gérer et visualiser tous les étudiants inscrits',
    'students.search': 'Rechercher des étudiants...',
    'students.allLevels': 'Tous les niveaux',
    'students.noResults': 'Aucun étudiant trouvé',
    'students.noResultsHint': "Essayez d'ajuster votre recherche ou vos filtres",
    'students.sessionsCompleted': 'sessions',
    'students.progress': 'Progression',
    
    // Admin Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.welcome': 'Bienvenue',
    'dashboard.totalStudents': 'Total étudiants',
    'dashboard.activeRooms': 'Salles actives',
    'dashboard.scheduledSessions': 'Sessions planifiées',
    'dashboard.completedSessions': 'Sessions terminées',
    'dashboard.upcomingSessions': 'Sessions à venir',
    'dashboard.liveSessions': 'Sessions en direct',
    'dashboard.recentStudents': 'Étudiants récents',
    'dashboard.viewAll': 'Voir tout',
    
    // Student Dashboard
    'student.welcome': 'Bon retour',
    'student.yourLevel': 'Votre niveau',
    'student.hoursLearned': 'Heures apprises',
    'student.sessionsCompleted': 'Sessions terminées',
    'student.liveNow': 'En direct maintenant',
    'student.joinNow': 'Rejoindre',
    'student.upcomingSessions': 'Sessions à venir',
    'student.yourProgress': 'Votre progression',
    
    // Profile
    'profile.title': 'Mon Profil',
    'profile.subtitle': 'Gérer les paramètres de votre compte et vos préférences',
    'profile.edit': 'Modifier le profil',
    'profile.save': 'Enregistrer',
    'profile.cancel': 'Annuler',
    'profile.nickname': 'Pseudo',
    'profile.bio': 'Bio',
    'profile.noBio': 'Pas de bio encore',
    'profile.sessions': 'Sessions',
    'profile.hours': 'Heures',
    'profile.streak': 'Série',
    'profile.accountInfo': 'Informations du compte',
    'profile.memberSince': 'Membre depuis',
    'profile.currentLevel': 'Niveau actuel',
    'profile.accountStatus': 'Statut du compte',
    'profile.active': 'Actif',
    'profile.updated': 'Profil mis à jour avec succès !',
    
    // Quiz
    'quiz.title': 'Quiz de session',
    'quiz.question': 'Question',
    'quiz.of': 'sur',
    'quiz.next': 'Suivant',
    'quiz.submit': 'Terminer',
    'quiz.results': 'Résultats',
    'quiz.score': 'Score',
    'quiz.passed': 'Félicitations ! Vous avez réussi le quiz.',
    'quiz.failed': 'Continuez à pratiquer pour améliorer votre score.',
    'quiz.close': 'Fermer',
    
    // Rooms
    'rooms.title': 'Salles de classe',
    'rooms.subtitle': 'Gérer les salles virtuelles',
    'rooms.create': 'Créer une salle',
    'rooms.live': 'En direct',
    'rooms.capacity': 'Capacité',
    'rooms.join': 'Rejoindre',
    
    // Sessions
    'sessions.title': 'Sessions',
    'sessions.subtitle': 'Planifier et gérer les sessions',
    'sessions.upcoming': 'À venir',
    'sessions.past': 'Passées',
    'sessions.duration': 'Durée',
    'sessions.startIn': 'Commence dans',
    
    // Common
    'common.join': 'Rejoindre',
    'common.view': 'Voir',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.add': 'Ajouter',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.live': 'En direct',
    'common.scheduled': 'Planifié',
    'common.completed': 'Terminé',
    'common.students': 'étudiants',
    'common.hours': 'heures',
    'common.minutes': 'minutes',
    'common.today': "Aujourd'hui",
    'common.tomorrow': 'Demain',
    'common.yesterday': 'Hier',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.rooms': 'الغرف',
    'nav.students': 'الطلاب',
    'nav.sessions': 'الجلسات',
    'nav.progress': 'التقدم',
    'nav.profile': 'الملف الشخصي',
    'nav.admin': 'مشرف',
    'nav.student': 'طالب',
    'nav.lightMode': 'الوضع الفاتح',
    'nav.darkMode': 'الوضع الداكن',
    'nav.level': 'المستوى',
    'nav.logout': 'تسجيل الخروج',
    
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.name': 'الاسم الكامل',
    'auth.nickname': 'اسم المستخدم',
    'auth.bio': 'نبذة عنك',
    'auth.level': 'المستوى',
    'auth.accessToken': 'رمز الوصول',
    'auth.createAccount': 'إنشاء الحساب',
    'auth.loginButton': 'تسجيل الدخول',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.hasAccount': 'لديك حساب بالفعل؟',
    'auth.chooseRole': 'اختر نوع حسابك',
    'auth.admin': 'مشرف',
    'auth.student': 'طالب',
    'auth.adminDesc': 'إدارة الطلاب والغرف والجلسات',
    'auth.studentDesc': 'الانضمام إلى الجلسات وتتبع تقدمك',
    'auth.chooseAvatar': 'اختر صورتك الرمزية',
    'auth.selectImage': 'اختر صورة تمثلك',
    'auth.yourInfo': 'معلوماتك الشخصية',
    'auth.completeProfile': 'أكمل ملفك الشخصي',
    'auth.currentLevel': 'مستواك الحالي',
    'auth.bioPlaceholder': 'أخبرنا عن نفسك وأهداف التعلم الخاصة بك...',
    'auth.tokenTitle': 'رمز الوصول',
    'auth.tokenDesc': 'أدخل رمز الوصول الذي قدمه لك المشرف',
    'auth.noToken': 'إذا لم يكن لديك رمز، اتصل بمشرفك',
    'auth.back': 'رجوع',
    'auth.continue': 'التالي',
    'auth.loading': 'جاري التحميل...',
    'auth.creating': 'جاري الإنشاء...',
    'auth.backToLogin': 'العودة لتسجيل الدخول',
    'auth.signupSuccess': 'تم إنشاء الحساب بنجاح! سجل دخولك الآن.',
    'auth.allRightsReserved': 'جميع الحقوق محفوظة',
    
    // Admin Students
    'students.title': 'الطلاب',
    'students.subtitle': 'إدارة وعرض جميع الطلاب المسجلين',
    'students.search': 'البحث عن الطلاب...',
    'students.allLevels': 'جميع المستويات',
    'students.noResults': 'لم يتم العثور على طلاب',
    'students.noResultsHint': 'حاول تعديل البحث أو الفلاتر',
    'students.sessionsCompleted': 'جلسات',
    'students.progress': 'التقدم',
    
    // Admin Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.welcome': 'مرحباً',
    'dashboard.totalStudents': 'إجمالي الطلاب',
    'dashboard.activeRooms': 'الغرف النشطة',
    'dashboard.scheduledSessions': 'الجلسات المجدولة',
    'dashboard.completedSessions': 'الجلسات المكتملة',
    'dashboard.upcomingSessions': 'الجلسات القادمة',
    'dashboard.liveSessions': 'الجلسات المباشرة',
    'dashboard.recentStudents': 'الطلاب الجدد',
    'dashboard.viewAll': 'عرض الكل',
    
    // Student Dashboard
    'student.welcome': 'مرحباً بعودتك',
    'student.yourLevel': 'مستواك',
    'student.hoursLearned': 'ساعات التعلم',
    'student.sessionsCompleted': 'الجلسات المكتملة',
    'student.liveNow': 'مباشر الآن',
    'student.joinNow': 'انضم الآن',
    'student.upcomingSessions': 'الجلسات القادمة',
    'student.yourProgress': 'تقدمك',
    
    // Profile
    'profile.title': 'ملفي الشخصي',
    'profile.subtitle': 'إدارة إعدادات حسابك وتفضيلاتك',
    'profile.edit': 'تعديل الملف',
    'profile.save': 'حفظ',
    'profile.cancel': 'إلغاء',
    'profile.nickname': 'اسم المستخدم',
    'profile.bio': 'نبذة عنك',
    'profile.noBio': 'لا توجد نبذة بعد',
    'profile.sessions': 'جلسات',
    'profile.hours': 'ساعات',
    'profile.streak': 'تتابع',
    'profile.accountInfo': 'معلومات الحساب',
    'profile.memberSince': 'عضو منذ',
    'profile.currentLevel': 'المستوى الحالي',
    'profile.accountStatus': 'حالة الحساب',
    'profile.active': 'نشط',
    'profile.updated': 'تم تحديث الملف الشخصي بنجاح!',
    
    // Quiz
    'quiz.title': 'اختبار الجلسة',
    'quiz.question': 'السؤال',
    'quiz.of': 'من',
    'quiz.next': 'التالي',
    'quiz.submit': 'إنهاء',
    'quiz.results': 'النتائج',
    'quiz.score': 'النتيجة',
    'quiz.passed': 'تهانينا! لقد نجحت في الاختبار.',
    'quiz.failed': 'استمر في التدريب لتحسين نتيجتك.',
    'quiz.close': 'إغلاق',
    
    // Rooms
    'rooms.title': 'الفصول الدراسية',
    'rooms.subtitle': 'إدارة الغرف الافتراضية',
    'rooms.create': 'إنشاء غرفة',
    'rooms.live': 'مباشر',
    'rooms.capacity': 'السعة',
    'rooms.join': 'انضم',
    
    // Sessions
    'sessions.title': 'الجلسات',
    'sessions.subtitle': 'جدولة وإدارة الجلسات',
    'sessions.upcoming': 'القادمة',
    'sessions.past': 'السابقة',
    'sessions.duration': 'المدة',
    'sessions.startIn': 'تبدأ في',
    
    // Common
    'common.join': 'انضم',
    'common.view': 'عرض',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.add': 'إضافة',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.live': 'مباشر',
    'common.scheduled': 'مجدول',
    'common.completed': 'مكتمل',
    'common.students': 'طلاب',
    'common.hours': 'ساعات',
    'common.minutes': 'دقائق',
    'common.today': 'اليوم',
    'common.tomorrow': 'غداً',
    'common.yesterday': 'أمس',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
