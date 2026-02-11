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
      "flex items-center justify-center gap-3 sm:gap-4",
      isRTL && "flex-row-reverse"
    )}>
      {/* Microphone Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleMute}
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
          compact ? "w-11 h-11" : "w-14 h-14 sm:w-16 sm:h-16",
          isMuted 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
        )}
        title={isMuted ? 'Activer le micro' : 'Couper le micro'}
      >
        {isMuted ? (
          <MicOff className={cn(
            "text-white",
            compact ? "w-5 h-5" : "w-6 h-6 sm:w-7 sm:h-7"
          )} />
        ) : (
          <Mic className={cn(
            "text-gray-700",
            compact ? "w-5 h-5" : "w-6 h-6 sm:w-7 sm:h-7"
          )} />
        )}
      </motion.button>

      {/* Camera Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleCamera}
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
          compact ? "w-11 h-11" : "w-14 h-14 sm:w-16 sm:h-16",
          !isCameraOn 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
        )}
        title={isCameraOn ? 'Désactiver la caméra' : 'Activer la caméra'}
      >
        {isCameraOn ? (
          <Video className={cn(
            "text-gray-700",
            compact ? "w-5 h-5" : "w-6 h-6 sm:w-7 sm:h-7"
          )} />
        ) : (
          <VideoOff className={cn(
            "text-white",
            compact ? "w-5 h-5" : "w-6 h-6 sm:w-7 sm:h-7"
          )} />
        )}
      </motion.button>

      {/* Screen Share Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleScreenShare}
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
          compact ? "w-11 h-11" : "w-14 h-14 sm:w-16 sm:h-16",
          isScreenSharing 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
        )}
        title={isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
      >
        {isScreenSharing ? (
          <MonitorUp className={cn(
            "text-white",
            compact ? "w-5 h-5" : "w-6 h-6 sm:w-7 sm:h-7"
          )} />
        ) : (
          <MonitorOff className={cn(
            "text-gray-700",
            compact ? "w-5 h-5" : "w-6 h-6 sm:w-7 sm:h-7"
          )} />
        )}
      </motion.button>
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
