"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { STYLES } from "@/lib/styles";

type DemoId = "balcao" | "mosaico" | "cartao";

const DEMOS: {
  id: DemoId;
  tabLabel: string;
  modelTag: string;
  styleName: string;
  initials: string;
  name: string;
  kind: string;
  city: string;
  status: string;
  slug: string;
  palette: (typeof STYLES)[keyof typeof STYLES]["palette"];
}[] = [
  {
    id: "balcao",
    tabLabel: "Balcão",
    modelTag: "Academia · Estilo Sport",
    styleName: "Sport",
    initials: "SF",
    name: "Studio Força",
    kind: "Treino funcional · Personal",
    city: "São Paulo, SP",
    status: "Aberto agora · até 22h",
    slug: "studioforca",
    palette: STYLES.sport.palette,
  },
  {
    id: "mosaico",
    tabLabel: "Mosaico",
    modelTag: "Cafeteria · Estilo Pop",
    styleName: "Pop",
    initials: "CE",
    name: "Café da Esquina",
    kind: "Cafés especiais · Padaria",
    city: "Curitiba, PR",
    status: "Aberto agora · até 20h",
    slug: "cafedaesquina",
    palette: STYLES.pop.palette,
  },
  {
    id: "cartao",
    tabLabel: "Cartão",
    modelTag: "Consultório · Estilo Calm",
    styleName: "Calm",
    initials: "MC",
    name: "Dra. Marina Costa",
    kind: "Dermatologia · CRM 184.210",
    city: "Belo Horizonte, MG",
    status: "Atendendo · até 18h",
    slug: "dramarinacosta",
    palette: STYLES.calm.palette,
  },
];

/**
 * Interactive phone preview in the landing hero: lets visitors switch between
 * the 3 real templates (Balcão, Mosaico, Cartão) and styles before signing up.
 */
