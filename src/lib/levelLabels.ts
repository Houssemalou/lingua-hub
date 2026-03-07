export const LEVEL_LABELS: Record<string, string> = {
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
};

export function getLevelLabel(level?: string) {
  if (!level) return '';
  return LEVEL_LABELS[level] || level;
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
