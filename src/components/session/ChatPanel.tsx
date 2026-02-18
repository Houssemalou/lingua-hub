import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  type: 'chat';
  message: string;
  timestamp: number;
  sender: {
    id: string;
    name: string;
  };
}

interface ChatPanelProps {
  messages?: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserId?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages = [], onSendMessage, currentUserId = '' }) => {
  const [message, setMessage] = useState('');
  const msgs = messages;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const sendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === currentUserId;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="p-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-gray-900">Chat</h3>
            <p className="text-xs text-gray-500">Discutez avec les participants</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
        <div className="space-y-3">
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Aucun message pour le moment</p>
              <p className="text-xs text-gray-400 mt-1">Commencez la conversation !</p>
            </div>
          ) : (
            msgs.map((msg) => {
              const isSelf = isCurrentUser(msg.sender.id);
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    isSelf ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isSelf && (
                    <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                        {msg.sender.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("flex flex-col max-w-[75%]", isSelf && "items-end")}>
                    {!isSelf && (
                      <span className="text-xs font-medium text-gray-700 mb-1 px-1">
                        {msg.sender.name}
                      </span>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 shadow-sm",
                        isSelf
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-sm"
                          : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                      )}
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] text-gray-400 mt-1 px-1",
                      isSelf && "text-right"
                    )}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {isSelf && (
                    <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                        {msg.sender.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t bg-white shadow-inner">
        <div className="flex gap-2 items-end">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white rounded-xl text-black placeholder:text-gray-400 caret-black"
          />
          <Button 
            onClick={sendMessage} 
            size="sm"
            disabled={!message.trim()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 h-10 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 px-1">Appuyez sur Entrée pour envoyer</p>
      </div>
    </div>
  );
};