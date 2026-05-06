import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultSizeStyle,
  TLStoreWithStatus,
  TLRecord,
  TLStore,
  getSnapshot,
  loadSnapshot,
  DefaultToolbar,
  ToolbarItem,
  StateNode,
  TLPointerEventInfo,
  TLUiOverrides,
  TLUiAssetUrlOverrides,
  toRichText,
} from "tldraw";
import "tldraw/tldraw.css";
import jsPDF from "jspdf";
import { Room } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { createShapeId, TLShapeId } from "@tldraw/tlschema";
import { getIndices, IndexKey } from "@tldraw/utils";
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

const TOOL_MIN_RADIUS = 20;
const TOOL_DOT_SIZE = 8;
const PROTRACTOR_MIN_RADIUS = 60;
const PROTRACTOR_ARC_POINTS = 61;
const PROTRACTOR_TICK_COUNT = 19;
const PROTRACTOR_LABEL_COUNT = 7;
const PROTRACTOR_MAJOR_TICK = 12;
const PROTRACTOR_MINOR_TICK = 7;
const COMPASS_TRACE_POINTS = 80;
const MM_TO_PX = 96 / 25.4;
const TABLET_DRAW_MIN_POINT_DISTANCE = 0.75;
const TABLET_DRAW_DECIMALS = 2;

const toFixedPoint = (point: { x: number; y: number }) => ({
  x: Number(point.x.toFixed(2)),
  y: Number(point.y.toFixed(2)),
});

const roundPoint = (point: { x: number; y: number; z?: number }) => ({
  x: Number(point.x.toFixed(TABLET_DRAW_DECIMALS)),
  y: Number(point.y.toFixed(TABLET_DRAW_DECIMALS)),
  z: point.z,
});

const simplifyFreehandPoints = (
  points: Array<{ x: number; y: number; z?: number }>,
) => {
  if (!points || points.length <= 2) {
    return points?.map((p) => roundPoint(p)) || [];
  }

  const simplified: Array<{ x: number; y: number; z?: number }> = [];
  let lastKept = points[0];
  simplified.push(roundPoint(lastKept));

  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    if (
      Math.hypot(current.x - lastKept.x, current.y - lastKept.y) >=
      TABLET_DRAW_MIN_POINT_DISTANCE
    ) {
      simplified.push(roundPoint(current));
      lastKept = current;
    }
  }

  const last = points[points.length - 1];
  const alreadyHasLast =
    simplified.length > 0 &&
    simplified[simplified.length - 1].x === Number(last.x.toFixed(TABLET_DRAW_DECIMALS)) &&
    simplified[simplified.length - 1].y === Number(last.y.toFixed(TABLET_DRAW_DECIMALS));

  if (!alreadyHasLast) {
    simplified.push(roundPoint(last));
  }

  if (simplified.length < 2 && points.length >= 2) {
    return points.map((p) => roundPoint(p));
  }

  return simplified;
};

const normalizeDrawSegments = (
  segments: Array<{ type: "free" | "straight"; points: Array<{ x: number; y: number; z?: number }> }>,
) => {
  return segments.map((segment) => ({
    type: segment.type,
    points: simplifyFreehandPoints(segment.points || []),
  }));
};

const areDrawSegmentsEquivalent = (
  a: Array<{ type: "free" | "straight"; points: Array<{ x: number; y: number; z?: number }> }>,
  b: Array<{ type: "free" | "straight"; points: Array<{ x: number; y: number; z?: number }> }>,
) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const sa = a[i];
    const sb = b[i];
    if (sa.type !== sb.type || sa.points.length !== sb.points.length) return false;
    for (let j = 0; j < sa.points.length; j++) {
      const pa = sa.points[j];
      const pb = sb.points[j];
      if (pa.x !== pb.x || pa.y !== pb.y) return false;
    }
  }
  return true;
};

const getDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(b.x - a.x, b.y - a.y);

const getAngle = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.atan2(b.y - a.y, b.x - a.x);

