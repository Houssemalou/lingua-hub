import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MainLayout() {
  const isMobile = useIsMobile();
  const { isRTL } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          paddingTop: isMobile ? 56 : 0
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn("min-h-screen")}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
