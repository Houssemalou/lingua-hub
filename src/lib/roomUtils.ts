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
export function canJoinRoom(room: RoomModel): { canJoin: boolean; reason?: string; minutesLeft?: number } {
  // Always check status first
  if (room.status === 'completed') {
    return {
      canJoin: false,
      reason: 'This session has already ended.'
    };
  }

  if (room.status === 'cancelled') {
    return {
      canJoin: false,
      reason: 'This session has been cancelled.'
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
      reason: `Session starts in ${minutesLeft} minutes. You can join 15 minutes before the scheduled time.`
    };
  }

  return { canJoin: true };
}

/**
 * Check if a professor can start a room
 * Always enforces the 15-min rule
 */
export function canStartRoom(room: RoomModel): { canStart: boolean; reason?: string; minutesLeft?: number } {
  // Check if already started
  if (room.status === 'live') {
    return {
      canStart: false,
      reason: 'Session is already live.'
    };
  }

  // Check if completed or cancelled
  if (room.status === 'completed' || room.status === 'cancelled') {
    return {
      canStart: false,
      reason: `Session has been ${room.status}.`
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
      reason: `You can start the session in ${minutesLeft} minutes (15 minutes before scheduled time).`
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
export function formatTimeUntilJoinable(room: RoomModel): string {
  const minutes = getMinutesUntilJoinable(room);
  
  if (minutes <= 0) {
    return 'Available now';
  }
  
  if (minutes < 60) {
    return `Available in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `Available in ${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `Available in ${hours}h ${remainingMinutes}m`;
}
