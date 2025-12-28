import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  CalendarCheck,
  User,
  TrendingUp,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Languages,
  ShieldCheck,
  GraduationCap,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRole } from '@/contexts/RoleContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { currentStudent } from '@/data/mockData';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const adminNavItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/rooms', icon: DoorOpen, label: 'Rooms' },
  { to: '/admin/students', icon: Users, label: 'Students' },
];

const studentNavItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/sessions', icon: CalendarCheck, label: 'Sessions' },
  { to: '/student/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/student/profile', icon: User, label: 'Profile' },
];

export function AppSidebar({ collapsed, onToggle, isMobile, onClose }: SidebarProps) {
  const location = useLocation();
  const { role, setRole } = useRole();
  const { theme, toggleTheme } = useTheme();

  const navItems = role === 'admin' ? adminNavItems : studentNavItems;

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        "fixed left-0 h-screen bg-sidebar flex flex-col border-r border-sidebar-border z-50",
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
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                <Languages className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-sidebar-foreground">LinguaAI</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && !isMobile && (
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center mx-auto">
            <Languages className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground ml-auto"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Role Switcher */}
      <div className="p-3 border-b border-sidebar-border">
        <div className={cn("flex gap-1", collapsed && !isMobile && "flex-col")}>
          <Button
            variant={role === 'admin' ? 'default' : 'ghost'}
            size={(collapsed && !isMobile) ? 'icon-sm' : 'sm'}
            onClick={() => setRole('admin')}
            className={cn(
              "flex-1",
              role === 'admin' 
                ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            {(!collapsed || isMobile) && <span className="ml-1">Admin</span>}
          </Button>
          <Button
            variant={role === 'student' ? 'default' : 'ghost'}
            size={(collapsed && !isMobile) ? 'icon-sm' : 'sm'}
            onClick={() => setRole('student')}
            className={cn(
              "flex-1",
              role === 'student' 
                ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <GraduationCap className="w-4 h-4" />
            {(!collapsed || isMobile) && <span className="ml-1">Student</span>}
          </Button>
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
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary rounded-r-full"
                  style={{ left: '-8px' }}
                />
              )}
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium"
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
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-5 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
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
                className="font-medium"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User */}
        {role === 'student' && (
          <div className="px-3 py-3 border-t border-sidebar-border">
            <div className={cn("flex items-center gap-3", collapsed && !isMobile && "justify-center")}>
              <Avatar className="w-9 h-9">
                <AvatarImage src={currentStudent.avatar} />
                <AvatarFallback>{currentStudent.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <AnimatePresence mode="wait">
                {(!collapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {currentStudent.name}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      Level {currentStudent.level}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center py-3 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </motion.aside>
  );
}
