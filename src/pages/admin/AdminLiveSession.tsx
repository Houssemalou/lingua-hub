import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Clock, Target, Play, Pause, StopCircle, Mic, MicOff, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getRoomById, getStudentById, mockChatMessages } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminLiveSession() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const room = getRoomById(roomId || '');
  
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(600); // 10 minutes in for demo
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!isSessionActive) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isSessionActive]);

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Room not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/rooms')}>
            Back to Rooms
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((elapsedTime / (room.duration * 60)) * 100, 100);

  const handleEndSession = () => {
    toast.success('Session ended successfully');
    navigate('/admin/rooms');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: 'teacher',
      senderName: 'Teacher',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher',
      content: newMessage,
      timestamp: new Date().toISOString(),
    }]);
    setNewMessage('');
  };

  const joinedStudentData = room.joinedStudents.map(id => getStudentById(id)).filter(Boolean);
  const invitedNotJoined = room.invitedStudents
    .filter(id => !room.joinedStudents.includes(id))
    .map(id => getStudentById(id))
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/rooms')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
            <Badge variant="live">LIVE</Badge>
          </div>
          <p className="text-muted-foreground">{room.language} • {room.level}</p>
        </div>
        <Button variant="destructive" onClick={handleEndSession} className="gap-2">
          <StopCircle className="w-4 h-4" />
          End Session
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Timer */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-mono font-bold text-foreground">
                    {formatTime(elapsedTime)}
                  </div>
                  <span className="text-muted-foreground">/ {room.duration}:00</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isSessionActive ? 'outline' : 'default'}
                    size="icon"
                    onClick={() => setIsSessionActive(!isSessionActive)}
                  >
                    {isSessionActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(progress)}% complete
              </p>
            </CardContent>
          </Card>

          {/* Objective */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Session Objective
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{room.objective}</p>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="flex flex-col h-80">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Session Chat
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={msg.senderAvatar} />
                      <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-sm">{msg.senderName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2">
              <Input
                placeholder="Send a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm">Send</Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Joined Students */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-success" />
                Joined ({joinedStudentData.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {joinedStudentData.map((student) => student && (
                <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg bg-success/10 border border-success/20">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.level}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-success" />
                  </div>
                </div>
              ))}
              {joinedStudentData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students have joined yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pending Students */}
          {invitedNotJoined.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  Pending ({invitedNotJoined.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invitedNotJoined.map((student) => student && (
                  <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border">
                    <Avatar className="w-10 h-10 opacity-60">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-muted-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.level}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <MicOff className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participation</span>
                <span className="font-medium">{Math.round((joinedStudentData.length / room.invitedStudents.length) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{room.duration} min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
