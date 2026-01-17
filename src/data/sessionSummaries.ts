// ============================================
// Mock Session Summaries Data
// ============================================

export interface SessionSummary {
  id: string;
  sessionId: string;
  roomName: string;
  language: string;
  level: string;
  date: string;
  duration: number;
  professorName: string;
  professorAvatar: string;
  
  // Performance metrics
  overallScore: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  participation: number;
  
  // Feedback
  strengths: string[];
  areasToImprove: string[];
  professorFeedback: string;
  
  // Session details
  topicsDiscussed: string[];
  newVocabulary: { word: string; translation: string; example: string }[];
  grammarPoints: string[];
  
  // Recommendations
  recommendations: string[];
  nextSessionFocus: string;
}

export const mockSessionSummaries: SessionSummary[] = [
  {
    id: 'summary-1',
    sessionId: '3',
    roomName: 'Advanced English Grammar',
    language: 'English',
    level: 'B2',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    professorName: 'Marie Dubois',
    professorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    
    overallScore: 78,
    pronunciation: 75,
    grammar: 82,
    vocabulary: 80,
    fluency: 72,
    participation: 85,
    
    strengths: [
      'Excellent use of conditional sentences',
      'Good vocabulary range for the topic',
      'Active participation in discussions'
    ],
    areasToImprove: [
      'Work on past perfect tense usage',
      'Improve intonation in questions',
      'Practice linking words'
    ],
    professorFeedback: 'Emma showed great improvement this session! Her confidence in speaking has increased significantly. Continue practicing complex sentences at home.',
    
    topicsDiscussed: [
      'Conditional sentences (Type 2 & 3)',
      'Reported speech',
      'Business email writing'
    ],
    newVocabulary: [
      { word: 'Nevertheless', translation: 'Néanmoins', example: 'The project was difficult; nevertheless, we completed it on time.' },
      { word: 'Furthermore', translation: 'De plus', example: 'The price is reasonable. Furthermore, the quality is excellent.' },
      { word: 'Subsequently', translation: 'Par la suite', example: 'He studied hard and subsequently passed the exam.' }
    ],
    grammarPoints: [
      'If + past simple, would + infinitive',
      'If + past perfect, would have + past participle',
      'Say vs Tell in reported speech'
    ],
    
    recommendations: [
      'Practice conditional sentences with online exercises',
      'Watch English news for 15 minutes daily',
      'Keep a vocabulary journal'
    ],
    nextSessionFocus: 'Passive voice and formal writing'
  },
  {
    id: 'summary-2',
    sessionId: 'session-2',
    roomName: 'French Conversation Practice',
    language: 'French',
    level: 'B1',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    professorName: 'Marie Dubois',
    professorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    
    overallScore: 72,
    pronunciation: 70,
    grammar: 68,
    vocabulary: 75,
    fluency: 65,
    participation: 80,
    
    strengths: [
      'Good understanding of subjunctive mood',
      'Improved pronunciation of nasal vowels',
      'Creative use of idiomatic expressions'
    ],
    areasToImprove: [
      'Gender agreement with adjectives',
      'Use of passé composé vs imparfait',
      'Speed of response in conversations'
    ],
    professorFeedback: 'Great effort this week! Your willingness to experiment with new structures is commendable. Focus on verb conjugations for next time.',
    
    topicsDiscussed: [
      'Daily routines and habits',
      'Describing past experiences',
      'Making plans and appointments'
    ],
    newVocabulary: [
      { word: 'Quotidien', translation: 'Daily', example: 'Ma routine quotidienne commence à 7h.' },
      { word: 'Autrefois', translation: 'In the past', example: 'Autrefois, les gens voyageaient en calèche.' },
      { word: 'Désormais', translation: 'From now on', example: 'Désormais, je ferai plus attention.' }
    ],
    grammarPoints: [
      'Subjunctive with expressions of doubt',
      'Difference between passé composé and imparfait',
      'Position of object pronouns'
    ],
    
    recommendations: [
      'Listen to French podcasts during commute',
      'Practice writing short diary entries in French',
      'Use flashcards for verb conjugations'
    ],
    nextSessionFocus: 'Hypothetical situations and conditional mood'
  },
  {
    id: 'summary-3',
    sessionId: 'session-3',
    roomName: 'Spanish for Beginners',
    language: 'Spanish',
    level: 'A2',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    professorName: 'Carmen Rodriguez',
    professorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carmen',
    
    overallScore: 85,
    pronunciation: 88,
    grammar: 82,
    vocabulary: 85,
    fluency: 80,
    participation: 90,
    
    strengths: [
      'Excellent pronunciation of rolling R',
      'Quick grasp of new vocabulary',
      'Enthusiastic participation'
    ],
    areasToImprove: [
      'Ser vs Estar distinction',
      'Irregular verb conjugations',
      'Use of definite articles'
    ],
    professorFeedback: 'Fantastic progress! Your natural ear for Spanish pronunciation is impressive. Keep up the momentum and don\'t be afraid to make mistakes!',
    
    topicsDiscussed: [
      'Introducing yourself',
      'Describing family members',
      'Numbers and dates'
    ],
    newVocabulary: [
      { word: 'Hermano/a', translation: 'Brother/Sister', example: 'Mi hermana se llama María.' },
      { word: 'Abuelos', translation: 'Grandparents', example: 'Mis abuelos viven en Madrid.' },
      { word: 'Cumpleaños', translation: 'Birthday', example: 'Mi cumpleaños es el 15 de marzo.' }
    ],
    grammarPoints: [
      'Ser for permanent characteristics',
      'Estar for temporary states and locations',
      'Possessive adjectives (mi, tu, su)'
    ],
    
    recommendations: [
      'Watch Spanish movies with subtitles',
      'Practice with language exchange apps',
      'Learn one new verb conjugation per day'
    ],
    nextSessionFocus: 'Daily activities and reflexive verbs'
  },
  {
    id: 'summary-4',
    sessionId: 'session-4',
    roomName: 'Business English Workshop',
    language: 'English',
    level: 'B1',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 75,
    professorName: 'John Smith',
    professorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    
    overallScore: 70,
    pronunciation: 68,
    grammar: 72,
    vocabulary: 75,
    fluency: 65,
    participation: 70,
    
    strengths: [
      'Good understanding of formal register',
      'Improved email structure',
      'Clear presentation of ideas'
    ],
    areasToImprove: [
      'Presentation confidence',
      'Use of hedging language',
      'Meeting vocabulary'
    ],
    professorFeedback: 'You\'re building a solid foundation for business English. Work on your presentation skills and you\'ll be ready for professional settings.',
    
    topicsDiscussed: [
      'Writing professional emails',
      'Meeting etiquette',
      'Telephone conversations'
    ],
    newVocabulary: [
      { word: 'Regarding', translation: 'Concernant', example: 'I\'m writing regarding your recent inquiry.' },
      { word: 'Stakeholder', translation: 'Partie prenante', example: 'All stakeholders must approve the proposal.' },
      { word: 'Deadline', translation: 'Date limite', example: 'The deadline for submissions is Friday.' }
    ],
    grammarPoints: [
      'Formal vs informal register',
      'Passive voice in business writing',
      'Polite request structures'
    ],
    
    recommendations: [
      'Practice mock presentations at home',
      'Read business news in English',
      'Join online business English forums'
    ],
    nextSessionFocus: 'Negotiation skills and persuasive language'
  }
];

export const getStudentSessionSummaries = (studentId: string): SessionSummary[] => {
  // In a real app, this would filter by student ID
  return mockSessionSummaries;
};

export const getSessionSummaryById = (summaryId: string): SessionSummary | undefined => {
  return mockSessionSummaries.find(s => s.id === summaryId);
};
