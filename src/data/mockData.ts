import { Student, Room, ChatMessage } from '@/types';

export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    nickname: 'EmmaW',
    bio: 'Passionate about learning Spanish for travel!',
    level: 'B1',
    joinedAt: '2024-01-15',
    skills: { pronunciation: 68, grammar: 72, vocabulary: 65, fluency: 58 },
    totalSessions: 24,
    hoursLearned: 36,
  },
  {
    id: '2',
    name: 'James Chen',
    email: 'james@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    nickname: 'JamesC',
    bio: 'Learning French for business opportunities.',
    level: 'A2',
    joinedAt: '2024-02-20',
    skills: { pronunciation: 55, grammar: 48, vocabulary: 52, fluency: 42 },
    totalSessions: 12,
    hoursLearned: 18,
  },
  {
    id: '3',
    name: 'Sofia Martinez',
    email: 'sofia@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
    nickname: 'SofiaM',
    bio: 'Native Spanish speaker learning English.',
    level: 'C1',
    joinedAt: '2023-11-10',
    skills: { pronunciation: 88, grammar: 92, vocabulary: 85, fluency: 90 },
    totalSessions: 48,
    hoursLearned: 72,
  },
  {
    id: '4',
    name: 'Lucas Brown',
    email: 'lucas@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
    nickname: 'LucasB',
    bio: 'Complete beginner starting my German journey!',
    level: 'A1',
    joinedAt: '2024-06-01',
    skills: { pronunciation: 25, grammar: 20, vocabulary: 30, fluency: 15 },
    totalSessions: 5,
    hoursLearned: 7.5,
  },
  {
    id: '5',
    name: 'Olivia Taylor',
    email: 'olivia@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    nickname: 'OliviaT',
    bio: 'Preparing for my C2 certification exam.',
    level: 'B2',
    joinedAt: '2023-09-05',
    skills: { pronunciation: 78, grammar: 82, vocabulary: 75, fluency: 72 },
    totalSessions: 36,
    hoursLearned: 54,
  },
  {
    id: '6',
    name: 'Noah Anderson',
    email: 'noah@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah',
    nickname: 'NoahA',
    bio: 'Italian language enthusiast.',
    level: 'B1',
    joinedAt: '2024-03-12',
    skills: { pronunciation: 62, grammar: 58, vocabulary: 70, fluency: 55 },
    totalSessions: 18,
    hoursLearned: 27,
  },
];

export const mockRooms: Room[] = [
  {
    id: '1',
    name: 'Spanish Conversation Club',
    language: 'Spanish',
    level: 'B1',
    objective: 'Practice everyday conversations about hobbies and interests',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    maxStudents: 6,
    status: 'scheduled',
    invitedStudents: ['1', '5', '6'],
    joinedStudents: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'French Business Vocabulary',
    language: 'French',
    level: 'A2',
    objective: 'Learn essential business terminology and phrases',
    scheduledAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    duration: 60,
    maxStudents: 4,
    status: 'live',
    invitedStudents: ['2', '4'],
    joinedStudents: ['2'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Advanced English Grammar',
    language: 'English',
    level: 'C1',
    objective: 'Master complex grammatical structures',
    scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    maxStudents: 8,
    status: 'completed',
    invitedStudents: ['3', '5'],
    joinedStudents: ['3', '5'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'German Basics',
    language: 'German',
    level: 'A1',
    objective: 'Introduction to German greetings and basic phrases',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    maxStudents: 5,
    status: 'scheduled',
    invitedStudents: ['4'],
    joinedStudents: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Italian Pronunciation Workshop',
    language: 'Italian',
    level: 'B2',
    objective: 'Perfect your Italian accent and intonation',
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    maxStudents: 4,
    status: 'scheduled',
    invitedStudents: ['5', '6'],
    joinedStudents: [],
    createdAt: new Date().toISOString(),
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    senderId: '2',
    senderName: 'James Chen',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    content: 'Bonjour tout le monde! 👋',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    senderId: 'teacher',
    senderName: 'Teacher',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher',
    content: 'Welcome everyone! Today we will focus on business vocabulary.',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    senderId: '2',
    senderName: 'James Chen',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    content: 'Je suis prêt! Ready to learn!',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
];

export const currentStudent = mockStudents[0];

export const getStudentById = (id: string): Student | undefined => {
  return mockStudents.find((s) => s.id === id);
};

export const getRoomById = (id: string): Room | undefined => {
  return mockRooms.find((r) => r.id === id);
};

export const getStudentSessions = (studentId: string) => {
  return mockRooms
    .filter((room) => room.invitedStudents.includes(studentId))
    .map((room) => ({
      id: room.id,
      roomId: room.id,
      roomName: room.name,
      language: room.language,
      level: room.level,
      objective: room.objective,
      scheduledAt: room.scheduledAt,
      duration: room.duration,
      status: room.status,
      participantsCount: room.invitedStudents.length,
    }));
};
