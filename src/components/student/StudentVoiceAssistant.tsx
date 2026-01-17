import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  X, 
  Volume2, 
  VolumeX,
  Sparkles,
  MessageCircle,
  Send,
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { currentStudent } from '@/data/mockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Mock AI responses based on context
const mockResponses: Record<string, string[]> = {
  pronunciation: [
    "Pour améliorer votre prononciation, essayez de répéter après moi: 'The rain in Spain stays mainly in the plain.' Concentrez-vous sur les sons 'ai' et 'ay'.",
    "Voici un exercice: Prononcez lentement 'though', 'through', 'thorough'. Ces mots sont souvent confondus!",
    "Excellent effort! N'oubliez pas que la pratique régulière est la clé. Essayez de vous enregistrer et de comparer avec des locuteurs natifs.",
  ],
  grammar: [
    "Le conditionnel en anglais suit cette structure: If + past simple, would + infinitive. Par exemple: 'If I had time, I would travel more.'",
    "Attention à l'ordre des mots dans les questions! En anglais, c'est: Auxiliaire + Sujet + Verbe. 'Do you like coffee?' et non 'Like you coffee?'",
    "Pour le present perfect, utilisez 'have/has + past participle'. 'I have been to Paris' signifie que c'est une expérience passée avec un lien au présent.",
  ],
  vocabulary: [
    "Voici quelques synonymes utiles pour 'beautiful': gorgeous, stunning, breathtaking, magnificent, exquisite.",
    "Les phrasal verbs sont essentiels! 'Look up' (chercher), 'look after' (s'occuper de), 'look forward to' (avoir hâte de).",
    "Pour enrichir votre vocabulaire, essayez d'apprendre 5 nouveaux mots par jour dans un contexte. Utilisez-les dans des phrases!",
  ],
  fluency: [
    "Pour gagner en fluidité, essayez de penser directement en anglais plutôt que de traduire du français. Commencez par des phrases simples.",
    "Les 'fillers' naturels comme 'well', 'you know', 'I mean' peuvent vous aider à maintenir le flux de conversation pendant que vous réfléchissez.",
    "Pratiquez le 'shadowing': écoutez un podcast et répétez immédiatement ce que vous entendez. Cela améliore le rythme et l'intonation.",
  ],
  default: [
    "Je suis là pour vous aider à améliorer vos compétences linguistiques! Que souhaitez-vous travailler aujourd'hui?",
    "C'est une excellente question! Voulez-vous que je vous donne des exercices pratiques?",
    "N'hésitez pas à me demander de l'aide sur la prononciation, la grammaire, le vocabulaire ou la fluidité!",
  ],
};

function getAIResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('prononciation') || lowerMessage.includes('pronunciation') || lowerMessage.includes('accent')) {
    const responses = mockResponses.pronunciation;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  if (lowerMessage.includes('grammaire') || lowerMessage.includes('grammar') || lowerMessage.includes('tense')) {
    const responses = mockResponses.grammar;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  if (lowerMessage.includes('vocabulaire') || lowerMessage.includes('vocabulary') || lowerMessage.includes('word')) {
    const responses = mockResponses.vocabulary;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  if (lowerMessage.includes('fluidité') || lowerMessage.includes('fluency') || lowerMessage.includes('speak')) {
    const responses = mockResponses.fluency;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  const responses = mockResponses.default;
  return responses[Math.floor(Math.random() * responses.length)];
}

export function StudentVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Bonjour ${currentStudent.name.split(' ')[0]}! 👋 Je suis votre assistant IA vocal. Je peux vous aider à améliorer votre prononciation, grammaire, vocabulaire et fluidité. Comment puis-je vous aider aujourd'hui?`,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(inputText),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setIsListening(false);
        const voiceTexts = [
          "Comment améliorer ma prononciation?",
          "Je veux pratiquer la grammaire",
          "Aide-moi avec le vocabulaire",
        ];
        const randomText = voiceTexts[Math.floor(Math.random() * voiceTexts.length)];
        setInputText(randomText);
      }, 2000);
    }
  };

  const quickActions = [
    { label: 'Prononciation', icon: '🎤' },
    { label: 'Grammaire', icon: '📝' },
    { label: 'Vocabulaire', icon: '📚' },
    { label: 'Fluidité', icon: '💬' },
  ];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "bg-gradient-to-br from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70",
          "flex items-center justify-center transition-all duration-300",
          "hover:scale-110 hover:shadow-xl",
          isOpen && "hidden"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <Sparkles className="w-6 h-6 text-accent-foreground" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-[calc(100vw-3rem)] sm:w-[400px] h-[600px] max-h-[calc(100vh-6rem)]",
              "bg-card border border-border rounded-2xl shadow-2xl",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-accent/10 to-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Assistant IA</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">En ligne</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className="h-8 w-8"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 p-3 border-b border-border overflow-x-auto">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => {
                    setInputText(`Aide-moi avec la ${action.label.toLowerCase()}`);
                  }}
                >
                  <span>{action.icon}</span>
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      message.role === 'assistant' 
                        ? "bg-accent/20" 
                        : "bg-primary/20"
                    )}>
                      {message.role === 'assistant' ? (
                        <Bot className="w-4 h-4 text-accent" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl",
                      message.role === 'assistant'
                        ? "bg-muted rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    )}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                    <div className="bg-muted p-3 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={handleVoiceInput}
                  className={cn(
                    "shrink-0 h-10 w-10 rounded-full",
                    isListening && "animate-pulse"
                  )}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Posez votre question..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                  size="icon"
                  className="shrink-0 h-10 w-10 rounded-full"
                >
                  {isTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {isListening && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center text-muted-foreground mt-2"
                >
                  🎤 Écoute en cours... Parlez maintenant
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
