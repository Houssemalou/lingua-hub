export const LEVEL_LABELS: Record<string, string> = {
  YEAR1: '1re année',
  YEAR2: '2ème année',
  YEAR3: '3ème année',
  YEAR4: '4ème année',
  YEAR5: '5ème année',
  YEAR6: '6ème année',
  YEAR7: '7ème année',
  YEAR8: '8ème année',
  YEAR9: '9ème année',
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
