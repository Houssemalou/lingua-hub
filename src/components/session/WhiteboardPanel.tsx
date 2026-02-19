import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  TLStoreWithStatus,
  TLRecord,
  TLStore,
  getSnapshot,
  loadSnapshot,
} from 'tldraw';
import 'tldraw/tldraw.css';
import { Room } from 'livekit-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Users,
  Lock,
  Unlock,
  Eye,
  Pencil,
  ChevronDown,
  FileImage,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface WhiteboardPanelProps {
  room: Room;
  isProfessor: boolean;
  participantCount: number;
  onClose: () => void;
}

type WritingPermission = 'professor-only' | 'all';

// tldraw store message type
interface WhiteboardSyncMessage {
  type: 'whiteboard-sync';
  records: TLRecord[];
  removed: string[];
  permissions: WritingPermission;
}

interface WhiteboardPermissionMessage {
  type: 'whiteboard-permission';
  permissions: WritingPermission;
}

interface WhiteboardSnapshotMessage {
  type: 'whiteboard-snapshot';
  snapshot: ReturnType<typeof getSnapshot>;
  permissions: WritingPermission;
}

export const WhiteboardPanel: React.FC<WhiteboardPanelProps> = ({
  room,
  isProfessor,
  participantCount,
  onClose,
}) => {
  const isMobile = useIsMobile();
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils })
  );
  const [permissions, setPermissions] = useState<WritingPermission>('professor-only');
  const [isReadOnly, setIsReadOnly] = useState(!isProfessor);
  const [connectedCount, setConnectedCount] = useState(participantCount);
  const [showParticipantMenu, setShowParticipantMenu] = useState(false);
  const storeRef = useRef(store);
  const isSyncingRef = useRef(false);
  const lastSentRef = useRef<number>(0);

  storeRef.current = store;

  // Update read-only state based on permissions
  useEffect(() => {
    if (isProfessor) {
      setIsReadOnly(false);
    } else {
      setIsReadOnly(permissions === 'professor-only');
    }
  }, [permissions, isProfessor]);

  // Listen for incoming whiteboard data from LiveKit
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === 'whiteboard-snapshot') {
          const msg = data as WhiteboardSnapshotMessage;
          isSyncingRef.current = true;
          loadSnapshot(storeRef.current, msg.snapshot);
          setPermissions(msg.permissions);
          isSyncingRef.current = false;
          toast.success('Tableau synchronisé');
        } else if (data.type === 'whiteboard-sync') {
          const msg = data as WhiteboardSyncMessage;
          if (isSyncingRef.current) return;
          isSyncingRef.current = true;
          storeRef.current.mergeRemoteChanges(() => {
            if (msg.records?.length > 0) {
              storeRef.current.put(msg.records);
            }
            if (msg.removed?.length > 0) {
              storeRef.current.remove(msg.removed as any[]);
            }
          });
          setPermissions(msg.permissions);
          isSyncingRef.current = false;
        } else if (data.type === 'whiteboard-permission') {
          const msg = data as WhiteboardPermissionMessage;
          setPermissions(msg.permissions);
          if (!isProfessor) {
            if (msg.permissions === 'all') {
              toast.success('Le professeur vous autorise à écrire sur le tableau');
            } else {
              toast('Mode lecture activé');
            }
          }
        }
      } catch (err) {
        // ignore non-whiteboard messages
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => {
      room.off('dataReceived', handleDataReceived);
    };
  }, [room, isProfessor]);

  // Subscribe to store changes and broadcast via LiveKit (throttled)
  useEffect(() => {
    if (isReadOnly) return;

    const unsubscribe = store.listen(
      ({ changes }) => {
        if (isSyncingRef.current) return;
        const now = Date.now();
        if (now - lastSentRef.current < 80) return; // ~12fps throttle
        lastSentRef.current = now;

        const added = Object.values(changes.added) as TLRecord[];
        const updated = Object.values(changes.updated).map(([, next]) => next) as TLRecord[];
        const removed = Object.keys(changes.removed);

        const records = [...added, ...updated];
        if (records.length === 0 && removed.length === 0) return;

        const msg: WhiteboardSyncMessage = {
          type: 'whiteboard-sync',
          records,
          removed,
          permissions,
        };

        try {
          room.localParticipant.publishData(
            new TextEncoder().encode(JSON.stringify(msg)),
            { reliable: false }
          );
        } catch (e) {
          console.error('Error sending whiteboard data', e);
        }
      },
      { source: 'user', scope: 'document' }
    );

    return unsubscribe;
  }, [store, room, permissions, isReadOnly]);

  // Send full snapshot when professor opens whiteboard (to sync late-joiners)
  useEffect(() => {
    if (!isProfessor) return;
    const timer = setTimeout(() => {
      try {
        const snapshot = getSnapshot(store);
        const msg: WhiteboardSnapshotMessage = {
          type: 'whiteboard-snapshot',
          snapshot,
          permissions,
        };
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(msg)),
          { reliable: true }
        );
      } catch (e) {
        console.error('Error sending whiteboard snapshot', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [isProfessor, store, room, permissions]);

  const togglePermissions = useCallback(() => {
    const next: WritingPermission = permissions === 'professor-only' ? 'all' : 'professor-only';
    setPermissions(next);

    // Broadcast permission change
    const msg: WhiteboardPermissionMessage = {
      type: 'whiteboard-permission',
      permissions: next,
    };
    try {
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(msg)),
        { reliable: true }
      );
    } catch (e) {
      console.error('Error sending permission update', e);
    }

    toast.success(
      next === 'all'
        ? 'Tous les élèves peuvent maintenant écrire'
        : 'Seul le professeur peut écrire'
    );
  }, [permissions, room]);

  // Export whiteboard as PNG
  const handleExport = useCallback(async () => {
    try {
      // Use tldraw's built-in export via canvas
      const canvas = document.querySelector('.tl-canvas') as HTMLCanvasElement | null;
      if (!canvas) {
        toast.error('Impossible d\'exporter le tableau');
        return;
      }

      // Try to find the SVG element inside tldraw
      const svgEl = document.querySelector('.tl-svg-context svg') as SVGSVGElement | null;
      if (svgEl) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgEl);
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tableau-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Tableau exporté en SVG');
        return;
      }

      // Fallback: export snapshot as JSON
      const snapshot = getSnapshot(store);
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tableau-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Tableau exporté');
    } catch (e) {
      console.error('Export error', e);
      toast.error('Erreur lors de l\'export');
    }
  }, [store]);

  const canWrite = isProfessor || permissions === 'all';

  return (
    <div className="relative flex flex-col w-full h-full bg-[#f8f9fa] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
        {/* Left: title + status */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-gray-800 text-sm sm:text-base truncate">
              Tableau Blanc
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs hidden sm:flex gap-1 items-center",
              canWrite ? 'border-emerald-400 text-emerald-600' : 'border-orange-400 text-orange-600'
            )}
          >
            {canWrite ? <Pencil className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {canWrite ? 'Écriture' : 'Lecture'}
          </Badge>
          <Badge variant="outline" className="text-xs hidden sm:flex gap-1 items-center border-gray-300 text-gray-600">
            <Users className="w-3 h-3" />
            {participantCount}
          </Badge>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Professor-only: toggle permissions */}
          {isProfessor && (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                variant="outline"
                onClick={togglePermissions}
                className={cn(
                  "gap-1.5 text-xs h-8 rounded-full border transition-all",
                  permissions === 'all'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                )}
              >
                {permissions === 'all' ? (
                  <><Unlock className="w-3.5 h-3.5" /><span className="hidden sm:inline">Collaboratif</span></>
                ) : (
                  <><Lock className="w-3.5 h-3.5" /><span className="hidden sm:inline">Restreint</span></>
                )}
              </Button>
            </motion.div>
          )}

          {/* Export */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              className="gap-1.5 text-xs h-8 rounded-full"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
          </motion.div>

          {/* Close */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-600" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Read-only overlay notification for students */}
      <AnimatePresence>
        {!canWrite && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-orange-500 text-white text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none"
          >
            <Eye className="w-3.5 h-3.5" />
            Mode visualisation — Le professeur contrôle le tableau
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tldraw canvas */}
      <div
        className="flex-1 min-h-0 relative"
        style={{ touchAction: 'none' }}
      >
        <Tldraw
          store={store}
          hideUi={isReadOnly}
          inferDarkMode
          onMount={(editor) => {
            // Enable touch/stylus input
            editor.updateInstanceState({ isReadonly: isReadOnly });
          }}
        />

        {/* Read-only full overlay (click-through prevention) */}
        {isReadOnly && (
          <div
            className="absolute inset-0 z-10 cursor-not-allowed"
            style={{ touchAction: 'none', pointerEvents: 'all' }}
          >
            {/* Tldraw in read-only mode via hideUi — clicks bubble to overlay */}
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t border-gray-200 text-xs text-gray-500 shrink-0">
        <span className="flex items-center gap-1">
          <div className={cn("w-1.5 h-1.5 rounded-full", canWrite ? 'bg-emerald-500' : 'bg-orange-400')} />
          {canWrite ? 'Vous pouvez dessiner' : 'Visualisation uniquement'}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {participantCount} participant{participantCount > 1 ? 's' : ''}
          {permissions === 'all' ? ' · Collaboratif' : ' · Professeur seul'}
        </span>
      </div>
    </div>
  );
};