const normalizeAngleDelta = (delta: number) => {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

const getPointOnCircle = (
  center: { x: number; y: number },
  radius: number,
  angle: number,
) => ({
  x: center.x + Math.cos(angle) * radius,
  y: center.y + Math.sin(angle) * radius,
});

const toRelativePoints = (
  points: { x: number; y: number }[],
  center: { x: number; y: number },
) => points.map((point) => ({ x: point.x - center.x, y: point.y - center.y }));

const toLinePointsRecord = (points: { x: number; y: number }[]) => {
  const indices = getIndices(points.length);
  return points.reduce(
    (acc, point, i) => {
      const index = indices[i] as IndexKey;
      acc[index] = { id: index, index, x: point.x, y: point.y };
      return acc;
    },
    {} as Record<string, { id: string; index: IndexKey; x: number; y: number }>,
  );
};

const createLineShape = (id: TLShapeId, x: number, y: number) => ({
  id,
  type: "line" as const,
  x,
  y,
  props: {
    dash: "solid" as const,
    size: "s" as const,
    color: "black" as const,
    spline: "line" as const,
    points: toLinePointsRecord([
      { x: -0.5, y: 0 },
      { x: 0.5, y: 0 },
    ]),
    scale: 1,
  },
});

const createArcPolyline = (
  center: { x: number; y: number },
  radius: number,
  start: number,
  sweep: number,
  pointsCount: number,
) => {
  const safeCount = Math.max(2, pointsCount);
  return Array.from({ length: safeCount }, (_, i) => {
    const t = safeCount === 1 ? 0 : i / (safeCount - 1);
    return getPointOnCircle(center, radius, start + sweep * t);
  });
};

class CompassTool extends StateNode {
  static override id = "compass";
  static configuredRadius = 120;

  private center: { x: number; y: number } | null = null;
  private activeRadius: number | null = null;
  private startAngle: number | null = null;
  private lastAngle: number | null = null;
  private accumulatedSweep = 0;

  private armId: TLShapeId | null = null;
  private traceId: TLShapeId | null = null;
  private centerId: TLShapeId | null = null;
  private tipId: TLShapeId | null = null;

  private allIds(): TLShapeId[] {
    return [this.armId, this.traceId, this.centerId, this.tipId].filter(
      Boolean,
    ) as TLShapeId[];
  }

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }

  override onPointerDown(_info: TLPointerEventInfo) {
    const center = toFixedPoint(this.editor.inputs.currentPagePoint);
    this.center = center;
    this.activeRadius = Math.max(TOOL_MIN_RADIUS, CompassTool.configuredRadius);
    this.startAngle = null;
    this.lastAngle = null;
    this.accumulatedSweep = 0;

    this.armId = createShapeId();
    this.traceId = createShapeId();
    this.centerId = createShapeId();
    this.tipId = createShapeId();

    const dotHalf = TOOL_DOT_SIZE / 2;

    this.editor.createShapes([
      createLineShape(this.armId, center.x, center.y),
      createLineShape(this.traceId, center.x, center.y),
      {
        id: this.centerId,
        type: "geo",
        x: center.x - dotHalf,
        y: center.y - dotHalf,
        props: {
          geo: "ellipse",
          w: TOOL_DOT_SIZE,
          h: TOOL_DOT_SIZE,
          dash: "solid",
          fill: "solid",
          color: "black",
        },
      },
      {
        id: this.tipId,
        type: "geo",
        x: center.x + this.activeRadius - dotHalf,
        y: center.y - dotHalf,
        props: {
          geo: "ellipse",
          w: TOOL_DOT_SIZE,
          h: TOOL_DOT_SIZE,
          dash: "solid",
          fill: "none",
          color: "black",
        },
      },
    ]);
  }

  override onPointerMove(_info: TLPointerEventInfo) {
    if (!this.center || !this.armId || !this.traceId || !this.tipId) return;

    const current = toFixedPoint(this.editor.inputs.currentPagePoint);
    const angle = getAngle(this.center, current);
    if (this.activeRadius === null) {
      this.activeRadius = Math.max(TOOL_MIN_RADIUS, getDistance(this.center, current));
    }
    const radius = this.activeRadius;

    if (this.startAngle === null) {
      this.startAngle = angle;
      this.lastAngle = angle;
      this.accumulatedSweep = 0;
    } else if (this.lastAngle !== null) {
      const delta = normalizeAngleDelta(angle - this.lastAngle);
      this.accumulatedSweep += delta;
      this.lastAngle = angle;
    }

    const rawSweep = this.accumulatedSweep;
    const sweep = Math.abs(rawSweep) < 0.07 ? 0.07 : rawSweep;
    const isCircle = Math.abs(rawSweep) >= Math.PI * 2 - 0.2;

    const tracePoints = isCircle
      ? createArcPolyline(this.center, radius, 0, Math.PI * 2, COMPASS_TRACE_POINTS)
      : createArcPolyline(
          this.center,
          radius,
          this.startAngle ?? angle,
          sweep,
          Math.max(
            12,
            Math.floor((Math.abs(sweep) / (Math.PI * 2)) * COMPASS_TRACE_POINTS),
          ),
        );

    const tip = getPointOnCircle(this.center, radius, angle);

    this.editor.updateShape({
      id: this.armId,
      type: "line",
      x: this.center.x,
      y: this.center.y,
      props: {
        points: toLinePointsRecord([
          { x: 0, y: 0 },
          { x: tip.x - this.center.x, y: tip.y - this.center.y },
        ]),
      },
    });

    this.editor.updateShape({
      id: this.traceId,
      type: "line",
      x: this.center.x,
      y: this.center.y,
      props: {
        points: toLinePointsRecord(toRelativePoints(tracePoints, this.center)),
      },
    });

    this.editor.updateShape({
      id: this.tipId,
      type: "geo",
      x: tip.x - TOOL_DOT_SIZE / 2,
      y: tip.y - TOOL_DOT_SIZE / 2,
      props: {
        geo: "ellipse",
        w: TOOL_DOT_SIZE,
        h: TOOL_DOT_SIZE,
      },
    });
  }

  override onPointerUp(_info: TLPointerEventInfo) {
    this.finish();
  }

  override onCancel() {
    this.finish(true);
  }

  private finish(isCanceled = false) {
    if (!this.center) return;

    const helperIds = [this.armId, this.centerId, this.tipId].filter(
      Boolean,
    ) as TLShapeId[];
    const traceId = this.traceId;

    if (isCanceled) {
      const all = this.allIds().filter((id) => !!this.editor.getShape(id));
      this.editor.deleteShapes(all);
    } else {
      const existingHelpers = helperIds.filter((id) => !!this.editor.getShape(id));
      if (existingHelpers.length > 0) {
        this.editor.deleteShapes(existingHelpers);
      }
      if (traceId && this.editor.getShape(traceId)) {
        this.editor.select(traceId);
      }
    }

    this.center = null;
    this.activeRadius = null;
    this.startAngle = null;
    this.lastAngle = null;
    this.accumulatedSweep = 0;
    this.armId = null;
    this.traceId = null;
    this.centerId = null;
    this.tipId = null;
  }
}

