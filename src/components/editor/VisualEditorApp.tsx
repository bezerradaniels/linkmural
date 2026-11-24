"use client";

/* eslint-disable @next/next/no-img-element -- dynamic user avatar/cover media */
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  publishMuralFromEditorAction,
  saveMuralDocumentAction,
} from "@/app/(site)/editor/actions";
import {
  ImageCropModal,
  type CroppedImageResult,
} from "@/components/app/ImageCropModal";
import {
  EditorBottomDock,
  type DockPanelKey,
} from "@/components/editor/EditorBottomDock";
import { EditorDrawers } from "@/components/editor/EditorDrawers";
import { EditorWidgetCard } from "@/components/editor/EditorWidgetCard";
import {
  FloatingWidgetPopover,
  type PopoverAnchorRect,
} from "@/components/editor/FloatingWidgetPopover";
import {
  distancePx,
  GESTURE_THRESHOLDS,
  GESTURE_TIMINGS,
  INITIAL_GESTURE_STATE,
  snapCornerResize,
  transitionGestureFsm,
  type CornerDirection,
  type GestureFsmState,
} from "@/lib/editor/fsm";
import { resolveEditorTheme } from "@/lib/editor/mapper";
import {
  EDITOR_THEME_PRESETS,
  type BlockGeometry,
  type CanvasNode,
  type MuralDocument,
  type MuralProfileHeader,
  type MuralSettings,
  type ViewportKey,
  type WidgetItem,
  type WidgetTemplateSpec,
} from "@/lib/editor/types";
import type { Plan } from "@/lib/plans";
import { publicFont } from "@/lib/public-fonts";
import { createClient } from "@/utils/supabase/client";

type Snapshot = {
  header: Pick<
    MuralProfileHeader,
    | "businessName"
    | "bio"
    | "avatarPath"
    | "coverPath"
    | "avatarUrl"
    | "coverUrl"
  >;
  settings: MuralSettings;
  nodes: CanvasNode[];
};

