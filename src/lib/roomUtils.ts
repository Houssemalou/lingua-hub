// ============================================
// Room Utilities
// Helper functions for room management
// ============================================

import { RoomModel } from '@/models';

/**
 * Check if a room can be joined based on scheduled time
 * Allows joining 15 minutes before scheduled time
 */
export function canJoinRoom(room: RoomModel): { canJoin: boolean; reason?: string } {
  const now = new Date();
  const scheduledTime = new Date(room.scheduledAt);
  const allowedJoinTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000); // 15 minutes before

  // Check if scheduled time has arrived (with 15 min buffer)
  if (now < allowedJoinTime) {
    const minutesUntil = Math.ceil((allowedJoinTime.getTime() - now.getTime()) / 60000);
    return {
      canJoin: false,
      reason: `Session starts in ${minutesUntil} minutes. You can join 15 minutes before the scheduled time.`
    };
  }

  // Check if room is in a joinable status
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

  return { canJoin: true };
}

/**
 * Check if a professor can start a room
 */
export function canStartRoom(room: RoomModel): { canStart: boolean; reason?: string } {
  const now = new Date();
  const scheduledTime = new Date(room.scheduledAt);
  const allowedStartTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000); // 15 minutes before

  // Check if scheduled time has arrived
  if (now < allowedStartTime) {
    const minutesUntil = Math.ceil((allowedStartTime.getTime() - now.getTime()) / 60000);
    return {
      canStart: false,
      reason: `You can start the session in ${minutesUntil} minutes (15 minutes before scheduled time).`
    };
  }

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