class ProtractorTool extends StateNode {
  static override id = "protractor";

  private center: { x: number; y: number } | null = null;
  private arcId: TLShapeId | null = null;
  private baseId: TLShapeId | null = null;
  private centerId: TLShapeId | null = null;
  private tickIds: TLShapeId[] = [];
  private labelIds: TLShapeId[] = [];

  private allIds(): TLShapeId[] {
    return [
      this.arcId,
      this.baseId,
      this.centerId,
      ...this.tickIds,
      ...this.labelIds,
    ].filter(Boolean) as TLShapeId[];
  }

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }

  override onPointerDown(_info: TLPointerEventInfo) {
    const center = toFixedPoint(this.editor.inputs.currentPagePoint);
    this.center = center;
    this.arcId = createShapeId();
    this.baseId = createShapeId();
    this.centerId = createShapeId();
    this.tickIds = Array.from({ length: PROTRACTOR_TICK_COUNT }, () =>
      createShapeId(),
    );
    this.labelIds = Array.from({ length: PROTRACTOR_LABEL_COUNT }, () =>
      createShapeId(),
    );

    const dotHalf = TOOL_DOT_SIZE / 2;

    this.editor.createShapes([
      {
        id: this.arcId,
        type: "line",
        x: center.x,
        y: center.y,
        props: {
          dash: "solid",
          size: "s",
          color: "black",
          spline: "line",
          points: toLinePointsRecord([
            { x: -1, y: 0 },
            { x: 1, y: 0 },
          ]),
          scale: 1,
        },
      },
      {
        id: this.baseId,
        type: "line",
        x: center.x,
        y: center.y,
        props: {
          dash: "solid",
          size: "s",
          color: "black",
          spline: "line",
          points: toLinePointsRecord([
            { x: -1, y: 0 },
            { x: 1, y: 0 },
          ]),
          scale: 1,
        },
      },
      {
        id: this.centerId,
        type: "geo",
        x: center.x - dotHalf,
        y: center.y - dotHalf,
        props: {
          geo: "ellipse",
          w: TOOL_DOT_SIZE,
          h: TOOL_DOT_SIZE,
          dash: "solid",
          fill: "solid",
          color: "black",
        },
      },
      ...this.tickIds.map((tickId) => ({
        ...createLineShape(tickId, center.x, center.y),
      })),
      ...this.labelIds.map((labelId, i) => ({
        id: labelId,
        type: "text" as const,
        x: center.x,
        y: center.y,
        props: {
          richText: toRichText(`${i * 30}`),
          size: "s" as const,
          color: "black" as const,
        },
      })),
    ]);
  }

  override onPointerMove(_info: TLPointerEventInfo) {
    if (!this.center || !this.arcId || !this.baseId || !this.centerId) return;
    const current = toFixedPoint(this.editor.inputs.currentPagePoint);
    const radius = Math.max(PROTRACTOR_MIN_RADIUS, getDistance(this.center, current));
    const angle = getAngle(this.center, current);
    const arcStart = angle + Math.PI;
    const arcSweep = -Math.PI;
    const arcPoints = createArcPolyline(
      this.center,
      radius,
      arcStart,
      arcSweep,
      PROTRACTOR_ARC_POINTS,
    );

    const baseRight = getPointOnCircle(this.center, radius, angle);
    const baseLeft = getPointOnCircle(this.center, radius, angle + Math.PI);

    this.editor.updateShape({
      id: this.arcId,
      type: "line",
      x: this.center.x,
      y: this.center.y,
      props: {
        points: toLinePointsRecord(toRelativePoints(arcPoints, this.center)),
      },
    });

    this.editor.updateShape({
      id: this.baseId,
      type: "line",
      x: this.center.x,
      y: this.center.y,
      props: {
        points: toLinePointsRecord(
          toRelativePoints([baseLeft, baseRight], this.center),
        ),
      },
    });

    this.tickIds.forEach((tickId, index) => {
      const t = index / (PROTRACTOR_TICK_COUNT - 1);
      const tickAngle = arcStart + arcSweep * t;
      const isMajor = index % 3 === 0 || index === PROTRACTOR_TICK_COUNT - 1;
      const tickLen = isMajor ? PROTRACTOR_MAJOR_TICK : PROTRACTOR_MINOR_TICK;
      const outer = getPointOnCircle(this.center!, radius, tickAngle);
      const inner = getPointOnCircle(this.center!, radius - tickLen, tickAngle);

      this.editor.updateShape({
        id: tickId,
        type: "line",
        x: this.center!.x,
        y: this.center!.y,
        props: {
          points: toLinePointsRecord(
            toRelativePoints([inner, outer], this.center!),
          ),
        },
      });
    });

    this.labelIds.forEach((labelId, index) => {
      const t = index / (PROTRACTOR_LABEL_COUNT - 1);
      const labelAngle = arcStart + arcSweep * t;
      const labelPoint = getPointOnCircle(this.center!, radius - 24, labelAngle);
      const value = Math.round(t * 180);

      this.editor.updateShape({
        id: labelId,
        type: "text",
        x: labelPoint.x,
        y: labelPoint.y,
        rotation: 0,
        props: {
          richText: toRichText(`${value}°`),
          size: "s",
          color: "black",
        },
      });
    });
  }

  override onPointerUp(_info: TLPointerEventInfo) {
    this.finish();
  }

  override onCancel() {
    this.finish(true);
  }

  private finish(isCanceled = false) {
    if (!this.center) return;

    const ids = this.allIds();
    const validIds = ids.filter((id) => !!this.editor.getShape(id));

    if (isCanceled) {
      this.editor.deleteShapes(validIds);
    } else if (validIds.length > 1) {
      const center = this.center;
      const groupId = createShapeId();

      // Restore robust move-as-one behavior by creating a parent group and reparenting all parts.
      this.editor.createShape({
        id: groupId,
        type: "group",
        x: center.x,
        y: center.y,
      } as any);
      this.editor.reparentShapes(validIds, groupId);
      this.editor.select(groupId);
    }

    this.center = null;
    this.arcId = null;
    this.baseId = null;
    this.centerId = null;
    this.tickIds = [];
    this.labelIds = [];
  }
}

