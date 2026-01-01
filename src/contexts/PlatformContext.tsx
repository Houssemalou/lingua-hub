import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PlatformColors {
  primary: string;
  sidebar: string;
  sidebarForeground: string;
  accent: string;
}

interface PlatformSettings {
  logoUrl: string;
  colors: PlatformColors;
}

interface PlatformContextType {
  settings: PlatformSettings;
  updateLogo: (url: string) => void;
  updateColors: (colors: Partial<PlatformColors>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: PlatformSettings = {
  logoUrl: '',
  colors: {
    primary: '231 48% 48%',
    sidebar: '222 47% 11%',
    sidebarForeground: '210 40% 96%',
    accent: '174 72% 46%',
  },
};

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem('platformSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('platformSettings', JSON.stringify(settings));
    
    // Apply colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', settings.colors.primary);
    root.style.setProperty('--sidebar-background', settings.colors.sidebar);
    root.style.setProperty('--sidebar-foreground', settings.colors.sidebarForeground);
    root.style.setProperty('--sidebar-primary', settings.colors.accent);
    root.style.setProperty('--accent', settings.colors.accent);
  }, [settings]);

  const updateLogo = (url: string) => {
    setSettings(prev => ({ ...prev, logoUrl: url }));
  };

  const updateColors = (colors: Partial<PlatformColors>) => {
    setSettings(prev => ({
      ...prev,
      colors: { ...prev.colors, ...colors },
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return (
    <PlatformContext.Provider value={{ settings, updateLogo, updateColors, resetToDefaults }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
