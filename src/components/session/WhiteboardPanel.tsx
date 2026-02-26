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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  roomId?: string;
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
  roomId,
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
          // persist received snapshot locally
          try {
            if (roomId) sessionStorage.setItem(`whiteboard-snapshot:${roomId}`, JSON.stringify(msg.snapshot));
          } catch (e) {
            // ignore
          }
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

  // Load persisted snapshot when opening the whiteboard
  useEffect(() => {
    try {
      if (roomId) {
        const saved = sessionStorage.getItem(`whiteboard-snapshot:${roomId}`);
        if (saved) {
          const snap = JSON.parse(saved);
          isSyncingRef.current = true;
          loadSnapshot(storeRef.current, snap);
          isSyncingRef.current = false;
        }
      }
    } catch (e) {
      // ignore
    }
  }, [roomId]);

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

    // Persist snapshot locally on store changes (throttled)
    useEffect(() => {
      let timer: number | null = null;
      const unsub = store.listen(() => {
        if (isSyncingRef.current) return;
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          try {
            const snap = getSnapshot(storeRef.current);
            if (roomId) sessionStorage.setItem(`whiteboard-snapshot:${roomId}`, JSON.stringify(snap));
          } catch (e) {
            // ignore
          }
        }, 700);
      }, { source: 'user', scope: 'document' });

      return () => {
        unsub();
        if (timer) window.clearTimeout(timer);
      };
    }, [roomId]);

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

  // Export whiteboard pages as a multi‑page PDF (one PDF page per tldraw page)
  const handleExport = useCallback(async () => {
    try {
      const originalSnapshot = getSnapshot(store) as any;
      const pages = originalSnapshot?.document?.pages ? Object.keys(originalSnapshot.document.pages) : [];

      if (pages.length === 0) {
        toast.error('Aucune page à exporter');
        return;
      }

      toast('Génération du PDF — veuillez patienter...');

      let doc: any = null;
      // Prevent broadcasting while we temporarily switch pages locally
      isSyncingRef.current = true;

      for (let i = 0; i < pages.length; i++) {
        const pageId = pages[i];
        // Load the same snapshot but with the selected page set to pageId
        const snapForPage = {
          ...originalSnapshot,
          document: { ...originalSnapshot.document, selectedPageId: pageId },
        };

        loadSnapshot(store, snapForPage);
        // Wait a short time for tldraw to re-render the requested page
        await new Promise((r) => setTimeout(r, 220));

        // Prefer the SVG export when available
        const svgEl = document.querySelector('.tl-svg-context svg') as SVGSVGElement | null;
        const canvasEl = document.querySelector('.tl-canvas') as HTMLCanvasElement | null;

        let imgDataUrl: string | null = null;
        let imgW = 800;
        let imgH = 600;

        if (svgEl) {
          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(svgEl);
          const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.crossOrigin = 'anonymous';

          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
          });

          const rect = svgEl.getBoundingClientRect();
          imgW = Math.round(rect.width || img.naturalWidth || 800);
          imgH = Math.round(rect.height || img.naturalHeight || 600);

          const scale = 2; // increase quality
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(imgW * scale);
          canvas.height = Math.round(imgH * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            imgDataUrl = canvas.toDataURL('image/png');
          }

          URL.revokeObjectURL(url);
        } else if (canvasEl) {
          // Use the rendered canvas directly
          imgDataUrl = canvasEl.toDataURL('image/png');
          imgW = canvasEl.width || imgW;
          imgH = canvasEl.height || imgH;
        } else {
          // Last resort: capture the container with html2canvas
          const container = document.querySelector('.tl-wrapper') || document.querySelector('.tl-root');
          if (container) {
            const captured = await html2canvas(container as HTMLElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            imgDataUrl = captured.toDataURL('image/png');
            imgW = captured.width;
            imgH = captured.height;
          }
        }

        if (!imgDataUrl) continue; // skip page on failure

        // Create or append to the PDF using A4 pages and scale the image to fit while preserving aspect ratio
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;
        const MARGIN_MM = 8; // small page margin
        const PAGE_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;
        const PAGE_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_MM * 2;
        const PX_TO_MM = 25.4 / 96; // convert CSS pixels -> mm (approx)

        const imgWidthMm = imgW * PX_TO_MM;
        const imgHeightMm = imgH * PX_TO_MM;
        const scale = Math.min(PAGE_WIDTH_MM / imgWidthMm, PAGE_HEIGHT_MM / imgHeightMm, 1);
        const finalWmm = imgWidthMm * scale;
        const finalHmm = imgHeightMm * scale;
        const left = (A4_WIDTH_MM - finalWmm) / 2;
        const top = (A4_HEIGHT_MM - finalHmm) / 2;
        const orientation = finalWmm > finalHmm ? 'landscape' : 'portrait';

        if (!doc) {
          doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: orientation as any });
          doc.addImage(imgDataUrl, 'PNG', left, top, finalWmm, finalHmm);
        } else {
          doc.addPage('a4', orientation as any);
          doc.addImage(imgDataUrl, 'PNG', left, top, finalWmm, finalHmm);
        }
      }

      // Restore original snapshot and re-enable syncing
      loadSnapshot(store, originalSnapshot);
      isSyncingRef.current = false;

      if (doc) {
        doc.save(`tableau-${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`);
        toast.success('Export PDF réussi');
        return;
      }

      // If we reach here, fallback to previous behavior (SVG or JSON)
      const fallbackSvg = document.querySelector('.tl-svg-context svg') as SVGSVGElement | null;
      if (fallbackSvg) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(fallbackSvg);
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tableau-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Tableau exporté en SVG (fallback)');
        return;
      }

      const snapshot = getSnapshot(store);
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tableau-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Tableau exporté (JSON fallback)');
    } catch (e) {
      console.error('Export error', e);
      isSyncingRef.current = false;
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
          
          {/*<motion.div whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              className="gap-1.5 text-xs h-8 rounded-full"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
          </motion.div>*/}

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
