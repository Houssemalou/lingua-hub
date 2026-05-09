import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, LayoutDashboard, CalendarCheck, FileText, Gamepad2, User, Users, Settings, GraduationCap, Swords, ClipboardList, Crown, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AdminChatbot } from '@/components/admin/AdminChatbot';
import { StudentChatbot } from '@/components/student/StudentChatbot';
import { AuthService } from '@/services/AuthService';

export function MainLayout() {
  const isMobile = useIsMobile();
  const { isRTL, language } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Premium chatbot state
  const [isPremiumActive, setIsPremiumActive] = useState(false);
  const [premiumChecked, setPremiumChecked] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [premiumToken, setPremiumToken] = useState('');
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState('');

  const role = user?.role || 'student';

  // Check if current route is admin or student
  const isAdminRoute = location.pathname.startsWith('/admin');
  // Hide student assistant on any live/room page (don't show while inside a session)
  const isStudentRoute = location.pathname.startsWith('/student') && !location.pathname.startsWith('/student/room');
  // Live room pages use fixed full-screen layout — no MainLayout padding/margin needed
  const isLiveRoomPage = location.pathname.includes('/room/');

  // Check premium status for student chatbot
  const checkPremiumStatus = useCallback(async () => {
    if (user?.role !== 'student') return;
    try {
      const res = await AuthService.getPremiumStatus();
      setIsPremiumActive(res.data?.isPremium === true);
    } catch {
      // Also check locally via premiumExpiresAt
      if (user.student?.premiumExpiresAt) {
        setIsPremiumActive(new Date(user.student.premiumExpiresAt) > new Date());
      } else {
        setIsPremiumActive(false);
      }
    } finally {
      setPremiumChecked(true);
    }
  }, [user]);

  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  const handleActivatePremium = async () => {
    if (!premiumToken.trim()) return;
    setPremiumLoading(true);
    setPremiumError('');
    try {
      await AuthService.activatePremiumToken(premiumToken.trim());
      setIsPremiumActive(true);
      setShowPremiumDialog(false);
      setPremiumToken('');
      // Refresh profile to update premiumExpiresAt
      refreshProfile?.();
    } catch (err: any) {
      setPremiumError(err?.response?.data?.message || err?.response?.data || 'Token invalide ou déjà utilisé');
    } finally {
      setPremiumLoading(false);
    }
  };

  // Determine if gamification should be hidden
  const professorType = user?.professor?.professorType;
  const studentType = user?.student?.studentType;
  const hideGamification =
    (role === 'professor' && (professorType === 'FORMATEUR' || professorType === 'PROF_PREPA')) ||
    (role === 'student' && (studentType === 'FORMATION' || studentType === 'PREPA'));

  // Bottom nav items per role
  const studentBottomNav = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: isRTL ? 'الرئيسية' : 'Accueil' },
    { to: '/student/sessions', icon: CalendarCheck, label: isRTL ? 'الجلسات' : 'Sessions' },
    ...(!hideGamification ? [{ to: '/student/games', icon: Gamepad2, label: isRTL ? 'ألعاب' : 'Jeux' }] : []),
    { to: '/student/evaluations', icon: GraduationCap, label: isRTL ? 'تقييمات' : 'Évals' },
    { to: '/student/profile', icon: User, label: isRTL ? 'الملف' : 'Profil' },
  ];
  const professorBottomNav = [
    { to: '/professor/dashboard', icon: LayoutDashboard, label: isRTL ? 'الرئيسية' : 'Accueil' },
    { to: '/professor/sessions', icon: CalendarCheck, label: isRTL ? 'الجلسات' : 'Sessions' },
    ...(!hideGamification ? [{ to: '/professor/challenges', icon: Swords, label: isRTL ? 'تحديات' : 'Défis' }] : []),
    { to: '/professor/evaluations', icon: GraduationCap, label: isRTL ? 'تقييمات' : 'Évals' },
    { to: '/professor/profile', icon: User, label: isRTL ? 'الملف' : 'Profil' },
  ];
  const adminBottomNav = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: isRTL ? 'لوحة' : 'Tableau' },
    { to: '/admin/students', icon: Users, label: isRTL ? 'طلاب' : 'Élèves' },
    { to: '/admin/settings', icon: Settings, label: isRTL ? 'إعدادات' : 'Config' },
  ];
  const bottomNavItems = role === 'admin' ? adminBottomNav : role === 'professor' ? professorBottomNav : studentBottomNav;

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Close mobile menu when clicking outside
  const handleOverlayClick = () => {
    setMobileMenuOpen(false);
  };

  // whenever the location changes on a mobile device we want to auto-close the
  // sidebar; this avoids having to rely on the onClick handlers inside the
  // menu and ensures the close happens *after* navigation.
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Live room pages are full-screen fixed — render without sidebar/padding
  if (isLiveRoomPage) {
    return (
      <>
        <Outlet />
        {/* Student Chatbot still hidden in live rooms */}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className={cn(
          "fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-40 flex items-center px-4",
          isRTL && "flex-row-reverse"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
          <img src="/new_logo.png" alt="LearnUp" className={cn("h-[7.5rem] object-contain", isRTL ? "mr-3" : "ml-3")} />
        </header>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleOverlayClick}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(!isMobile || mobileMenuOpen) && (
          <motion.div
            initial={isMobile ? { x: isRTL ? 280 : -280 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: isRTL ? 280 : -280 } : undefined}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <AppSidebar 
              collapsed={isMobile ? false : sidebarCollapsed} 
              onToggle={() => {
                if (isMobile) {
                  setMobileMenuOpen(false);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              isMobile={isMobile}
              onClose={() => setMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ 
          marginLeft: isMobile ? 0 : (isRTL ? 0 : (sidebarCollapsed ? 72 : 256)),
          marginRight: isMobile ? 0 : (isRTL ? (sidebarCollapsed ? 72 : 256) : 0),
          paddingTop: isMobile ? 56 : 0,
          // Extra bottom padding on mobile to account for bottom nav
          paddingBottom: isMobile ? 64 : 0,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn("min-h-screen")}
      >
        <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
          <Outlet />
        </div>
      </motion.main>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <nav className={cn(
          "fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-lg border-t border-border z-40 flex items-center justify-around px-2 safe-area-bottom",
        )}>
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[56px] relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/60"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileBottomNav"
                    className="absolute inset-0 bg-primary/5 rounded-xl"
                  />
                )}
                <item.icon className={cn("w-5 h-5 transition-all duration-200", isActive && "scale-110")} />
                <span className={cn("text-[10px] font-medium leading-none", isActive ? "text-primary" : "text-muted-foreground/60")}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      {/* Admin Chatbot - Only visible for admin routes */}
      {/*isAdminRoute && <AdminChatbot />*/}

      {/* Student Chatbot - Premium gated */}
      {user && user.role === 'student' && isStudentRoute && premiumChecked && (
        <>
          {isPremiumActive ? (
            <StudentChatbot
              studentId={user.student?.id || user.id}
              studentName={user.student?.name || user.email}
              language={language}
              level={user.student?.level || 'A1'}
              age={undefined}
              onClose={undefined}
              isRTL={isRTL}
            />
          ) : (
            <>
              {/* Locked floating button */}
              <motion.button
                onClick={() => setShowPremiumDialog(true)}
                className={cn("fixed bottom-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group", isRTL ? "left-6" : "right-6")}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Crown className="w-6 h-6 text-white" />
                <div className={cn("absolute -top-1 w-4 h-4 bg-red-400 rounded-full flex items-center justify-center", isRTL ? "-left-1" : "-right-1")}>
                  <Lock className="w-2.5 h-2.5 text-white" />
                </div>
              </motion.button>

              {/* Premium activation dialog */}
              <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      {isRTL ? 'الوصول إلى الدردشة الذكية' : 'Accès Chatbot Premium'}
                    </DialogTitle>
                    <DialogDescription>
                      {isRTL
                        ? 'أدخل رمز بريميوم للوصول إلى المساعد الذكي لمدة 30 يومًا'
                        : 'Entrez votre token premium pour activer l\'assistant IA pendant 30 jours'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Input
                        placeholder={isRTL ? 'PREMIUM_XXXXXXXXXXXX' : 'PREMIUM_XXXXXXXXXXXX'}
                        value={premiumToken}
                        onChange={(e) => { setPremiumToken(e.target.value); setPremiumError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleActivatePremium()}
                        className={cn("font-mono", premiumError && "border-red-500")}
                        dir="ltr"
                      />
                      {premiumError && (
                        <p className="text-sm text-red-500">{premiumError}</p>
                      )}
                    </div>
                    <Button
                      onClick={handleActivatePremium}
                      disabled={premiumLoading || !premiumToken.trim()}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      {premiumLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Crown className="w-4 h-4 mr-2" />
                      )}
                      {isRTL ? 'تفعيل' : 'Activer'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {isRTL
                        ? 'تواصل مع المسؤول للحصول على رمز بريميوم'
                        : 'Contactez votre administrateur pour obtenir un token premium'}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      )}
    </div>
  );
}