const CUSTOM_TOOLS = [CompassTool, ProtractorTool];

const customToolAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    "tool-compass-custom": "/tldraw-icons/compass.svg",
    "tool-protractor-custom": "/tldraw-icons/protractor.svg",
  },
};

const customToolOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools.compass = {
      id: "compass",
      icon: "tool-compass-custom",
      label: "tools.compass",
      kbd: "c",
      onSelect: () => editor.setCurrentTool("compass"),
    };
    tools.protractor = {
      id: "protractor",
      icon: "tool-protractor-custom",
      label: "tools.protractor",
      kbd: "p",
      onSelect: () => editor.setCurrentTool("protractor"),
    };
    return tools;
  },
  translations: {
    en: {
      "tools.compass": "Compass",
      "tools.protractor": "Protractor",
    },
    fr: {
      "tools.compass": "Compas",
      "tools.protractor": "Rapporteur",
    },
    ar: {
      "tools.compass": "فرجار",
      "tools.protractor": "منقلة",
    },
  },
};

const CustomToolbar = () => (
  <DefaultToolbar>
    <>
      <ToolbarItem tool="select" />
      <ToolbarItem tool="hand" />
      <ToolbarItem tool="draw" />
      <ToolbarItem tool="eraser" />
      <ToolbarItem tool="arrow" />
      <ToolbarItem tool="text" />
      <ToolbarItem tool="note" />
      <ToolbarItem tool="asset" />
      <ToolbarItem tool="rectangle" />
      <ToolbarItem tool="ellipse" />
      <ToolbarItem tool="triangle" />
      <ToolbarItem tool="diamond" />
      <ToolbarItem tool="hexagon" />
      <ToolbarItem tool="oval" />
      <ToolbarItem tool="rhombus" />
      <ToolbarItem tool="star" />
      <ToolbarItem tool="line" />
      <ToolbarItem tool="highlight" />
      <ToolbarItem tool="frame" />
      <ToolbarItem tool="compass" />
      <ToolbarItem tool="protractor" />
    </>
  </DefaultToolbar>
);

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
  const [compassRadiusMm, setCompassRadiusMm] = useState<number>(32);
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
  const isNormalizingDrawRef = useRef(false);
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

  useEffect(() => {
    const radiusPx = Math.round(compassRadiusMm * MM_TO_PX);
    CompassTool.configuredRadius = Math.max(
      TOOL_MIN_RADIUS,
      radiusPx || TOOL_MIN_RADIUS,
    );
  }, [compassRadiusMm]);

  // Keep local tool state synced so custom controls can appear/disappear reliably.
  useEffect(() => {
    if (!editorReady) return;
    const timer = window.setInterval(() => {
      const editor = editorRef.current;
      if (!editor?.getCurrentToolId) return;
      const id = editor.getCurrentToolId();
      setCurrentTool((prev) => (prev === id ? prev : id));
    }, 150);

    return () => window.clearInterval(timer);
  }, [editorReady]);

  storeRef.current = store;

  // Tablet writing mode: normalize draw points to reduce jitter from micro-movements.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const unsubscribe = store.listen(
      (entry: any) => {
        if (isSyncingRef.current || isNormalizingDrawRef.current) return;

        const changedRecordIds = new Set<string>();
        const updates = entry?.changes?.updated ?? {};
        const additions = entry?.changes?.added ?? {};

        Object.keys(updates).forEach((id) => changedRecordIds.add(id));
        Object.keys(additions).forEach((id) => changedRecordIds.add(id));

        if (changedRecordIds.size === 0) return;

        const shapePatches: Array<{
          id: string;
          type: "draw";
          props: {
            segments: Array<{ type: "free" | "straight"; points: Array<{ x: number; y: number; z?: number }> }>;
            isPen: boolean;
          };
        }> = [];

        changedRecordIds.forEach((id) => {
          const shape = editor.getShape?.(id);
          if (!shape || shape.type !== "draw") return;

          const rawSegments = (shape.props?.segments ?? []) as Array<{
            type: "free" | "straight";
            points: Array<{ x: number; y: number; z?: number }>;
          }>;
          if (!Array.isArray(rawSegments) || rawSegments.length === 0) return;

          const normalizedSegments = normalizeDrawSegments(rawSegments);
          const currentSegments = rawSegments.map((segment) => ({
            type: segment.type,
            points: (segment.points || []).map((p) => roundPoint(p)),
          }));

          const needsUpdate =
            !areDrawSegmentsEquivalent(currentSegments, normalizedSegments) ||
            shape.props?.isPen !== true;

          if (needsUpdate) {
            shapePatches.push({
              id: shape.id,
              type: "draw",
              props: {
                segments: normalizedSegments,
                isPen: true,
              },
            });
          }
        });

        if (shapePatches.length === 0) return;

        isNormalizingDrawRef.current = true;
        try {
          editor.updateShapes(shapePatches as any);
        } finally {
          window.setTimeout(() => {
            isNormalizingDrawRef.current = false;
          }, 0);
        }
      },
      { source: "user", scope: "document" },
    );

    return () => unsubscribe();
  }, [store, editorReady]);

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
        {!isRecordingMode && currentTool === "compass" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
            <span className="text-xs text-gray-600 whitespace-nowrap">
              {isRTL ? "نصف القطر" : "Rayon"}
            </span>
            <input
              type="number"
              min={5}
              max={150}
              step={1}
              value={compassRadiusMm}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isNaN(next)) return;
                setCompassRadiusMm(Math.max(5, Math.min(150, next)));
              }}
              className="w-20 h-8 text-sm text-black rounded-md border border-gray-300 px-2 bg-white"
            />
            <span className="text-xs text-gray-500">mm</span>
          </div>
        )}

        <Tldraw
          autoFocus
          store={store}
          tools={CUSTOM_TOOLS}
          assetUrls={customToolAssetUrls}
          overrides={customToolOverrides}
          components={{ Toolbar: CustomToolbar }}
          hideUi={isRecordingMode}  // show controls for students in read-only mode
          inferDarkMode={false}
          onMount={(editor) => {
            editorRef.current = editor;
            // isReadonly blocks drawing but still allows pan/zoom for all users
            editor.updateInstanceState({ isReadonly: isReadOnly });
            // Keep handwriting visible/clear by default on pen tablets.
            try {
              editor.setStyleForNextShapes(DefaultSizeStyle, "m");
              editor.setStyleForNextShapes(DefaultDashStyle, "draw");
              editor.setStyleForNextShapes(DefaultColorStyle, "black");
            } catch (e) {
              /* ignore */
            }
            // Disable debug rendering and keep default instance behavior stable.
            editor.updateInstanceState({ isDebugMode: false });
            // Tablet profile: prefer clean medium strokes for handwriting clarity.
            try {
              editor.user.updateUserPreferences?.({ colorScheme: "light" });
            } catch (e) {
              /* ignore */
            }
            // Start at 50% zoom — users can freely zoom in/out
            try {
              editor.setCamera({ x: 0, y: 0, z: 0.5 });
            } catch (e) {
              /* ignore */
            }
            // Default to draw tool when user can write; otherwise keep select for pan/zoom.
            try {
              const mountTool = isReadOnly ? "select" : "draw";
              editor.setCurrentTool?.(mountTool);
              setCurrentTool(mountTool);
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
