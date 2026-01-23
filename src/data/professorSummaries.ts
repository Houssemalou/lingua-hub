// ============================================
// Professor Session Summaries Data
// ============================================

export interface ProfessorSessionSummary {
  id: string;
  sessionId: string;
  studentId: string;
  professorId: string;
  professorName: string;
  professorAvatar: string;
  roomName: string;
  language: string;
  level: string;
  date: string;
  duration: number;
  
  // Performance metrics
  overallScore: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  participation: number;
  
  // Professional feedback
  professorFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  
  // Session details
  topicsDiscussed: string[];
  newVocabulary: { word: string; translation: string; example: string }[];
  grammarPoints: string[];
  
  // Recommendations
  recommendations: string[];
  nextSessionFocus: string;
  
  // Metadata
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockProfessorSummaries: ProfessorSessionSummary[] = [
  {
    id: 'prof-summary-1',
    sessionId: '3',
    studentId: '1',
    professorId: '1',
    professorName: 'Marie Dubois',
    professorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    roomName: 'Advanced English Grammar',
    language: 'English',
    level: 'B2',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    
    overallScore: 78,
    pronunciation: 75,
    grammar: 82,
    vocabulary: 80,
    fluency: 72,
    participation: 85,
    
    professorFeedback: `Emma a démontré une excellente progression lors de cette session. Sa maîtrise des phrases conditionnelles de type 2 et 3 est remarquable. Elle participe activement aux discussions et n'hésite pas à prendre des risques linguistiques, ce qui est essentiel pour progresser.

Points particulièrement positifs :
- Utilisation créative du vocabulaire avancé
- Bonne compréhension des nuances grammaticales
- Attitude positive et engagement constant

Je recommande de continuer à pratiquer les temps composés et de travailler sur l'intonation dans les questions. La lecture à voix haute d'articles de presse pourrait être bénéfique.`,
    
    strengths: [
      'Maîtrise excellente des conditionnels',
      'Vocabulaire riche et varié',
      'Participation active et enthousiaste',
      'Bonne capacité d\'auto-correction'
    ],
    areasToImprove: [
      'Améliorer l\'intonation interrogative',
      'Travailler le past perfect',
      'Renforcer l\'usage des connecteurs logiques'
    ],
    
    topicsDiscussed: [
      'Les phrases conditionnelles (Type 2 & 3)',
      'Le discours rapporté',
      'La rédaction d\'emails professionnels',
      'Le débat sur le télétravail'
    ],
    newVocabulary: [
      { word: 'Nevertheless', translation: 'Néanmoins', example: 'The project was difficult; nevertheless, we completed it on time.' },
      { word: 'Furthermore', translation: 'De plus', example: 'The price is reasonable. Furthermore, the quality is excellent.' },
      { word: 'Subsequently', translation: 'Par la suite', example: 'He studied hard and subsequently passed the exam.' },
      { word: 'Notwithstanding', translation: 'Nonobstant', example: 'Notwithstanding the difficulties, we succeeded.' }
    ],
    grammarPoints: [
      'If + past simple → would + infinitive',
      'If + past perfect → would have + past participle',
      'Différence entre Say et Tell dans le discours rapporté',
      'Position des adverbes de fréquence'
    ],
    
    recommendations: [
      'Pratiquer les conditionnels avec des exercices en ligne (recommandé: British Council)',
      'Écouter des podcasts en anglais 15-20 minutes par jour',
      'Tenir un journal de vocabulaire avec exemples contextuels',
      'Lire des articles du Guardian ou BBC News',
      'Pratiquer la lecture à voix haute pour améliorer la fluidité'
    ],
    nextSessionFocus: 'La voix passive et l\'écriture formelle - Préparation à la rédaction de rapports professionnels',
    
    isPublished: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prof-summary-2',
    sessionId: 'session-2',
    studentId: '2',
    professorId: '1',
    professorName: 'Marie Dubois',
    professorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    roomName: 'French Conversation Practice',
    language: 'Français',
    level: 'B1',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    
    overallScore: 72,
    pronunciation: 70,
    grammar: 68,
    vocabulary: 75,
    fluency: 65,
    participation: 80,
    
    professorFeedback: `Lucas montre une progression constante dans sa maîtrise du français oral. Sa volonté de s'exprimer malgré les erreurs est très appréciable et contribue grandement à son apprentissage.

Cette session a mis en lumière une bonne compréhension des expressions idiomatiques, mais il reste des défis concernant l'accord des adjectifs et la distinction passé composé/imparfait.

Je note particulièrement:
- Un effort louable pour utiliser des structures complexes
- Une bonne écoute et compréhension
- Une amélioration notable de la prononciation des voyelles nasales

Pour la prochaine session, nous travaillerons sur les hypothèses et le conditionnel.`,
    
    strengths: [
      'Bonne compréhension du subjonctif',
      'Prononciation améliorée des voyelles nasales',
      'Utilisation créative des expressions idiomatiques',
      'Écoute active et réceptivité aux corrections'
    ],
    areasToImprove: [
      'Accord genre/nombre des adjectifs',
      'Distinction passé composé vs imparfait',
      'Vitesse de réponse en conversation spontanée'
    ],
    
    topicsDiscussed: [
      'Les routines quotidiennes',
      'La description d\'expériences passées',
      'Faire des projets et des rendez-vous',
      'Les loisirs et hobbies'
    ],
    newVocabulary: [
      { word: 'Quotidien', translation: 'Daily', example: 'Ma routine quotidienne commence à 7h.' },
      { word: 'Autrefois', translation: 'In the past', example: 'Autrefois, les gens voyageaient en calèche.' },
      { word: 'Désormais', translation: 'From now on', example: 'Désormais, je ferai plus attention.' }
    ],
    grammarPoints: [
      'Le subjonctif avec les expressions de doute',
      'Différence passé composé / imparfait',
      'Position des pronoms compléments'
    ],
    
    recommendations: [
      'Écouter des podcasts français pendant les trajets',
      'Écrire de courts textes de journal en français',
      'Utiliser des flashcards pour les conjugaisons',
      'Regarder des films français avec sous-titres français'
    ],
    nextSessionFocus: 'Les situations hypothétiques et le conditionnel présent',
    
    isPublished: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prof-summary-3',
    sessionId: 'session-3',
    studentId: '3',
    professorId: '1',
    professorName: 'Marie Dubois',
    professorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    roomName: 'Spanish for Beginners',
    language: 'Español',
    level: 'A2',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    
    overallScore: 85,
    pronunciation: 88,
    grammar: 82,
    vocabulary: 85,
    fluency: 80,
    participation: 90,
    
    professorFeedback: `Sophie fait preuve d'un talent naturel pour l'espagnol! Sa prononciation est exceptionnellement bonne pour son niveau, notamment le roulement du R qui est souvent difficile pour les francophones.

Son enthousiasme est contagieux et elle n'hésite jamais à poser des questions ou à demander des clarifications. Cette attitude est un atout majeur pour son apprentissage.

Points d'attention pour progresser:
- La distinction ser/estar reste à consolider
- Quelques irrégularités verbales à mémoriser
- L'utilisation des articles définis

Excellent travail cette semaine!`,
    
    strengths: [
      'Prononciation excellente du R roulé',
      'Apprentissage rapide du vocabulaire',
      'Participation enthousiaste et curieuse',
      'Bonne mémoire et rétention'
    ],
    areasToImprove: [
      'Distinction Ser vs Estar',
      'Conjugaisons des verbes irréguliers',
      'Utilisation des articles définis'
    ],
    
    topicsDiscussed: [
      'Se présenter et présenter sa famille',
      'Décrire les membres de la famille',
      'Les nombres et les dates',
      'Les couleurs et les vêtements'
    ],
    newVocabulary: [
      { word: 'Hermano/a', translation: 'Frère/Sœur', example: 'Mi hermana se llama María.' },
      { word: 'Abuelos', translation: 'Grands-parents', example: 'Mis abuelos viven en Madrid.' },
      { word: 'Cumpleaños', translation: 'Anniversaire', example: 'Mi cumpleaños es el 15 de marzo.' }
    ],
    grammarPoints: [
      'Ser pour les caractéristiques permanentes',
      'Estar pour les états temporaires et la localisation',
      'Les adjectifs possessifs (mi, tu, su)'
    ],
    
    recommendations: [
      'Regarder des dessins animés en espagnol',
      'Utiliser des applications d\'échange linguistique',
      'Apprendre une nouvelle conjugaison par jour',
      'Écouter de la musique latino avec les paroles'
    ],
    nextSessionFocus: 'Les activités quotidiennes et les verbes réflexifs',
    
    isPublished: false, // Draft
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prof-summary-4',
    sessionId: 'session-4',
    studentId: '4',
    professorId: '1',
    professorName: 'Marie Dubois',
    professorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    roomName: 'Business English Workshop',
    language: 'English',
    level: 'B1',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 75,
    
    overallScore: 70,
    pronunciation: 68,
    grammar: 72,
    vocabulary: 75,
    fluency: 65,
    participation: 70,
    
    professorFeedback: `Marc développe progressivement les compétences nécessaires pour communiquer en anglais des affaires. Sa compréhension des registres formels s'améliore, et la structure de ses emails est devenue plus professionnelle.

Observations clés:
- Bonne assimilation du vocabulaire business
- Structure des emails améliorée
- Présentation des idées plus claire

Défis identifiés:
- La confiance lors des présentations orales
- L'utilisation du langage d'atténuation (hedging)
- Le vocabulaire spécifique aux réunions

Je recommande des exercices de présentation devant un miroir et l'écoute de podcasts business.`,
    
    strengths: [
      'Bonne compréhension du registre formel',
      'Structure d\'email améliorée',
      'Présentation claire des idées',
      'Motivation constante'
    ],
    areasToImprove: [
      'Confiance en présentation',
      'Utilisation du hedging language',
      'Vocabulaire des réunions'
    ],
    
    topicsDiscussed: [
      'Rédaction d\'emails professionnels',
      'Étiquette en réunion',
      'Conversations téléphoniques',
      'Négociation basique'
    ],
    newVocabulary: [
      { word: 'Regarding', translation: 'Concernant', example: 'I\'m writing regarding your recent inquiry.' },
      { word: 'Stakeholder', translation: 'Partie prenante', example: 'All stakeholders must approve the proposal.' },
      { word: 'Deadline', translation: 'Date limite', example: 'The deadline for submissions is Friday.' }
    ],
    grammarPoints: [
      'Registre formel vs informel',
      'Voix passive dans l\'écriture business',
      'Structures de demande polie'
    ],
    
    recommendations: [
      'Pratiquer des présentations mock à la maison',
      'Lire la presse économique en anglais',
      'Rejoindre des forums business en anglais',
      'Regarder des TED Talks sur le leadership'
    ],
    nextSessionFocus: 'Techniques de négociation et langage persuasif',
    
    isPublished: true,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Get summaries by professor ID
export const getProfessorSessionSummaries = (professorId: string): ProfessorSessionSummary[] => {
  return mockProfessorSummaries.filter(s => s.professorId === professorId);
};

// Get summary by ID
export const getProfessorSummaryById = (summaryId: string): ProfessorSessionSummary | undefined => {
  return mockProfessorSummaries.find(s => s.id === summaryId);
};

// Get summaries for a specific student (visible to student)
export const getStudentVisibleSummaries = (studentId: string): ProfessorSessionSummary[] => {
  return mockProfessorSummaries.filter(s => s.studentId === studentId && s.isPublished);
};

// Get summary for a specific session and student
export const getSessionStudentSummary = (sessionId: string, studentId: string): ProfessorSessionSummary | undefined => {
  return mockProfessorSummaries.find(s => s.sessionId === sessionId && s.studentId === studentId);
};
