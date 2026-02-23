import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  CalendarCheck,
  User,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Languages,
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

  const adminNavItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/admin/rooms', icon: DoorOpen, label: t('nav.rooms') },
    { to: '/admin/students', icon: Users, label: t('nav.students') },
    { to: '/admin/settings', icon: Settings, label: t('nav.settings') },
    { to: '/admin/profile', icon: User, label: t('nav.profile') },
  ];

  const studentNavItems = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/student/sessions', icon: CalendarCheck, label: t('nav.sessions') },
    { to: '/student/summaries', icon: FileText, label: t('nav.summaries') || 'Résumés' },
    { to: '/student/games', icon: Gamepad2, label: t('nav.games') || 'Jeux' },
    { to: '/student/quizzes', icon: ClipboardList, label: t('nav.quiz') },
    { to: '/student/evaluations', icon: GraduationCap, label: t('nav.evaluations') || 'Évaluations' },
    { to: '/student/profile', icon: User, label: t('nav.profile') },
  ];

  const professorNavItems = [
    { to: '/professor/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/professor/sessions', icon: CalendarCheck, label: t('nav.sessions') },
    { to: '/professor/summaries', icon: FileText, label: t('nav.summaries') || 'Résumés' },
    { to: '/professor/challenges', icon: Swords, label: t('nav.challenges') || 'Défis' },
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
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
            >
              {settings.logoUrl && role === 'student' ? (
                <img src={settings.logoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain" />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                    <Languages className="w-5 h-5 text-sidebar-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg text-sidebar-foreground">LinguaAI</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && !isMobile && (
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center mx-auto">
            {settings.logoUrl && role === 'student' ? (
              <img src={settings.logoUrl} alt="Logo" className="h-6 w-6 object-contain rounded" />
            ) : (
              <Languages className="w-5 h-5 text-sidebar-primary-foreground" />
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
      <div className="p-3 border-b border-sidebar-border">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50",
          isRTL && "flex-row-reverse"
        )}>
          {getRoleIcon()}
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-sidebar-foreground"
              >
                {getRoleLabel()}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
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
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary rounded-full",
                    isRTL ? "right-0" : "left-0",
                    isRTL ? "rounded-l-full" : "rounded-r-full"
                  )}
                  style={isRTL ? { right: '-8px' } : { left: '-8px' }}
                />
              )}
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? 10 : -10 }}
                    className="font-medium whitespace-nowrap"
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
            "w-full flex items-center gap-3 px-5 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
            isRTL && "flex-row-reverse"
          )}
        >
          <Globe className="w-5 h-5 shrink-0" />
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium whitespace-nowrap"
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
            "w-full flex items-center gap-3 px-5 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
            isRTL && "flex-row-reverse"
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 shrink-0" />
          )}
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium whitespace-nowrap"
              >
                {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Info & Logout */}
        <div className="px-3 py-3 border-t border-sidebar-border">
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
              "w-full mt-2 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
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
            className="w-full flex items-center justify-center py-3 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {isRTL ? (
              collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
            ) : (
              collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </motion.aside>
  );
}
