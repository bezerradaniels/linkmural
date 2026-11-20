"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "./cx";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** The question, e.g. "Excluir este link?" */
  title: string;
  /** The consequence. */
  description?: ReactNode;
  /** Buttons. Repeat the verb ("Excluir link"), and put Cancelar first. */
  actions?: ReactNode;
  children?: ReactNode;
};

/**
 * Modal built on the native <dialog>: focus is kept inside, Esc closes.
 * On phones it sits at the bottom like a sheet.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  actions,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cx(
        "m-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-overlay",
        "sm:m-auto sm:w-[calc(100%-48px)] sm:max-w-[380px]",
        "open:animate-rise",
      )}
    >
      <div
        className={cx(
          "flex flex-col gap-3 bg-surface p-6 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-lg",
          "rounded-t-[24px] sm:rounded-xl sm:pb-6",
        )}
      >
        <div
          aria-hidden
          className="mx-auto -mt-2 mb-1 h-[5px] w-9 rounded-pill bg-line-strong sm:hidden"
        />
        <h2
          id={titleId}
          className="m-0 font-display text-title leading-[26px] tracking-[-0.03em]"
        >
          {title}
        </h2>
        {description && (
          <div id={descId} className="text-[14px] leading-5 text-ink-muted">
            {description}
          </div>
        )}
        {children}
        {actions && (
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </dialog>
  );
}
