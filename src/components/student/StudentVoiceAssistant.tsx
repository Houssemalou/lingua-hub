import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  MessageCircle,
  BookOpen,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar3DCharacter } from './Avatar3DCharacter';

type AssistantState = 'idle' | 'listening' | 'speaking';

interface ConversationMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

const TIPS = [
  "Essayez de me parler en français pour pratiquer !",
  "Posez-moi une question sur la grammaire 📖",
  "Demandez-moi de corriger votre prononciation 🎤",
  "Je peux vous aider avec le vocabulaire scientifique 🔬",
];

export function StudentVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [state, setState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<ConversationMessage[]>([
    { id: '1', role: 'assistant', text: 'Bonjour ! Je suis votre assistant linguistique. Parlez-moi pour améliorer vos compétences de communication ! 🎓' },
  ]);
  const [tipIndex, setTipIndex] = useState(0);

  const statusConfig: Record<AssistantState, { label: string; color: string }> = {
    idle: { label: 'Prêt à vous aider', color: 'bg-emerald-400' },
    listening: { label: 'Je vous écoute…', color: 'bg-red-400' },
    speaking: { label: 'Je parle…', color: 'bg-blue-400' },
  };

  const handleMicToggle = useCallback(() => {
    if (state === 'listening') {
      setState('idle');
      // Simulate user message + assistant response
      const userMsg: ConversationMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: 'Comment dit-on "hello" en français ?',
      };
      setMessages(prev => [...prev, userMsg]);

      setTimeout(() => {
        setState('speaking');
        const assistantMsg: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'On dit "Bonjour" ! C\'est la salutation la plus courante en français. Essayez de le prononcer : "Bon-jour" 🗣️',
        };
        setMessages(prev => [...prev, assistantMsg]);
        setTimeout(() => setState('idle'), 4000);
      }, 2000);
    } else {
      setState('listening');
      setTipIndex(i => (i + 1) % TIPS.length);
    }
  }, [state]);

  return (
    <>
      {/* ── Floating 3D Character Trigger ─────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 cursor-pointer"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            style={{ width: 100, height: 120 }}
          >
            {/* Glow behind character */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/40 via-violet-500/30 to-purple-600/40 blur-2xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* 3D Character */}
            <div className="relative w-full h-full pointer-events-none">
              <Avatar3DCharacter isSpeaking={false} className="w-full h-full" />
            </div>

            {/* Speech bubble */}
            <motion.div
              className="absolute -top-10 -left-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-border text-[10px] font-medium text-foreground whitespace-nowrap"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span>Parlons ensemble ! 💬</span>
              <div className="absolute bottom-0 left-6 translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-slate-800 border-r border-b border-border" />
            </motion.div>

            {/* Online indicator */}
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-2 ring-background animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Expanded Assistant Panel ─────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 80 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 80 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed bottom-4 right-4 z-50 w-[340px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border bg-background"
            style={{ maxHeight: '85vh' }}
          >
            {/* ── Header with 3D Character ───────────────────── */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-4">
              {/* Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMuted(m => !m)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:bg-white/25 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setIsOpen(false); setState('idle'); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:bg-red-500/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              <div className="flex items-center gap-3">
                {/* Small 3D Character in header */}
                <div className="relative w-20 h-24 flex-shrink-0">
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl"
                    animate={{
                      scale: state === 'speaking' ? [1, 1.2, 1] : [1, 1.05, 1],
                      opacity: state === 'speaking' ? [0.3, 0.6, 0.3] : [0.15, 0.3, 0.15],
                    }}
                    transition={{ duration: state === 'speaking' ? 1 : 3, repeat: Infinity }}
                    style={{ background: state === 'listening' ? 'rgba(239,68,68,0.3)' : 'rgba(129,140,248,0.3)' }}
                  />
                  <Avatar3DCharacter
                    isSpeaking={state === 'speaking'}
                    className="w-full h-full"
                    style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Assistant Lingua
                  </h3>
                  <p className="text-white/70 text-[11px] mt-0.5">Coach de communication</p>

                  {/* Status pill */}
                  <motion.div
                    key={state}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm"
                  >
                    <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', statusConfig[state].color)} />
                    <span className="text-[10px] font-medium text-white/90">{statusConfig[state].label}</span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* ── Quick actions ───────────────────────────────── */}
            <div className="px-3 py-2 border-b border-border flex gap-2 overflow-x-auto">
              {[
                { icon: Languages, label: 'Prononciation' },
                { icon: BookOpen, label: 'Grammaire' },
                { icon: MessageCircle, label: 'Conversation' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors whitespace-nowrap"
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Chat messages ───────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[180px] max-h-[300px]">
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={cn(
                      'max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
                      msg.role === 'assistant'
                        ? 'bg-muted text-foreground rounded-tl-sm'
                        : 'bg-primary text-primary-foreground rounded-tr-sm ml-auto'
                    )}
                  >
                    {msg.text}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Tip bubble */}
              {state === 'idle' && (
                <motion.div
                  key={tipIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-2"
                >
                  <span className="text-[10px] text-muted-foreground italic">
                    💡 {TIPS[tipIndex]}
                  </span>
                </motion.div>
              )}
            </div>

            {/* ── Mic button area ─────────────────────────────── */}
            <div className="border-t border-border bg-muted/30 p-4 flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center">
                {/* Pulse rings */}
                {state === 'listening' && (
                  <>
                    <motion.div
                      className="absolute w-14 h-14 rounded-full border-2 border-red-400/50"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="absolute w-14 h-14 rounded-full border-2 border-red-400/30"
                      initial={{ scale: 1, opacity: 0.4 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                    />
                  </>
                )}

                {state === 'speaking' && (
                  <motion.div
                    className="absolute w-14 h-14 rounded-full border-2 border-blue-400/40"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                  />
                )}

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMicToggle}
                  className={cn(
                    'relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
                    state === 'listening'
                      ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
                      : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30',
                    'hover:shadow-xl',
                  )}
                >
                  {state === 'listening' ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-white" />
                  )}
                </motion.button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                {state === 'listening' ? 'Appuyez pour arrêter' : 'Appuyez pour parler'}
              </p>
            </div>

            {/* Footer */}
            <div className="text-center py-1.5 border-t border-border">
              <p className="text-[9px] text-muted-foreground tracking-wide">propulsé par LiveKit AI</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
