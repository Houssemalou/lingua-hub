import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  MonitorOff,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaControlsProps {
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  isRTL?: boolean;
  compact?: boolean;
}

export function MediaControls({
  isMuted,
  isCameraOn,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  isRTL = false,
  compact = false,
}: MediaControlsProps) {
  return (
    <div className={cn(
      "flex items-center justify-center gap-2 sm:gap-3",
      isRTL && "flex-row-reverse"
    )}>
      {/* Microphone Toggle */}
      <motion.button
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleMute}
        aria-label={isMuted ? 'Activer le micro' : 'Couper le micro'}
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-300",
          compact ? "w-10 h-10" : "w-11 h-11 sm:w-14 sm:h-14",
          isMuted 
            ? 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30' 
            : 'bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20'
        )}
      >
        {isMuted ? (
          <MicOff className={cn("text-white", compact ? "w-4 h-4" : "w-5 h-5 sm:w-6 sm:h-6")} />
        ) : (
          <Mic className={cn("text-white", compact ? "w-4 h-4" : "w-5 h-5 sm:w-6 sm:h-6")} />
        )}
      </motion.button>

      {/* Camera Toggle */}
      <motion.button
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleCamera}
        aria-label={isCameraOn ? 'Désactiver la caméra' : 'Activer la caméra'}
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-300",
          compact ? "w-10 h-10" : "w-11 h-11 sm:w-14 sm:h-14",
          !isCameraOn 
            ? 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30' 
            : 'bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20'
        )}
      >
        {isCameraOn ? (
          <Video className={cn("text-white", compact ? "w-4 h-4" : "w-5 h-5 sm:w-6 sm:h-6")} />
        ) : (
          <VideoOff className={cn("text-white", compact ? "w-4 h-4" : "w-5 h-5 sm:w-6 sm:h-6")} />
        )}
      </motion.button>

      {/* Screen Share Toggle — hidden on mobile (not supported) */}
      {!compact && (
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleScreenShare}
          aria-label={isScreenSharing ? 'Arrêter le partage' : "Partager l'écran"}
          className={cn(
            "rounded-full flex items-center justify-center transition-all duration-300 w-11 h-11 sm:w-14 sm:h-14",
            isScreenSharing 
              ? 'bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/30' 
              : 'bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20'
          )}
        >
          {isScreenSharing ? (
            <MonitorUp className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <MonitorOff className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </motion.button>
      )}
    </div>
  );
}

interface MediaControlsLabeledProps extends MediaControlsProps {
  labels?: {
    mute: string;
    unmute: string;
    cameraOn: string;
    cameraOff: string;
    shareScreen: string;
    stopShare: string;
  };
}

export function MediaControlsLabeled({
  isMuted,
  isCameraOn,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  isRTL = false,
  labels = {
    mute: 'Couper le micro',
    unmute: 'Activer le micro',
    cameraOn: 'Caméra activée',
    cameraOff: 'Activer la caméra',
    shareScreen: 'Partager l\'écran',
    stopShare: 'Arrêter le partage',
  },
}: MediaControlsLabeledProps) {
  return (
    <div className={cn(
      "flex flex-wrap items-center justify-center gap-4",
      isRTL && "flex-row-reverse"
    )}>
      {/* Microphone */}
      <Button
        variant={isMuted ? "outline" : "destructive"}
        size="lg"
        onClick={onToggleMute}
        className="gap-2"
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        <span className="hidden sm:inline">
          {isMuted ? labels.unmute : labels.mute}
        </span>
      </Button>

      {/* Camera */}
      <Button
        variant={isCameraOn ? "default" : "outline"}
        size="lg"
        onClick={onToggleCamera}
        className="gap-2"
      >
        {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        <span className="hidden sm:inline">
          {isCameraOn ? labels.cameraOn : labels.cameraOff}
        </span>
      </Button>

      {/* Screen Share */}
      <Button
        variant={isScreenSharing ? "secondary" : "outline"}
        size="lg"
        onClick={onToggleScreenShare}
        className={cn("gap-2", isScreenSharing && "bg-success hover:bg-success/90 text-success-foreground")}
      >
        {isScreenSharing ? <MonitorUp className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
        <span className="hidden sm:inline">
          {isScreenSharing ? labels.stopShare : labels.shareScreen}
        </span>
      </Button>
    </div>
  );
}
