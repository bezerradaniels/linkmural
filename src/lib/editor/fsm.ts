import type { InteractionMode } from "./types";

/** Mandatory Gesture Timing & Displacement Constants */
export const GESTURE_TIMINGS = {
  /** Deliberate hold duration required to confirm card selection (ms) */
  LONG_PRESS_MS: 380,
  /** Tactile press-in visual feedback start time (ms) */
  PRE_LOCK_FEEDBACK_MS: 70,
  /** Hold on empty canvas to enter ZOOM_OUT overview */
  BACKGROUND_ZOOM_OUT_MS: 500,
  /** Post-interaction cooldown to block synthetic clicks on neighbors */
  POST_INTERACTION_COOLDOWN_MS: 120,
} as const;

export const GESTURE_THRESHOLDS = {
  /** Movement > 8px during PRESS_PENDING cancels hold and yields to native scroll */
  SCROLL_CANCEL_PX: 8,
  /** Pointer displacement from DRAG_READY to start DRAGGING */
  DRAG_START_PX: 8,
} as const;

export type CornerDirection = "nw" | "ne" | "sw" | "se";

export interface GestureFsmState {
  mode: InteractionMode;
  /** Currently confirmed selected node */
  activeNodeId: string | null;
  /** Candidate node being held during PRESS_PENDING */
  pendingNodeId: string | null;
  activePointerId: number | null;
  pointerType: "touch" | "mouse" | "pen" | null;
  dragReady: boolean;
  preLockVisual: boolean;
  resizeCorner: CornerDirection | null;
  startX: number;
  startY: number;
  startTime: number;
  cooldownUntil: number;
}

export const INITIAL_GESTURE_STATE: GestureFsmState = {
  mode: "IDLE",
  activeNodeId: null,
  pendingNodeId: null,
  activePointerId: null,
  pointerType: null,
  dragReady: false,
  preLockVisual: false,
  resizeCorner: null,
  startX: 0,
  startY: 0,
  startTime: 0,
  cooldownUntil: 0,
};

export type GestureFsmEvent =
  | {
      type: "CARD_POINTER_DOWN";
      nodeId: string;
      pointerId: number;
      pointerType: "touch" | "mouse" | "pen";
      x: number;
      y: number;
      now: number;
    }
  | {
      type: "CORNER_POINTER_DOWN";
      nodeId: string;
      corner: CornerDirection;
      pointerId: number;
      pointerType: "touch" | "mouse" | "pen";
      x: number;
      y: number;
      now: number;
    }
  | {
      type: "PRE_LOCK_TIMER";
      pointerId: number;
    }
  | {
      type: "LONG_PRESS_TIMER";
      pointerId: number;
    }
  | {
      type: "POINTER_MOVE";
      pointerId: number;
      x: number;
      y: number;
    }
  | {
      type: "POINTER_UP";
      pointerId: number;
      x: number;
      y: number;
      now: number;
    }
  | {
      type: "POINTER_CANCEL";
      pointerId: number;
      now: number;
    }
  | {
      type: "CANVAS_BACKGROUND_TAP";
      now: number;
    }
  | {
      type: "ENTER_ZOOM_OUT";
    }
  | {
      type: "EXIT_ZOOM_OUT";
    }
  | {
      type: "SELECT_NODE";
      nodeId: string | null;
    };

