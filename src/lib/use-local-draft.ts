"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Keeps unsaved form edits in localStorage so an interrupted session (app
 * switch on mobile, reload, dropped connection) does not lose typed data.
 *
 * Safety rule: a draft is stored together with a snapshot of the server data
 * it was made from. It is restored only while the server data is still the
 * same; if the page was changed meanwhile (another device or tab), the draft
 * is dropped so it can never overwrite newer data.
 */

const PREFIX = "lm:draft:";
const VERSION = 2;

type DraftEntry = { v: typeof VERSION; base: string; value: unknown };

export function serializeDraft(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/**
 * Decides what to do with a stored entry for the current server snapshot:
 * the draft value to restore, or null (and the entry should be removed).
 */
export function draftToRestore(
  raw: string | null,
  baseSerialized: string,
): { restore: unknown | null; drop: boolean } {
  if (!raw) return { restore: null, drop: false };
  try {
    const entry = JSON.parse(raw) as Partial<DraftEntry>;
    if (entry?.v !== VERSION || entry.base !== baseSerialized) {
      return { restore: null, drop: true };
    }
    if (serializeDraft(entry.value) === baseSerialized) {
      return { restore: null, drop: true };
    }
    return { restore: entry.value ?? null, drop: false };
  } catch {
    return { restore: null, drop: true };
  }
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function safeGet(key: string) {
  try {
    return storage()?.getItem(PREFIX + key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    storage()?.setItem(PREFIX + key, value);
  } catch {
    // Quota or private mode: drafts are a convenience, never required.
  }
}

function safeRemove(key: string) {
  try {
    storage()?.removeItem(PREFIX + key);
  } catch {
    // Ignore storage errors.
  }
}

/** Removes every form draft on this device (used on sign out). */
export function clearAllLocalDrafts() {
  const s = storage();
  if (!s) return;
  try {
    for (const key of Object.keys(s)) {
      if (key.startsWith(PREFIX)) s.removeItem(key);
    }
  } catch {
    // Ignore storage errors.
  }
}

/**
 * Restores a draft after mount (hydration-safe) when it still matches the
 * server data, and saves later edits with a 250 ms debounce.
 *
 * - `key`: unique per form and page (no prefix needed).
 * - `value`: the current form values; the first render is taken as the
 *   server snapshot.
 * - `onRestore`: applies a set of values to the form (also used by discard).
 *
 * Returns `restored` (show a "não salvo" notice), `discard()` (back to the
 * server values) and `clear()` (call after a successful save).
 */
export function useLocalDraft<T>(
  key: string,
  value: T,
  onRestore: (draft: T) => void,
) {
  const baseRef = useRef<string | null>(null);
  if (baseRef.current === null) baseRef.current = serializeDraft(value);

  const readyRef = useRef(false);
  const onRestoreRef = useRef(onRestore);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const base = baseRef.current ?? "null";
      const { restore, drop } = draftToRestore(safeGet(key), base);
      if (drop) safeRemove(key);
      if (restore !== null) {
        onRestoreRef.current(restore as T);
        setRestored(true);
      }
      readyRef.current = true;
    });
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    if (!readyRef.current) return;
    const timer = setTimeout(() => {
      const base = baseRef.current ?? "null";
      const serialized = serializeDraft(value);
      if (serialized === base) {
        safeRemove(key);
        setRestored(false);
        return;
      }
      const entry: DraftEntry = { v: VERSION, base, value };
      safeSet(key, JSON.stringify(entry));
    }, 250);
    return () => clearTimeout(timer);
  }, [key, value]);

  /** After a successful save: the saved values become the new snapshot. */
  const clear = useCallback(() => {
    baseRef.current = serializeDraft(value);
    safeRemove(key);
    setRestored(false);
  }, [key, value]);

  /** Throws the draft away and puts the server values back in the form. */
  const discard = useCallback(() => {
    safeRemove(key);
    setRestored(false);
    const base = baseRef.current;
    if (base) onRestoreRef.current(JSON.parse(base) as T);
  }, [key]);

  return { clear, discard, restored };
}
