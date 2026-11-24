"use client";

export type DockPanelKey =
  | "background"
  | "themes"
  | "widgets"
  | "settings"
  | "widget-edit"
  | "stack"
  | null;

const DOCK_ITEMS: {
  key: Exclude<DockPanelKey, "widget-edit" | "stack" | null>;
  label: string;
  shortLabel: string;
  limeHighlight?: boolean;
  svgPath: string;
}[] = [
  {
    key: "background",
    label: "Fundo e estilo",
    shortLabel: "Fundo e estilo",
    svgPath:
      "M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zm0 11 4.5-4.5 3.5 3.5 3-3L20 17M9 9.5a1.5 1.5 0 1 0 0-.01",
  },
  {
    key: "themes",
    label: "Temas",
    shortLabel: "Temas",
    svgPath:
      "M4 4h16v5a2 2 0 0 1-2 2h-4v9a2 2 0 0 1-4 0v-9H6a2 2 0 0 1-2-2V4zm0 4h16",
  },
  {
    key: "widgets",
    label: "Link",
    shortLabel: "Link",
    limeHighlight: true,
    svgPath:
      "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  },
  {
    key: "settings",
    label: "Configurações",
    shortLabel: "Configurações",
    svgPath:
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4 0a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  },
];

export function EditorBottomDock({
  activePanel,
  isZoomOut,
  onSelectPanel,
}: {
  activePanel: DockPanelKey;
  isZoomOut: boolean;
  onSelectPanel: (panel: DockPanelKey) => void;
}) {
  return (
    <nav
      aria-label="Personalização global do mural"
      onPointerDown={(e) => e.stopPropagation()}
      className={`fixed inset-x-0 bottom-0 z-30 mx-auto w-full px-3 pb-[max(12px,env(safe-area-inset-bottom))] transition-all duration-300 sm:max-w-[500px] sm:px-4 ${
        isZoomOut ? "scale-[1.02]" : ""
      }`}
    >
      <div
        className={`grid grid-cols-4 items-center gap-1 rounded-[26px] border px-2 py-1.5 backdrop-blur-xl transition-all ${
          isZoomOut
            ? "border-[#CDF54A]/45 bg-[#0E0E0E]/96 shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
            : "border-white/12 bg-[#141416]/94 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        }`}
      >
        {DOCK_ITEMS.map((item) => {
          const active = activePanel === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectPanel(active ? null : item.key)}
              className={`flex min-h-[54px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[18px] border-0 px-1.5 py-1.5 transition-all ${
                active
                  ? "bg-[#CDF54A] font-semibold text-[#0E0E0E] shadow-sm"
                  : "bg-transparent text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`inline-grid place-items-center transition-all ${
                  item.limeHighlight && !active
                    ? "h-6 w-10 rounded-full bg-[#CDF54A] text-[#0E0E0E] shadow-[0_0_12px_rgba(205,245,74,0.35)]"
                    : "size-6"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={item.limeHighlight && !active ? 17 : 20}
                  height={item.limeHighlight && !active ? 17 : 20}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={item.limeHighlight ? 2.1 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={item.svgPath} />
                </svg>
              </span>
              <span
                className={`max-w-full truncate text-[11px] leading-tight ${
                  item.limeHighlight && !active
                    ? "font-semibold text-[#CDF54A]"
                    : ""
                }`}
              >
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
