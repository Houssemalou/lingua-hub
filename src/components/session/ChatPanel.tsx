import React, { useState } from 'react';
import { Chat, ChatEntry } from '@livekit/components-react';
import { Room } from 'livekit-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatPanelProps {
  room: Room;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ room }) => {
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    if (message.trim() && room) {
      // Using LiveKit's data channel for chat
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify({
          type: 'chat',
          message: message.trim(),
          timestamp: Date.now(),
        })),
        { reliable: true }
      );
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <Chat />
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};