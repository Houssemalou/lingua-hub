import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Target,
  Clock,
  Play,
  Pause,
  PhoneOff,
  Settings2,
  ClipboardCheck,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LiveKitRoom } from '@/components/session/LiveKitRoom';
import { RoomService } from '@/services/RoomService';
import { RoomModel } from '@/models';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { RoomSessionSummaryEditor } from '@/components/professor/RoomSessionSummaryEditor';

export default function ProfessorLiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [room, setRoom] = useState<RoomModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showSummaryEditor, setShowSummaryEditor] = useState(false);
  
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

  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  const handleLeaveRoom = () => {
    navigate('/professor/sessions');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32 rounded" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        {/* Room content skeleton */}
        <div className="flex-1 p-4">
          <Skeleton className="w-full h-full rounded-lg" />
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
          <Button variant="outline" className="mt-4" onClick={() => navigate('/professor/sessions')}>
            {isRTL ? 'العودة إلى الجلسات' : 'Back to Sessions'}
          </Button>
        </div>
      </div>
    );
  }

  // If room is not live, show waiting screen (but allow professor to start it)
  if (room.status.toLowerCase() !== 'live') {
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
            {room.status.toLowerCase() === 'scheduled'
              ? (isRTL ? 'الجلسة مجدولة لاحقاً' : 'Session is scheduled for later')
              : (isRTL ? 'الجلسة انتهت' : 'Session has ended')
            }
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/professor/sessions')}>
              {isRTL ? 'العودة إلى الجلسات' : 'Back to Sessions'}
            </Button>

            {isAssignedProfessor && room.status.toLowerCase() === 'scheduled' && (
              <Button
                variant="default"
                onClick={async () => {
                  try {
                    setStarting(true);
                    const startRes = await RoomService.startSession(room.id);
                    if (startRes.success && startRes.data) {
                      const started = (startRes as any).data?.data ? (startRes as any).data.data : startRes.data;
                      setRoom(started);
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
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSummaryEditor(true)}
            className={cn("gap-2", isRTL && "flex-row-reverse")}
          >
            <FileText className="w-4 h-4" />
            {isRTL ? 'إنشاء ملخص' : 'Créer résumé'}
          </Button>
          <Badge variant="live" className="animate-pulse">
            <Play className="w-3 h-3 mr-1" />
            {isRTL ? 'مباشر' : 'LIVE'}
          </Badge>
        </div>
      </div>

      {/* LiveKit Room */}
      <div className="flex-1">
        <LiveKitRoom
          roomId={room.id}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>

      {/* Session Summary Editor */}
      <RoomSessionSummaryEditor
        roomId={room.id}
        roomName={room.name}
        language={room.language}
        level={room.level}
        isOpen={showSummaryEditor}
        onClose={() => setShowSummaryEditor(false)}
        onSaved={() => {
          toast.success(isRTL ? 'تم حفظ ملخص الجلسة' : 'Résumé de session sauvegardé');
        }}
        isRTL={isRTL}
      />
    </div>
  );
}