export function distancePx(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Pure, deterministic Finite State Machine for all touch & pointer gestures.
 * Guarantees:
 * 1. Quick taps/clicks NEVER select instantaneously; user must hold for LONG_PRESS_MS (380ms).
 * 2. Vertical scroll (>8px before 380ms) immediately aborts hold and yields to native scroll.
 * 3. Single-Active-Pointer Mutex blocks multi-touch / sibling card triggers.
 * 4. 120ms post-drop/resize cooldown suppresses synthetic click misfires.
 */
export function transitionGestureFsm(
  state: GestureFsmState,
  event: GestureFsmEvent,
): GestureFsmState {
  switch (event.type) {
    case "ENTER_ZOOM_OUT":
      return {
        ...INITIAL_GESTURE_STATE,
        mode: "ZOOM_OUT",
        cooldownUntil: state.cooldownUntil,
      };

    case "EXIT_ZOOM_OUT":
      return {
        ...INITIAL_GESTURE_STATE,
        mode: "IDLE",
        cooldownUntil: state.cooldownUntil,
      };

    case "SELECT_NODE":
      return {
        ...INITIAL_GESTURE_STATE,
        mode: event.nodeId ? "SELECTED" : "IDLE",
        activeNodeId: event.nodeId,
        cooldownUntil: state.cooldownUntil,
      };

    case "CANVAS_BACKGROUND_TAP": {
      if (event.now < state.cooldownUntil) return state;
      if (state.mode === "DRAGGING" || state.mode === "RESIZING") return state;
      if (state.mode === "ZOOM_OUT" || state.mode === "SELECTED") {
        return { ...INITIAL_GESTURE_STATE, mode: "IDLE" };
      }
      return state;
    }

    case "CORNER_POINTER_DOWN": {
      if (event.now < state.cooldownUntil) return state;
      if (
        (state.mode === "DRAGGING" || state.mode === "RESIZING") &&
        state.activePointerId !== null &&
        state.activePointerId !== event.pointerId
      ) {
        return state;
      }
      return {
        mode: "RESIZING",
        activeNodeId: event.nodeId,
        pendingNodeId: null,
        activePointerId: event.pointerId,
        pointerType: event.pointerType,
        dragReady: false,
        preLockVisual: false,
        resizeCorner: event.corner,
        startX: event.x,
        startY: event.y,
        startTime: event.now,
        cooldownUntil: state.cooldownUntil,
      };
    }

    case "CARD_POINTER_DOWN": {
      if (event.now < state.cooldownUntil) return state;
      if (state.mode === "ZOOM_OUT") return state;

      if (
        state.mode === "DRAGGING" ||
        state.mode === "RESIZING" ||
        (state.activePointerId !== null &&
          state.activePointerId !== event.pointerId)
      ) {
        return state;
      }

      // If this exact card is ALREADY confirmed SELECTED and user grabs it with mouse,
      // allow dragging it directly after >8px without waiting another 380ms.
      if (
        event.pointerType === "mouse" &&
        state.mode === "SELECTED" &&
        state.activeNodeId === event.nodeId
      ) {
        return {
          ...state,
          activePointerId: event.pointerId,
          pointerType: "mouse",
          pendingNodeId: null,
          dragReady: true,
          preLockVisual: false,
          startX: event.x,
          startY: event.y,
          startTime: event.now,
        };
      }

      // All unselected cards (both touch AND mouse) require deliberate press-and-hold!
      return {
        mode: "PRESS_PENDING",
        activeNodeId: state.activeNodeId,
        pendingNodeId: event.nodeId,
        activePointerId: event.pointerId,
        pointerType: event.pointerType,
        dragReady: false,
        preLockVisual: false,
        resizeCorner: null,
        startX: event.x,
        startY: event.y,
        startTime: event.now,
        cooldownUntil: state.cooldownUntil,
      };
    }

    case "PRE_LOCK_TIMER": {
      if (
        state.mode !== "PRESS_PENDING" ||
        state.activePointerId !== event.pointerId
      ) {
        return state;
      }
      return {
        ...state,
        preLockVisual: true,
      };
    }

    case "LONG_PRESS_TIMER": {
      if (
        state.mode !== "PRESS_PENDING" ||
        state.activePointerId !== event.pointerId ||
        !state.pendingNodeId
      ) {
        return state;
      }
      return {
        ...state,
        mode: "SELECTED",
        activeNodeId: state.pendingNodeId,
        pendingNodeId: null,
        dragReady: true,
        preLockVisual: false,
      };
    }

    case "POINTER_MOVE": {
      if (state.activePointerId !== event.pointerId) return state;
      const dist = distancePx(state.startX, state.startY, event.x, event.y);

      if (state.mode === "PRESS_PENDING") {
        if (dist > GESTURE_THRESHOLDS.SCROLL_CANCEL_PX) {
          // Immediately cancel hold and yield to native scroll!
          return {
            ...state,
            mode: "SCROLLING",
            pendingNodeId: null,
            dragReady: false,
            preLockVisual: false,
          };
        }
        return state;
      }

      if (
        state.dragReady &&
        state.mode !== "DRAGGING" &&
        state.mode !== "RESIZING"
      ) {
        if (dist > GESTURE_THRESHOLDS.DRAG_START_PX && state.activeNodeId) {
          return {
            ...state,
            mode: "DRAGGING",
            preLockVisual: false,
          };
        }
      }

      return state;
    }

    case "POINTER_UP": {
      if (state.activePointerId !== event.pointerId) return state;

      if (state.mode === "DRAGGING" || state.mode === "RESIZING") {
        return {
          ...INITIAL_GESTURE_STATE,
          mode: state.activeNodeId ? "SELECTED" : "IDLE",
          activeNodeId: state.activeNodeId,
          cooldownUntil:
            event.now + GESTURE_TIMINGS.POST_INTERACTION_COOLDOWN_MS,
        };
      }

      if (state.mode === "SCROLLING") {
        return {
          ...INITIAL_GESTURE_STATE,
          mode: state.activeNodeId ? "SELECTED" : "IDLE",
          activeNodeId: state.activeNodeId,
          cooldownUntil: state.cooldownUntil,
        };
      }

      if (state.mode === "PRESS_PENDING") {
        // Released BEFORE LONG_PRESS_MS elapsed -> do NOT select instantaneously!
        return {
          ...INITIAL_GESTURE_STATE,
          mode: state.activeNodeId ? "SELECTED" : "IDLE",
          activeNodeId: state.activeNodeId,
          cooldownUntil: state.cooldownUntil,
        };
      }

      // Released right after hold confirmed SELECTED (without dragging) -> stays SELECTED
      return {
        ...state,
        pendingNodeId: null,
        activePointerId: null,
        pointerType: null,
        dragReady: false,
        preLockVisual: false,
      };
    }

    case "POINTER_CANCEL": {
      if (state.activePointerId !== event.pointerId) return state;
      const wasActiveTransform =
        state.mode === "DRAGGING" || state.mode === "RESIZING";
      return {
        ...INITIAL_GESTURE_STATE,
        mode: wasActiveTransform && state.activeNodeId ? "SELECTED" : "IDLE",
        activeNodeId:
          wasActiveTransform && state.activeNodeId ? state.activeNodeId : null,
        cooldownUntil: wasActiveTransform
          ? event.now + GESTURE_TIMINGS.POST_INTERACTION_COOLDOWN_MS
          : state.cooldownUntil,
      };
    }
  }
}

/**
 * Computes snapped grid span (colSpan, rowSpan) when dragging any of the 4 corners.
 */
export function snapCornerResize(params: {
  corner: CornerDirection;
  startColSpan: 1 | 2 | 4;
  startRowSpan: 1 | 2;
  dx: number;
  dy: number;
  colWidthPx: number;
  rowHeightPx: number;
  gridColumns: 2 | 4 | 6;
}): { colSpan: 1 | 2 | 4; rowSpan: 1 | 2 } {
  const {
    corner,
    startColSpan,
    startRowSpan,
    dx,
    dy,
    colWidthPx,
    rowHeightPx,
    gridColumns,
  } = params;

  const signX = corner === "ne" || corner === "se" ? 1 : -1;
  const signY = corner === "sw" || corner === "se" ? 1 : -1;

  const safeColW = Math.max(48, colWidthPx);
  const safeRowH = Math.max(56, rowHeightPx);

  const deltaCols = Math.round((dx * signX) / (safeColW * 0.65));
  const deltaRows = Math.round((dy * signY) / (safeRowH * 0.65));

  const rawCols = Math.max(1, Math.min(gridColumns, startColSpan + deltaCols));
  const rawRows = Math.max(1, Math.min(2, startRowSpan + deltaRows));

  let colSpan: 1 | 2 | 4;
  if (gridColumns === 2) {
    colSpan = rawCols >= 2 ? 2 : 1;
  } else {
    if (rawCols >= 3) colSpan = 4;
    else if (rawCols === 2) colSpan = 2;
    else colSpan = 1;
  }

  const rowSpan: 1 | 2 = rawRows >= 2 ? 2 : 1;
  return { colSpan, rowSpan };
}
