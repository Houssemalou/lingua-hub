import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Target, 
  MessageSquare, 
  Send, 
  Clock,
  BookOpen,
  Play,
  Pause,
  PhoneOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { getRoomById, getStudentById, mockChatMessages, getProfessorById } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MediaControlsLabeled } from '@/components/session/MediaControls';
import { VideoGrid } from '@/components/session/VideoGrid';
import { useMediaStream } from '@/hooks/useMediaStream';
import { cn } from '@/lib/utils';

export default function ProfessorLiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const room = getRoomById(roomId || '');
  const professor = user?.professor;

  const [isSessionActive, setIsSessionActive] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');

  const {
    isMuted,
    isCameraOn,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    localVideoRef,
  } = useMediaStream({
    onError: (error) => {
      toast({
        title: 'Erreur média',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = room ? (elapsedTime / (room.duration * 60)) * 100 : 0;

  const handleEndSession = () => {
    toast({
      title: isRTL ? 'انتهت الجلسة' : 'Session terminée',
      description: isRTL ? 'لقد أنهيت الجلسة بنجاح' : 'Vous avez terminé la session avec succès',
    });
    navigate('/professor/sessions');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !professor) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: professor.id,
      senderName: professor.name,
      senderAvatar: professor.avatar,
      content: newMessage,
      timestamp: new Date().toISOString(),
    }]);
    setNewMessage('');
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {isRTL ? 'لم يتم العثور على الجلسة' : 'Session non trouvée'}
          </h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/professor/sessions')}>
            {isRTL ? 'العودة إلى الجلسات' : 'Retour aux sessions'}
          </Button>
        </div>
      </div>
    );
  }

  const joinedStudents = room.joinedStudents.map(id => getStudentById(id)).filter(Boolean);

  // Build participants list for video grid
  const participants = [
    // Professor (host)
    {
      id: professor?.id || 'prof',
      name: professor?.name || 'Professeur',
      avatar: professor?.avatar,
      isMuted,
      isCameraOn,
      isScreenSharing,
      isHost: true,
      isCurrentUser: true,
      role: 'professor' as const,
    },
    // Students
    ...joinedStudents.map(student => ({
      id: student!.id,
      name: student!.name,
      avatar: student!.avatar,
      isMuted: true,
      isCameraOn: false,
      isScreenSharing: false,
      isHost: false,
      isCurrentUser: false,
      role: 'student' as const,
    })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
        <Button variant="ghost" size="icon" onClick={() => navigate('/professor/sessions')}>
          <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
        </Button>
        <div className={cn("flex-1", isRTL && "text-right")}>
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse justify-end")}>
            <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
            {room.status === 'live' && <Badge variant="live">LIVE</Badge>}
          </div>
          <p className="text-muted-foreground">{room.language} • {room.level}</p>
        </div>
        <Button variant="destructive" onClick={handleEndSession} className="gap-2">
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isRTL ? 'إنهاء الجلسة' : 'Terminer la session'}
          </span>
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Session Timer */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className={cn("flex items-center justify-between mb-4", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</span>
                  <span className="text-muted-foreground">/ {room.duration} min</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSessionActive(!isSessionActive)}
                  className="gap-2"
                >
                  {isSessionActive ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span className="hidden sm:inline">{isRTL ? 'إيقاف مؤقت' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span className="hidden sm:inline">{isRTL ? 'استئناف' : 'Reprendre'}</span>
                    </>
                  )}
                </Button>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
            </CardContent>
          </Card>

          {/* Video Grid */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className={cn("text-lg flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Users className="w-5 h-5 text-primary" />
                {isRTL ? 'المشاركون' : 'Participants'} ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <VideoGrid
                participants={participants}
                localVideoRef={localVideoRef}
                isRTL={isRTL}
              />
            </CardContent>
          </Card>

          {/* Media Controls */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <MediaControlsLabeled
                isMuted={isMuted}
                isCameraOn={isCameraOn}
                isScreenSharing={isScreenSharing}
                onToggleMute={toggleMute}
                onToggleCamera={toggleCamera}
                onToggleScreenShare={toggleScreenShare}
                isRTL={isRTL}
                labels={{
                  mute: isRTL ? 'كتم الصوت' : 'Couper le micro',
                  unmute: isRTL ? 'تفعيل الصوت' : 'Activer le micro',
                  cameraOn: isRTL ? 'الكاميرا مفعلة' : 'Caméra activée',
                  cameraOff: isRTL ? 'تفعيل الكاميرا' : 'Activer la caméra',
                  shareScreen: isRTL ? 'مشاركة الشاشة' : 'Partager l\'écran',
                  stopShare: isRTL ? 'إيقاف المشاركة' : 'Arrêter le partage',
                }}
              />
            </CardContent>
          </Card>

          {/* Session Objective */}
          <Card className="gradient-accent">
            <CardContent className="p-4 sm:p-6">
              <div className={cn("flex items-start gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sidebar-primary-foreground/20 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-sidebar-primary-foreground" />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <h3 className="font-semibold text-sidebar-primary-foreground text-base sm:text-lg">
                    {isRTL ? 'هدف الجلسة' : 'Objectif de la session'}
                  </h3>
                  <p className="text-sidebar-primary-foreground/90 mt-1 text-sm sm:text-base">{room.objective}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Chat */}
          <Card className="flex flex-col h-96">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className={cn("text-lg flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <MessageSquare className="w-5 h-5 text-primary" />
                {isRTL ? 'الدردشة' : 'Chat'}
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.senderId === professor?.id;
                  return (
                    <div key={msg.id} className={cn("flex gap-3", isMe ? 'flex-row-reverse' : '', isRTL && !isMe ? 'flex-row-reverse' : '')}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.senderAvatar} />
                        <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={cn("max-w-[70%]", isMe ? 'text-right' : '', isRTL && 'text-right')}>
                        <div className={cn("flex items-baseline gap-2", isMe ? 'flex-row-reverse' : '')}>
                          <span className="font-medium text-sm">{isMe ? (isRTL ? 'أنت' : 'Vous') : msg.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={cn(
                          "mt-1 p-3 rounded-lg",
                          isMe 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-foreground'
                        )}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className={cn("p-3 border-t border-border flex gap-2", isRTL && "flex-row-reverse")}>
              <Input
                placeholder={isRTL ? 'اكتب رسالة...' : 'Écrire un message...'}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
                dir={isRTL ? "rtl" : "ltr"}
              />
              <Button type="submit" size="icon">
                <Send className={cn("w-4 h-4", isRTL && "rotate-180")} />
              </Button>
            </form>
          </Card>

          {/* Joined Students */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <BookOpen className="w-5 h-5 text-success" />
                {isRTL ? 'الطلاب المتصلون' : 'Étudiants connectés'} ({joinedStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {joinedStudents.length === 0 ? (
                <p className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
                  {isRTL ? 'لا يوجد طلاب متصلون بعد' : 'Aucun étudiant connecté'}
                </p>
              ) : (
                joinedStudents.map(student => student && (
                  <div 
                    key={student.id} 
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                      <p className="font-medium text-sm truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.level}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {isRTL ? 'متصل' : 'Connecté'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
