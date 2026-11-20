"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "./Icon";

export type ToastOptions = {
  message: string;
  /** One optional action, e.g. "Desfazer". */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it hides. Default 4000. */
  duration?: number;
};

type ToastState = ToastOptions & { id: number };

const ToastContext = createContext<
  ((options: ToastOptions | string) => void) | null
>(null);

/** Shows one toast at a time, bottom center, above the mobile tab bar. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);

  const show = useCallback((options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { message: options } : options;
    nextId.current += 1;
    setToast({ ...opts, id: nextId.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--toast-offset,24px)+env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto inline-flex animate-rise items-center gap-2.5 rounded-pill bg-ink py-2.5 pr-4.5 pl-3 text-[14px] font-medium text-paper shadow-lg"
          >
            <span className="grid size-6 place-items-center rounded-full bg-lime text-on-lime">
              <Icon name="check" size={14} strokeWidth={2.4} />
            </span>
            {toast.message}
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
                className="ml-1.5 cursor-pointer font-semibold text-lime"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

/** `const toast = useToast(); toast("Salvo")` */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
