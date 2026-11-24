"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { luminance } from "@/lib/color";
import type { CornerDirection } from "@/lib/editor/fsm";
import {
  SUPPORT_PALETTE,
  type BlockGeometry,
  type CanvasNode,
} from "@/lib/editor/types";
import { brandColor, resolveIcon } from "@/lib/icons";
import type { ResolvedTheme } from "@/lib/theme";

function WidgetGlyph({
  iconKey,
  theme,
  size = 20,
}: {
  iconKey: string;
  theme: ResolvedTheme;
  size?: number;
}) {
  const icon = resolveIcon(iconKey);
  if (icon.type === "brand") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        focusable="false"
        style={{
          width: size,
          height: size,
          fill: brandColor(icon, theme.iconColor),
        }}
      >
        <path d={icon.path} />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
    >
      <path d={icon.path} />
    </svg>
  );
}

const CORNERS: {
  dir: CornerDirection;
  posCls: string;
  cursorCls: string;
  bracketPath: string;
  label: string;
}[] = [
  {
    dir: "nw",
    posCls: "-top-3.5 -left-3.5",
    cursorCls: "cursor-nwse-resize",
    bracketPath: "M 20 5 H 10 A 5 5 0 0 0 5 10 V 20",
    label: "Redimensionar pelo canto superior esquerdo",
  },
  {
    dir: "ne",
    posCls: "-top-3.5 -right-3.5",
    cursorCls: "cursor-nesw-resize",
    bracketPath: "M 4 5 H 14 A 5 5 0 0 1 19 10 V 20",
    label: "Redimensionar pelo canto superior direito",
  },
  {
    dir: "sw",
    posCls: "-bottom-3.5 -left-3.5",
    cursorCls: "cursor-nesw-resize",
    bracketPath: "M 20 19 H 10 A 5 5 0 0 1 5 14 V 4",
    label: "Redimensionar pelo canto inferior esquerdo",
  },
  {
    dir: "se",
    posCls: "-bottom-3.5 -right-3.5",
    cursorCls: "cursor-nwse-resize",
    bracketPath: "M 4 19 H 14 A 5 5 0 0 0 19 14 V 4",
    label: "Redimensionar pelo canto inferior direito",
  },
];

export function spanClassForGeometry(
  geo: BlockGeometry,
  gridCols: 2 | 4 | 6,
): string {
  const c = Math.min(gridCols, geo.colSpan);
  const colCls =
    c >= 4 ? "col-span-4" : c === 2 ? "col-span-2" : "col-span-1";
  const rowCls = geo.rowSpan >= 2 ? "row-span-2" : "row-span-1";
  return `${colCls} ${rowCls}`;
}

