import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  TLStoreWithStatus,
  TLRecord,
  TLStore,
  getSnapshot,
  loadSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";
import jsPDF from "jspdf";
import { Room } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
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
  UserCircle,
  Maximize,
  Minimize,
  Move,
} from "lucide-react";
import { MediaControls } from "./MediaControls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

interface WhiteboardParticipant {
  identity: string;
  name: string;
  role: string;
}

interface MediaControlProps {
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  allowCamera?: boolean;
  allowScreenShare?: boolean;
}

interface WhiteboardPanelProps {
  room: Room;
  isProfessor: boolean;
  participantCount: number;
  onClose: () => void;
  roomId?: string;
  participants?: WhiteboardParticipant[];
  mediaControls?: MediaControlProps;
  isRecordingMode?: boolean;
}

type WritingPermission = "professor-only" | "all" | "specific-student";

// tldraw store message type
interface WhiteboardSyncMessage {
  type: "whiteboard-sync";
  records: TLRecord[];
  removed: string[];
  permissions: WritingPermission;
  allowedStudentIdentity?: string;
  allowedStudentName?: string;
}

interface WhiteboardPermissionMessage {
  type: "whiteboard-permission";
  permissions: WritingPermission;
  allowedStudentIdentity?: string;
  allowedStudentName?: string;
}

interface WhiteboardCameraMessage {
  type: "whiteboard-camera";
  x: number;
  y: number;
  z: number;
}

interface WhiteboardSnapshotMessage {
  type: "whiteboard-snapshot";
  snapshot: ReturnType<typeof getSnapshot>;
  permissions: WritingPermission;
  allowedStudentIdentity?: string;
  allowedStudentName?: string;
}

