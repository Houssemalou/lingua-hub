import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar3DCharacter } from './Avatar3DCharacter';

type AssistantState = 'idle' | 'listening' | 'speaking';

export function StudentVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [state, setState] = useState<AssistantState>('idle');

  const statusLabel: Record<AssistantState, string> = {
    idle: 'Prêt à vous aider',
    listening: 'Écoute en cours…',
    speaking: 'En train de parler…',
  };

  const handleMicToggle = useCallback(() => {
    if (state === 'listening') {
      setState('idle');
    } else {
      setState('listening');
      setTimeout(() => {
        setState('speaking');
        setTimeout(() => setState('idle'), 4000);
      }, 3000);
    }
  }, [state]);

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed bottom-8 right-8 z-50 w-[72px] h-[72px] rounded-full',
              'bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600',
              'flex items-center justify-center',
              'shadow-[0_8px_32px_rgba(99,102,241,0.45)]',
              'hover:shadow-[0_8px_40px_rgba(99,102,241,0.65)]',
              'transition-shadow duration-300',
            )}
            whileHover={{ scale: 1.12, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            aria-label="Ouvrir l'assistant IA"
          >
            <Sparkles className="w-8 h-8 text-white drop-shadow-lg" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-2 ring-white/80 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Frameless floating 3D character ─────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 60 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed bottom-4 right-4 z-50 flex flex-col items-center"
            style={{ width: 280 }}
          >
            {/* ── Top-right small controls ───────────────────── */}
            <div className="self-end flex items-center gap-1 mb-1 mr-1">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMuted((m) => !m)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  'bg-black/30 backdrop-blur-sm border border-white/10',
                  'text-white/70 hover:text-white hover:bg-black/50 transition-colors',
                )}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setIsOpen(false); setState('idle'); }}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  'bg-black/30 backdrop-blur-sm border border-white/10',
                  'text-white/70 hover:text-white hover:bg-red-500/60 transition-colors',
                )}
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* ── Ambient glow behind the character ─────────── */}
            <div className="relative w-[260px] h-[320px]">
              {/* Glow layers */}
              <motion.div
                animate={{
                  scale: state === 'speaking' ? [1, 1.15, 1] : [1, 1.05, 1],
                  opacity: state === 'speaking' ? [0.4, 0.7, 0.4] : [0.2, 0.35, 0.2],
                }}
                transition={{ duration: state === 'speaking' ? 1.2 : 3, repeat: Infinity, ease: 'easeInOut' }}
                className={cn(
                  'absolute inset-0 rounded-full blur-3xl',
                  state === 'listening'
                    ? 'bg-red-500/30'
                    : state === 'speaking'
                      ? 'bg-blue-500/30'
                      : 'bg-indigo-500/20',
                )}
                style={{ top: '10%', bottom: '10%', left: '10%', right: '10%' }}
              />

              {/* 3D Character – no frame, transparent background */}
              <Avatar3DCharacter
                isSpeaking={state === 'speaking'}
                className="w-full h-full"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))' }}
              />
            </div>

            {/* ── Status label ──────────────────────────────── */}
            <motion.div
              key={state}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'px-4 py-1.5 rounded-full mb-3',
                'bg-black/25 backdrop-blur-md border border-white/10',
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    state === 'idle' && 'bg-emerald-400 animate-pulse',
                    state === 'listening' && 'bg-red-400 animate-pulse',
                    state === 'speaking' && 'bg-blue-400 animate-pulse',
                  )}
                />
                <span className="text-xs font-medium text-white/90">
                  {statusLabel[state]}
                </span>
              </div>
            </motion.div>

            {/* ── Mic button ────────────────────────────────── */}
            <div className="relative flex items-center justify-center">
              {/* Pulse rings for listening */}
              {state === 'listening' && (
                <>
                  <motion.div
                    className="absolute w-16 h-16 rounded-full border-2 border-red-400/60"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute w-16 h-16 rounded-full border-2 border-red-400/40"
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                  />
                </>
              )}

              {/* Speaking wave rings */}
              {state === 'speaking' && (
                <motion.div
                  className="absolute w-16 h-16 rounded-full border-2 border-blue-400/50"
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
                  'relative z-10 w-14 h-14 rounded-full flex items-center justify-center',
                  'shadow-lg transition-all duration-300',
                  state === 'listening'
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/40',
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

            {/* ── Footer ────────────────────────────────────── */}
            <p className="mt-2 text-[10px] text-white/30 tracking-wide">
              propulsé par LiveKit
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
