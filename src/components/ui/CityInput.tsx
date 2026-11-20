"use client";

import { useId, useMemo, useState } from "react";
import { Icon, Input } from "@/components/ui";
import { searchBrCities } from "@/lib/br-inputs";

/**
 * City input with pre-registered Brazilian city suggestions as the user types.
 * Keeps free-text entry possible when a city is not in the list.
 */
export function CityInput({
  label = "Cidade",
  name,
  value,
  onChange,
  placeholder = "Ex.: São Paulo, SP",
  maxLength = 60,
}: {
  label?: string;
  name?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(() => searchBrCities(value, 6), [value]);
  const showMenu = open && suggestions.length > 0;

  function pick(city: string) {
    onChange(city);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showMenu) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const chosen = suggestions[activeIndex];
      if (chosen) pick(chosen);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative">
      <Input
        label={label}
        name={name}
        role="combobox"
        aria-expanded={showMenu}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Small delay so pointer click on a suggestion registers first
          setTimeout(() => setOpen(false), 120);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
      />

      {showMenu && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Sugestões de cidades"
          className="absolute inset-x-0 top-[calc(100%+4px)] z-30 max-h-60 overflow-y-auto rounded-lg border border-line-strong bg-surface p-1 shadow-md"
        >
          {suggestions.map((city, idx) => (
            <li key={city} role="option" aria-selected={idx === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(city);
                }}
                className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-left text-small transition-colors ${
                  idx === activeIndex
                    ? "bg-lime-soft font-semibold text-ink"
                    : "text-ink hover:bg-hover"
                }`}
              >
                <Icon
                  name="pin"
                  size={15}
                  className="shrink-0 text-ink-muted"
                />
                <span className="truncate">{city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
