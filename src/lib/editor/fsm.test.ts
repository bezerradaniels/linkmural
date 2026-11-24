import { describe, expect, it } from "vitest";
import {
  GESTURE_TIMINGS,
  INITIAL_GESTURE_STATE,
  snapCornerResize,
  transitionGestureFsm,
} from "./fsm";

describe("Editor Touch & Pointer Gesture FSM", () => {
  it("cancels touch hold and enters SCROLLING when finger moves > 8px before hold completes", () => {
    let s = transitionGestureFsm(INITIAL_GESTURE_STATE, {
      type: "CARD_POINTER_DOWN",
      nodeId: "card-a",
      pointerId: 1,
      pointerType: "touch",
      x: 100,
      y: 200,
      now: 1000,
    });
    expect(s.mode).toBe("PRESS_PENDING");
    expect(s.pendingNodeId).toBe("card-a");
    expect(s.activeNodeId).toBeNull();

    s = transitionGestureFsm(s, {
      type: "POINTER_MOVE",
      pointerId: 1,
      x: 100,
      y: 214,
    });
    expect(s.mode).toBe("SCROLLING");
    expect(s.pendingNodeId).toBeNull();

    s = transitionGestureFsm(s, { type: "LONG_PRESS_TIMER", pointerId: 1 });
    expect(s.mode).toBe("SCROLLING");

    s = transitionGestureFsm(s, {
      type: "POINTER_UP",
      pointerId: 1,
      x: 100,
      y: 260,
      now: 1300,
    });
    expect(s.mode).toBe("IDLE");
    expect(s.activeNodeId).toBeNull();
  });

  it("does NOT select on quick instant click/tap; requires holding until LONG_PRESS_TIMER", () => {
    const downMouse = transitionGestureFsm(INITIAL_GESTURE_STATE, {
      type: "CARD_POINTER_DOWN",
      nodeId: "card-c",
      pointerId: 9,
      pointerType: "mouse",
      x: 80,
      y: 80,
      now: 500,
    });
    expect(downMouse.mode).toBe("PRESS_PENDING");
    expect(downMouse.activeNodeId).toBeNull();

    // Quick release at 110ms -> stays IDLE, no instant selection!
    const quickUp = transitionGestureFsm(downMouse, {
      type: "POINTER_UP",
      pointerId: 9,
      x: 80,
      y: 80,
      now: 610,
    });
    expect(quickUp.mode).toBe("IDLE");
    expect(quickUp.activeNodeId).toBeNull();
  });

  it("activates pre-lock feedback, confirms SELECTED after hold timer, and drags after >8px", () => {
    let s = transitionGestureFsm(INITIAL_GESTURE_STATE, {
      type: "CARD_POINTER_DOWN",
      nodeId: "card-a",
      pointerId: 7,
      pointerType: "touch",
      x: 50,
      y: 50,
      now: 0,
    });

    s = transitionGestureFsm(s, { type: "PRE_LOCK_TIMER", pointerId: 7 });
    expect(s.preLockVisual).toBe(true);

    s = transitionGestureFsm(s, { type: "LONG_PRESS_TIMER", pointerId: 7 });
    expect(s.mode).toBe("SELECTED");
    expect(s.activeNodeId).toBe("card-a");
    expect(s.dragReady).toBe(true);
    expect(s.preLockVisual).toBe(false);

    s = transitionGestureFsm(s, {
      type: "POINTER_MOVE",
      pointerId: 7,
      x: 50,
      y: 65,
    });
    expect(s.mode).toBe("DRAGGING");
    expect(s.activeNodeId).toBe("card-a");
  });

  it("enforces sibling isolation and 120ms post-drop cooldown", () => {
    let s = transitionGestureFsm(INITIAL_GESTURE_STATE, {
      type: "CORNER_POINTER_DOWN",
      nodeId: "card-a",
      corner: "se",
      pointerId: 2,
      pointerType: "touch",
      x: 200,
      y: 200,
      now: 1000,
    });
    expect(s.mode).toBe("RESIZING");

    const duringResize = transitionGestureFsm(s, {
      type: "CARD_POINTER_DOWN",
      nodeId: "card-b",
      pointerId: 3,
      pointerType: "touch",
      x: 120,
      y: 300,
      now: 1100,
    });
    expect(duringResize.activeNodeId).toBe("card-a");
    expect(duringResize.mode).toBe("RESIZING");

    s = transitionGestureFsm(s, {
      type: "POINTER_UP",
      pointerId: 2,
      x: 260,
      y: 260,
      now: 1400,
    });
    expect(s.mode).toBe("SELECTED");
    expect(s.activeNodeId).toBe("card-a");
    expect(s.cooldownUntil).toBe(
      1400 + GESTURE_TIMINGS.POST_INTERACTION_COOLDOWN_MS,
    );

    const blocked = transitionGestureFsm(s, {
      type: "CARD_POINTER_DOWN",
      nodeId: "card-b",
      pointerId: 4,
      pointerType: "touch",
      x: 260,
      y: 260,
      now: 1440,
    });
    expect(blocked.activeNodeId).toBe("card-a");
  });

  it("snaps 4-corner magnetic resize accurately for 2-col and 4-col grids", () => {
    expect(
      snapCornerResize({
        corner: "se",
        startColSpan: 1,
        startRowSpan: 1,
        dx: 140,
        dy: 120,
        colWidthPx: 160,
        rowHeightPx: 120,
        gridColumns: 2,
      }),
    ).toEqual({ colSpan: 2, rowSpan: 2 });

    expect(
      snapCornerResize({
        corner: "nw",
        startColSpan: 1,
        startRowSpan: 1,
        dx: -260,
        dy: 0,
        colWidthPx: 90,
        rowHeightPx: 90,
        gridColumns: 4,
      }),
    ).toEqual({ colSpan: 4, rowSpan: 1 });
  });
});