const MAX_HISTORY = 40;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function vibrate(ms: number) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(ms);
    } catch {
      // Ignore unsupported environments
    }
  }
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "LM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function VisualEditorApp({
  initialDoc,
  ownerId,
  plan,
  pageUrl,
}: {
  initialDoc: MuralDocument;
  ownerId: string;
  plan: Plan;
  pageUrl: string;
}) {
  // Temporal state (Undo / Redo history)
  const [past, setPast] = useState<Snapshot[]>([]);
  const [present, setPresent] = useState<Snapshot>({
    header: {
      businessName: initialDoc.header.businessName,
      bio: initialDoc.header.bio,
      avatarPath: initialDoc.header.avatarPath,
      coverPath: initialDoc.header.coverPath,
      avatarUrl: initialDoc.header.avatarUrl,
      coverUrl: initialDoc.header.coverUrl,
    },
    settings: initialDoc.settings,
    nodes: initialDoc.nodes,
  });
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [published, setPublished] = useState(initialDoc.header.published);
  const [publishing, setPublishing] = useState(false);

  // Viewport & UI Chrome state
  const [viewport, setViewport] = useState<ViewportKey>("mobile");
  const [activePanel, setActivePanel] = useState<DockPanelKey>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<string | null>(null);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [cropState, setCropState] = useState<{
    file: File;
    kind: "logo" | "cover";
  } | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState<"logo" | "cover" | null>(
    null,
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Gesture FSM state
  const [fsm, setFsm] = useState<GestureFsmState>(INITIAL_GESTURE_STATE);
  const fsmRef = useRef<GestureFsmState>(INITIAL_GESTURE_STATE);
  const setFsmSync = useCallback(
    (updater: GestureFsmState | ((prev: GestureFsmState) => GestureFsmState)) => {
      setFsm((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        fsmRef.current = next;
        return next;
      });
    },
    [],
  );

  // Live Drag & Resize Ephemeral Visual State (60fps without history spam)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [resizePreview, setResizePreview] = useState<{
    colSpan: 1 | 2 | 4;
    rowSpan: 1 | 2;
  } | null>(null);
  const [popoverRect, setPopoverRect] = useState<PopoverAnchorRect | null>(
    null,
  );

  // Refs for DOM elements, timers, and pointer tracking
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const preLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgDownPosRef = useRef<{ x: number; y: number; pointerId: number } | null>(
    null,
  );
  const dragOriginSnapshotRef = useRef<Snapshot | null>(null);
  const resizeStartGeoRef = useRef<BlockGeometry | null>(null);
  const lastPointerClientRef = useRef<{ x: number; y: number } | null>(null);
  const undoToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMountRef = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerCardElement = useCallback(
    (nodeId: string, el: HTMLDivElement | null) => {
      if (el) cardElsRef.current.set(nodeId, el);
      else cardElsRef.current.delete(nodeId);
    },
    [],
  );

  const clearHoldTimers = useCallback(() => {
    if (preLockTimerRef.current) {
      clearTimeout(preLockTimerRef.current);
      preLockTimerRef.current = null;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const clearBgHoldTimer = useCallback(() => {
    if (bgHoldTimerRef.current) {
      clearTimeout(bgHoldTimerRef.current);
      bgHoldTimerRef.current = null;
    }
    bgDownPosRef.current = null;
  }, []);

  // Commit a state mutation to Undo/Redo history
  const commitChange = useCallback(
    (updater: (cur: Snapshot) => Snapshot) => {
      setPresent((cur) => {
        const next = updater(cur);
        if (next === cur) return cur;
        setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), cur]);
        setFuture([]);
        setSaveState("saving");
        return next;
      });
    },
    [],
  );

  const handleUndo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setPresent((cur) => {
        setFuture((f) => [cur, ...f.slice(0, MAX_HISTORY - 1)]);
        return previous;
      });
      setSaveState("saving");
      setUndoToast(null);
      return p.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPresent((cur) => {
        setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), cur]);
        return next;
      });
      setSaveState("saving");
      return f.slice(1);
    });
  }, []);

  // 800ms Debounced Auto-Save
  const triggerSaveNow = useCallback(
    async (snap: Snapshot) => {
      setSaveState("saving");
      setSaveError(null);
      const res = await saveMuralDocumentAction({
        muralId: initialDoc.id,
        header: {
          businessName: snap.header.businessName.trim() || initialDoc.slug,
          bio: snap.header.bio,
          avatarPath: snap.header.avatarPath,
          coverPath: snap.header.coverPath,
        },
        settings: snap.settings,
        nodes: snap.nodes,
      });

      if (!res.ok) {
        setSaveState("error");
        setSaveError(res.error);
        return;
      }

      setSaveState("saved");
      const mapKeys = Object.keys(res.createdIdMap);
      if (mapKeys.length > 0) {
        const replaceIds = (s: Snapshot): Snapshot => ({
          ...s,
          nodes: s.nodes.map((n) =>
            res.createdIdMap[n.id] ? { ...n, id: res.createdIdMap[n.id] } : n,
          ),
        });
        setPresent((cur) => replaceIds(cur));
        setPast((p) => p.map(replaceIds));
        setFsmSync((cur) =>
          cur.activeNodeId && res.createdIdMap[cur.activeNodeId]
            ? { ...cur, activeNodeId: res.createdIdMap[cur.activeNodeId] }
            : cur,
        );
      }
    },
    [initialDoc.id, setFsmSync],
  );

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (fsm.mode === "DRAGGING" || fsm.mode === "RESIZING") return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void triggerSaveNow(present);
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [present, fsm.mode, triggerSaveNow]);

  // Keep Popover anchored above/below selected card on scroll/resize/layout change
  const selectedNode = useMemo(
    () =>
      fsm.activeNodeId
        ? (present.nodes.find((n) => n.id === fsm.activeNodeId) ?? null)
        : null,
    [fsm.activeNodeId, present.nodes],
  );

  const updatePopoverAnchor = useCallback(() => {
    if (fsm.mode !== "SELECTED" || !fsm.activeNodeId) {
      setPopoverRect(null);
      return;
    }
    const el = cardElsRef.current.get(fsm.activeNodeId);
    if (!el) {
      setPopoverRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setPopoverRect({
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      width: r.width,
    });
  }, [fsm.mode, fsm.activeNodeId]);

  useEffect(() => {
    const raf = requestAnimationFrame(updatePopoverAnchor);
    const scroller = scrollContainerRef.current;
    scroller?.addEventListener("scroll", updatePopoverAnchor, { passive: true });
    window.addEventListener("resize", updatePopoverAnchor);
    return () => {
      cancelAnimationFrame(raf);
      scroller?.removeEventListener("scroll", updatePopoverAnchor);
      window.removeEventListener("resize", updatePopoverAnchor);
    };
  }, [updatePopoverAnchor, present, viewport]);

  // Smooth Auto-Scroll during DRAGGING near top/bottom 12% of viewport (Spec §3 State C)
  useEffect(() => {
    if (fsm.mode !== "DRAGGING") return;
    let rafId = 0;
    const tick = () => {
      const scroller = scrollContainerRef.current;
      const pt = lastPointerClientRef.current;
      if (scroller && pt) {
        const rect = scroller.getBoundingClientRect();
        const zone = rect.height * 0.12;
        if (pt.y < rect.top + zone) {
          scroller.scrollTop -= 9;
        } else if (pt.y > rect.bottom - zone) {
          scroller.scrollTop += 9;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [fsm.mode]);

  // Remove node with 4-second Undo toast
  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      const target = present.nodes.find((n) => n.id === nodeId);
      if (!target) return;
      commitChange((cur) => ({
        ...cur,
        nodes: cur.nodes.filter((n) => n.id !== nodeId),
      }));
      setFsmSync((cur) =>
        transitionGestureFsm(cur, { type: "SELECT_NODE", nodeId: null }),
      );
      if (activePanel === "widget-edit" || activePanel === "stack") {
        setActivePanel(null);
      }
      setUndoToast(`"${target.items[0]?.title ?? "Bloco"}" removido`);
      if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current);
      undoToastTimerRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 4000);
    },
    [present.nodes, commitChange, setFsmSync, activePanel],
  );

  // Desktop Keyboard Shortcuts: Delete/Backspace, Cmd/Ctrl+Z, Esc (Spec §4)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement | null)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !isTyping) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y" && !isTyping) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === "Escape") {
        if (activePanel) {
          setActivePanel(null);
        } else if (fsmRef.current.mode === "ZOOM_OUT") {
          setFsmSync((cur) =>
            transitionGestureFsm(cur, { type: "EXIT_ZOOM_OUT" }),
          );
        } else if (fsmRef.current.activeNodeId) {
          setFsmSync((cur) =>
            transitionGestureFsm(cur, { type: "SELECT_NODE", nodeId: null }),
          );
        }
        return;
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !isTyping &&
        fsmRef.current.mode === "SELECTED" &&
        fsmRef.current.activeNodeId
      ) {
        e.preventDefault();
        handleRemoveNode(fsmRef.current.activeNodeId);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePanel, handleUndo, handleRedo, handleRemoveNode, setFsmSync]);

  /* ------------------------------------------------------------------------ */
  /* Pointer Event Handlers (Single-Target Mutex + FSM)                       */
  /* ------------------------------------------------------------------------ */
  const gridColumns: 2 | 4 | 6 =
    viewport === "mobile"
      ? present.settings.grid.mobileColumns
      : present.settings.grid.desktopColumns;

  const handleCardPointerDown = useCallback(
    (nodeId: string, e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.stopPropagation();
      clearBgHoldTimer();

      const now = Date.now();
      const cur = fsmRef.current;
      if (now < cur.cooldownUntil) return;
      if (cur.mode === "ZOOM_OUT") {
        setFsmSync((s) => transitionGestureFsm(s, { type: "EXIT_ZOOM_OUT" }));
        return;
      }
      if (
        cur.mode === "DRAGGING" ||
        cur.mode === "RESIZING" ||
        (cur.activePointerId !== null && cur.activePointerId !== e.pointerId)
      ) {
        return;
      }

      const pType: "touch" | "mouse" | "pen" =
        e.pointerType === "mouse"
          ? "mouse"
          : e.pointerType === "pen"
            ? "pen"
            : "touch";

      const targetEl = e.currentTarget;
      const pointerId = e.pointerId;
      const startX = e.clientX;
      const startY = e.clientY;
      lastPointerClientRef.current = { x: startX, y: startY };

      // If this exact card is ALREADY selected and grabbed with mouse, allow direct drag
      if (
        pType === "mouse" &&
        cur.mode === "SELECTED" &&
        cur.activeNodeId === nodeId
      ) {
        try {
          targetEl.setPointerCapture(pointerId);
        } catch {
          // Ignore if capture unsupported
        }
        setFsmSync((s) =>
          transitionGestureFsm(s, {
            type: "CARD_POINTER_DOWN",
            nodeId,
            pointerId,
            pointerType: "mouse",
            x: startX,
            y: startY,
            now,
          }),
        );
        return;
      }

      // Deliberate press-and-hold required to confirm selection (both touch & mouse)
      clearHoldTimers();
      setFsmSync((s) =>
        transitionGestureFsm(s, {
          type: "CARD_POINTER_DOWN",
          nodeId,
          pointerId,
          pointerType: pType,
          x: startX,
          y: startY,
          now,
        }),
      );

      preLockTimerRef.current = setTimeout(() => {
        setFsmSync((s) =>
          transitionGestureFsm(s, { type: "PRE_LOCK_TIMER", pointerId }),
        );
      }, GESTURE_TIMINGS.PRE_LOCK_FEEDBACK_MS);

      holdTimerRef.current = setTimeout(() => {
        setFsmSync((s) => {
          const next = transitionGestureFsm(s, {
            type: "LONG_PRESS_TIMER",
            pointerId,
          });
          if (next.mode === "SELECTED" && next.dragReady) {
            vibrate(18);
            try {
              targetEl.setPointerCapture(pointerId);
            } catch {
              // Ignore if pointer already released
            }
          }
          return next;
        });
      }, GESTURE_TIMINGS.LONG_PRESS_MS);
    },
    [clearBgHoldTimer, clearHoldTimers, setFsmSync],
  );

  const handleCornerPointerDown = useCallback(
    (
      nodeId: string,
      corner: CornerDirection,
      e: ReactPointerEvent<HTMLButtonElement>,
    ) => {
      e.stopPropagation();
      clearHoldTimers();
      clearBgHoldTimer();

      const now = Date.now();
      const cur = fsmRef.current;
      if (now < cur.cooldownUntil) return;

      const node = present.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }

      const startGeo = node.layout[viewport];
      resizeStartGeoRef.current = startGeo;
      setResizePreview({
        colSpan: startGeo.colSpan,
        rowSpan: startGeo.rowSpan,
      });

      const pType: "touch" | "mouse" | "pen" =
        e.pointerType === "mouse"
          ? "mouse"
          : e.pointerType === "pen"
            ? "pen"
            : "touch";

      setFsmSync((s) =>
        transitionGestureFsm(s, {
          type: "CORNER_POINTER_DOWN",
          nodeId,
          corner,
          pointerId: e.pointerId,
          pointerType: pType,
          x: e.clientX,
          y: e.clientY,
          now,
        }),
      );
      vibrate(10);
    },
    [clearBgHoldTimer, clearHoldTimers, present.nodes, setFsmSync, viewport],
  );

  // Global window pointermove / pointerup / pointercancel listener for active pointerId
  useEffect(() => {
    function onWindowPointerMove(e: PointerEvent) {
      // Check background long-press cancellation on scroll/drift
      if (
        bgDownPosRef.current &&
        bgDownPosRef.current.pointerId === e.pointerId
      ) {
        if (
          distancePx(
            bgDownPosRef.current.x,
            bgDownPosRef.current.y,
            e.clientX,
            e.clientY,
          ) > GESTURE_THRESHOLDS.SCROLL_CANCEL_PX
        ) {
          clearBgHoldTimer();
        }
      }

      const cur = fsmRef.current;
      if (cur.activePointerId !== e.pointerId) return;
      lastPointerClientRef.current = { x: e.clientX, y: e.clientY };

      const dist = distancePx(cur.startX, cur.startY, e.clientX, e.clientY);

      // 1. Touch PRESS_PENDING -> cancel immediately if > 8px (native scroll wins!)
      if (cur.mode === "PRESS_PENDING") {
        if (dist > GESTURE_THRESHOLDS.SCROLL_CANCEL_PX) {
          clearHoldTimers();
          setFsmSync((s) =>
            transitionGestureFsm(s, {
              type: "POINTER_MOVE",
              pointerId: e.pointerId,
              x: e.clientX,
              y: e.clientY,
            }),
          );
        }
        return;
      }

      // 2. DRAG_READY -> DRAGGING once moved > 8px after hold (or on already-selected card)
      if (
        cur.dragReady &&
        cur.mode === "SELECTED" &&
        cur.activeNodeId &&
        dist > GESTURE_THRESHOLDS.DRAG_START_PX
      ) {
        dragOriginSnapshotRef.current = present;
        setFsmSync((s) =>
          transitionGestureFsm(s, {
            type: "POINTER_MOVE",
            pointerId: e.pointerId,
            x: e.clientX,
            y: e.clientY,
          }),
        );
        setDragOffset({ x: e.clientX - cur.startX, y: e.clientY - cur.startY });
        return;
      }

      // 4. Active DRAGGING: update GPU offset + live closest-center reorder
      if (cur.mode === "DRAGGING" && cur.activeNodeId) {
        if (!dragOriginSnapshotRef.current) {
          dragOriginSnapshotRef.current = present;
        }
        setDragOffset({ x: e.clientX - cur.startX, y: e.clientY - cur.startY });

        // Bounding-box center hit-testing against sibling cards (never triggers sibling selection!)
        let swapTargetId: string | null = null;
        for (const [otherId, el] of cardElsRef.current.entries()) {
          if (otherId === cur.activeNodeId) continue;
          const r = el.getBoundingClientRect();
          if (
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom
          ) {
            swapTargetId = otherId;
            break;
          }
        }

        if (swapTargetId) {
          setPresent((snap) => {
            const fromIdx = snap.nodes.findIndex(
              (n) => n.id === cur.activeNodeId,
            );
            const toIdx = snap.nodes.findIndex((n) => n.id === swapTargetId);
            if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return snap;
            const reordered = [...snap.nodes];
            const [moved] = reordered.splice(fromIdx, 1);
            reordered.splice(toIdx, 0, moved);
            vibrate(6);
            // Reset drag start to current pointer so offset stays smooth after slot swap
            setFsmSync((s) => ({ ...s, startX: e.clientX, startY: e.clientY }));
            setDragOffset({ x: 0, y: 0 });
            return { ...snap, nodes: reordered };
          });
        }
        return;
      }

      // 5. Active RESIZING: 4-Corner Magnetic Snap
      if (
        cur.mode === "RESIZING" &&
        cur.activeNodeId &&
        cur.resizeCorner &&
        resizeStartGeoRef.current
      ) {
        const gridEl = gridRef.current;
        const gridRect = gridEl?.getBoundingClientRect();
        const colW = gridRect ? gridRect.width / gridColumns : 140;
        const snapped = snapCornerResize({
          corner: cur.resizeCorner,
          startColSpan: resizeStartGeoRef.current.colSpan,
          startRowSpan: resizeStartGeoRef.current.rowSpan,
          dx: e.clientX - cur.startX,
          dy: e.clientY - cur.startY,
          colWidthPx: colW,
          rowHeightPx: 108,
          gridColumns,
        });

        setResizePreview((prev) => {
          if (
            !prev ||
            prev.colSpan !== snapped.colSpan ||
            prev.rowSpan !== snapped.rowSpan
          ) {
            vibrate(8);
            return snapped;
          }
          return prev;
        });
      }
    }

    function onWindowPointerUp(e: PointerEvent) {
      clearBgHoldTimer();
      const cur = fsmRef.current;
      if (cur.activePointerId !== e.pointerId) return;
      clearHoldTimers();

      const now = Date.now();

      // Commit drag reorder history if order changed
      if (cur.mode === "DRAGGING" && dragOriginSnapshotRef.current) {
        const originSnap = dragOriginSnapshotRef.current;
        dragOriginSnapshotRef.current = null;
        setDragOffset(null);
        setPresent((finalSnap) => {
          const changed = finalSnap.nodes.some(
            (n, i) => originSnap.nodes[i]?.id !== n.id,
          );
          if (changed) {
            setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), originSnap]);
            setFuture([]);
            setSaveState("saving");
          }
          return finalSnap;
        });
      }

      // Commit 4-corner resize span to history
      if (cur.mode === "RESIZING" && cur.activeNodeId && resizePreview) {
        const nodeId = cur.activeNodeId;
        const targetSpan = resizePreview;
        setResizePreview(null);
        resizeStartGeoRef.current = null;
        commitChange((snap) => ({
          ...snap,
          nodes: snap.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  layout: {
                    ...n.layout,
                    [viewport]: {
                      ...n.layout[viewport],
                      colSpan: targetSpan.colSpan,
                      rowSpan: targetSpan.rowSpan,
                    },
                  },
                }
              : n,
          ),
        }));
      } else {
        setResizePreview(null);
        resizeStartGeoRef.current = null;
      }

      setDragOffset(null);
      setFsmSync((s) =>
        transitionGestureFsm(s, {
          type: "POINTER_UP",
          pointerId: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          now,
        }),
      );
    }

    function onWindowPointerCancel(e: PointerEvent) {
      clearBgHoldTimer();
      const cur = fsmRef.current;
      if (cur.activePointerId !== e.pointerId) return;
      clearHoldTimers();
      dragOriginSnapshotRef.current = null;
      resizeStartGeoRef.current = null;
      setDragOffset(null);
      setResizePreview(null);
      setFsmSync((s) =>
        transitionGestureFsm(s, {
          type: "POINTER_CANCEL",
          pointerId: e.pointerId,
          now: Date.now(),
        }),
      );
    }

    window.addEventListener("pointermove", onWindowPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerCancel);
    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerCancel);
    };
  }, [
    clearBgHoldTimer,
    clearHoldTimers,
    commitChange,
    gridColumns,
    present,
    resizePreview,
    setFsmSync,
    viewport,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Mural Mutation Actions                                                   */
  /* ------------------------------------------------------------------------ */
  const handleUpdateSettings = useCallback(
    (patch: Partial<MuralSettings>) => {
      commitChange((cur) => ({
        ...cur,
        settings: { ...cur.settings, ...patch },
      }));
    },
    [commitChange],
  );

  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const preset = EDITOR_THEME_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      commitChange((cur) => ({
        ...cur,
        settings: {
          ...cur.settings,
          themeId: preset.id,
          styleKey: preset.styleKey,
          bgType: preset.bgType,
          bgId: preset.bgId,
          customBgHex: preset.customBgHex,
          customAccentHex: preset.customAccentHex,
          cardStyle: preset.cardStyle,
        },
      }));
    },
    [commitChange],
  );

  const handleAddWidgetFromSpec = useCallback(
    (spec: WidgetTemplateSpec) => {
      const newId = `temp-${crypto.randomUUID()}`;
      const newItem: WidgetItem = {
        id: `${newId}:0`,
        type: spec.type,
        title: spec.defaultTitle,
        subtitle: spec.defaultSubtitle,
        url: spec.defaultUrl,
        icon: spec.defaultIcon,
        colorId: spec.defaultColor,
      };
      const newNode: CanvasNode = {
        id: newId,
        kind: "single",
        activeStackIndex: 0,
        items: [newItem],
        layout: {
          mobile: {
            colSpan: spec.defaultMobileSpan.colSpan,
            rowSpan: spec.defaultMobileSpan.rowSpan,
            order: present.nodes.length,
          },
          desktop: {
            colSpan: spec.defaultMobileSpan.colSpan === 1 ? 1 : 2,
            rowSpan: spec.defaultMobileSpan.rowSpan,
            order: present.nodes.length,
          },
        },
      };
      commitChange((cur) => ({
        ...cur,
        nodes: [...cur.nodes, newNode],
      }));
      setActivePanel(null);
      setFsmSync({
        ...INITIAL_GESTURE_STATE,
        mode: "SELECTED",
        activeNodeId: newId,
      });
    },
    [commitChange, present.nodes.length, setFsmSync],
  );

  const handleUpdateNodeItem = useCallback(
    (nodeId: string, itemIndex: number, patch: Partial<WidgetItem>) => {
      commitChange((cur) => ({
        ...cur,
        nodes: cur.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          const nextItems = n.items.map((it, idx) =>
            idx === itemIndex ? { ...it, ...patch } : it,
          );
          return { ...n, items: nextItems };
        }),
      }));
    },
    [commitChange],
  );

  const handleResizeSelected = useCallback(
    (nodeId: string, span: Pick<BlockGeometry, "colSpan" | "rowSpan">) => {
      commitChange((cur) => ({
        ...cur,
        nodes: cur.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                layout: {
                  ...n.layout,
                  [viewport]: { ...n.layout[viewport], ...span },
                },
              }
            : n,
        ),
      }));
    },
    [commitChange, viewport],
  );

  const handleToggleFeatured = useCallback(
    (nodeId: string) => {
      commitChange((cur) => {
        const target = cur.nodes.find((n) => n.id === nodeId);
        const nextVal = !target?.featured;
        return {
          ...cur,
          nodes: cur.nodes.map((n) => ({
            ...n,
            featured: n.id === nodeId ? nextVal : false,
          })),
        };
      });
    },
    [commitChange],
  );

  const handleCycleStackItem = useCallback((nodeId: string, nextIdx: number) => {
    setPresent((cur) => ({
      ...cur,
      nodes: cur.nodes.map((n) =>
        n.id === nodeId ? { ...n, activeStackIndex: nextIdx } : n,
      ),
    }));
  }, []);

  const handleMergeNodeIntoStack = useCallback(
    (targetNodeId: string, sourceNodeId: string) => {
      commitChange((cur) => {
        const target = cur.nodes.find((n) => n.id === targetNodeId);
        const source = cur.nodes.find((n) => n.id === sourceNodeId);
        if (!target || !source) return cur;
        const mergedItems = [...target.items, ...source.items];
        return {
          ...cur,
          nodes: cur.nodes
            .filter((n) => n.id !== sourceNodeId)
            .map((n) =>
              n.id === targetNodeId
                ? {
                    ...n,
                    kind: "stack",
                    items: mergedItems,
                    activeStackIndex: mergedItems.length - 1,
                  }
                : n,
            ),
        };
      });
    },
    [commitChange],
  );

  const handleAddNewItemToStack = useCallback(
    (nodeId: string, spec: WidgetTemplateSpec) => {
      commitChange((cur) => ({
        ...cur,
        nodes: cur.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          const nextItem: WidgetItem = {
            id: `stack-${crypto.randomUUID()}`,
            type: spec.type,
            title: spec.defaultTitle,
            subtitle: spec.defaultSubtitle,
            url: spec.defaultUrl,
            icon: spec.defaultIcon,
            colorId: spec.defaultColor,
          };
          const nextItems = [...n.items, nextItem];
          return {
            ...n,
            kind: "stack",
            items: nextItems,
            activeStackIndex: nextItems.length - 1,
          };
        }),
      }));
    },
    [commitChange],
  );

  const handleReorderStackItem = useCallback(
    (nodeId: string, itemIndex: number, direction: -1 | 1) => {
      commitChange((cur) => ({
        ...cur,
        nodes: cur.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          const nextIdx = itemIndex + direction;
          if (nextIdx < 0 || nextIdx >= n.items.length) return n;
          const items = [...n.items];
          const [moved] = items.splice(itemIndex, 1);
          items.splice(nextIdx, 0, moved);
          return { ...n, items, activeStackIndex: nextIdx };
        }),
      }));
    },
    [commitChange],
  );

  const handleRemoveStackItem = useCallback(
    (nodeId: string, itemIndex: number) => {
      commitChange((cur) => ({
        ...cur,
        nodes: cur.nodes.map((n) => {
          if (n.id !== nodeId || n.items.length <= 1) return n;
          const items = n.items.filter((_, i) => i !== itemIndex);
          return {
            ...n,
            kind: items.length > 1 ? "stack" : "single",
            items,
            activeStackIndex: Math.min(n.activeStackIndex, items.length - 1),
          };
        }),
      }));
    },
    [commitChange],
  );

  const handleUnstackNode = useCallback(
    (nodeId: string) => {
      commitChange((cur) => {
        const idx = cur.nodes.findIndex((n) => n.id === nodeId);
        if (idx < 0) return cur;
        const target = cur.nodes[idx];
        if (target.items.length <= 1) return cur;
        const expanded: CanvasNode[] = target.items.map((it, i) => ({
          id: i === 0 ? target.id : `temp-${crypto.randomUUID()}`,
          kind: "single",
          activeStackIndex: 0,
          featured: i === 0 ? target.featured : false,
          items: [it],
          layout: {
            mobile: { ...target.layout.mobile },
            desktop: { ...target.layout.desktop },
          },
        }));
        const nextNodes = [...cur.nodes];
        nextNodes.splice(idx, 1, ...expanded);
        return { ...cur, nodes: nextNodes };
      });
    },
    [commitChange],
  );

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    await triggerSaveNow(present);
    const res = await publishMuralFromEditorAction(initialDoc.id);
    setPublishing(false);
    if (res.ok) {
      setPublished(true);
    } else {
      setSaveState("error");
      setSaveError(res.error);
    }
  }, [initialDoc.id, present, triggerSaveNow]);

  const handlePickMediaFile = useCallback(
    (kind: "logo" | "cover", file: File | undefined) => {
      if (!file) return;
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        setSaveError("Envie uma imagem PNG, JPG ou WEBP.");
        return;
      }
      setCropState({ file, kind });
    },
    [],
  );

  const handleConfirmCroppedMedia = useCallback(
    async (kind: "logo" | "cover", result: CroppedImageResult) => {
      setCropState(null);
      if (result.blob.size > MAX_UPLOAD_BYTES) {
        setSaveError("A imagem ficou acima de 2 MB.");
        return;
      }
      setUploadingMedia(kind);
      setSaveError(null);
      try {
        const path = `${ownerId}/${initialDoc.id}-${kind}-${Date.now()}.${result.ext}`;
        const supabase = createClient();
        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(path, result.blob, {
            contentType: result.contentType,
            upsert: true,
          });
        if (upErr) {
          setSaveError(
            kind === "logo"
              ? "Não foi possível enviar o logo agora."
              : "Não foi possível enviar a capa agora.",
          );
          return;
        }
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        commitChange((cur) => ({
          ...cur,
          header:
            kind === "logo"
              ? {
                  ...cur.header,
                  avatarPath: path,
                  avatarUrl: data.publicUrl,
                }
              : {
                  ...cur.header,
                  coverPath: path,
                  coverUrl: data.publicUrl,
                },
        }));
      } catch {
        setSaveError("Erro ao processar a imagem selecionada.");
      } finally {
        setUploadingMedia(null);
      }
    },
    [ownerId, initialDoc.id, commitChange],
  );

  /* ------------------------------------------------------------------------ */
  /* Resolved Theme & Canvas Background                                       */
  /* ------------------------------------------------------------------------ */
  const resolvedTheme = useMemo(
    () => resolveEditorTheme(present.settings, plan),
    [present.settings, plan],
  );
  const font = publicFont(resolvedTheme.font);
  const isZoomOut = fsm.mode === "ZOOM_OUT";

  const gridColsCss =
    gridColumns === 6
      ? "grid-cols-6"
      : gridColumns === 4
        ? "grid-cols-4"
        : "grid-cols-2";

  return (
    <div
      className="relative flex h-dvh w-screen flex-col overflow-hidden bg-[#0E0E0E] text-white select-none"
      style={{ WebkitTouchCallout: "none" }}
    >
      {/* Minimal Isolated Top Bar (Spec §1.4 & §9) */}
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/12 bg-[#0E0E0E]/95 px-3 backdrop-blur-xl sm:px-5">
        {/* Left: Back to Panel + Auto-save Status + Undo/Redo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <Link
            href="/app"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-small font-semibold text-white/90 no-underline transition-colors hover:bg-white/10"
          >
            <svg
              viewBox="0 0 24 24"
              width={17}
              height={17}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.1}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">Painel</span>
          </Link>

          {/* Undo / Redo */}
          <div className="flex items-center">
            <button
              type="button"
              disabled={past.length === 0}
              onClick={handleUndo}
              aria-label="Desfazer (Ctrl+Z)"
              title="Desfazer (Ctrl+Z)"
              className="grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                viewBox="0 0 24 24"
                width={17}
                height={17}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
            </button>
            <button
              type="button"
              disabled={future.length === 0}
              onClick={handleRedo}
              aria-label="Refazer (Ctrl+Shift+Z)"
              title="Refazer (Ctrl+Shift+Z)"
              className="grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                viewBox="0 0 24 24"
                width={17}
                height={17}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m15 14 5-5-5-5" />
                <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
              </svg>
            </button>
          </div>

          {/* Auto-save indicator */}
          <span
            aria-live="polite"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/70"
          >
            <span
              className={`size-1.5 rounded-full ${
                saveState === "saving"
                  ? "animate-pulse bg-[#CDF54A]"
                  : saveState === "error"
                    ? "bg-[#FF6B6B]"
                    : "bg-[#4ADE80]"
              }`}
            />
            <span>
              {saveState === "saving"
                ? "Salvando..."
                : saveState === "error"
                  ? "Erro ao salvar"
                  : "Salvo"}
            </span>
          </span>
        </div>

        {/* Center (Desktop only): Viewport Switcher */}
        <div
          role="group"
          aria-label="Alternar janela de edição"
          className="hidden items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] p-1 md:inline-flex"
        >
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            aria-pressed={viewport === "mobile"}
            className={`min-h-8 cursor-pointer rounded-full border-0 px-3 text-caption font-semibold transition-all ${
              viewport === "mobile"
                ? "bg-[#CDF54A] text-[#0E0E0E]"
                : "bg-transparent text-white/70 hover:text-white"
            }`}
          >
            Celular 390px
          </button>
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            aria-pressed={viewport === "desktop"}
            className={`min-h-8 cursor-pointer rounded-full border-0 px-3 text-caption font-semibold transition-all ${
              viewport === "desktop"
                ? "bg-[#CDF54A] text-[#0E0E0E]"
                : "bg-transparent text-white/70 hover:text-white"
            }`}
          >
            Desktop
          </button>
        </div>

        {/* Right: Overview (Zoom Out) + Preview / Publish */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setFsmSync((cur) =>
                transitionGestureFsm(cur, {
                  type: cur.mode === "ZOOM_OUT" ? "EXIT_ZOOM_OUT" : "ENTER_ZOOM_OUT",
                }),
              )
            }
            aria-pressed={isZoomOut}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-caption font-semibold transition-all ${
              isZoomOut
                ? "border-[#CDF54A] bg-[#CDF54A]/15 text-[#CDF54A]"
                : "border-white/14 bg-white/[0.05] text-white/85 hover:bg-white/10"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width={15}
              height={15}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            <span className="hidden sm:inline">Visão geral</span>
          </button>

          {!published ? (
            <button
              type="button"
              disabled={publishing}
              onClick={handlePublish}
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-[#CDF54A] px-4 text-small font-bold text-[#0E0E0E] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? "Publicando..." : "Publicar"}
            </button>
          ) : (
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#CDF54A] px-4 text-small font-bold text-[#0E0E0E] no-underline transition-opacity hover:opacity-90"
            >
              <span>Ver página</span>
              <svg
                viewBox="0 0 24 24"
                width={14}
                height={14}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          )}
        </div>
      </header>

      {/* Save Error Banner */}
      {saveError && (
        <div
          role="alert"
          className="z-30 flex items-center justify-between gap-3 bg-[#C42B30] px-4 py-2 text-caption font-medium text-white"
        >
          <span>{saveError}</span>
          <button
            type="button"
            onClick={() => void triggerSaveNow(present)}
            className="cursor-pointer rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-bold text-white"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Main Scrollable Viewport Stage (Sacred Native pan-y on Mobile!) */}
      <div
        ref={scrollContainerRef}
        style={{ touchAction: "pan-y" }}
        onDoubleClick={(e) => {
          if (e.target === e.currentTarget) {
            setFsmSync((cur) =>
              transitionGestureFsm(cur, {
                type:
                  cur.mode === "ZOOM_OUT" ? "EXIT_ZOOM_OUT" : "ENTER_ZOOM_OUT",
              }),
            );
          }
        }}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (!target.dataset.canvasBg) return;
          const now = Date.now();
          setFsmSync((cur) =>
            transitionGestureFsm(cur, { type: "CANVAS_BACKGROUND_TAP", now }),
          );
          if (activePanel === "widget-edit" || activePanel === "stack") {
            setActivePanel(null);
          }

          // 500ms hold on empty canvas enters Overview (ZOOM_OUT) mode (Spec §2.2 & §3 State E)
          clearBgHoldTimer();
          bgDownPosRef.current = {
            x: e.clientX,
            y: e.clientY,
            pointerId: e.pointerId,
          };
          bgHoldTimerRef.current = setTimeout(() => {
            vibrate(14);
            setFsmSync((cur) =>
              transitionGestureFsm(cur, { type: "ENTER_ZOOM_OUT" }),
            );
          }, GESTURE_TIMINGS.BACKGROUND_ZOOM_OUT_MS);
        }}
        className="relative flex-1 overflow-x-hidden overflow-y-auto"
      >
        <div
          data-canvas-bg="true"
          className="flex min-h-full w-full flex-col items-center justify-start px-0 pb-36 md:px-6 md:py-8 md:pb-36"
        >
          {/* Mural WYSIWYG Canvas Frame */}
          <div
            data-canvas-bg="true"
            style={{
              ...(resolvedTheme.vars as CSSProperties),
              fontFamily: font.family,
              background: resolvedTheme.bgCss,
              transform: isZoomOut ? "scale(0.84)" : "scale(1)",
              transformOrigin: "top center",
            }}
            className={`${font.className} relative w-full text-(--ink) antialiased transition-all duration-300 ease-out ${
              viewport === "mobile"
                ? "max-w-full md:max-w-[412px] md:rounded-[34px] md:border md:border-white/15 md:shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
                : "max-w-[780px] rounded-[30px] border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
            } ${
              isZoomOut
                ? "mt-4 rounded-[32px] border border-white/25 shadow-[0_32px_80px_rgba(0,0,0,0.75)] ring-2 ring-[#CDF54A]/40"
                : "min-h-[calc(100dvh-56px)] md:min-h-[720px]"
            }`}
          >
            {/* Cover + Discreet Cover Edit Button */}
            <div
              data-canvas-bg="true"
              className="group/cover relative h-32 w-full overflow-hidden rounded-t-[inherit] bg-(--accent)"
              style={{
                backgroundImage: present.header.coverUrl
                  ? undefined
                  : "radial-gradient(circle at 85% 20%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.22))",
              }}
            >
              {present.header.coverUrl && (
                <img
                  src={present.header.coverUrl}
                  alt={present.header.businessName}
                  className="pointer-events-none absolute inset-0 size-full object-cover"
                />
              )}

              <button
                type="button"
                disabled={uploadingMedia === "cover"}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  coverInputRef.current?.click();
                }}
                aria-label="Alterar imagem de capa"
                className="absolute top-3 right-3 z-10 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 text-[11px] font-semibold text-white/90 backdrop-blur-md transition-all hover:bg-black/70 hover:text-white disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>
                  {uploadingMedia === "cover" ? "Enviando..." : "Capa"}
                </span>
              </button>
            </div>

            <div
              data-canvas-bg="true"
              className="flex flex-col gap-4 px-5 pb-12 sm:px-6"
            >
              {/* Identity Header: Avatar + Discreet Logo Button + Editable Name */}
              <div
                data-canvas-bg="true"
                className={`flex flex-col gap-2 ${
                  resolvedTheme.headerAlign === "center"
                    ? "items-center text-center"
                    : "items-start text-left"
                }`}
              >
                <div
                  style={{
                    width: resolvedTheme.logoPx,
                    height: resolvedTheme.logoPx,
                    marginTop: -Math.round(resolvedTheme.logoPx * 0.45),
                  }}
                  className="relative z-1 shrink-0"
                >
                  <div className="grid size-full place-items-center overflow-hidden rounded-(--r-logo) border-4 border-(--bg) bg-(--surface) font-bold text-(--ink) shadow-sm">
                    {present.header.avatarUrl ? (
                      <img
                        src={present.header.avatarUrl}
                        alt={present.header.businessName}
                        className="pointer-events-none size-full object-cover"
                      />
                    ) : (
                      <span>{initialsFrom(present.header.businessName)}</span>
                    )}
                  </div>

                  {/* Discreet Logo Change Badge */}
                  <button
                    type="button"
                    disabled={uploadingMedia === "logo"}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      logoInputRef.current?.click();
                    }}
                    aria-label="Alterar logo"
                    title="Alterar logo"
                    className="absolute -right-2 -bottom-2 grid size-9 cursor-pointer place-items-center rounded-full border-2 border-(--bg) bg-[#141416]/90 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-[#0E0E0E] hover:text-[#CDF54A] disabled:opacity-50"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width={14}
                      height={14}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                </div>

                {/* Hidden file inputs for Logo and Cover */}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    handlePickMediaFile("logo", file);
                  }}
                />
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    handlePickMediaFile("cover", file);
                  }}
                />

                {/* Name + Discreet Edit Button below Avatar */}
                {editingIdentity ? (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="mt-1 flex w-full max-w-sm flex-col gap-2 rounded-2xl border border-white/15 bg-[#141416]/95 p-3 text-left text-white shadow-xl backdrop-blur-xl"
                  >
                    <label className="flex flex-col gap-1 text-[11px] font-semibold text-white/70">
                      Nome no mural
                      <input
                        type="text"
                        autoFocus
                        maxLength={60}
                        value={present.header.businessName}
                        onChange={(e) =>
                          commitChange((cur) => ({
                            ...cur,
                            header: {
                              ...cur.header,
                              businessName: e.target.value,
                            },
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setEditingIdentity(false);
                        }}
                        className="min-h-10 rounded-xl border border-white/15 bg-white/8 px-3 text-small font-semibold text-white focus:border-[#CDF54A] focus:outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-[11px] font-semibold text-white/70">
                      Descrição curta (opcional)
                      <input
                        type="text"
                        maxLength={160}
                        value={present.header.bio ?? ""}
                        onChange={(e) =>
                          commitChange((cur) => ({
                            ...cur,
                            header: {
                              ...cur.header,
                              bio: e.target.value,
                            },
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setEditingIdentity(false);
                        }}
                        placeholder="Ex.: Atendimento e links oficiais"
                        className="min-h-10 rounded-xl border border-white/15 bg-white/8 px-3 text-caption text-white placeholder:text-white/35 focus:border-[#CDF54A] focus:outline-none"
                      />
                    </label>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingIdentity(false)}
                        className="min-h-9 cursor-pointer rounded-full border-0 bg-[#CDF54A] px-4 text-caption font-bold text-[#0E0E0E]"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div
                      className={`flex flex-wrap items-center gap-2 ${
                        resolvedTheme.headerAlign === "center"
                          ? "justify-center"
                          : "justify-start"
                      }`}
                    >
                      <h1 className="m-0 text-[23px] leading-tight font-bold tracking-[-0.02em]">
                        {present.header.businessName || initialDoc.slug}
                      </h1>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingIdentity(true);
                        }}
                        aria-label="Editar nome e descrição"
                        className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-(--line) bg-(--soft) px-2.5 py-1 text-[11px] font-semibold text-(--muted) transition-colors hover:text-(--ink)"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width={12}
                          height={12}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />
                        </svg>
                        <span>Editar</span>
                      </button>
                    </div>

                    {present.header.bio && (
                      <p className="m-0 max-w-md text-[14px] leading-normal text-(--muted)">
                        {present.header.bio}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Interactive Bento Widget Grid */}
              {present.nodes.length === 0 ? (
                <div
                  data-canvas-bg="true"
                  className="mt-4 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-(--line) px-6 py-12 text-center"
                >
                  <p className="m-0 text-body font-semibold text-(--ink)">
                    Seu mural está pronto para receber links
                  </p>
                  <p className="m-0 text-small text-(--muted)">
                    Toque em Link na barra inferior para adicionar botões,
                    vídeos, mapas ou notas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActivePanel("widgets")}
                    className="mt-1 min-h-11 cursor-pointer rounded-full border-0 bg-[#CDF54A] px-5 text-small font-bold text-[#0E0E0E]"
                  >
                    + Adicionar link
                  </button>
                </div>
              ) : (
                <div
                  ref={gridRef}
                  data-canvas-bg="true"
                  className={`grid grid-flow-dense gap-(--card-gap) pt-2 ${gridColsCss}`}
                >
                  {present.nodes.map((node) => {
                    const isSelected =
                      (fsm.mode === "SELECTED" ||
                        fsm.mode === "RESIZING" ||
                        fsm.mode === "DRAGGING") &&
                      fsm.activeNodeId === node.id;
                    const isPreLock =
                      fsm.mode === "PRESS_PENDING" &&
                      fsm.preLockVisual &&
                      fsm.pendingNodeId === node.id;
                    const isDragging =
                      fsm.mode === "DRAGGING" && fsm.activeNodeId === node.id;

                    return (
                      <EditorWidgetCard
                        key={node.id}
                        node={node}
                        geometry={node.layout[viewport]}
                        gridCols={gridColumns}
                        theme={resolvedTheme}
                        showIconLabels={present.settings.labels.showIconLabels}
                        showSubtitles={present.settings.labels.showSubtitles}
                        isSelected={isSelected}
                        isPreLock={isPreLock}
                        isDragging={isDragging}
                        dragOffset={isDragging ? dragOffset : null}
                        resizePreview={
                          fsm.mode === "RESIZING" && fsm.activeNodeId === node.id
                            ? resizePreview
                            : null
                        }
                        stackPickMode={activePanel === "stack"}
                        onCardPointerDown={handleCardPointerDown}
                        onCornerPointerDown={handleCornerPointerDown}
                        onCycleStackItem={handleCycleStackItem}
                        registerCardElement={registerCardElement}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Overview Indicator Pill when in ZOOM_OUT (One UI Screenshot 2) */}
          {isZoomOut && (
            <div className="-mt-6 mb-4 flex items-center gap-2 rounded-full border border-white/15 bg-[#141416]/90 px-4 py-1.5 text-caption font-semibold text-white/85 backdrop-blur-md">
              <span className="size-2 rounded-full bg-[#CDF54A]" />
              <span>Modo Visão geral · Toque no mural para voltar</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Contextual Popover for Selected Widget (One UI Screenshot 1) */}
      {fsm.mode === "SELECTED" && selectedNode && !activePanel && (
        <FloatingWidgetPopover
          node={selectedNode}
          anchorRect={popoverRect}
          onStackAction={() => setActivePanel("stack")}
          onRemove={() => handleRemoveNode(selectedNode.id)}
          onOpenSettings={() => setActivePanel("widget-edit")}
          onToggleFeatured={() => handleToggleFeatured(selectedNode.id)}
        />
      )}

      {/* 4-Second Undo Toast after Widget Removal */}
      {undoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-24 z-50 mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-full border border-white/15 bg-[#1A1A1D]/96 px-4 py-2.5 text-small text-white shadow-2xl backdrop-blur-xl animate-pop-in"
        >
          <span className="truncate">{undoToast}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="shrink-0 cursor-pointer rounded-full border-0 bg-[#CDF54A] px-3 py-1 text-caption font-bold text-[#0E0E0E]"
          >
            Desfazer
          </button>
        </div>
      )}

      {/* Bottom Dock: 4 Global Customization Pillars */}
      <EditorBottomDock
        activePanel={activePanel}
        isZoomOut={isZoomOut}
        onSelectPanel={(panel) => setActivePanel(panel)}
      />

      {/* Slide-Up / Right-Hand Configuration Drawers */}
      <EditorDrawers
        activePanel={activePanel}
        settings={present.settings}
        viewport={viewport}
        selectedNode={selectedNode}
        allNodes={present.nodes}
        onClose={() => setActivePanel(null)}
        onUpdateSettings={handleUpdateSettings}
        onApplyPreset={handleApplyPreset}
        onAddWidgetFromSpec={handleAddWidgetFromSpec}
        onUpdateNodeItem={handleUpdateNodeItem}
        onResizeSelected={handleResizeSelected}
        onMergeNodeIntoStack={handleMergeNodeIntoStack}
        onAddNewItemToStack={handleAddNewItemToStack}
        onReorderStackItem={handleReorderStackItem}
        onRemoveStackItem={handleRemoveStackItem}
        onUnstackNode={handleUnstackNode}
      />
      {/* Image Crop Modal for Logo & Cover */}
      <ImageCropModal
        file={cropState?.file ?? null}
        onClose={() => setCropState(null)}
        aspectRatio={cropState?.kind === "cover" ? 2.6 : 1}
        maxWidth={cropState?.kind === "cover" ? 1280 : 512}
        circularGuide={cropState?.kind === "logo"}
        title={
          cropState?.kind === "cover"
            ? "Ajustar imagem de capa"
            : "Ajustar logo do mural"
        }
        onConfirm={(res) => {
          if (cropState) void handleConfirmCroppedMedia(cropState.kind, res);
        }}
      />
    </div>
  );
}