export function HeroShowcase() {
  const [active, setActive] = useState<DemoId>("balcao");
  const demo = DEMOS.find((d) => d.id === active) ?? DEMOS[0];
  const p = demo.palette;

  return (
    <div className="flex w-full max-w-[360px] flex-col items-center gap-3.5">
      {/* Model switcher */}
      <div
        role="tablist"
        aria-label="Testar os 3 modelos de página"
        className="inline-flex w-full items-center justify-between gap-1 rounded-pill border border-line bg-surface p-1 shadow-xs"
      >
        {DEMOS.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(item.id)}
              className={`min-h-10 flex-1 rounded-pill px-3 text-small font-semibold transition-colors ${
                selected
                  ? "bg-ink text-paper shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {item.tabLabel}
            </button>
          );
        })}
      </div>

      {/* Phone card */}
      <div
        className="w-full overflow-hidden rounded-[28px] border p-5 shadow-md transition-colors duration-200"
        style={{
          backgroundColor: p.bg,
          borderColor: p.line,
          color: p.ink,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="grid size-13 shrink-0 place-items-center rounded-[16px] font-display text-title font-bold"
            style={{ backgroundColor: p.accent, color: p.onAccent }}
          >
            {demo.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-body font-semibold">
              {demo.name}
            </p>
            <p className="truncate text-caption" style={{ color: p.muted }}>
              {demo.kind}
            </p>
            <p className="truncate text-caption" style={{ color: p.muted }}>
              {demo.city}
            </p>
          </div>
        </div>

        {/* Status + Quick actions */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-medium"
            style={{ backgroundColor: p.soft, color: p.ink }}
          >
            <span className="size-2 rounded-full bg-[#22C55E]" />
            {demo.status}
          </span>
          <div className="flex items-center gap-1.5">
            {["WhatsApp", "Contato", "QR"].map((action) => (
              <span
                key={action}
                className="rounded-pill border px-2 py-0.5 text-[11px] font-medium"
                style={{ borderColor: p.line, color: p.muted }}
              >
                {action}
              </span>
            ))}
          </div>
        </div>

        {/* Body per template */}
        {demo.id === "balcao" && (
          <div className="mt-4 flex flex-col gap-2.5">
            <div
              className="relative flex items-center justify-between rounded-lg px-4 py-3 text-small font-semibold"
              style={{ backgroundColor: p.accent, color: p.onAccent }}
            >
              <span>Agendar aula experimental</span>
              <Icon name="arrow" size={16} />
              <span
                aria-hidden
                className="absolute -top-1.5 -right-1.5 size-4 rounded-full border-2 bg-lime"
                style={{ borderColor: p.bg }}
              />
            </div>
            <div
              className="flex items-center justify-between rounded-lg border px-4 py-3 text-small font-medium"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <span>Chamar no WhatsApp</span>
              <Icon name="arrow" size={16} className="opacity-60" />
            </div>
            <div
              className="flex items-center justify-between rounded-lg border px-4 py-3 text-small font-medium"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <span>Planos e horários</span>
              <Icon name="arrow" size={16} className="opacity-60" />
            </div>
            <div
              className="flex items-center justify-between rounded-lg border px-4 py-3 text-small font-medium"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <span>Pagar com Pix · copiar chave</span>
              <Icon name="copy" size={15} className="opacity-60" />
            </div>
          </div>
        )}

        {demo.id === "mosaico" && (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div
              className="relative col-span-2 flex items-center justify-between rounded-lg px-4 py-3.5 text-small font-semibold"
              style={{ backgroundColor: p.accent, color: p.onAccent }}
            >
              <div>
                <p>Pedir no cardápio digital</p>
                <p className="text-caption font-normal opacity-80">
                  Entrega em até 35 min
                </p>
              </div>
              <Icon name="arrow" size={16} />
              <span
                aria-hidden
                className="absolute -top-1.5 -right-1.5 size-4 rounded-full border-2 bg-lime"
                style={{ borderColor: p.bg }}
              />
            </div>
            <div
              className="flex flex-col justify-between gap-4 rounded-lg border p-3.5 text-small font-semibold"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <Icon name="shop" size={18} />
              <span>Pedir no iFood</span>
            </div>
            <div
              className="flex flex-col justify-between gap-4 rounded-lg border p-3.5 text-small font-semibold"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <Icon name="map" size={18} />
              <span>Como chegar</span>
            </div>
            <div
              className="col-span-2 flex items-center justify-between rounded-lg border px-4 py-2.5 text-small font-medium"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <span>Encomendas pelo WhatsApp</span>
              <Icon name="arrow" size={15} className="opacity-60" />
            </div>
          </div>
        )}

        {demo.id === "cartao" && (
          <div className="mt-4 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div
                className="relative flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-center text-small font-semibold"
                style={{ backgroundColor: p.accent, color: p.onAccent }}
              >
                <Icon name="calendar" size={18} />
                <span>Agendar consulta</span>
                <span
                  aria-hidden
                  className="absolute -top-1.5 -right-1.5 size-4 rounded-full border-2 bg-lime"
                  style={{ borderColor: p.bg }}
                />
              </div>
              <div
                className="flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-3 text-center text-small font-semibold"
                style={{ backgroundColor: p.surface, borderColor: p.line }}
              >
                <Icon name="contact" size={18} />
                <span>Salvar contato</span>
              </div>
            </div>
            <div
              className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-small font-medium"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <span>WhatsApp da recepção</span>
              <Icon name="arrow" size={15} className="opacity-60" />
            </div>
            <div
              className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-small font-medium"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <span>Endereço do consultório</span>
              <Icon name="arrow" size={15} className="opacity-60" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-4 flex items-center justify-between border-t pt-3 text-caption"
          style={{ borderColor: p.line, color: p.muted }}
        >
          <span>linkmural.com/{demo.slug}</span>
          <span>{demo.modelTag}</span>
        </div>
      </div>

      <p className="text-center text-caption text-ink-muted">
        Toque acima para alternar entre os 3 modelos prontos.
      </p>
    </div>
  );
}
