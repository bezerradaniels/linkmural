"use client";

import { useMemo, useRef, useState } from "react";
import { Button, Dialog, Input } from "@/components/ui";
import { filterIconGroups, iconLabel } from "@/lib/panel-helpers";
import { LinkIconGlyph } from "./LinkIconGlyph";

/**
 * IconPicker (design/components/IconPicker/README.md):
 * - Search with Portuguese synonyms ("zap", "insta", "cardápio")
 * - 4 groups, 6-column grid
 * - 2px ink outline on selected item
 * - Arrow-key navigation
 * - Opens as a bottom Sheet on mobile via <Dialog>
 */
export function IconPicker({
  open,
  value,
  onSelect,
  onClose,
}: {
  open: boolean;
  value: string;
  onSelect: (iconRef: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => filterIconGroups(query), [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) {
      return;
    }
    const buttons = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>(
        "button[data-icon-ref]",
      ) ?? [],
    );
    if (buttons.length === 0) return;

    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;

    e.preventDefault();
    const step =
      e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowLeft"
          ? -1
          : e.key === "ArrowDown"
            ? 6
            : -6;
    const next = Math.min(buttons.length - 1, Math.max(0, idx + step));
    buttons[next]?.focus();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Escolher ícone"
      actions={
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Buscar ícone"
          type="search"
          placeholder="Ex.: zap, insta, cardápio, pix…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div
          ref={gridRef}
          onKeyDown={handleKeyDown}
          className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto pr-1"
        >
          {groups.length === 0 ? (
            <p className="py-6 text-center text-small text-ink-muted">
              Nenhum ícone encontrado para “{query}”.
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.group} className="flex flex-col gap-2">
                <span className="text-caption font-semibold tracking-wider text-ink-muted uppercase">
                  {g.group}
                </span>
                <div className="grid grid-cols-6 gap-2">
                  {g.icons.map((ref) => {
                    const selected = value === ref;
                    const label = iconLabel(ref);
                    return (
                      <button
                        key={ref}
                        type="button"
                        data-icon-ref={ref}
                        title={label}
                        aria-label={label}
                        aria-pressed={selected}
                        onClick={() => {
                          onSelect(ref);
                          onClose();
                        }}
                        className={`grid size-11 cursor-pointer place-items-center rounded-md border transition-colors ${
                          selected
                            ? "border-2 border-ink bg-lime-soft"
                            : "border-line bg-paper hover:border-ink-muted"
                        }`}
                      >
                        <LinkIconGlyph iconRef={ref} size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}
