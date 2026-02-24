import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, GraduationCap } from 'lucide-react';
import { AuthService } from '@/services/AuthService';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

type VerificationStatus = 'loading' | 'success' | 'error';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { theme, toggleTheme } = useTheme();

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Token de vérification manquant');
      return;
    }

    const verify = async () => {
      const result = await AuthService.verifyEmail(token);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'La vérification a échoué');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">LangSchool AI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
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
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  </div>
                  <CardTitle className="text-2xl">Vérification en cours...</CardTitle>
                  <CardDescription>Veuillez patienter</CardDescription>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                    Email vérifié !
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.
                  </CardDescription>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                    Erreur de vérification
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {errorMessage}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {status === 'success' && (
                <Link to="/auth">
                  <Button className="w-full">Se connecter</Button>
                </Link>
              )}
              {status === 'error' && (
                <Link to="/auth">
                  <Button variant="outline" className="w-full">
                    Retour à la connexion
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground">
        &copy; 2024 LangSchool AI. Tous droits réservés
      </footer>
    </div>
  );
}
