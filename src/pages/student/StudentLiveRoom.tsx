import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Target, MessageSquare, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LiveKitRoom } from '@/components/session/LiveKitRoom';
import { RoomService } from '@/services/RoomService';
import { RoomModel } from '@/models';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export default function StudentLiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const [room, setRoom] = useState<RoomModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) return;

      try {
        setLoading(true);
        const response = await RoomService.getById(roomId);
        if (response.success && response.data) {
          // Backend might return an ApiResponse wrapper
          const roomPayload = (response.data as any).data ? (response.data as any).data : response.data;
          setRoom(roomPayload);
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

  const handleLeaveRoom = () => {
    navigate('/student/sessions');
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
          <Button variant="outline" className="mt-4" onClick={() => navigate('/student/sessions')}>
            {isRTL ? 'العودة إلى الجلسات' : 'Back to Sessions'}
          </Button>
        </div>
      </div>
    );
  }

  // If room is not live, show waiting screen
  if (room.status.toLowerCase() !== 'live') {
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
            {room.status.toLowerCase() === 'scheduled'
              ? (isRTL ? 'الجلسة مجدولة لاحقاً' : 'Session is scheduled for later')
              : (isRTL ? 'الجلسة انتهت' : 'Session has ended')
            }
          </p>
          <Button variant="outline" onClick={() => navigate('/student/sessions')}>
            {isRTL ? 'العودة إلى الجلسات' : 'Back to Sessions'}
          </Button>
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
          <Users className="w-3 h-3 mr-1" />
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
