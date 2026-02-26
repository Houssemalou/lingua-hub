import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatform } from '@/contexts/PlatformContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AccessTokenGenerator } from '@/components/admin/AccessTokenGenerator';

const colorPresets = [
  { name: 'Bleu Professionnel', primary: '231 48% 48%', sidebar: '222 47% 11%', accent: '174 72% 46%' },
  { name: 'Vert Nature', primary: '142 71% 45%', sidebar: '160 30% 15%', accent: '142 71% 45%' },
  { name: 'Violet Royal', primary: '270 50% 50%', sidebar: '270 30% 15%', accent: '280 60% 60%' },
  { name: 'Orange Dynamique', primary: '25 95% 53%', sidebar: '20 30% 12%', accent: '38 92% 50%' },
  { name: 'Rose Moderne', primary: '330 80% 60%', sidebar: '330 25% 15%', accent: '340 75% 55%' },
  { name: 'Turquoise Frais', primary: '180 60% 45%', sidebar: '180 30% 12%', accent: '170 70% 50%' },
];

const AdminPlatformSettings = () => {
  const { t, isRTL } = useLanguage();
  const { settings, updateColors, resetToDefaults } = usePlatform();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);


  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    setSelectedPreset(preset.name);
    updateColors({
      primary: preset.primary,
      sidebar: preset.sidebar,
      accent: preset.accent,
    });
    toast.success(isRTL ? 'تم تطبيق الثيم بنجاح' : 'Thème appliqué avec succès');
  };

  const handleReset = () => {
    resetToDefaults();
    setLogoInput('');
    setSelectedPreset(null);
    toast.success(isRTL ? 'تمت إعادة الإعدادات الافتراضية' : 'Paramètres réinitialisés');
  };

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isRTL ? 'إعدادات المنصة' : 'Paramètres de la plateforme'}
        </h1>
        <p className="text-muted-foreground">
          {isRTL ? 'تخصيص مظهر وألوان المنصة' : 'Personnalisez l\'apparence et les couleurs de la plateforme'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Logo settings removed per admin UI requirements */}

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Palette className="w-5 h-5 text-primary" />
              {isRTL ? 'لوحة الألوان' : 'Palette de couleurs'}
            </CardTitle>
            <CardDescription>
              {isRTL ? 'اختر ثيم الألوان للمنصة' : 'Choisissez le thème de couleurs de la plateforme'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105",
                    selectedPreset === preset.name 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="space-y-2">
                    {/* Color Preview */}
                    <div className="flex gap-1">
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: `hsl(${preset.primary})` }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: `hsl(${preset.sidebar})` }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: `hsl(${preset.accent})` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-foreground text-center">
                      {preset.name}
                    </p>
                  </div>
                  {selectedPreset === preset.name && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Theme Preview */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isRTL ? 'معاينة الثيم الحالي' : 'Aperçu du thème actuel'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div 
                className="h-20 rounded-lg"
                style={{ backgroundColor: `hsl(${settings.colors.primary})` }}
              />
              <p className="text-xs text-muted-foreground text-center">Primary</p>
            </div>
            <div className="space-y-2">
              <div 
                className="h-20 rounded-lg"
                style={{ backgroundColor: `hsl(${settings.colors.sidebar})` }}
              />
              <p className="text-xs text-muted-foreground text-center">Sidebar</p>
            </div>
            <div className="space-y-2">
              <div 
                className="h-20 rounded-lg"
                style={{ backgroundColor: `hsl(${settings.colors.accent})` }}
              />
              <p className="text-xs text-muted-foreground text-center">Accent</p>
            </div>
            <div className="space-y-2">
              <div 
                className="h-20 rounded-lg border"
                style={{ backgroundColor: `hsl(${settings.colors.sidebarForeground})` }}
              />
              <p className="text-xs text-muted-foreground text-center">Text</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Token Generator */}
      <AccessTokenGenerator />

      {/* Reset Button */}
      <div className={cn("flex", isRTL ? "justify-start" : "justify-end")}>
        <Button variant="outline" onClick={handleReset} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <RotateCcw className="w-4 h-4" />
          {isRTL ? 'إعادة الإعدادات الافتراضية' : 'Réinitialiser les paramètres'}
        </Button>
      </div>
    </div>
  );
};

export default AdminPlatformSettings;
