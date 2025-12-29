import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Target, Mic, MicOff, MessageSquare, Send, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRoomById, getStudentById, mockChatMessages, currentStudent } from '@/data/mockData';
import { QuizModal } from '@/components/quiz/QuizModal';
import { getQuizForSession } from '@/data/quizzes';

export default function StudentLiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const room = getRoomById(roomId || '');
  
  const [isMuted, setIsMuted] = useState(true);
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  
  const quiz = getQuizForSession(roomId || '');

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

  const participants = room.joinedStudents.map(id => getStudentById(id)).filter(Boolean);

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

          {/* Push to Talk */}
          <Card>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="text-center space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-medium text-foreground">Voice Control</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-200 ${
                    isMuted 
                      ? 'bg-muted hover:bg-muted/80' 
                      : 'bg-destructive hover:bg-destructive/90 animate-pulse-ring'
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                  ) : (
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-destructive-foreground" />
                  )}
                </motion.button>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {isMuted ? 'Click to unmute and speak' : 'Speaking... Click to mute'}
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm">
                    <Volume2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Audio Settings</span>
                    <span className="sm:hidden">Audio</span>
                  </Button>
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
          {/* Participants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-success" />
                Participants ({participants.length + 1})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Teacher */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher" />
                  <AvatarFallback>T</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">Teacher</p>
                  <p className="text-xs text-muted-foreground">Host</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-success" />
                </div>
              </div>

              {/* Current Student (Me) */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={currentStudent.avatar} />
                  <AvatarFallback>{currentStudent.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{currentStudent.name} (You)</p>
                  <p className="text-xs text-muted-foreground">{currentStudent.level}</p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isMuted ? 'bg-muted' : 'bg-destructive/20'
                }`}>
                  {isMuted ? (
                    <MicOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Mic className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>

              {/* Other Participants */}
              {participants.filter(p => p && p.id !== currentStudent.id).map((student) => student && (
                <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.level}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <MicOff className="w-4 h-4 text-muted-foreground" />
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