export const WhiteboardPanel: React.FC<WhiteboardPanelProps> = ({
  room,
  isProfessor,
  participantCount,
  onClose,
  roomId,
  participants = [],
  mediaControls,
  isRecordingMode,
}) => {
  const isMobile = useIsMobile();
  const { isRTL } = useLanguage();
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils }),
  );
  const editorRef = useRef<any>(null);
  const [currentTool, setCurrentTool] = useState<string>("select");
  const [permissions, setPermissions] =
    useState<WritingPermission>("professor-only");
  const [allowedStudentIdentity, setAllowedStudentIdentity] = useState<
    string | null
  >(null);
  const [allowedStudentName, setAllowedStudentName] = useState<string | null>(
    null,
  );
  const [isReadOnly, setIsReadOnly] = useState(!isProfessor);
  const [connectedCount, setConnectedCount] = useState(participantCount);
  const [showParticipantMenu, setShowParticipantMenu] = useState(false);
  const storeRef = useRef(store);
  const isSyncingRef = useRef(false);
  const lastSentRef = useRef<number>(0);
  const lastCameraSentRef = useRef<number>(0);
  const isCameraSyncingRef = useRef(false);
  const [editorReady, setEditorReady] = useState(false);
  const snapshotChunksRef = useRef<{ chunks: string[]; total: number }>({
    chunks: [],
    total: 0,
  });

  // Fullscreen + overlay media controls state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMediaOverlay, setShowMediaOverlay] = useState(false);
  const mediaOverlayTimerRef = useRef<number | null>(null);

  // Request fullscreen on mount (skip in recording mode — headless Chrome doesn't support it)
  useEffect(() => {
    if (isRecordingMode) return;
    const el = containerRef.current;
    if (!el) return;
    const requestFs =
      el.requestFullscreen?.bind(el) ||
      (el as any).webkitRequestFullscreen?.bind(el) ||
      (el as any).msRequestFullscreen?.bind(el);
    if (requestFs) {
      requestFs().catch(() => {
        /* browser may block if no user gesture */
      });
    }
  }, [isRecordingMode]);

  // Track fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      const fsEl =
        document.fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFullscreen(!!fsEl && fsEl === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Exit fullscreen on close
  const handleClose = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  // Double-click on canvas: show media controls overlay temporarily
  const handleCanvasDoubleClick = useCallback(() => {
    if (!mediaControls) return;
    setShowMediaOverlay(true);
    if (mediaOverlayTimerRef.current)
      window.clearTimeout(mediaOverlayTimerRef.current);
    mediaOverlayTimerRef.current = window.setTimeout(() => {
      setShowMediaOverlay(false);
    }, 4000);
  }, [mediaControls]);

  // Cleanup overlay timer
  useEffect(() => {
    return () => {
      if (mediaOverlayTimerRef.current)
        window.clearTimeout(mediaOverlayTimerRef.current);
    };
  }, []);

  // Filter to only students for the selector
  const studentParticipants = participants.filter((p) => p.role === "student");

  storeRef.current = store;

  // Update read-only state based on permissions
  useEffect(() => {
    if (isProfessor) {
      setIsReadOnly(false);
    } else if (permissions === "all") {
      setIsReadOnly(false);
    } else if (permissions === "specific-student") {
      const myIdentity = room.localParticipant.identity;
      setIsReadOnly(myIdentity !== allowedStudentIdentity);
    } else {
      setIsReadOnly(true);
    }
  }, [permissions, isProfessor, allowedStudentIdentity, room]);

  // When write permissions change, update the editor state and default tool
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.updateInstanceState?.({ isReadonly: isReadOnly });
    if (!isProfessor && !isReadOnly) {
      // Give students the pen by default when they are granted write access
      const preferred = "draw";
      try {
        editor.selectTool?.(preferred);
        setCurrentTool(preferred);
      } catch (e) {
        // ignore if API unavailable
      }
    } else if (isReadOnly) {
      // Switch to select tool so students can freely pan and navigate the board
      try {
        editor.selectTool?.("select");
        setCurrentTool("select");
      } catch (e) {
        // ignore if API unavailable
      }
    }
  }, [isReadOnly, isProfessor]);

  // Listen for incoming whiteboard data from LiveKit
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === "whiteboard-snapshot") {
          const msg = data as WhiteboardSnapshotMessage;
          isSyncingRef.current = true;
          loadSnapshot(storeRef.current, msg.snapshot);
          setPermissions(msg.permissions);
          setAllowedStudentIdentity(msg.allowedStudentIdentity || null);
          setAllowedStudentName(msg.allowedStudentName || null);
          try {
            if (roomId)
              sessionStorage.setItem(
                `whiteboard-snapshot:${roomId}`,
                JSON.stringify(msg.snapshot),
              );
          } catch (e) {
            // ignore
          }
          isSyncingRef.current = false;
          toast.success(isRTL ? "تمت مزامنة اللوحة" : "Tableau synchronisé");
        } else if (data.type === "whiteboard-snapshot-chunk") {
          // Reassemble chunked snapshot
          const { chunk, index, total } = data as {
            chunk: string;
            index: number;
            total: number;
          };
          const ref = snapshotChunksRef.current;
          if (ref.total !== total) {
            ref.chunks = new Array(total).fill("");
            ref.total = total;
          }
          ref.chunks[index] = chunk;
          // Check if all chunks received
          if (ref.chunks.every((c) => c.length > 0)) {
            try {
              const fullJson = ref.chunks.join("");
              const msg = JSON.parse(fullJson) as WhiteboardSnapshotMessage;
              isSyncingRef.current = true;
              loadSnapshot(storeRef.current, msg.snapshot);
              setPermissions(msg.permissions);
              setAllowedStudentIdentity(msg.allowedStudentIdentity || null);
              setAllowedStudentName(msg.allowedStudentName || null);
              try {
                if (roomId)
                  sessionStorage.setItem(
                    `whiteboard-snapshot:${roomId}`,
                    JSON.stringify(msg.snapshot),
                  );
              } catch (e) {
                /* ignore */
              }
              isSyncingRef.current = false;
              toast.success(
                isRTL ? "تمت مزامنة اللوحة" : "Tableau synchronisé",
              );
            } catch (e) {
              console.warn("Failed to reassemble snapshot chunks:", e);
            }
            ref.chunks = [];
            ref.total = 0;
          }
        } else if (data.type === "whiteboard-sync") {
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
          setAllowedStudentIdentity(msg.allowedStudentIdentity || null);
          setAllowedStudentName(msg.allowedStudentName || null);
          isSyncingRef.current = false;
        } else if (data.type === "whiteboard-camera") {
          // Only the recording bot follows the professor's camera position.
          // Regular students navigate the board independently — no forced sync.
          if (isRecordingMode) {
            const camMsg = data as WhiteboardCameraMessage;
            const editor = editorRef.current;
            if (editor) {
              isCameraSyncingRef.current = true;
              try {
                editor.setCamera({ x: camMsg.x, y: camMsg.y, z: camMsg.z });
              } catch (e) {
                /* ignore */
              }
              isCameraSyncingRef.current = false;
            }
          }
        } else if (data.type === "whiteboard-permission") {
          const msg = data as WhiteboardPermissionMessage;
          setPermissions(msg.permissions);
          setAllowedStudentIdentity(msg.allowedStudentIdentity || null);
          setAllowedStudentName(msg.allowedStudentName || null);
          if (!isProfessor) {
            if (msg.permissions === "all") {
              toast.success(
                isRTL
                  ? "سمح لك الأستاذ بالكتابة على اللوحة"
                  : "Le professeur vous autorise à écrire sur le tableau",
              );
            } else if (msg.permissions === "specific-student") {
              const myIdentity = room.localParticipant.identity;
              if (myIdentity === msg.allowedStudentIdentity) {
                toast.success(
                  isRTL
                    ? "منحك الأستاذ صلاحية الكتابة"
                    : "Le professeur vous a donné la main pour écrire",
                );
              } else {
                toast(
                  isRTL
                    ? `${msg.allowedStudentName || "طالب"} لديه صلاحية الكتابة`
                    : `${msg.allowedStudentName || "Un élève"} a la main pour écrire`,
                );
              }
            } else {
              toast(
                isRTL
                  ? "وضع القراءة — يمكنك التنقل والتكبير بحرية"
                  : "Mode lecture — naviguez et zoomez librement sur le tableau",
              );
            }
          }
        }
      } catch (err) {
        // ignore non-whiteboard messages
      }
    };

    room.on("dataReceived", handleDataReceived);
    return () => {
      room.off("dataReceived", handleDataReceived);
    };
  }, [room, isProfessor, isRecordingMode, isRTL]);

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
    if (isReadOnly || isRecordingMode) return;

    const unsubscribe = store.listen(
      ({ changes }) => {
        if (isSyncingRef.current) return;
        const now = Date.now();
        if (now - lastSentRef.current < 80) return; // ~12fps throttle
        lastSentRef.current = now;

        const added = Object.values(changes.added) as TLRecord[];
        const updated = Object.values(changes.updated).map(
          ([, next]) => next,
        ) as TLRecord[];
        const removed = Object.keys(changes.removed);

        const records = [...added, ...updated];
        if (records.length === 0 && removed.length === 0) return;

        // Split records into chunks that stay under WebRTC's 64KB limit
        const MAX_CHUNK = 50000; // leave headroom below 65535
        const sendChunk = (recs: TLRecord[], rem: string[]) => {
          const msg: WhiteboardSyncMessage = {
            type: "whiteboard-sync",
            records: recs,
            removed: rem,
            permissions,
            allowedStudentIdentity: allowedStudentIdentity || undefined,
            allowedStudentName: allowedStudentName || undefined,
          };
          const encoded = new TextEncoder().encode(JSON.stringify(msg));
          room.localParticipant.publishData(encoded, {
            reliable: encoded.byteLength > MAX_CHUNK,
          });
        };

        try {
          // Try sending all at once first
          const fullMsg = JSON.stringify({
            type: "whiteboard-sync",
            records,
            removed,
            permissions,
            allowedStudentIdentity: allowedStudentIdentity || undefined,
            allowedStudentName: allowedStudentName || undefined,
          });
          if (new TextEncoder().encode(fullMsg).byteLength <= MAX_CHUNK) {
            room.localParticipant.publishData(
              new TextEncoder().encode(fullMsg),
              { reliable: false },
            );
          } else {
            // Split records into smaller batches
            const batchSize = Math.max(
              1,
              Math.floor(
                records.length /
                  Math.ceil(
                    new TextEncoder().encode(fullMsg).byteLength / MAX_CHUNK,
                  ),
              ),
            );
            for (let b = 0; b < records.length; b += batchSize) {
              sendChunk(
                records.slice(b, b + batchSize),
                b === 0 ? removed : [],
              );
            }
            if (records.length === 0 && removed.length > 0) {
              sendChunk([], removed);
            }
          }
        } catch (e) {
          console.error("Error sending whiteboard data", e);
        }
      },
      { source: "user", scope: "document" },
    );

    return unsubscribe;
  }, [
    store,
    room,
    permissions,
    isReadOnly,
    isRecordingMode,
    allowedStudentIdentity,
    allowedStudentName,
  ]);

  // Persist snapshot locally on store changes (throttled)
  useEffect(() => {
    let timer: number | null = null;
    const unsub = store.listen(
      () => {
        if (isSyncingRef.current) return;
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          try {
            const snap = getSnapshot(storeRef.current);
            if (roomId)
              sessionStorage.setItem(
                `whiteboard-snapshot:${roomId}`,
                JSON.stringify(snap),
              );
          } catch (e) {
            // ignore
          }
        }, 700);
      },
      { source: "user", scope: "document" },
    );

    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, [roomId]);

  // Send full snapshot when professor opens whiteboard (to sync late-joiners)
  useEffect(() => {
    if (!isProfessor || isRecordingMode) return;
    const timer = setTimeout(() => {
      try {
        const snapshot = getSnapshot(store);
        const msg: WhiteboardSnapshotMessage = {
          type: "whiteboard-snapshot",
          snapshot,
          permissions,
          allowedStudentIdentity: allowedStudentIdentity || undefined,
          allowedStudentName: allowedStudentName || undefined,
        };
        const encoded = new TextEncoder().encode(JSON.stringify(msg));
        // If snapshot fits in one message, send directly; otherwise chunk it
        const SNAP_MAX = 50000;
        if (encoded.byteLength <= SNAP_MAX) {
          room.localParticipant.publishData(encoded, { reliable: true });
        } else {
          // Split the serialized snapshot JSON into chunks
          const jsonStr = JSON.stringify(msg);
          const numChunks = Math.ceil(encoded.byteLength / SNAP_MAX);
          const chunkLen = Math.ceil(jsonStr.length / numChunks);
          for (let ci = 0; ci < jsonStr.length; ci += chunkLen) {
            const chunk = jsonStr.slice(ci, ci + chunkLen);
            const chunkMsg = JSON.stringify({
              type: "whiteboard-snapshot-chunk",
              chunk,
              index: Math.floor(ci / chunkLen),
              total: numChunks,
            });
            room.localParticipant.publishData(
              new TextEncoder().encode(chunkMsg),
              { reliable: true },
            );
          }
        }
        // Also sync the current camera position
        const editor = editorRef.current;
        if (editor) {
          const cam = editor.getCamera();
          const camMsg: WhiteboardCameraMessage = {
            type: "whiteboard-camera",
            x: cam.x,
            y: cam.y,
            z: cam.z,
          };
          room.localParticipant.publishData(
            new TextEncoder().encode(JSON.stringify(camMsg)),
            { reliable: true },
          );
        }
      } catch (e) {
        console.error("Error sending whiteboard snapshot", e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [
    isProfessor,
    isRecordingMode,
    store,
    room,
    permissions,
    allowedStudentIdentity,
    allowedStudentName,
  ]);

  // Professor broadcasts camera (pan/zoom) changes so students follow the same view
  useEffect(() => {
    if (!isProfessor || isRecordingMode) return;
    if (!editorReady) return;
    const editor = editorRef.current;
    if (!editor) return;

    // Use a store listener on session scope (camera lives in session records)
    const unsub = store.listen(
      () => {
        if (isCameraSyncingRef.current) return;
        const now = Date.now();
        if (now - lastCameraSentRef.current < 100) return; // throttle ~10fps
        lastCameraSentRef.current = now;

        try {
          const cam = editor.getCamera();
          const camMsg: WhiteboardCameraMessage = {
            type: "whiteboard-camera",
            x: cam.x,
            y: cam.y,
            z: cam.z,
          };
          room.localParticipant.publishData(
            new TextEncoder().encode(JSON.stringify(camMsg)),
            { reliable: false },
          );
        } catch (e) {
          // ignore
        }
      },
      { source: "user", scope: "session" },
    );

    // Periodic reliable camera sync so late joiners or dropped messages are caught up
    const interval = setInterval(() => {
      try {
        const cam = editor.getCamera();
        const camMsg: WhiteboardCameraMessage = {
          type: "whiteboard-camera",
          x: cam.x,
          y: cam.y,
          z: cam.z,
        };
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(camMsg)),
          { reliable: true },
        );
      } catch (e) {
        // ignore
      }
    }, 3000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [isProfessor, isRecordingMode, store, room, editorReady]);

  // Zoom is intentionally free — both professor and students can pan/zoom independently.

  const setPermissionMode = useCallback(
    (
      next: WritingPermission,
      studentIdentity?: string,
      studentName?: string,
    ) => {
      setPermissions(next);
      setAllowedStudentIdentity(studentIdentity || null);
      setAllowedStudentName(studentName || null);

      // Broadcast permission change
      const msg: WhiteboardPermissionMessage = {
        type: "whiteboard-permission",
        permissions: next,
        allowedStudentIdentity: studentIdentity,
        allowedStudentName: studentName,
      };
      try {
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(msg)),
          { reliable: true },
        );
      } catch (e) {
        console.error("Error sending permission update", e);
      }

      if (next === "specific-student") {
        toast.success(
          isRTL
            ? `${studentName || "طالب"} يمكنه الكتابة الآن`
            : `${studentName || "Élève"} peut maintenant écrire`,
        );
      } else if (next === "professor-only") {
        toast.success(
          isRTL
            ? "الأستاذ فقط يمكنه الكتابة"
            : "Seul le professeur peut écrire",
        );
      } else {
        toast.success(
          isRTL
            ? "يمكن لجميع الطلاب الكتابة الآن"
            : "Tous les élèves peuvent maintenant écrire",
        );
      }
    },
    [room, isRTL],
  );

  // Export current whiteboard page as a single-page PDF
  const handleExport = useCallback(async () => {
    try {
      const editor = editorRef.current;
      if (!editor) {
        toast.error(isRTL ? "المحرر غير جاهز" : "Éditeur non prêt");
        return;
      }

      toast(
        isRTL
          ? "جارٍ إنشاء ملف PDF — يرجى الانتظار..."
          : "Génération du PDF en cours — veuillez patienter…",
      );

      // PDF layout constants (landscape A4)
      const A4_W = 297;
      const A4_H = 210;
      const MARGIN = 12;
      const HEADER_H = 12;
      const FOOTER_H = 8;
      const CONTENT_W = A4_W - MARGIN * 2;
      const CONTENT_H = A4_H - MARGIN - HEADER_H - FOOTER_H - MARGIN;
      const PX_TO_MM = 25.4 / 96;

      const currentPage = editor.getCurrentPage();
      const shapeIds = [...editor.getCurrentPageShapeIds()];

      let imgDataUrl: string | null = null;
      let imgW = 0;
      let imgH = 0;

      // --- tldraw SVG export ---
      if (shapeIds.length > 0) {
        try {
          const result = await (editor as Record<string, any>).getSvgString(
            shapeIds,
            {
              background: true,
              padding: 40,
            },
          );
          if (result?.svg) {
            imgW = result.width;
            imgH = result.height;

            // Sanitize SVG: replace unsupported color() CSS functions with fallback
            let svgStr: string = result.svg;
            svgStr = svgStr.replace(/color\([^)]*\)/g, "#000000");

            const svgBlob = new Blob([svgStr], {
              type: "image/svg+xml;charset=utf-8",
            });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = url;
            });
            if (img.naturalWidth > 0) {
              const MAX_DIM = 2000;
              const scale = Math.min(2, MAX_DIM / imgW, MAX_DIM / imgH);
              const c = document.createElement("canvas");
              c.width = Math.round(imgW * scale);
              c.height = Math.round(imgH * scale);
              const ctx = c.getContext("2d")!;
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, c.width, c.height);
              ctx.drawImage(img, 0, 0, c.width, c.height);
              imgDataUrl = c.toDataURL("image/jpeg", 0.92);
            }
            URL.revokeObjectURL(url);
          }
        } catch (svgErr) {
          console.warn("SVG export failed:", svgErr);
        }
      }

      // --- Fallback: capture tldraw canvas directly from DOM ---
      if (!imgDataUrl) {
        try {
          const svgEl =
            (document.querySelector(
              ".tl-container svg.tl-svg-context",
            ) as SVGSVGElement) ||
            (document.querySelector(".tl-canvas svg") as SVGSVGElement);
          if (svgEl) {
            const serializer = new XMLSerializer();
            let svgStr = serializer.serializeToString(svgEl);
            svgStr = svgStr.replace(/color\([^)]*\)/g, "#000000");
            const blob = new Blob([svgStr], {
              type: "image/svg+xml;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = url;
            });
            if (img.naturalWidth > 0) {
              const c = document.createElement("canvas");
              c.width = Math.min(img.naturalWidth, 2000);
              c.height = Math.min(img.naturalHeight, 2000);
              const ctx = c.getContext("2d")!;
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, c.width, c.height);
              ctx.drawImage(img, 0, 0, c.width, c.height);
              imgDataUrl = c.toDataURL("image/jpeg", 0.92);
              imgW = c.width;
              imgH = c.height;
            }
            URL.revokeObjectURL(url);
          }
        } catch (domErr) {
          console.warn("DOM SVG fallback failed:", domErr);
        }
      }

      if (!imgDataUrl) {
        toast.error(
          isRTL ? "لا يوجد محتوى للتصدير" : "Aucun contenu à exporter",
        );
        return;
      }

      // Scale image to fit the content area while preserving aspect ratio
      const wMm = imgW * PX_TO_MM || CONTENT_W;
      const hMm = imgH * PX_TO_MM || CONTENT_H;
      const scaleFactor = Math.min(CONTENT_W / wMm, CONTENT_H / hMm, 1);
      const finalW = wMm * scaleFactor;
      const finalH = hMm * scaleFactor;
      const imgLeft = MARGIN + (CONTENT_W - finalW) / 2;
      const imgTop = MARGIN + HEADER_H + (CONTENT_H - finalH) / 2;

      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "landscape",
      });

      // White background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, A4_W, A4_H, "F");

      // --- Header ---
      const pageTitle = currentPage.name || "Page 1";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(pageTitle, MARGIN, MARGIN + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.text("Tableau Blanc — LearnUP", A4_W - MARGIN, MARGIN + 7, {
        align: "right",
      });
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.line(
        MARGIN,
        MARGIN + HEADER_H - 1,
        A4_W - MARGIN,
        MARGIN + HEADER_H - 1,
      );

      // --- Content image ---
      doc.addImage(imgDataUrl, "JPEG", imgLeft, imgTop, finalW, finalH);

      // --- Footer ---
      const footerY = A4_H - MARGIN + 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(pageTitle, MARGIN, footerY);
      doc.text(
        new Date().toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        A4_W - MARGIN,
        footerY,
        { align: "right" },
      );
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, footerY - 4, A4_W - MARGIN, footerY - 4);

      doc.save(
        `tableau-blanc-${pageTitle}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast.success(
        isRTL ? "تم تصدير الصفحة في PDF بنجاح" : "Export PDF réussi",
      );
    } catch (e) {
      console.error("Export PDF error:", e);
      toast.error(isRTL ? "خطأ أثناء التصدير" : "Erreur lors de l'export");
    }
  }, [isRTL]);

  const canWrite =
    isProfessor ||
    permissions === "all" ||
    (permissions === "specific-student" &&
      room.localParticipant.identity === allowedStudentIdentity);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full bg-[#f8f9fa] overflow-hidden"
    >
      {/* Header Bar — hidden in recording mode to maximize canvas */}
      {!isRecordingMode && (
        <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
          {/* Left: title + status */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                {isRTL ? "اللوحة البيضاء" : "Tableau Blanc"}
              </span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs hidden sm:flex gap-1 items-center",
                canWrite
                  ? "border-emerald-400 text-emerald-600"
                  : "border-orange-400 text-orange-600",
              )}
            >
              {canWrite ? (
                <Pencil className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              {canWrite
                ? isRTL
                  ? "كتابة"
                  : "Écriture"
                : isRTL
                  ? "قراءة"
                  : "Lecture"}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs hidden sm:flex gap-1 items-center border-gray-300 text-gray-600"
            >
              <Users className="w-3 h-3" />
              {participantCount}
            </Badge>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Professor-only: permission selector dropdown (hidden in fullscreen) */}
            {isProfessor && !isFullscreen && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "gap-1.5 text-xs h-8 rounded-full border transition-all",
                        permissions === "all"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                          : permissions === "specific-student"
                            ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                            : "bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100",
                      )}
                    >
                      {permissions === "all" ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {isRTL ? "تعاوني" : "Collaboratif"}
                          </span>
                        </>
                      ) : permissions === "specific-student" ? (
                        <>
                          <UserCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline truncate max-w-[100px]">
                            {allowedStudentName || (isRTL ? "طالب" : "Élève")}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {isRTL ? "مقيّد" : "Restreint"}
                          </span>
                        </>
                      )}
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs text-gray-500">
                    {isRTL ? "وضع الكتابة" : "Mode d'écriture"}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setPermissionMode("professor-only")}
                    className={cn(
                      "gap-2 text-sm",
                      permissions === "professor-only" &&
                        "bg-orange-50 font-medium",
                    )}
                  >
                    <Lock className="w-4 h-4 text-orange-600" />
                    {isRTL ? "الأستاذ فقط" : "Professeur seul"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-gray-500">
                    {isRTL
                      ? "منح صلاحية الكتابة لطالب"
                      : "Donner la main à un élève"}
                  </DropdownMenuLabel>
                  {studentParticipants.length === 0 ? (
                    <DropdownMenuItem
                      disabled
                      className="text-xs text-gray-400 italic"
                    >
                      {isRTL ? "لا يوجد طلاب متصلين" : "Aucun élève connecté"}
                    </DropdownMenuItem>
                  ) : (
                    studentParticipants.map((student) => (
                      <DropdownMenuItem
                        key={student.identity}
                        onClick={() =>
                          setPermissionMode(
                            "specific-student",
                            student.identity,
                            student.name,
                          )
                        }
                        className={cn(
                          "gap-2 text-sm",
                          permissions === "specific-student" &&
                            allowedStudentIdentity === student.identity &&
                            "bg-blue-50 font-medium",
                        )}
                      >
                        <UserCircle className="w-4 h-4 text-blue-600" />
                        {student.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Export PDF */}
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                className="gap-1.5 text-xs h-8 rounded-full"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isRTL ? "تصدير PDF" : "Exporter PDF"}
                </span>
              </Button>
            </motion.div>

            {/* Fullscreen toggle */}
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleFullscreen}
                className="h-8 w-8 rounded-full hover:bg-gray-100"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 text-gray-600" />
                ) : (
                  <Maximize className="w-4 h-4 text-gray-600" />
                )}
              </Button>
            </motion.div>

            {/* Close */}
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClose}
                className="h-8 w-8 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-600" />
              </Button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Read-only overlay notification for students — hidden in recording mode */}
      {!isRecordingMode && (
        <AnimatePresence>
          {!canWrite && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-slate-700/90 text-white text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none"
            >
              <Move className="w-3.5 h-3.5" />
              {permissions === "specific-student"
                ? isRTL
                  ? `${allowedStudentName || "طالب"} يكتب — يمكنك التنقل بحرية`
                  : `${allowedStudentName || "Un élève"} écrit — naviguez librement`
                : isRTL
                  ? "قراءة فقط — يمكنك التنقل والتكبير بحرية"
                  : "Lecture seule — naviguez et zoomez librement"}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Tldraw canvas */}
      <div
        className="flex-1 min-h-0 relative"
        style={{ touchAction: "none" }}
        onDoubleClick={handleCanvasDoubleClick}
      >
        <Tldraw
          store={store}
          hideUi={isRecordingMode}  // show controls for students in read-only mode
          inferDarkMode
          onMount={(editor) => {
            editorRef.current = editor;
            // isReadonly blocks drawing but still allows pan/zoom for all users
            editor.updateInstanceState({ isReadonly: isReadOnly });
            // Start at 50% zoom — users can freely zoom in/out
            try {
              editor.setCamera({ x: 0, y: 0, z: 0.5 });
            } catch (e) {
              /* ignore */
            }
            // Select tool active on mount so panning works immediately
            try {
              editor.selectTool?.("select");
            } catch (e) {
              /* ignore */
            }
            setEditorReady(true);
          }}
        />

        {/* No blocking overlay — tldraw's isReadonly prevents drawing while
            allowing students to freely pan and zoom the canvas. */}
      </div>

      {/* Transparent media controls overlay on double-click */}
      <AnimatePresence>
        {showMediaOverlay && mediaControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 bg-black/40 backdrop-blur-md rounded-2xl px-6 py-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <MediaControls
              isMuted={mediaControls.isMuted}
              isCameraOn={mediaControls.isCameraOn}
              isScreenSharing={mediaControls.isScreenSharing}
              onToggleMute={mediaControls.onToggleMute}
              onToggleCamera={mediaControls.onToggleCamera}
              onToggleScreenShare={mediaControls.onToggleScreenShare}
              allowCamera={mediaControls.allowCamera}
              allowScreenShare={mediaControls.allowScreenShare}
              isRTL={isRTL}
              compact
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom status bar — hidden in recording mode */}
      {!isRecordingMode && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t border-gray-200 text-xs text-gray-500 shrink-0">
          <span className="flex items-center gap-1">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                canWrite ? "bg-emerald-500" : "bg-orange-400",
              )}
            />
            {canWrite
              ? isRTL
                ? "يمكنك الرسم"
                : "Vous pouvez dessiner"
              : isRTL
                ? "قراءة — تنقل وتكبير حر"
                : "Lecture — navigation & zoom libres"}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {participantCount}{" "}
            {isRTL
              ? "مشارك"
              : participantCount > 1
                ? "participants"
                : "participant"}
            {permissions === "all"
              ? isRTL
                ? " · تعاوني"
                : " · Collaboratif"
              : permissions === "specific-student"
                ? ` · ${allowedStudentName || (isRTL ? "طالب" : "Élève")}`
                : isRTL
                  ? " · الأستاذ فقط"
                  : " · Professeur seul"}
          </span>
        </div>
      )}
    </div>
  );
};
