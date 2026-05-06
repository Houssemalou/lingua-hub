export type LevelLabelLocale = 'fr' | 'ar';

export const LEVEL_LABELS_FR: Record<string, string> = {
  // Primaire (enseignement de base – 1er cycle)
  YEAR1: '1ère année primaire',
  YEAR2: '2ème année primaire',
  YEAR3: '3ème année primaire',
  YEAR4: '4ème année primaire',
  YEAR5: '5ème année primaire',
  YEAR6: '6ème année primaire',
  // Collège (enseignement de base – 2ème cycle)
  YEAR7: '7ème année de base',
  YEAR8: '8ème année de base',
  YEAR9: '9ème année de base',
  // Lycée (enseignement secondaire)
  YEAR10: '1ère année secondaire',
  YEAR11: '2ème année secondaire',
  YEAR12: '3ème année secondaire',
  YEAR13: 'Baccalauréat (4ème année)',
  // Classes préparatoires
  PREPA1: '1ère année prépa',
  PREPA2: '2ème année prépa',
  // Langue (CEFR)
  A1: 'Niveau A1',
  A2: 'Niveau A2',
  B1: 'Niveau B1',
  B2: 'Niveau B2',
  C1: 'Niveau C1',
  C2: 'Niveau C2',
};

export const LEVEL_LABELS_AR: Record<string, string> = {
  // التعليم الابتدائي
  YEAR1: 'السنة الأولى ابتدائي',
  YEAR2: 'السنة الثانية ابتدائي',
  YEAR3: 'السنة الثالثة ابتدائي',
  YEAR4: 'السنة الرابعة ابتدائي',
  YEAR5: 'السنة الخامسة ابتدائي',
  YEAR6: 'السنة السادسة ابتدائي',
  // التعليم الأساسي
  YEAR7: 'السنة السابعة أساسي',
  YEAR8: 'السنة الثامنة أساسي',
  YEAR9: 'السنة التاسعة أساسي',
  // التعليم الثانوي
  YEAR10: 'السنة الأولى ثانوي',
  YEAR11: 'السنة الثانية ثانوي',
  YEAR12: 'السنة الثالثة ثانوي',
  YEAR13: 'السنة الرابعة ثانوي (باكالوريا)',
  // تحضيري
  PREPA1: 'السنة الأولى تحضيري',
  PREPA2: 'السنة الثانية تحضيري',
  // مستويات لغات
  A1: 'المستوى A1',
  A2: 'المستوى A2',
  B1: 'المستوى B1',
  B2: 'المستوى B2',
  C1: 'المستوى C1',
  C2: 'المستوى C2',
};

function getCurrentLevelLocale(): LevelLabelLocale {
  if (typeof window === 'undefined') return 'fr';

  const storedLanguage = window.localStorage.getItem('language');
  if (storedLanguage === 'ar') return 'ar';

  const htmlLang = window.document?.documentElement?.lang;
  if (htmlLang?.toLowerCase().startsWith('ar')) return 'ar';

  const htmlDir = window.document?.documentElement?.dir;
  if (htmlDir === 'rtl') return 'ar';

  return 'fr';
}

export function getLevelLabel(level?: string, locale?: LevelLabelLocale) {
  if (!level) return '';
  const effectiveLocale = locale ?? getCurrentLevelLocale();
  const labels = effectiveLocale === 'ar' ? LEVEL_LABELS_AR : LEVEL_LABELS_FR;
  return labels[level] || level;
}

// Convert legacy CEFR codes to YEAR codes. If already a YEAR code, return unchanged.
export function normalizeLevelToYear(level?: string) {
  if (!level) return '';
  const map: Record<string, string> = {
    A1: 'YEAR1',
    A2: 'YEAR2',
    B1: 'YEAR3',
    B2: 'YEAR4',
    C1: 'YEAR5',
    C2: 'YEAR6',
  };
  if (level.startsWith('YEAR')) return level;
  return map[level] || level;
}
