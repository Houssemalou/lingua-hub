// ============================================
// Subject Categories and Types
// ============================================

export type SubjectCategory = 'languages' | 'sciences';

export type LanguageSubject = 'English' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese' | 'Arabic';

export type ScienceSubject = 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology';

export type Subject = LanguageSubject | ScienceSubject;

// Language learning levels (CEFR)
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Science education levels
export type ScienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type SubjectLevel = LanguageLevel | ScienceLevel;

// Skills per category
export interface LanguageSkills {
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
}

export interface MathSkills {
  algebra: number;
  geometry: number;
  calculus: number;
  problemSolving: number;
}

export interface PhysicsSkills {
  mechanics: number;
  electricity: number;
  optics: number;
  thermodynamics: number;
}

export interface ChemistrySkills {
  organicChemistry: number;
  inorganicChemistry: number;
  reactions: number;
  labSkills: number;
}

export interface BiologySkills {
  cellBiology: number;
  genetics: number;
  ecology: number;
  anatomy: number;
}

export type SubjectSkills = LanguageSkills | MathSkills | PhysicsSkills | ChemistrySkills | BiologySkills;

// Subject metadata
export interface SubjectInfo {
  id: Subject;
  name: string;
  nameFr: string;
  nameAr: string;
  category: SubjectCategory;
  icon: string;
  color: string;
  levels: SubjectLevel[];
  skills: string[];
}

// All subjects with metadata
export const SUBJECTS: SubjectInfo[] = [
  // Languages
  {
    id: 'English',
    name: 'English',
    nameFr: 'Anglais',
    nameAr: 'الإنجليزية',
    category: 'languages',
    icon: '🇬🇧',
    color: 'hsl(var(--primary))',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    skills: ['pronunciation', 'grammar', 'vocabulary', 'fluency']
  },
  {
    id: 'French',
    name: 'French',
    nameFr: 'Français',
    nameAr: 'الفرنسية',
    category: 'languages',
    icon: '🇫🇷',
    color: 'hsl(var(--accent))',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    skills: ['pronunciation', 'grammar', 'vocabulary', 'fluency']
  },
  {
    id: 'Spanish',
    name: 'Spanish',
    nameFr: 'Espagnol',
    nameAr: 'الإسبانية',
    category: 'languages',
    icon: '🇪🇸',
    color: 'hsl(var(--warning))',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    skills: ['pronunciation', 'grammar', 'vocabulary', 'fluency']
  },
  {
    id: 'German',
    name: 'German',
    nameFr: 'Allemand',
    nameAr: 'الألمانية',
    category: 'languages',
    icon: '🇩🇪',
    color: 'hsl(var(--destructive))',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    skills: ['pronunciation', 'grammar', 'vocabulary', 'fluency']
  },
  {
    id: 'Italian',
    name: 'Italian',
    nameFr: 'Italien',
    nameAr: 'الإيطالية',
    category: 'languages',
    icon: '🇮🇹',
    color: 'hsl(var(--success))',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    skills: ['pronunciation', 'grammar', 'vocabulary', 'fluency']
  },
  // Sciences
  {
    id: 'Mathematics',
    name: 'Mathematics',
    nameFr: 'Mathématiques',
    nameAr: 'الرياضيات',
    category: 'sciences',
    icon: '📐',
    color: 'hsl(217, 91%, 60%)',
    levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    skills: ['algebra', 'geometry', 'calculus', 'problemSolving']
  },
  {
    id: 'Physics',
    name: 'Physics',
    nameFr: 'Physique',
    nameAr: 'الفيزياء',
    category: 'sciences',
    icon: '⚛️',
    color: 'hsl(262, 83%, 58%)',
    levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    skills: ['mechanics', 'electricity', 'optics', 'thermodynamics']
  },
  {
    id: 'Chemistry',
    name: 'Chemistry',
    nameFr: 'Chimie',
    nameAr: 'الكيمياء',
    category: 'sciences',
    icon: '🧪',
    color: 'hsl(142, 71%, 45%)',
    levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    skills: ['organicChemistry', 'inorganicChemistry', 'reactions', 'labSkills']
  },
  {
    id: 'Biology',
    name: 'Biology',
    nameFr: 'Biologie',
    nameAr: 'علم الأحياء',
    category: 'sciences',
    icon: '🧬',
    color: 'hsl(25, 95%, 53%)',
    levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    skills: ['cellBiology', 'genetics', 'ecology', 'anatomy']
  }
];

export const getSubjectInfo = (subjectId: Subject): SubjectInfo | undefined => {
  return SUBJECTS.find(s => s.id === subjectId);
};

export const getSubjectsByCategory = (category: SubjectCategory): SubjectInfo[] => {
  return SUBJECTS.filter(s => s.category === category);
};

export const isLanguageSubject = (subject: Subject): subject is LanguageSubject => {
  return ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic'].includes(subject);
};

export const isScienceSubject = (subject: Subject): subject is ScienceSubject => {
  return ['Mathematics', 'Physics', 'Chemistry', 'Biology'].includes(subject);
};
