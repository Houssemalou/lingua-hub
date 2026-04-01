import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { isRTL } = useLanguage();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{isRTL ? 'مرحبًا بك في LearnUP' : 'Bienvenue sur LearnUP'}</h1>
        <p className="text-xl text-muted-foreground">{isRTL ? 'منصة تعلم اللغات الذكية' : 'La plateforme intelligente d\'apprentissage des langues'}</p>
      </div>
    </div>
  );
};

export default Index;
