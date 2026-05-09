import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const studentInfoSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  nickname: z.string().min(2, "Le pseudo doit contenir au moins 2 caractères"),
  uniqueCode: z.string().min(1, "Le code d'accès est requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const professorInfoSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  specialization: z.string().min(2, "La spécialisation est requise"),
  languages: z.array(z.string()).min(1, "Sélectionnez au moins une matière"),
});

export const adminSignupSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  accessToken: z.string().min(1, "Le token d'accès est requis"),
});

export const createRoomSchema = z.object({
  roomName: z.string().min(2, "Le nom de la session est requis"),
  roomLanguage: z.string().min(1, "La langue est requise"),
  roomLevel: z.string().min(1, "Le niveau est requis"),
  scheduledAt: z.string().min(1, "La date et l'heure sont requises"),
}).refine((data) => {
  const scheduled = new Date(data.scheduledAt);
  const now = new Date();
  return scheduled > now;
}, {
  message: "La date de la session doit être dans le futur",
  path: ["scheduledAt"],
});

export const professorProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  specialization: z.string().min(2, "La spécialisation doit contenir au moins 2 caractères"),
  bio: z.string().optional(),
});

export const studentProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  nickname: z.string().min(2, "Le pseudo doit contenir au moins 2 caractères"),
  bio: z.string().optional(),
});

export const challengeSchema = z.object({
  title: z.string().min(2, "Le titre est requis"),
  question: z.string().min(5, "La question doit contenir au moins 5 caractères"),
  options: z.array(z.string().min(1, "L'option ne peut pas être vide")).min(2, "Au moins 2 options requises"),
  correctAnswer: z.number().min(0, "Sélectionnez la réponse correcte"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type StudentInfoData = z.infer<typeof studentInfoSchema>;
export type ProfessorInfoData = z.infer<typeof professorInfoSchema>;
export type AdminSignupData = z.infer<typeof adminSignupSchema>;
export type CreateRoomData = z.infer<typeof createRoomSchema>;
export type ProfessorProfileData = z.infer<typeof professorProfileSchema>;
export type StudentProfileData = z.infer<typeof studentProfileSchema>;
export type ChallengeData = z.infer<typeof challengeSchema>;
