import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Target, MessageSquare, Send, Volume2, Mic, MicOff, Video, VideoOff, MonitorUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRoomById, getStudentById, mockChatMessages, currentStudent, getProfessorById } from '@/data/mockData';
import { QuizModal } from '@/components/quiz/QuizModal';
import { getQuizForSession } from '@/data/quizzes';
import { MediaControlsLabeled } from '@/components/session/MediaControls';
import { VideoGrid } from '@/components/session/VideoGrid';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function StudentLiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const room = getRoomById(roomId || '');
  
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  
  const quiz = getQuizForSession(roomId || '');

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

  const handleLeaveRoom = () => {
    if (quiz && !quiz.completed) {
      setShowQuiz(true);
    } else {
      navigate('/student/sessions');
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Room not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/student/sessions')}>
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: currentStudent.id,
      senderName: currentStudent.name,
      senderAvatar: currentStudent.avatar,
      content: newMessage,
      timestamp: new Date().toISOString(),
    }]);
    setNewMessage('');
  };

  const otherStudents = room.joinedStudents.map(id => getStudentById(id)).filter(Boolean);
  
  // Get professor if session is animated by one
  const professor = room.animatorType === 'professor' && room.professorId 
    ? getProfessorById(room.professorId) 
    : null;

  // Build participants list for video grid
  const participants = [
    // Host (Professor or AI)
    {
      id: professor?.id || 'host',
      name: professor?.name || 'AI Teacher',
      avatar: professor?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=AITeacher',
      isMuted: false,
      isCameraOn: professor ? true : false,
      isScreenSharing: false,
      isHost: true,
      isCurrentUser: false,
      role: professor ? 'professor' as const : undefined,
    },
    // Current student (me)
    {
      id: currentStudent.id,
      name: currentStudent.name,
      avatar: currentStudent.avatar,
      isMuted,
      isCameraOn,
      isScreenSharing,
      isHost: false,
      isCurrentUser: true,
      role: 'student' as const,
    },
    // Other students
    ...otherStudents.filter(s => s && s.id !== currentStudent.id).map(student => ({
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/student/sessions')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
            {room.status === 'live' && <Badge variant="live">LIVE</Badge>}
          </div>
          <p className="text-muted-foreground">{room.language} • {room.level}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
          {/* Video Grid */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <VideoGrid
                participants={participants}
                localVideoRef={localVideoRef}
              />
            </CardContent>
          </Card>

          {/* Media Controls */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-foreground">Contrôles média</h3>
                <MediaControlsLabeled
                  isMuted={isMuted}
                  isCameraOn={isCameraOn}
                  isScreenSharing={isScreenSharing}
                  onToggleMute={toggleMute}
                  onToggleCamera={toggleCamera}
                  onToggleScreenShare={toggleScreenShare}
                />
              </div>
            </CardContent>
          </Card>

          {/* Session Objective */}
          <Card className="gradient-accent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sidebar-primary-foreground/20 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-sidebar-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sidebar-primary-foreground text-base sm:text-lg">Session Objective</h3>
                  <p className="text-sidebar-primary-foreground/90 mt-1 text-sm sm:text-base">{room.objective}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="flex flex-col h-96">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Text Chat
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentStudent.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.senderAvatar} />
                        <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                        <div className={`flex items-baseline gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="font-medium text-sm">{isMe ? 'You' : msg.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`mt-1 p-3 rounded-lg ${
                          isMe 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-foreground'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Participants List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-success" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {participants.map((participant) => (
                <div 
                  key={participant.id} 
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border",
                    participant.isHost 
                      ? "bg-primary/10 border-primary/20"
                      : participant.isCurrentUser
                      ? "bg-accent/10 border-accent/20"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {participant.name}
                      {participant.isCurrentUser && ' (You)'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.isHost ? 'Host' : participant.role === 'student' ? 'Student' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {participant.isScreenSharing && (
                      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                        <MonitorUp className="w-3 h-3 text-success" />
                      </div>
                    )}
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      participant.isCameraOn ? "bg-primary/20" : "bg-muted"
                    )}>
                      {participant.isCameraOn ? (
                        <Video className="w-3 h-3 text-primary" />
                      ) : (
                        <VideoOff className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      participant.isMuted ? "bg-muted" : "bg-destructive/20"
                    )}>
                      {participant.isMuted ? (
                        <MicOff className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <Mic className="w-3 h-3 text-destructive" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="font-medium">{room.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level</span>
                <Badge variant={room.level.toLowerCase() as any}>{room.level}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{room.duration} minutes</span>
              </div>
            </CardContent>
          </Card>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLeaveRoom}
          >
            Leave Room
          </Button>
        </div>
      </div>

      {/* Quiz Modal */}
      {quiz && (
        <QuizModal
          quiz={quiz}
          isOpen={showQuiz}
          onClose={() => {
            setShowQuiz(false);
            navigate('/student/sessions');
          }}
          onComplete={(score) => {
            console.log('Quiz completed with score:', score);
          }}
        />
      )}
    </motion.div>
  );
}
