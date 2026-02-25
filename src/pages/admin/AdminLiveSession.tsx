import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Clock, Target, Play, Pause, StopCircle, Mic, MicOff, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LiveKitRoom } from '@/components/session/LiveKitRoom';
import { getLevelLabel } from '@/lib/levelLabels';
import { RoomService } from '@/services/RoomService';
import { RoomModel } from '@/models';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function AdminLiveSession() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const [room, setRoom] = useState<RoomModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) return;

      try {
        setLoading(true);
        const response = await RoomService.getById(roomId);
        if (response.success && response.data) {
          // Backend might return an ApiResponse wrapper: { data: RoomModel } or { data: { data: RoomModel } }
          const roomPayload = (response.data as any).data ? (response.data as any).data : response.data;
          setRoom(roomPayload);

          // Only the assigned professor can auto-start a session, not admin
          const isAssignedProfessor = user?.role === 'professor' && roomPayload.professorId === user?.id;

          if (roomPayload.status !== 'live' && isAssignedProfessor) {
            setStarting(true);
            const startRes = await RoomService.startSession(roomPayload.id);
            if (startRes.success) {
              // Reload room to get updated status
              const updatedResponse = await RoomService.getById(roomPayload.id);
              if (updatedResponse.success && updatedResponse.data) {
                const updated = (updatedResponse.data as any).data ? (updatedResponse.data as any).data : updatedResponse.data;
                setRoom(updated);
              }
              toast.success(isRTL ? 'تم بدء الجلسة' : 'Session started');
            } else {
              // Starting failed, keep the loaded room and show error
              setError(startRes.error || (isRTL ? 'فشل في بدء الجلسة' : 'Failed to start session'));
            }
            setStarting(false);
          }

        } else {
          setError(response.error || 'Failed to load room');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId]);

  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  const handleLeaveRoom = async () => {
    if (room && room.id) {
      try { await RoomService.leave(room.id); } catch (e) { console.error('Error notifying leave from page header:', e); }
    }
    navigate('/admin/rooms');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>{isRTL ? 'جاري تحميل الغرفة...' : 'Loading room...'}</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {isRTL ? 'الغرفة غير موجودة' : 'Room not found'}
          </h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/rooms')}>
            {isRTL ? 'العودة إلى الغرف' : 'Back to Rooms'}
          </Button>
        </div>
      </div>
    );
  }

  // If room is not live, show waiting screen (but allow only assigned professor to start it)
  if (room.status !== 'live') {
    const isAdmin = user?.role === 'admin';
    const isAssignedProfessor = user?.role === 'professor' && room.professorId === user?.id;

    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {isRTL ? 'الجلسة غير نشطة' : 'Session not active'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {room.status === 'scheduled'
              ? (isRTL ? 'الجلسة مجدولة لاحقاً' : 'Session is scheduled for later')
              : (isRTL ? 'الجلسة انتهت' : 'Session has ended')
            }
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/rooms')}>
              {isRTL ? 'العودة إلى الغرف' : 'Back to Rooms'}
            </Button>

            {/* Only assigned professor can start the session, not admin */}
            {isAssignedProfessor && (
              <Button
                variant="default"
                onClick={async () => {
                  try {
                    setStarting(true);
                    const startRes = await RoomService.startSession(room.id);
                    if (startRes.success) {
                      // Reload room to get updated status
                      const updatedResponse = await RoomService.getById(room.id);
                      if (updatedResponse.success && updatedResponse.data) {
                        const updated = (updatedResponse.data as any).data ? (updatedResponse.data as any).data : updatedResponse.data;
                        setRoom(updated);
                      }
                      toast.success(isRTL ? 'تم بدء الجلسة' : 'Session started');
                    } else {
                      toast.error(startRes.error || (isRTL ? 'فشل في بدء الجلسة' : 'Failed to start session'));
                    }
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed to start session');
                  } finally {
                    setStarting(false);
                  }
                }}
                disabled={starting}
              >
                {starting ? (isRTL ? 'جارٍ البدء...' : 'Starting...') : (isRTL ? 'بدء الجلسة' : 'Start Session')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className={cn("flex items-center justify-between p-4 border-b border-border", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
          <Button variant="ghost" size="icon" onClick={handleLeaveRoom}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-xl font-bold text-foreground">{room.name}</h1>
            <p className="text-sm text-muted-foreground">
              {room.language} • {room.level} • {isRTL ? 'مباشر' : 'Live'}
            </p>
          </div>
        </div>
        <Badge variant="live" className="animate-pulse">
          <Play className="w-3 h-3 mr-1" />
          {isRTL ? 'مباشر' : 'LIVE'}
        </Badge>
      </div>

      {/* LiveKit Room */}
      <div className="flex-1">
        <LiveKitRoom
          roomId={room.id}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>
    </div>
  );
}
