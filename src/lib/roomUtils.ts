// ============================================
// Room Utilities
// Helper functions for room management
// ============================================

import { RoomModel } from '@/models';

// Dev mode configuration - set to false in production
const DEV_MODE = import.meta.env.VITE_DEV_MODE !== 'false'; // true by default
const ALLOW_EARLY_JOIN = import.meta.env.VITE_ALLOW_EARLY_JOIN !== 'false'; // true by default

/**
 * Check if a room can be joined based on scheduled time
 * Allows joining 15 minutes before scheduled time
 * Always enforces the 15-min rule regardless of dev mode
 */
export function canJoinRoom(room: RoomModel, isRTL = false): { canJoin: boolean; reason?: string; minutesLeft?: number } {
  // Always check status first
  if (room.status === 'completed') {
    return {
      canJoin: false,
      reason: isRTL ? 'هذه الجلسة انتهت بالفعل.' : 'Cette session est déjà terminée.'
    };
  }

  if (room.status === 'cancelled') {
    return {
      canJoin: false,
      reason: isRTL ? 'تم إلغاء هذه الجلسة.' : 'Cette session a été annulée.'
    };
  }

  // If room is already live, allow joining
  if (room.status === 'live') {
    return { canJoin: true };
  }

  // Enforce 15-min-before rule for scheduled rooms
  const now = new Date();
  const scheduledTime = new Date(room.scheduledAt);
  const allowedJoinTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000); // 15 minutes before

  if (now < allowedJoinTime) {
    const minutesLeft = Math.ceil((allowedJoinTime.getTime() - now.getTime()) / 60000);
    return {
      canJoin: false,
      minutesLeft,
      reason: isRTL
        ? `تبدأ الجلسة بعد ${minutesLeft} دقيقة. يمكنك الانضمام قبل 15 دقيقة من الموعد المحدد.`
        : `La session commence dans ${minutesLeft} minutes. Vous pouvez rejoindre 15 minutes avant l'heure prévue.`
    };
  }

  return { canJoin: true };
}

/**
 * Check if a professor can start a room
 * Always enforces the 15-min rule
 */
export function canStartRoom(room: RoomModel, isRTL = false): { canStart: boolean; reason?: string; minutesLeft?: number } {
  // Check if already started
  if (room.status === 'live') {
    return {
      canStart: false,
      reason: isRTL ? 'الجلسة قيد التنفيذ بالفعل.' : 'La session est déjà en cours.'
    };
  }

  // Check if completed or cancelled
  if (room.status === 'completed' || room.status === 'cancelled') {
    const statusLabel = room.status === 'completed'
      ? (isRTL ? 'مكتملة' : 'terminée')
      : (isRTL ? 'ملغاة' : 'annulée');
    return {
      canStart: false,
      reason: isRTL ? `الجلسة ${statusLabel}.` : `La session est ${statusLabel}.`
    };
  }

  // Enforce 15-min-before rule
  const now = new Date();
  const scheduledTime = new Date(room.scheduledAt);
  const allowedStartTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000);

  if (now < allowedStartTime) {
    const minutesLeft = Math.ceil((allowedStartTime.getTime() - now.getTime()) / 60000);
    return {
      canStart: false,
      minutesLeft,
      reason: isRTL
        ? `يمكنك بدء الجلسة بعد ${minutesLeft} دقيقة (15 دقيقة قبل الموعد المحدد).`
        : `Vous pourrez démarrer la session dans ${minutesLeft} minutes (15 minutes avant l'heure prévue).`
    };
  }

  return { canStart: true };
}

/**
 * Get time until room can be joined (in minutes)
 * Returns 0 if can join now, or negative if passed
 */
export function getMinutesUntilJoinable(room: RoomModel): number {
  const now = new Date();
  const scheduledTime = new Date(room.scheduledAt);
  const allowedJoinTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000);
  
  return Math.ceil((allowedJoinTime.getTime() - now.getTime()) / 60000);
}

/**
 * Format time until joinable as a human-readable string
 */
export function formatTimeUntilJoinable(room: RoomModel, isRTL = false): string {
  const minutes = getMinutesUntilJoinable(room);
  
  if (minutes <= 0) {
    return isRTL ? 'متاح الآن' : 'Disponible maintenant';
  }
  
  if (minutes < 60) {
    return isRTL
      ? `متاح بعد ${minutes} دقيقة`
      : `Disponible dans ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return isRTL
      ? `متاح بعد ${hours} ساعة`
      : `Disponible dans ${hours} heure${hours !== 1 ? 's' : ''}`;
  }
  
  return isRTL
    ? `متاح بعد ${hours} سا ${remainingMinutes} د`
    : `Disponible dans ${hours}h ${remainingMinutes}m`;
}
