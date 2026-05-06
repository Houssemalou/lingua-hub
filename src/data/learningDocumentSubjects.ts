export type LearningDocumentSubject =
  | 'ARABIC'
  | 'FRENCH'
  | 'ENGLISH'
  | 'MATHEMATICS'
  | 'SCIENCE'
  | 'HISTORY_GEOGRAPHY'
  | 'CIVIC_EDUCATION'
  | 'ISLAMIC_EDUCATION'
  | 'TECHNOLOGY'
  | 'ARTS'
  | 'OTHER';

export interface LearningDocumentSubjectInfo {
  id: LearningDocumentSubject;
  name: string;
  nameFr: string;
  nameAr: string;
  icon: string;
  color: string;
}

export const learningDocumentSubjects: LearningDocumentSubjectInfo[] = [
  { id: 'ARABIC', name: 'Arabic', nameFr: 'Arabe', nameAr: 'العربية', icon: '📚', color: 'hsl(20, 86%, 55%)' },
  { id: 'FRENCH', name: 'French', nameFr: 'Français', nameAr: 'الفرنسية', icon: '🇫🇷', color: 'hsl(340, 80%, 55%)' },
  { id: 'ENGLISH', name: 'English', nameFr: 'Anglais', nameAr: 'الإنجليزية', icon: '🇬🇧', color: 'hsl(210, 80%, 55%)' },
  { id: 'MATHEMATICS', name: 'Mathematics', nameFr: 'Mathématiques', nameAr: 'الرياضيات', icon: '📐', color: 'hsl(217, 91%, 60%)' },
  { id: 'SCIENCE', name: 'Science', nameFr: 'Sciences', nameAr: 'العلوم', icon: '🔬', color: 'hsl(262, 83%, 58%)' },
  { id: 'HISTORY_GEOGRAPHY', name: 'History / Geography', nameFr: 'Histoire-Géographie', nameAr: 'التاريخ والجغرافيا', icon: '🌍', color: 'hsl(38, 92%, 50%)' },
  { id: 'CIVIC_EDUCATION', name: 'Civic education', nameFr: 'Education civique', nameAr: 'التربية المدنية', icon: '🏛️', color: 'hsl(173, 80%, 40%)' },
  { id: 'ISLAMIC_EDUCATION', name: 'Islamic education', nameFr: 'Education islamique', nameAr: 'التربية الإسلامية', icon: '☪️', color: 'hsl(142, 71%, 45%)' },
  { id: 'TECHNOLOGY', name: 'Technology', nameFr: 'Technologie', nameAr: 'التكنولوجيا', icon: '💻', color: 'hsl(200, 70%, 45%)' },
  { id: 'ARTS', name: 'Arts', nameFr: 'Arts', nameAr: 'الفنون', icon: '🎨', color: 'hsl(25, 95%, 53%)' },
];

export const learningDocumentDisplaySubjects = learningDocumentSubjects.filter((subject) => subject.id !== 'OTHER');

export const getLearningDocumentSubjectInfo = (subject?: LearningDocumentSubject | null) => {
  return learningDocumentSubjects.find((item) => item.id === (subject || 'OTHER')) ?? learningDocumentSubjects[learningDocumentSubjects.length - 1];
};