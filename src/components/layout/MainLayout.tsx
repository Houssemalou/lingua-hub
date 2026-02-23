import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, LayoutDashboard, CalendarCheck, FileText, Gamepad2, User, Users, DoorOpen, Settings, GraduationCap, Swords, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminChatbot } from '@/components/admin/AdminChatbot';
import { StudentChatbot } from '@/components/student/StudentChatbot';

export function MainLayout() {
  const isMobile = useIsMobile();
  const { isRTL, language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || 'student';

  // Check if current route is admin or student
  const isAdminRoute = location.pathname.startsWith('/admin');
  // Hide student assistant on any live/room page (don't show while inside a session)
  const isStudentRoute = location.pathname.startsWith('/student') && !location.pathname.startsWith('/student/room');
  // Live room pages use fixed full-screen layout — no MainLayout padding/margin needed
  const isLiveRoomPage = location.pathname.includes('/room/');

  // Bottom nav items per role
  const studentBottomNav = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { to: '/student/sessions', icon: CalendarCheck, label: 'Sessions' },
    { to: '/student/games', icon: Gamepad2, label: 'Jeux' },
    { to: '/student/evaluations', icon: GraduationCap, label: 'Évals' },
    { to: '/student/profile', icon: User, label: 'Profil' },
  ];
  const professorBottomNav = [
    { to: '/professor/dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { to: '/professor/sessions', icon: CalendarCheck, label: 'Sessions' },
    { to: '/professor/challenges', icon: Swords, label: 'Défis' },
    { to: '/professor/evaluations', icon: GraduationCap, label: 'Évals' },
    { to: '/professor/profile', icon: User, label: 'Profil' },
  ];
  const adminBottomNav = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau' },
    { to: '/admin/rooms', icon: DoorOpen, label: 'Salles' },
    { to: '/admin/students', icon: Users, label: 'Élèves' },
    { to: '/admin/settings', icon: Settings, label: 'Config' },
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
          <span className={cn("font-bold text-sidebar-foreground", isRTL ? "mr-3" : "ml-3")}>LinguaAI</span>
        </header>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
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
          "fixed bottom-0 left-0 right-0 h-16 bg-sidebar border-t border-sidebar-border z-40 flex items-center justify-around px-2",
        )}>
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[52px]",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileBottomNav"
                    className="absolute inset-0 bg-sidebar-primary/10 rounded-xl"
                  />
                )}
                <item.icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      {/* Admin Chatbot - Only visible for admin routes */}
      {isAdminRoute && <AdminChatbot />}

      {/* Student Chatbot - Only on student routes (not live rooms) */}
      {user && isStudentRoute && (
        <StudentChatbot
          studentId={user.student?.id || user.id}
          studentName={user.student?.name || user.email}
          language={language}
          level={user.student?.level || 'A1'}
          age={undefined}
          onClose={undefined}
        />
      )}
    </div>
  );
}

