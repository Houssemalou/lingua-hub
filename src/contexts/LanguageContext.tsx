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
    
    // Admin Students
    'students.title': 'Étudiants',
    'students.subtitle': 'Gérer et visualiser tous les étudiants inscrits',
    'students.search': 'Rechercher des étudiants...',
    'students.allLevels': 'Tous les niveaux',
    'students.noResults': 'Aucun étudiant trouvé',
    'students.noResultsHint': 'Essayez d\'ajuster votre recherche ou vos filtres',
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
