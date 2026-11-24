"use client";

import type { CanvasNode } from "@/lib/editor/types";

export interface PopoverAnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

/**
 * Floating Contextual Popover inspired by Android One UI Home Screen Editor:
 * - Outer div handles fixed coordinates + translateY(-100%) (no CSS animation on outer div
 *   so animation-fill-mode never overrides translateY(-100%)!)
 * - Floats 20px clear above the selected card's top border (or 20px below bottom border
 *   when near the top bar), never covering the card itself.
 */
export function FloatingWidgetPopover({
  node,
  anchorRect,
  onStackAction,
  onRemove,
  onOpenSettings,
  onToggleFeatured,
}: {
  node: CanvasNode;
  anchorRect: PopoverAnchorRect | null;
  onStackAction: () => void;
  onRemove: () => void;
  onOpenSettings: () => void;
  onToggleFeatured: () => void;
}) {
  if (!anchorRect) return null;

  const activeItem =
    node.items[Math.min(node.activeStackIndex, node.items.length - 1)] ??
    node.items[0];

  const popWidth = 284;
  const popEstHeight = 118;
  const clearancePx = 20;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 400;

  const centerX = anchorRect.left + anchorRect.width / 2;
  const left = Math.max(
    12,
    Math.min(viewportW - popWidth - 12, centerX - popWidth / 2),
  );

  // Flip below the card if there isn't enough space between the card and the 56px top bar
  const flipBelow = anchorRect.top < popEstHeight + 64 + clearancePx;
  const top = flipBelow
    ? anchorRect.bottom + clearancePx
    : anchorRect.top - clearancePx;

  const isStack = node.kind === "stack" && node.items.length > 1;

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        width: popWidth,
        transform: flipBelow ? "none" : "translateY(-100%)",
        zIndex: 45,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="select-none"
    >
      <div
        role="toolbar"
        aria-label={`Opções de ${activeItem.title}`}
        className="animate-pop-in overflow-hidden rounded-[22px] border border-white/12 bg-[#1A1A1D]/95 text-white shadow-[0_20px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        {/* Header Row: Title + Stack Badge + Featured Toggle */}
        <div className="flex min-h-12 items-center justify-between gap-2 px-4 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-white">
              {activeItem.title}
            </span>
            {isStack && (
              <span className="shrink-0 rounded-full bg-[#CDF54A]/20 px-2 py-0.5 text-[11px] font-bold text-[#CDF54A]">
                Pilha ({node.items.length})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleFeatured}
            aria-label={
              node.featured ? "Remover destaque do bloco" : "Destacar este bloco"
            }
            title={node.featured ? "Bloco em destaque" : "Destacar bloco"}
            className={`grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent transition-colors hover:bg-white/10 ${
              node.featured ? "text-[#CDF54A]" : "text-white/70"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill={node.featured ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
            </svg>
          </button>
        </div>

        {/* Divider + 3 Direct Actions */}
        <div className="grid grid-cols-3 border-t border-white/10">
          <button
            type="button"
            onClick={onStackAction}
            className="flex min-h-[60px] cursor-pointer flex-col items-center justify-center gap-1 border-0 bg-transparent px-2 py-2 text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
          >
            <svg
              viewBox="0 0 24 24"
              width={19}
              height={19}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="4" y="4" width="16" height="16" rx="4" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <span className="text-[11px] font-medium">
              {isStack ? "Editar pilha" : "Criar pilha"}
            </span>
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="flex min-h-[60px] cursor-pointer flex-col items-center justify-center gap-1 border-0 bg-transparent px-2 py-2 text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
          >
            <svg
              viewBox="0 0 24 24"
              width={19}
              height={19}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
            </svg>
            <span className="text-[11px] font-medium">Remover</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex min-h-[60px] cursor-pointer flex-col items-center justify-center gap-1 border-0 bg-transparent px-2 py-2 text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
          >
            <svg
              viewBox="0 0 24 24"
              width={19}
              height={19}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-[11px] font-medium">Configurações</span>
          </button>
        </div>
      </div>
    </div>
  );
}
