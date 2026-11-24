"use client";

import { useState } from "react";
import type { DockPanelKey } from "./EditorBottomDock";
import {
  EDITOR_THEME_PRESETS,
  SUPPORT_PALETTE,
  WIDGET_LIBRARY,
  type BlockGeometry,
  type CanvasNode,
  type MuralSettings,
  type SupportColorId,
  type ViewportKey,
  type WidgetItem,
  type WidgetTemplateSpec,
} from "@/lib/editor/types";
import {
  BG_GRADIENTS,
  BG_IMAGE_PRESETS,
  STYLES,
  TEMPLATES,
  type TemplateKey,
} from "@/lib/styles";

const QUICK_ICONS: { key: string; label: string }[] = [
  { key: "si:whatsapp", label: "WhatsApp" },
  { key: "si:instagram", label: "Instagram" },
  { key: "si:youtube", label: "YouTube" },
  { key: "si:tiktok", label: "TikTok" },
  { key: "lm:calendar", label: "Agenda" },
  { key: "lm:pin", label: "Mapa" },
  { key: "lm:shop", label: "Loja" },
  { key: "lm:portfolio", label: "Mídia Kit" },
  { key: "lm:mail", label: "E-mail" },
  { key: "lm:phone", label: "Telefone" },
  { key: "lm:link", label: "Link" },
  { key: "lm:info", label: "Aviso" },
];

const SOLID_SWATCHES = [
  { hex: "#0E0E0E", label: "Ink" },
  { hex: "#F4F4EF", label: "Paper" },
  { hex: "#FFFFFF", label: "Branco" },
  { hex: "#1B1C20", label: "Grafite" },
  { hex: "#FFF6EE", label: "Creme" },
  { hex: "#EEF6FF", label: "Gelo" },
];

const SCALE_STEPS: ("compact" | "default" | "large")[] = [
  "compact",
  "default",
  "large",
];

const SCALE_LABELS: Record<"compact" | "default" | "large", string> = {
  compact: "Compacto",
  default: "Padrão",
  large: "Grande",
};

function PanelShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[82dvh] flex-col overflow-hidden rounded-t-[28px] border-t border-white/12 bg-[#141416]/98 text-white shadow-[0_-20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl animate-rise lg:inset-x-auto lg:top-[72px] lg:right-4 lg:bottom-[92px] lg:max-h-none lg:w-[376px] lg:rounded-[24px] lg:border"
    >
      {/* Mobile drag indicator */}
      <div className="flex justify-center pt-2.5 lg:hidden">
        <span className="h-1 w-10 rounded-full bg-white/20" />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
        <h2 className="m-0 font-display text-[17px] font-semibold tracking-[-0.01em] text-white">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-white/8 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">{children}</div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-2 text-left text-white"
    >
      <span className="text-[14px] leading-snug font-medium text-white/90">
        {label}
      </span>
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
          checked ? "bg-[#CDF54A]" : "bg-white/20"
        }`}
      >
        <span
          className={`size-5 rounded-full transition-transform ${
            checked
              ? "translate-x-5 bg-[#0E0E0E]"
              : "translate-x-0 bg-white"
          }`}
        />
      </span>
    </button>
  );
}

export function EditorDrawers({
  activePanel,
  settings,
  viewport,
  selectedNode,
  allNodes,
  onClose,
  onUpdateSettings,
  onApplyPreset,
  onAddWidgetFromSpec,
  onUpdateNodeItem,
  onResizeSelected,
  onMergeNodeIntoStack,
  onAddNewItemToStack,
  onReorderStackItem,
  onRemoveStackItem,
  onUnstackNode,
}: {
  activePanel: DockPanelKey;
  settings: MuralSettings;
  viewport: ViewportKey;
  selectedNode: CanvasNode | null;
  allNodes: CanvasNode[];
  onClose: () => void;
  onUpdateSettings: (patch: Partial<MuralSettings>) => void;
  onApplyPreset: (presetId: string) => void;
  onAddWidgetFromSpec: (spec: WidgetTemplateSpec) => void;
  onUpdateNodeItem: (
    nodeId: string,
    itemIndex: number,
    patch: Partial<WidgetItem>,
  ) => void;
  onResizeSelected: (
    nodeId: string,
    span: Pick<BlockGeometry, "colSpan" | "rowSpan">,
  ) => void;
  onMergeNodeIntoStack: (targetNodeId: string, sourceNodeId: string) => void;
  onAddNewItemToStack: (nodeId: string, spec: WidgetTemplateSpec) => void;
  onReorderStackItem: (
    nodeId: string,
    itemIndex: number,
    direction: -1 | 1,
  ) => void;
  onRemoveStackItem: (nodeId: string, itemIndex: number) => void;
  onUnstackNode: (nodeId: string) => void;
}) {
  const [editingStackIdx, setEditingStackIdx] = useState(0);

  if (!activePanel) return null;

  /* ------------------------------------------------------------------------ */
  /* Pillar 1: Fundo e estilo                                                 */
  /* ------------------------------------------------------------------------ */
  if (activePanel === "background") {
    return (
      <PanelShell title="Fundo e estilo" onClose={onClose}>
        <div className="flex flex-col gap-5">
          {/* Card Finish: Solid vs Glass */}
          <div>
            <p className="mb-2 text-caption font-semibold tracking-wider text-white/60 uppercase">
              Acabamento dos blocos
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["solid", "Sólido"],
                  ["glass", "Vidro (Glass)"],
                ] as const
              ).map(([val, lbl]) => {
                const active = settings.cardStyle === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onUpdateSettings({ cardStyle: val })}
                    className={`min-h-11 cursor-pointer rounded-xl border text-small font-semibold transition-all ${
                      active
                        ? "border-[#CDF54A] bg-[#CDF54A] text-[#0E0E0E]"
                        : "border-white/12 bg-white/5 text-white/85 hover:bg-white/10"
                    }`}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Header Template */}
          <div>
            <p className="mb-2 text-caption font-semibold tracking-wider text-white/60 uppercase">
              Cabeçalho do mural
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TEMPLATES) as TemplateKey[]).map((tpl) => {
                const active = settings.templateKey === tpl;
                return (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => onUpdateSettings({ templateKey: tpl })}
                    className={`min-h-11 cursor-pointer rounded-xl border text-caption font-semibold transition-all ${
                      active
                        ? "border-[#CDF54A] bg-white/15 text-[#CDF54A]"
                        : "border-white/12 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {TEMPLATES[tpl]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Solid Colors */}
          <div>
            <p className="mb-2 text-caption font-semibold tracking-wider text-white/60 uppercase">
              Cores sólidas (KV)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SOLID_SWATCHES.map((sw) => {
                const active =
                  settings.bgType === "solid" &&
                  settings.customBgHex?.toUpperCase() === sw.hex;
                return (
                  <button
                    key={sw.hex}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        bgType: "solid",
                        customBgHex: sw.hex,
                        customAccentHex:
                          sw.hex === "#0E0E0E" || sw.hex === "#1B1C20"
                            ? "#CDF54A"
                            : "#0E0E0E",
                      })
                    }
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-caption font-medium transition-all ${
                      active
                        ? "border-[#CDF54A] bg-white/14 text-white"
                        : "border-white/12 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className="size-5 shrink-0 rounded-full border border-white/25"
                      style={{ background: sw.hex }}
                    />
                    <span className="truncate">{sw.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Curated Gradients */}
          <div>
            <p className="mb-2 text-caption font-semibold tracking-wider text-white/60 uppercase">
              Degradês
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BG_GRADIENTS).map(([key, grad]) => {
                const active =
                  settings.bgType === "gradient" && settings.bgId === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        bgType: "gradient",
                        bgId: key,
                      })
                    }
                    className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left text-caption font-medium transition-all ${
                      active
                        ? "border-[#CDF54A] bg-white/14 text-white"
                        : "border-white/12 bg-white/5 text-white/85 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className="size-7 shrink-0 rounded-lg border border-white/20"
                      style={{ background: grad.css }}
                    />
                    <span className="truncate">{grad.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Atmospheric Mesh / Image */}
          <div>
            <p className="mb-2 text-caption font-semibold tracking-wider text-white/60 uppercase">
              Atmosferas e imagem
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BG_IMAGE_PRESETS).map(([key, img]) => {
                const active =
                  settings.bgType === "image" &&
                  settings.bgId === key &&
                  !settings.bgCustomUrl;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        bgType: "image",
                        bgId: key,
                        bgCustomUrl: undefined,
                      })
                    }
                    className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left text-caption font-medium transition-all ${
                      active
                        ? "border-[#CDF54A] bg-white/14 text-white"
                        : "border-white/12 bg-white/5 text-white/85 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className="size-7 shrink-0 rounded-lg border border-white/20"
                      style={{ background: img.css }}
                    />
                    <span className="truncate">{img.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PanelShell>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Pillar 2: Temas                                                          */
  /* ------------------------------------------------------------------------ */
  if (activePanel === "themes") {
    return (
      <PanelShell title="Temas rápidos" onClose={onClose}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-2.5">
            {EDITOR_THEME_PRESETS.map((preset) => {
              const active = settings.themeId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset.id)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                    active
                      ? "border-[#CDF54A] bg-white/12"
                      : "border-white/10 bg-white/5 hover:bg-white/9"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/20 p-1.5"
                      style={{ background: preset.previewBg }}
                    >
                      <div
                        className="flex size-full items-end justify-end rounded-md p-1"
                        style={{ background: preset.previewCard }}
                      >
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: preset.previewAccent }}
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 truncate text-small font-semibold text-white">
                        {preset.label}
                      </p>
                      <p className="m-0 truncate text-caption text-white/65">
                        {preset.tagline}
                      </p>
                    </div>
                  </div>
                  {active && (
                    <span className="shrink-0 rounded-full bg-[#CDF54A] px-2.5 py-0.5 text-[10px] font-bold text-[#0E0E0E]">
                      Ativo
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="mb-2 text-caption font-semibold tracking-wider text-white/60 uppercase">
              Estilos tipográficos
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STYLES).map(([key, st]) => {
                const active =
                  settings.styleKey === key && !settings.customBgHex;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        themeId: key,
                        styleKey: key,
                        bgType: "solid",
                        customBgHex: undefined,
                        customAccentHex: undefined,
                      })
                    }
                    className={`flex min-h-11 cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-caption font-semibold transition-all ${
                      active
                        ? "border-[#CDF54A] bg-white/14 text-[#CDF54A]"
                        : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className="size-4 rounded-full border border-white/25"
                      style={{ background: st.palette.accent }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PanelShell>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Pillar 3: Biblioteca de Widgets                                          */
  /* ------------------------------------------------------------------------ */
  if (activePanel === "widgets") {
    return (
      <PanelShell title="Adicionar link" onClose={onClose}>
        <div className="grid grid-cols-1 gap-2.5">
          {WIDGET_LIBRARY.map((spec) => {
            const swatch =
              spec.defaultColor !== "default"
                ? SUPPORT_PALETTE[spec.defaultColor]
                : null;
            return (
              <button
                key={spec.type}
                type="button"
                onClick={() => onAddWidgetFromSpec(spec)}
                className="flex min-h-[64px] cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-left transition-all hover:border-[#CDF54A]/60 hover:bg-white/10 active:scale-[0.99]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-xl font-bold"
                    style={{
                      background: swatch ? swatch.bg : "#26272C",
                      color: swatch ? swatch.ink : "#FFFFFF",
                    }}
                  >
                    +
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 truncate text-small font-semibold text-white">
                      {spec.label}
                    </p>
                    <p className="m-0 truncate text-caption text-white/65">
                      {spec.description}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/75">
                  {spec.defaultMobileSpan.colSpan}×
                  {spec.defaultMobileSpan.rowSpan}
                </span>
              </button>
            );
          })}
        </div>
      </PanelShell>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Pillar 4: Configurações (Live Mini-Preview Panel, Spec §5.4 / One UI #3) */
  /* ------------------------------------------------------------------------ */
  if (activePanel === "settings") {
    const scaleIndex = SCALE_STEPS.indexOf(settings.grid.scale);
    const miniScale =
      settings.grid.scale === "compact"
        ? "scale-[0.92]"
        : settings.grid.scale === "large"
          ? "scale-[1.06]"
          : "scale-100";

    return (
      <PanelShell title="Configurações da grade" onClose={onClose}>
        <div className="flex flex-col gap-5">
          {/* Sticky Live Mini-Preview Card (One UI Screenshot 3 fidelity) */}
          <div className="sticky top-0 z-10 rounded-2xl border border-white/12 bg-[#1D1D21] p-4 shadow-md">
            <div
              className={`mx-auto grid max-w-[230px] items-start gap-2.5 transition-transform duration-200 ${miniScale} ${
                settings.grid.mobileColumns === 4
                  ? "grid-cols-4"
                  : "grid-cols-2"
              }`}
            >
              {/* Miniature 2x2 Featured Widget */}
              <div className="col-span-2 flex flex-col justify-between gap-2 rounded-2xl bg-[#2563EB]/85 p-3 text-white">
                <div className="flex items-center justify-between">
                  <span className="size-4 rounded-full bg-[#CDF54A]" />
                  <span className="text-[11px] font-bold">24°</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="h-2 w-12 rounded-full bg-white/90" />
                  {settings.labels.showSubtitles && (
                    <span className="h-1.5 w-16 rounded-full bg-white/55" />
                  )}
                </div>
              </div>

              {/* Miniature 1x1 App Icons */}
              <div className="col-span-1 flex flex-col items-center gap-1">
                <div className="grid size-10 place-items-center rounded-xl bg-white/90 text-[#0E0E0E]">
                  <span className="size-4 rounded-full bg-[#0E0E0E]" />
                </div>
                {settings.labels.showIconLabels && (
                  <span className="h-1.5 w-8 rounded-full bg-white/50" />
                )}
              </div>

              <div className="col-span-1 flex flex-col items-center gap-1">
                <div className="grid size-10 place-items-center rounded-xl bg-[#CDF54A] text-[#0E0E0E]">
                  <span className="size-4 rounded-sm bg-[#0E0E0E]" />
                </div>
                {settings.labels.showIconLabels && (
                  <span className="h-1.5 w-8 rounded-full bg-white/50" />
                )}
              </div>
            </div>
          </div>

          {/* Widget Scale Slider (Compact / Default / Large) */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-small font-medium text-white/90">
                Tamanho dos blocos no mural
              </span>
              <span className="rounded-full bg-[#CDF54A]/20 px-2.5 py-0.5 text-caption font-semibold text-[#CDF54A]">
                {SCALE_LABELS[settings.grid.scale]}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={scaleIndex < 0 ? 1 : scaleIndex}
              aria-label="Tamanho dos blocos no mural"
              onChange={(e) => {
                const nextScale = SCALE_STEPS[Number(e.target.value)] ?? "default";
                onUpdateSettings({
                  grid: { ...settings.grid, scale: nextScale },
                });
              }}
              className="h-2 w-full cursor-pointer accent-[#CDF54A]"
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-white/55">
              <span>Compacto</span>
              <span>Padrão</span>
              <span>Grande</span>
            </div>

            {/* Label Toggles */}
            <div className="mt-4 divide-y divide-white/10 border-t border-white/10">
              <ToggleSwitch
                label="Exibir etiquetas nos ícones (1x1)"
                checked={settings.labels.showIconLabels}
                onChange={(val) =>
                  onUpdateSettings({
                    labels: { ...settings.labels, showIconLabels: val },
                  })
                }
              />
              <ToggleSwitch
                label="Exibir subtítulos nos blocos em destaque"
                checked={settings.labels.showSubtitles}
                onChange={(val) =>
                  onUpdateSettings({
                    labels: { ...settings.labels, showSubtitles: val },
                  })
                }
              />
            </div>
          </div>

          {/* Grid Density */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-2.5 text-small font-semibold text-white">
              Densidade da grade (Celular)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  [2, "2 colunas (Botões)"],
                  [4, "4 colunas (Ícones)"],
                ] as const
              ).map(([cols, lbl]) => {
                const active = settings.grid.mobileColumns === cols;
                return (
                  <button
                    key={cols}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        grid: { ...settings.grid, mobileColumns: cols },
                      })
                    }
                    className={`min-h-11 cursor-pointer rounded-xl border text-caption font-semibold transition-all ${
                      active
                        ? "border-[#CDF54A] bg-[#CDF54A] text-[#0E0E0E]"
                        : "border-white/12 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 mb-2.5 text-small font-semibold text-white">
              Densidade da grade (Desktop)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  [4, "4 colunas"],
                  [6, "6 colunas"],
                ] as const
              ).map(([cols, lbl]) => {
                const active = settings.grid.desktopColumns === cols;
                return (
                  <button
                    key={cols}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        grid: { ...settings.grid, desktopColumns: cols },
                      })
                    }
                    className={`min-h-11 cursor-pointer rounded-xl border text-caption font-semibold transition-all ${
                      active
                        ? "border-[#CDF54A] bg-[#CDF54A] text-[#0E0E0E]"
                        : "border-white/12 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PanelShell>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Selected Widget Content Editor ("Configurações" on Popover)              */
  /* ------------------------------------------------------------------------ */
  if (activePanel === "widget-edit" && selectedNode) {
    const safeItemIdx = Math.min(
      Math.max(0, selectedNode.activeStackIndex),
      selectedNode.items.length - 1,
    );
    const activeItem = selectedNode.items[safeItemIdx] ?? selectedNode.items[0];
    const currentGeo = selectedNode.layout[viewport];
    const gridMaxCols =
      viewport === "mobile"
        ? settings.grid.mobileColumns
        : settings.grid.desktopColumns;

    const sizeOptions: { label: string; colSpan: 1 | 2 | 4; rowSpan: 1 | 2 }[] =
      gridMaxCols === 2
        ? [
            { label: "1×1", colSpan: 1, rowSpan: 1 },
            { label: "2×1", colSpan: 2, rowSpan: 1 },
            { label: "1×2", colSpan: 1, rowSpan: 2 },
            { label: "2×2", colSpan: 2, rowSpan: 2 },
          ]
        : [
            { label: "1×1", colSpan: 1, rowSpan: 1 },
            { label: "2×1", colSpan: 2, rowSpan: 1 },
            { label: "2×2", colSpan: 2, rowSpan: 2 },
            { label: "4×1", colSpan: 4, rowSpan: 1 },
            { label: "4×2", colSpan: 4, rowSpan: 2 },
          ];

    return (
      <PanelShell title="Editar bloco" onClose={onClose}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-caption font-medium text-white/75">
            Título
            <input
              type="text"
              maxLength={80}
              value={activeItem.title}
              onChange={(e) =>
                onUpdateNodeItem(selectedNode.id, safeItemIdx, {
                  title: e.target.value,
                })
              }
              className="min-h-11 rounded-xl border border-white/15 bg-white/7 px-3.5 text-small text-white focus:border-[#CDF54A] focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-caption font-medium text-white/75">
            Subtítulo (opcional)
            <input
              type="text"
              maxLength={120}
              value={activeItem.subtitle ?? ""}
              onChange={(e) =>
                onUpdateNodeItem(selectedNode.id, safeItemIdx, {
                  subtitle: e.target.value,
                })
              }
              placeholder="Ex.: Atendimento imediato"
              className="min-h-11 rounded-xl border border-white/15 bg-white/7 px-3.5 text-small text-white placeholder:text-white/35 focus:border-[#CDF54A] focus:outline-none"
            />
          </label>

          {activeItem.type !== "note" && (
            <label className="flex flex-col gap-1.5 text-caption font-medium text-white/75">
              Endereço (URL ou WhatsApp)
              <input
                type="url"
                value={activeItem.url ?? ""}
                onChange={(e) =>
                  onUpdateNodeItem(selectedNode.id, safeItemIdx, {
                    url: e.target.value,
                  })
                }
                placeholder="https://..."
                className="min-h-11 rounded-xl border border-white/15 bg-white/7 px-3.5 text-small text-white placeholder:text-white/35 focus:border-[#CDF54A] focus:outline-none"
              />
            </label>
          )}

          {/* Dimensions in current viewport */}
          <div>
            <p className="mb-2 text-caption font-medium text-white/75">
              Tamanho na grade ({viewport === "mobile" ? "Celular" : "Desktop"})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sizeOptions.map((opt) => {
                const active =
                  currentGeo.colSpan === opt.colSpan &&
                  currentGeo.rowSpan === opt.rowSpan;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() =>
                      onResizeSelected(selectedNode.id, {
                        colSpan: opt.colSpan,
                        rowSpan: opt.rowSpan,
                      })
                    }
                    className={`min-h-11 min-w-14 cursor-pointer rounded-xl border px-3 text-caption font-bold transition-all ${
                      active
                        ? "border-[#CDF54A] bg-[#CDF54A] text-[#0E0E0E]"
                        : "border-white/12 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Support Palette Color Swatches */}
          <div>
            <p className="mb-2 text-caption font-medium text-white/75">
              Cor do bloco
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(SUPPORT_PALETTE) as SupportColorId[]).map((cid) => {
                const sw = SUPPORT_PALETTE[cid];
                const active = activeItem.colorId === cid;
                return (
                  <button
                    key={cid}
                    type="button"
                    onClick={() =>
                      onUpdateNodeItem(selectedNode.id, safeItemIdx, {
                        colorId: cid,
                      })
                    }
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-1.5 text-caption font-medium transition-all ${
                      active
                        ? "border-[#CDF54A] bg-white/15 text-white"
                        : "border-white/12 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className="size-4 shrink-0 rounded-full border border-white/30"
                      style={{
                        background:
                          cid === "default"
                            ? "linear-gradient(135deg, #FFFFFF 50%, #141416 50%)"
                            : sw.bg,
                      }}
                    />
                    <span className="truncate">{sw.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Icons */}
          <div>
            <p className="mb-2 text-caption font-medium text-white/75">
              Ícone
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_ICONS.map((ic) => {
                const active = activeItem.icon === ic.key;
                return (
                  <button
                    key={ic.key}
                    type="button"
                    onClick={() =>
                      onUpdateNodeItem(selectedNode.id, safeItemIdx, {
                        icon: ic.key,
                      })
                    }
                    className={`min-h-10 cursor-pointer rounded-xl border px-2.5 text-caption font-medium transition-all ${
                      active
                        ? "border-[#CDF54A] bg-[#CDF54A]/20 text-[#CDF54A]"
                        : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    {ic.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PanelShell>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Widget Stack Drawer ("Criar pilha" / "Editar pilha")                     */
  /* ------------------------------------------------------------------------ */
  if (activePanel === "stack" && selectedNode) {
    const otherSingleNodes = allNodes.filter(
      (n) => n.id !== selectedNode.id && n.kind === "single",
    );
    const clampedIdx = Math.min(editingStackIdx, selectedNode.items.length - 1);

    return (
      <PanelShell title="Pilha de widgets" onClose={onClose}>
        <div className="flex flex-col gap-5">
          <p className="m-0 text-caption text-white/70">
            Agrupe vários cartões no mesmo espaço. Os visitantes podem deslizar
            para o lado para navegar entre eles.
          </p>

          {/* Current items in stack */}
          <div className="flex flex-col gap-2">
            <p className="m-0 text-caption font-semibold tracking-wider text-white/60 uppercase">
              Cartões nesta pilha ({selectedNode.items.length})
            </p>
            {selectedNode.items.map((it, idx) => (
              <div
                key={it.id}
                className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                  clampedIdx === idx
                    ? "border-[#CDF54A]/60 bg-white/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setEditingStackIdx(idx)}
                  className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-left text-white"
                >
                  <p className="m-0 truncate text-small font-semibold">
                    {idx + 1}. {it.title}
                  </p>
                  {it.subtitle && (
                    <p className="m-0 truncate text-caption text-white/60">
                      {it.subtitle}
                    </p>
                  )}
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onReorderStackItem(selectedNode.id, idx, -1)}
                    aria-label="Mover para cima"
                    className="grid size-9 cursor-pointer place-items-center rounded-lg border-0 bg-white/10 text-caption text-white disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === selectedNode.items.length - 1}
                    onClick={() => onReorderStackItem(selectedNode.id, idx, 1)}
                    aria-label="Mover para baixo"
                    className="grid size-9 cursor-pointer place-items-center rounded-lg border-0 bg-white/10 text-caption text-white disabled:opacity-30"
                  >
                    ↓
                  </button>
                  {selectedNode.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveStackItem(selectedNode.id, idx)}
                      aria-label="Remover da pilha"
                      className="grid size-9 cursor-pointer place-items-center rounded-lg border-0 bg-white/10 text-caption text-[#FF6B6B]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Merge an existing widget from the canvas */}
          {otherSingleNodes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="m-0 text-caption font-semibold tracking-wider text-white/60 uppercase">
                Juntar bloco existente do mural
              </p>
              <div className="flex flex-col gap-1.5">
                {otherSingleNodes.map((other) => (
                  <button
                    key={other.id}
                    type="button"
                    onClick={() =>
                      onMergeNodeIntoStack(selectedNode.id, other.id)
                    }
                    className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-left text-small text-white hover:border-[#CDF54A] hover:bg-white/10"
                  >
                    <span className="truncate font-medium">
                      {other.items[0]?.title}
                    </span>
                    <span className="shrink-0 text-caption font-semibold text-[#CDF54A]">
                      + Empilhar
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add a fresh card into the stack */}
          <div className="flex flex-col gap-2">
            <p className="m-0 text-caption font-semibold tracking-wider text-white/60 uppercase">
              Adicionar novo cartão na pilha
            </p>
            <div className="grid grid-cols-2 gap-2">
              {WIDGET_LIBRARY.slice(0, 4).map((spec) => (
                <button
                  key={spec.type}
                  type="button"
                  onClick={() => onAddNewItemToStack(selectedNode.id, spec)}
                  className="min-h-11 cursor-pointer rounded-xl border border-white/12 bg-white/5 px-3 text-left text-caption font-semibold text-white/90 hover:border-[#CDF54A] hover:bg-white/10"
                >
                  + {spec.label}
                </button>
              ))}
            </div>
          </div>

          {selectedNode.items.length > 1 && (
            <button
              type="button"
              onClick={() => {
                onUnstackNode(selectedNode.id);
                onClose();
              }}
              className="min-h-11 cursor-pointer rounded-xl border border-white/15 bg-white/5 text-small font-semibold text-white/85 hover:bg-white/10"
            >
              Separar cartões no mural
            </button>
          )}
        </div>
      </PanelShell>
    );
  }

  return null;
}
