import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  User,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  X,
  Globe,
  ClipboardList,
  Settings,
  BookOpen,
  FileText,
  Gamepad2,
  Swords,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatform } from '@/contexts/PlatformContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ collapsed, onToggle, isMobile, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role || 'student';
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { settings } = usePlatform();

  // Determine if gamification should be hidden
  const professorType = user?.professor?.professorType;
  const studentType = user?.student?.studentType;
  const hideGamification =
    (role === 'professor' && (professorType === 'FORMATEUR' || professorType === 'PROF_PREPA')) ||
    (role === 'student' && (studentType === 'FORMATION' || studentType === 'PREPA'));

  const adminNavItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/admin/students', icon: Users, label: t('nav.students') },
    { to: '/admin/settings', icon: Settings, label: t('nav.settings') },
    { to: '/admin/profile', icon: User, label: t('nav.profile') },
  ];

  const studentNavItems = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/student/sessions', icon: CalendarCheck, label: t('nav.sessions') },
    { to: '/student/resources', icon: BookOpen, label: isRTL ? 'الموارد' : 'Ressources' },
    { to: '/student/summaries', icon: FileText, label: t('nav.summaries') || 'Résumés' },
    ...(!hideGamification ? [{ to: '/student/games', icon: Gamepad2, label: t('nav.games') || 'Jeux' }] : []),
    { to: '/student/quizzes', icon: ClipboardList, label: t('nav.quiz') },
    { to: '/student/evaluations', icon: GraduationCap, label: t('nav.evaluations') || 'Évaluations' },
    { to: '/student/profile', icon: User, label: t('nav.profile') },
  ];

  const professorNavItems = [
    { to: '/professor/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/professor/sessions', icon: CalendarCheck, label: t('nav.sessions') },
    { to: '/professor/resources', icon: FileText, label: isRTL ? 'مكتبة الوثائق' : 'Bibliothèque docs' },
    { to: '/professor/summaries', icon: FileText, label: t('nav.summaries') || 'Résumés' },
    ...(!hideGamification ? [{ to: '/professor/challenges', icon: Swords, label: t('nav.challenges') || 'Défis' }] : []),
    { to: '/professor/evaluations', icon: GraduationCap, label: t('nav.evaluations') || 'Évaluations' },
    { to: '/professor/quizzes', icon: ClipboardList, label: t('nav.quiz') },
    { to: '/professor/profile', icon: User, label: t('nav.profile') },
  ];

  const navItems = role === 'admin' 
    ? adminNavItems 
    : role === 'professor' 
    ? professorNavItems 
    : studentNavItems;

  const handleNavClick = () => {
    // closing the drawer immediately can unmount the NavLink before the
    // router processes the click, which makes the link appear non-functional
    // on small screens.  Use a micro-task so navigation happens first.
    if (isMobile && onClose) {
      setTimeout(onClose, 0);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'ar' : 'fr');
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-sidebar-primary" />;
      case 'professor':
        return <BookOpen className="w-4 h-4 text-sidebar-primary" />;
      default:
        return <GraduationCap className="w-4 h-4 text-sidebar-primary" />;
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return t('nav.admin');
      case 'professor':
        return isRTL ? 'أستاذ' : 'Professeur';
      default:
        return t('nav.student');
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        "fixed h-screen bg-sidebar flex flex-col border-sidebar-border z-50",
        isRTL ? "right-0 border-l" : "left-0 border-r",
        isMobile ? "top-0 w-64" : "top-0"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("flex items-center gap-2.5", isRTL && "flex-row-reverse")}
            >
              {settings.logoUrl && role === 'student' ? (
                <img src={settings.logoUrl} alt="Logo" className="h-6 max-w-[120px] object-contain" />
              ) : (
                <>
                  <img src="/logo_learnUp.jpeg" alt="LearnUp" className="h-6 object-contain" />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && !isMobile && (
          <div className="w-6 h-6 rounded-lg bg-sidebar-primary/20 flex items-center justify-center mx-auto">
            {settings.logoUrl && role === 'student' ? (
              <img src={settings.logoUrl} alt="Logo" className="h-4 w-4 object-contain rounded" />
            ) : (
              <img src="/new_logo.jpeg" alt="LearnUp" className="h-4 w-4 object-contain rounded" />
            )}
          </div>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("text-sidebar-foreground", isRTL ? "mr-auto" : "ml-auto")}
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Role Badge */}
      <div className="px-3 py-2.5 border-b border-sidebar-border">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md bg-sidebar-accent/40",
          isRTL && "flex-row-reverse"
        )}>
          {getRoleIcon()}
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium text-sidebar-foreground/80"
              >
                {getRoleLabel()}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isRTL && "flex-row-reverse",
                isActive
                  ? "bg-sidebar-primary/10 text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-full",
                    isRTL ? "right-0" : "left-0",
                  )}
                  style={isRTL ? { right: '-6px' } : { left: '-6px' }}
                />
              )}
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-sidebar-primary")} />
              <AnimatePresence mode="wait">
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? 10 : -10 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto border-t border-sidebar-border">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm",
            isRTL && "flex-row-reverse"
          )}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                {language === 'fr' ? 'العربية' : 'Français'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm",
            isRTL && "flex-row-reverse"
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Info & Logout */}
        <div className="px-3 py-2.5 border-t border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3", 
            collapsed && !isMobile && "justify-center",
            isRTL && "flex-row-reverse"
          )}>
            {role === 'student' && user?.student && (
              <>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user.student.avatar} />
                  <AvatarFallback>{user.student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <AnimatePresence mode="wait">
                  {(!collapsed || isMobile) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn("flex-1 min-w-0", isRTL && "text-right")}
                    >
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user.student.name}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">
                        {t('nav.level')} {user.student.level}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            {role === 'professor' && user?.professor && (
              <>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user.professor.avatar} />
                  <AvatarFallback>{user.professor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <AnimatePresence mode="wait">
                  {(!collapsed || isMobile) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn("flex-1 min-w-0", isRTL && "text-right")}
                    >
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user.professor.name}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">
                        {user.professor.specialization}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            {role === 'admin' && (
              <>
                <Avatar className="w-9 h-9">
                  <AvatarFallback>{(user?.username || user?.email || 'A').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <AnimatePresence mode="wait">
                  {(!collapsed || isMobile) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn("flex-1 min-w-0", isRTL && "text-right")}
                    >
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user?.username || user?.email}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">
                        {t('nav.admin')}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
          {/* Logout button */}
          <Button
            variant="ghost"
            size={collapsed && !isMobile ? 'icon' : 'sm'}
            onClick={logout}
            className={cn(
              "w-full mt-2 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 text-sm",
              isRTL && "flex-row-reverse"
            )}
          >
            <LogOut className="w-4 h-4" />
            {(!collapsed || isMobile) && (
              <span className={cn(isRTL ? "mr-2" : "ml-2")}>{t('nav.logout')}</span>
            )}
          </Button>
        </div>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center py-2.5 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {isRTL ? (
              collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </motion.aside>
  );
}
