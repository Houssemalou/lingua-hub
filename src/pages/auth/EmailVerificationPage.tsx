import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, GraduationCap } from 'lucide-react';
import { AuthService } from '@/services/AuthService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Languages } from 'lucide-react';

type VerificationStatus = 'loading' | 'success' | 'error';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, setLanguage, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage(isRTL ? 'رمز التحقق مفقود' : 'Token de vérification manquant');
      return;
    }

    const verify = async () => {
      const result = await AuthService.verifyEmail(token);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || (isRTL ? 'فشل التحقق من البريد الإلكتروني' : 'La vérification a échoué'));
      }
    };

    verify();
  }, [token, isRTL]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">LangSchool AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
          >
            <Languages className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="w-full max-w-md mx-auto glass-card">
            <CardHeader className="text-center">
              {status === 'loading' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  </div>
                  <CardTitle className="text-2xl">
                    {isRTL ? 'جاري التحقق...' : 'Vérification en cours...'}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? 'يرجى الانتظار بينما نتحقق من بريدك الإلكتروني' : 'Veuillez patienter pendant que nous vérifions votre email'}
                  </CardDescription>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl">
                    {isRTL ? 'تم التحقق بنجاح !' : 'Email vérifié !'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {isRTL
                      ? 'تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول.'
                      : 'Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.'}
                  </CardDescription>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <CardTitle className="text-2xl">
                    {isRTL ? 'فشل التحقق' : 'Échec de la vérification'}
                  </CardTitle>
                  <CardDescription className="text-base text-destructive">
                    {errorMessage}
                  </CardDescription>
                </>
              )}
            </CardHeader>

            {status !== 'loading' && (
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  {isRTL ? 'تسجيل الدخول' : 'Se connecter'}
                </Button>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground">
        &copy; 2024 LangSchool AI. {isRTL ? 'جميع الحقوق محفوظة' : 'Tous droits réservés'}
      </footer>
    </div>
  );
}