export function EditorWidgetCard({
  node,
  geometry,
  gridCols,
  theme,
  showIconLabels,
  showSubtitles,
  isSelected,
  isPreLock,
  isDragging,
  dragOffset,
  resizePreview,
  stackPickMode,
  onCardPointerDown,
  onCornerPointerDown,
  onCycleStackItem,
  registerCardElement,
}: {
  node: CanvasNode;
  geometry: BlockGeometry;
  gridCols: 2 | 4 | 6;
  theme: ResolvedTheme;
  showIconLabels: boolean;
  showSubtitles: boolean;
  isSelected: boolean;
  isPreLock: boolean;
  isDragging: boolean;
  dragOffset: { x: number; y: number } | null;
  resizePreview: { colSpan: 1 | 2 | 4; rowSpan: 1 | 2 } | null;
  /** True when user clicked "Criar pilha" and is picking a target card to merge */
  stackPickMode: boolean;
  onCardPointerDown: (
    nodeId: string,
    e: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  onCornerPointerDown: (
    nodeId: string,
    corner: CornerDirection,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  onCycleStackItem: (nodeId: string, nextIdx: number) => void;
  registerCardElement: (nodeId: string, el: HTMLDivElement | null) => void;
}) {
  const activeGeo = resizePreview
    ? { ...geometry, ...resizePreview }
    : geometry;
  const spanCls = spanClassForGeometry(activeGeo, gridCols);

  const safeIdx = Math.min(
    Math.max(0, node.activeStackIndex),
    node.items.length - 1,
  );
  const item = node.items[safeIdx] ?? node.items[0];
  const swatch =
    item.colorId !== "default" ? SUPPORT_PALETTE[item.colorId] : null;

  const cardVars: CSSProperties | undefined = swatch
    ? ({
        "--card-bg": swatch.bg,
        "--card-ink": swatch.ink,
        "--card-muted": swatch.muted,
        "--card-icon-bg": swatch.iconBg,
        "--card-icon-ink": swatch.iconInk,
        "--card-border": "transparent",
      } as CSSProperties)
    : undefined;

  const isDarkCanvas = luminance(theme.palette.bg) < 0.36;
  const bracketColor = isDarkCanvas ? "#CDF54A" : "#0E0E0E";

  const isCompactTile = activeGeo.colSpan === 1 && activeGeo.rowSpan === 1;
  const isLargeCard = activeGeo.rowSpan >= 2;
  const glassCls =
    theme.cardEffect === "glass"
      ? "backdrop-blur-md shadow-[0_6px_22px_rgba(0,0,0,0.09)]"
      : "";

  const transformStyle: CSSProperties = isDragging && dragOffset
    ? {
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.03)`,
        zIndex: 40,
        touchAction: "none",
      }
    : {
        transform: isPreLock ? "scale(0.965)" : undefined,
        touchAction: "pan-y",
      };

  return (
    <div
      ref={(el) => registerCardElement(node.id, el)}
      data-editor-node-id={node.id}
      onPointerDown={(e) => onCardPointerDown(node.id, e)}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        ...cardVars,
        ...transformStyle,
        WebkitTouchCallout: "none",
      }}
      className={`${spanCls} relative select-none transition-[transform,box-shadow] ${
        isDragging
          ? "duration-0 shadow-[0_24px_56px_rgba(0,0,0,0.38)]"
          : "duration-150 ease-out"
      }`}
    >
      {/* Card Visual Surface (WYSIWYG with Public Page) */}
      <div
        className={`relative flex h-full w-full overflow-hidden border border-(--card-border) bg-(--card-bg) text-(--card-ink) transition-colors ${glassCls} ${
          isLargeCard
            ? "min-h-[154px] flex-col justify-between gap-3 rounded-(--r-big) p-5"
            : isCompactTile
              ? "min-h-[112px] flex-col justify-between rounded-(--r) p-(--card-px)"
              : "min-h-[72px] items-center gap-3 rounded-(--r) px-(--card-px) py-(--card-py)"
        } ${
          isDragging ? "ring-2 ring-[#CDF54A]" : ""
        } ${
          stackPickMode && !isSelected
            ? "ring-2 ring-dashed ring-[#CDF54A] cursor-pointer"
            : ""
        }`}
      >
        {/* Featured Pin */}
        {node.featured && (
          <span
            aria-hidden
            className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-[#CDF54A] ring-2 ring-black/20"
          />
        )}

        {isCompactTile ? (
          showIconLabels ? (
            <>
              <div className="flex w-full items-start justify-between gap-2">
                <span className="grid size-(--card-icon) shrink-0 place-items-center rounded-(--card-icon-r) bg-(--card-icon-bg) text-(--card-icon-ink) shadow-[0_1px_3px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06]">
                  <WidgetGlyph iconKey={item.icon} theme={theme} size={20} />
                </span>
                {node.kind === "stack" ? (
                  <span className="rounded-full bg-(--card-icon-bg) px-2 py-0.5 text-[10px] font-bold">
                    {safeIdx + 1}/{node.items.length}
                  </span>
                ) : (
                  <Icon
                    name="arrow"
                    size={14}
                    strokeWidth={2}
                    className="mt-1 shrink-0 opacity-55"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 text-left">
                <span className="line-clamp-2 text-(length:--card-title) leading-tight font-semibold">
                  {item.title}
                </span>
                {showSubtitles && item.subtitle && (
                  <span className="truncate text-(length:--card-sub) text-(--card-muted)">
                    {item.subtitle}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="grid size-full place-items-center py-2">
              <span className="grid size-(--card-icon) shrink-0 place-items-center rounded-(--card-icon-r) bg-(--card-icon-bg) text-(--card-icon-ink) shadow-[0_1px_3px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06]">
                <WidgetGlyph iconKey={item.icon} theme={theme} size={22} />
              </span>
            </div>
          )
        ) : isLargeCard ? (
          <>
            <div className="flex w-full items-center justify-between gap-2">
              <span className="grid size-(--card-icon) shrink-0 place-items-center rounded-(--card-icon-r) bg-(--card-icon-bg) text-(--card-icon-ink) shadow-[0_1px_3px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06]">
                <WidgetGlyph iconKey={item.icon} theme={theme} size={22} />
              </span>

              {node.kind === "stack" ? (
                <span className="rounded-full bg-(--card-icon-bg) px-2.5 py-1 text-[11px] font-bold">
                  Pilha · {safeIdx + 1}/{node.items.length}
                </span>
              ) : (
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-(--card-icon-bg) text-(--card-ink)">
                  <Icon name="arrow" size={16} strokeWidth={2} />
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 text-left">
              <span className="text-[19px] leading-tight font-bold">
                {item.title}
              </span>
              {showSubtitles && item.subtitle && (
                <span className="line-clamp-2 text-[13px] leading-snug text-(--card-muted)">
                  {item.subtitle}
                </span>
              )}
            </div>
          </>
        ) : (
          /* Standard 2x1 / 4x1 Bar */
          <>
            <span className="grid size-(--card-icon) shrink-0 place-items-center rounded-(--card-icon-r) bg-(--card-icon-bg) text-(--card-icon-ink) shadow-[0_1px_3px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06]">
              <WidgetGlyph iconKey={item.icon} theme={theme} size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
              <span className="truncate text-(length:--card-title) leading-tight font-semibold">
                {item.title}
              </span>
              {showSubtitles && item.subtitle && (
                <span className="truncate text-(length:--card-sub) leading-snug text-(--card-muted)">
                  {item.subtitle}
                </span>
              )}
            </div>
            {node.kind === "stack" ? (
              <span className="shrink-0 rounded-full bg-(--card-icon-bg) px-2.5 py-1 text-[11px] font-bold">
                {safeIdx + 1}/{node.items.length}
              </span>
            ) : (
              <Icon
                name="arrow"
                size={18}
                strokeWidth={2}
                className="shrink-0 opacity-70"
              />
            )}
          </>
        )}
      </div>

      {/* Stack pagination dots (clickable in editor) */}
      {node.kind === "stack" && node.items.length > 1 && (
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          {node.items.map((stItem, idx) => (
            <button
              key={stItem.id}
              type="button"
              aria-label={`Mostrar cartão ${idx + 1} da pilha`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onCycleStackItem(node.id, idx);
              }}
              className={`h-2 cursor-pointer rounded-full border-0 transition-all ${
                idx === safeIdx
                  ? "w-5 bg-[#CDF54A] shadow-xs"
                  : "w-2 bg-current opacity-35"
              }`}
            />
          ))}
        </div>
      )}

      {/* Magnetic Snap Ghost Overlay during 4-corner resize (Spec §3 State D) */}
      {resizePreview && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-(--r-big) border-2 border-dashed border-[#CDF54A] bg-[#CDF54A]/[0.09]"
        >
          <span className="rounded-full bg-[#0E0E0E] px-3 py-1 text-caption font-bold text-[#CDF54A] shadow-lg">
            {resizePreview.colSpan} × {resizePreview.rowSpan}
          </span>
        </div>
      )}

      {/* One UI 4-Corner Resize Frame (Spec §3 State B & §4: 44x44px invisible hit targets) */}
      {isSelected && !isDragging && (
        <div className="pointer-events-none absolute -inset-1.5 z-20">
          {CORNERS.map((c) => (
            <button
              key={c.dir}
              type="button"
              aria-label={c.label}
              onPointerDown={(e) => {
                e.stopPropagation();
                onCornerPointerDown(node.id, c.dir, e);
              }}
              style={{ touchAction: "none" }}
              className={`pointer-events-auto absolute ${c.posCls} ${c.cursorCls} grid size-11 place-items-center border-0 bg-transparent p-0 focus:outline-none`}
            >
              <svg
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
              >
                <path
                  d={c.bracketPath}
                  stroke={bracketColor}
                  strokeWidth={3.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
