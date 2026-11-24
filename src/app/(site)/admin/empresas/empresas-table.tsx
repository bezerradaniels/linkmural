"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  blockPageAction,
  reactivateUserAction,
  suspendUserAction,
  unblockPageAction,
} from "@/app/(site)/admin/actions";
import { useToast } from "@/components/ui";
import { formatMetricNumber } from "@/lib/panel-helpers";

export type EmpresaOrigin = {
  label: string;
  referer: string | null;
  campaign: string | null;
  content: string | null;
  medium: string | null;
  source: string | null;
  term: string | null;
};

export type EmpresaRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  plan: string;
  role: string;
  created_at: string;
  suspended_at: string | null;
  page_id: string | null;
  pages_count: number;
  slug: string | null;
  business_name: string | null;
  city: string | null;
  published: boolean;
  blocked: boolean;
  onboarding_step: number;
  template: string | null;
  sub_status: string | null;
  sub_interval: string | null;
  sub_period_end: string | null;
  sub_cancel_at_end: boolean;
  has_stripe: boolean;
  links_count: number;
  views_30d: number;
  clicks_30d: number;
  has_whatsapp: boolean;
  has_domain: boolean;
  origin: EmpresaOrigin;
};

export type EmpresasKpis = {
  total: number;
  subscribers: number;
  overdue: number;
  published: number;
  withLinks: number;
  withTraffic: number;
};

type SortField = "created_at" | "name" | "links_count" | "views_30d" | "clicks_30d";
type SortDir = "asc" | "desc";

type FilterState = {
  createdWindow: "all" | "today" | "7d" | "30d";
  plan: "all" | "free" | "pro" | "business";
  origin: "all" | "utm" | "direct";
  subStatus: "all" | "active" | "trialing" | "past_due" | "canceled" | "none";
  pageStatus: "all" | "published" | "draft" | "blocked" | "no_page" | "suspended";
  links: "all" | "with" | "without";
  traffic: "all" | "with" | "without";
  channels: "all" | "whatsapp" | "domain";
};

const INITIAL_FILTERS: FilterState = {
  createdWindow: "all",
  plan: "all",
  origin: "all",
  subStatus: "all",
  pageStatus: "all",
  links: "all",
  traffic: "all",
  channels: "all",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Grátis",
  pro: "Pro",
  business: "Negócios",
};

const SUB_STATUS_META: Record<
  string,
  { label: string; tone: "positive" | "warning" | "negative" | "neutral" }
> = {
  active: { label: "ATIVA", tone: "positive" },
  trialing: { label: "EM TESTE", tone: "positive" },
  past_due: { label: "PENDENTE", tone: "warning" },
  unpaid: { label: "NÃO PAGA", tone: "negative" },
  canceled: { label: "CANCELADA", tone: "neutral" },
  paused: { label: "PAUSADA", tone: "neutral" },
  incomplete: { label: "INCOMPLETA", tone: "warning" },
};

function formatCreatedPartsUtc3(iso: string): { date: string; time: string } {
  const dt = new Date(iso);
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(dt);
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
  return { date, time };
}

function formatFullDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
  }).format(new Date(iso));
}

function FilterAccordion({
  title,
  active,
  defaultOpen = false,
  children,
}: {
  title: string;
  active: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-line/70 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-1 py-2.5 text-left text-small font-medium text-ink transition-colors hover:text-ink-soft"
      >
        <span className="flex items-center gap-2">
          <span>{title}</span>
          {active && <span className="size-1.5 rounded-full bg-positive" />}
        </span>
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="flex flex-col gap-1 pb-3">{children}</div>}
    </div>
  );
}

function FilterOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-caption transition-colors ${
        selected
          ? "bg-lime-soft font-semibold text-ink"
          : "text-ink-muted hover:bg-hover hover:text-ink"
      }`}
    >
      <span
        className={`inline-grid size-3.5 shrink-0 place-items-center rounded-full border ${
          selected ? "border-ink bg-lime" : "border-line-strong bg-surface"
        }`}
      >
        {selected && <span className="size-1.5 rounded-full bg-ink" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1 whitespace-nowrap font-semibold transition-colors ${
        active ? "text-ink" : "text-ink-muted hover:text-ink"
      }`}
    >
      <span>{label}</span>
      <span className="text-[11px]" aria-hidden="true">
        {active ? (dir === "asc" ? "↑" : "↓") : "↑↓"}
      </span>
    </button>
  );
}

export function EmpresasTable({
  initialQuery,
  rows,
  kpis,
  nowMs,
}: {
  initialQuery: string;
  rows: EmpresaRow[];
  kpis: EmpresasKpis;
  nowMs: number;
}) {
  const toast = useToast();
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openMenu, setOpenMenu] = useState<{
    rowId: string;
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);
  const [activeModal, setActiveModal] = useState<{
    kind: "origin" | "plan" | "status";
    rowId: string;
  } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [, startActionTransition] = useTransition();
  const modalCardRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    function onPointerDown(e: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    function onScroll() {
      setOpenMenu(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!activeModal) return;
    function onPointerDown(e: MouseEvent) {
      if (
        modalCardRef.current &&
        !modalCardRef.current.contains(e.target as Node)
      ) {
        setActiveModal(null);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveModal(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeModal]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.createdWindow !== "all") n++;
    if (filters.plan !== "all") n++;
    if (filters.origin !== "all") n++;
    if (filters.subStatus !== "all") n++;
    if (filters.pageStatus !== "all") n++;
    if (filters.links !== "all") n++;
    if (filters.traffic !== "all") n++;
    if (filters.channels !== "all") n++;
    if (search.trim()) n++;
    return n;
  }, [filters, search]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = rows.filter((row) => {
      if (q) {
        const hay = [
          row.business_name ?? "",
          row.full_name ?? "",
          row.email ?? "",
          row.slug ?? "",
          row.city ?? "",
          row.id,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (filters.createdWindow !== "all") {
        const ageMs = nowMs - new Date(row.created_at).getTime();
        if (filters.createdWindow === "today" && ageMs > 86_400_000)
          return false;
        if (filters.createdWindow === "7d" && ageMs > 7 * 86_400_000)
          return false;
        if (filters.createdWindow === "30d" && ageMs > 30 * 86_400_000)
          return false;
      }

      if (filters.plan !== "all" && row.plan !== filters.plan) return false;

      if (filters.origin !== "all") {
        const hasUtm = Boolean(
          row.origin.source ||
            row.origin.campaign ||
            row.origin.medium ||
            row.origin.referer,
        );
        if (filters.origin === "utm" && !hasUtm) return false;
        if (filters.origin === "direct" && hasUtm) return false;
      }

      if (filters.subStatus !== "all") {
        if (filters.subStatus === "none") {
          if (row.sub_status !== null) return false;
        } else if (row.sub_status !== filters.subStatus) {
          return false;
        }
      }

      if (filters.pageStatus !== "all") {
        if (filters.pageStatus === "suspended" && !row.suspended_at)
          return false;
        if (filters.pageStatus === "no_page" && row.slug !== null) return false;
        if (filters.pageStatus === "blocked" && !row.blocked) return false;
        if (
          filters.pageStatus === "published" &&
          (!row.published || row.blocked || row.suspended_at)
        )
          return false;
        if (
          filters.pageStatus === "draft" &&
          (row.published || row.blocked || !row.slug)
        )
          return false;
      }

      if (filters.links === "with" && row.links_count === 0) return false;
      if (filters.links === "without" && row.links_count > 0) return false;

      if (
        filters.traffic === "with" &&
        row.views_30d === 0 &&
        row.clicks_30d === 0
      )
        return false;
      if (
        filters.traffic === "without" &&
        (row.views_30d > 0 || row.clicks_30d > 0)
      )
        return false;

      if (filters.channels === "whatsapp" && !row.has_whatsapp) return false;
      if (filters.channels === "domain" && !row.has_domain) return false;

      return true;
    });

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "created_at":
          cmp = a.created_at.localeCompare(b.created_at);
          break;
        case "name": {
          const na = (a.business_name || a.full_name || a.email || "").toLowerCase();
          const nb = (b.business_name || b.full_name || b.email || "").toLowerCase();
          cmp = na.localeCompare(nb, "pt-BR");
          break;
        }
        case "links_count":
          cmp = a.links_count - b.links_count;
          break;
        case "views_30d":
          cmp = a.views_30d - b.views_30d;
          break;
        case "clicks_30d":
          cmp = a.clicks_30d - b.clicks_30d;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [rows, search, filters, sortField, sortDir, nowMs]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function clearAllFilters() {
    setFilters(INITIAL_FILTERS);
    setSearch("");
  }

  function handleRefresh() {
    startRefreshTransition(() => {
      router.refresh();
    });
  }

  function runAction(
    id: string,
    fn: () => Promise<{ ok: true } | { ok: false; error: string }>,
    successMsg: string,
  ) {
    setOpenMenu(null);
    setPendingId(id);
    startActionTransition(async () => {
      const res = await fn();
      setPendingId(null);
      if (res.ok) {
        toast(successMsg);
        router.refresh();
      } else {
        toast(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-display-md tracking-[-0.03em] text-ink">
            Empresas
          </h1>
          <p className="text-small text-ink-muted">
            Pesquise contas, acompanhe a saúde das assinaturas e gerencie páginas
            publicadas.
          </p>
        </div>

        <span className="rounded-pill border border-line bg-surface px-3.5 py-1.5 text-caption font-medium text-ink-muted">
          Mostrando{" "}
          <strong className="font-semibold text-ink">
            {formatMetricNumber(filteredRows.length)}
          </strong>{" "}
          de {formatMetricNumber(rows.length)}
        </span>
      </div>

      {/* Top 6 KPI Cards (matching reference) */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <button
          type="button"
          onClick={clearAllFilters}
          className="animate-rise flex cursor-pointer flex-col gap-1.5 rounded-[18px] border border-line/80 bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md active:scale-[0.98]"
        >
          <span className="text-caption font-medium text-ink-muted">
            Empresas
          </span>
          <span className="font-display text-display-md leading-none tracking-[-0.03em] text-ink">
            {formatMetricNumber(kpis.total)}
          </span>
        </button>

        <button
          type="button"
          style={{ animationDelay: "40ms" }}
          onClick={() =>
            setFilters({ ...INITIAL_FILTERS, subStatus: "active" })
          }
          className="animate-rise flex cursor-pointer flex-col gap-1.5 rounded-[18px] border border-line/80 bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md active:scale-[0.98]"
        >
          <span className="text-caption font-medium text-ink-muted">
            Assinantes
          </span>
          <span className="font-display text-display-md leading-none tracking-[-0.03em] text-positive">
            {formatMetricNumber(kpis.subscribers)}
          </span>
        </button>

        <button
          type="button"
          style={{ animationDelay: "80ms" }}
          onClick={() =>
            setFilters({ ...INITIAL_FILTERS, pageStatus: "suspended" })
          }
          className="animate-rise flex cursor-pointer flex-col gap-1.5 rounded-[18px] border border-line/80 bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md active:scale-[0.98]"
        >
          <span className="text-caption font-medium text-ink-muted">
            Pendentes / Susp.
          </span>
          <span className="font-display text-display-md leading-none tracking-[-0.03em] text-warning">
            {formatMetricNumber(kpis.overdue)}
          </span>
        </button>

        <button
          type="button"
          style={{ animationDelay: "120ms" }}
          onClick={() =>
            setFilters({ ...INITIAL_FILTERS, pageStatus: "published" })
          }
          className="animate-rise flex cursor-pointer flex-col gap-1.5 rounded-[18px] border border-line/80 bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md active:scale-[0.98]"
        >
          <span className="text-caption font-medium text-ink-muted">
            Publicadas
          </span>
          <span className="font-display text-display-md leading-none tracking-[-0.03em] text-ink">
            {formatMetricNumber(kpis.published)}
          </span>
        </button>

        <button
          type="button"
          style={{ animationDelay: "160ms" }}
          onClick={() => setFilters({ ...INITIAL_FILTERS, links: "with" })}
          className="animate-rise flex cursor-pointer flex-col gap-1.5 rounded-[18px] border border-line/80 bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md active:scale-[0.98]"
        >
          <span className="text-caption font-medium text-ink-muted">
            Com links
          </span>
          <span className="font-display text-display-md leading-none tracking-[-0.03em] text-ink">
            {formatMetricNumber(kpis.withLinks)}
          </span>
        </button>

        <button
          type="button"
          style={{ animationDelay: "200ms" }}
          onClick={() => setFilters({ ...INITIAL_FILTERS, traffic: "with" })}
          className="animate-rise flex cursor-pointer flex-col gap-1.5 rounded-[18px] border border-line/80 bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md active:scale-[0.98]"
        >
          <span className="text-caption font-medium text-ink-muted">
            Com visitas (30d)
          </span>
          <span className="font-display text-display-md leading-none tracking-[-0.03em] text-ink">
            {formatMetricNumber(kpis.withTraffic)}
          </span>
        </button>
      </section>

      {/* Main Split: Collapsible Filters Sidebar + Data Table Card */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Left Filters Sidebar (matching reference) */}
        {filtersOpen && (
          <aside className="animate-pop-in w-full shrink-0 rounded-[20px] border border-line/80 bg-surface p-4 shadow-sm lg:w-60">
            <div className="mb-2 flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-display text-body font-semibold text-ink">
                Filtros
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="cursor-pointer text-caption font-semibold text-ink-muted hover:text-ink hover:underline"
                >
                  Limpar ({activeFiltersCount})
                </button>
              )}
            </div>

            <div className="flex flex-col">
              <FilterAccordion
                title="Data de criação"
                active={filters.createdWindow !== "all"}
                defaultOpen
              >
                {(
                  [
                    ["all", "Qualquer data"],
                    ["today", "Últimas 24h"],
                    ["7d", "Últimos 7 dias"],
                    ["30d", "Últimos 30 dias"],
                  ] as const
                ).map(([val, label]) => (
                  <FilterOption
                    key={val}
                    label={label}
                    selected={filters.createdWindow === val}
                    onClick={() =>
                      setFilters((f) => ({ ...f, createdWindow: val }))
                    }
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="Plano"
                active={filters.plan !== "all"}
                defaultOpen
              >
                {(
                  [
                    ["all", "Todos os planos"],
                    ["free", "Grátis"],
                    ["pro", "Pro"],
                    ["business", "Negócios"],
                  ] as const
                ).map(([val, label]) => (
                  <FilterOption
                    key={val}
                    label={label}
                    selected={filters.plan === val}
                    onClick={() => setFilters((f) => ({ ...f, plan: val }))}
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="Origem"
                active={filters.origin !== "all"}
              >
                {(
                  [
                    ["all", "Todas as origens"],
                    ["utm", "Com UTM / Referer"],
                    ["direct", "Acesso direto"],
                  ] as const
                ).map(([val, label]) => (
                  <FilterOption
                    key={val}
                    label={label}
                    selected={filters.origin === val}
                    onClick={() => setFilters((f) => ({ ...f, origin: val }))}
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="Status da assinatura"
                active={filters.subStatus !== "all"}
              >
                {(
                  [
                    ["all", "Todos"],
                    ["active", "Ativa"],
                    ["trialing", "Em teste"],
                    ["past_due", "Pendente"],
                    ["canceled", "Cancelada"],
                    ["none", "Sem assinatura"],
                  ] as const
                ).map(([val, label]) => (
                  <FilterOption
                    key={val}
                    label={label}
                    selected={filters.subStatus === val}
                    onClick={() =>
                      setFilters((f) => ({ ...f, subStatus: val }))
                    }
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="Status da página"
                active={filters.pageStatus !== "all"}
              >
                {(
                  [
                    ["all", "Todos"],
                    ["published", "Publicada"],
                    ["draft", "Rascunho"],
                    ["blocked", "Bloqueada"],
                    ["no_page", "Sem página"],
                    ["suspended", "Conta suspensa"],
                  ] as const
                ).map(([val, label]) => (
                  <FilterOption
                    key={val}
                    label={label}
                    selected={filters.pageStatus === val}
                    onClick={() =>
                      setFilters((f) => ({ ...f, pageStatus: val }))
                    }
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="Links criados"
                active={filters.links !== "all"}
              >
                {(
                  [
                    ["all", "Todos"],
                    ["with", "Com links ativos"],
                    ["without", "Sem links"],
                  ] as const
                ).map(([val, label]) => (
                  <FilterOption
                    key={val}
                    label={label}
                    selected={filters.links === val}
                    onClick={() => setFilters((f) => ({ ...f, links: val }))}
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="Visitas (30 dias)"
                active={filters.traffic !== "all"}
              >
                {(
                  [
                    ["all", "Todos"],
                    ["with", "Com visitas ou cliques"],
                    ["without", "Sem tráfego"],
                  ] as const
                ).map(([val, label]) => (
                  <FilterOption
                    key={val}
                    label={label}
                    selected={filters.traffic === val}
                    onClick={() => setFilters((f) => ({ ...f, traffic: val }))}
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="Canais conectados"
                active={filters.channels !== "all"}
              >
                {(
                  [
                    ["all", "Todos"],
                    ["whatsapp", "Com WhatsApp/Telefone"],
                    ["domain", "Com domínio próprio"],
                  ] as const
                ).map(([val, label]) => (
                  <FilterOption
                    key={val}
                    label={label}
                    selected={filters.channels === val}
                    onClick={() => setFilters((f) => ({ ...f, channels: val }))}
                  />
                ))}
              </FilterAccordion>
            </div>
          </aside>
        )}

        {/* Right Table Card */}
        <section
          style={{ animationDelay: "140ms" }}
          className="animate-rise flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-line/80 bg-surface shadow-sm"
        >
          {/* Table Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <div className="flex flex-1 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-label={
                  filtersOpen ? "Ocultar filtros" : "Mostrar filtros"
                }
                title={filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
                className={`inline-grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border transition-colors ${
                  filtersOpen
                    ? "border-ink bg-paper text-ink"
                    : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={16}
                  height={16}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 4v16" />
                </svg>
              </button>

              <div className="relative max-w-xs flex-1">
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                >
                  <path d="M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M20 20l-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar empresa, e-mail, /slug..."
                  aria-label="Buscar empresa, e-mail ou endereço"
                  className="min-h-10 w-full rounded-xl border border-line bg-paper pr-3 pl-8.5 text-small text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-caption font-semibold text-ink transition-colors hover:border-line-strong hover:bg-hover disabled:opacity-60"
              >
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={isRefreshing ? "animate-spin" : ""}
                >
                  <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5" />
                </svg>
                <span>Atualizar</span>
              </button>

              <button
                type="button"
                onClick={clearAllFilters}
                disabled={activeFiltersCount === 0}
                className="inline-flex min-h-10 cursor-pointer items-center rounded-xl border border-line bg-surface px-3 text-caption font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-small">
              <thead>
                <tr className="border-b border-line bg-paper/70 text-caption text-ink-muted">
                  <th className="py-3 pr-3 pl-4 font-semibold">
                    <SortButton
                      label="Criada UTC-3"
                      active={sortField === "created_at"}
                      dir={sortDir}
                      onClick={() => toggleSort("created_at")}
                    />
                  </th>
                  <th className="py-3 pr-3 font-semibold">
                    <SortButton
                      label="Empresa"
                      active={sortField === "name"}
                      dir={sortDir}
                      onClick={() => toggleSort("name")}
                    />
                  </th>
                  <th className="py-3 pr-3 text-center font-semibold">
                    Origem
                  </th>
                  <th className="py-3 pr-3 text-center font-semibold">
                    Plano
                  </th>
                  <th className="py-3 pr-3 text-center font-semibold">
                    Status
                  </th>
                  <th className="py-3 pr-3 text-center font-semibold">
                    <SortButton
                      label="Links"
                      active={sortField === "links_count"}
                      dir={sortDir}
                      onClick={() => toggleSort("links_count")}
                    />
                  </th>
                  <th className="py-3 pr-3 text-center font-semibold">
                    <SortButton
                      label="Visitas"
                      active={sortField === "views_30d"}
                      dir={sortDir}
                      onClick={() => toggleSort("views_30d")}
                    />
                  </th>
                  <th className="py-3 pr-3 text-center font-semibold">
                    <SortButton
                      label="Cliques"
                      active={sortField === "clicks_30d"}
                      dir={sortDir}
                      onClick={() => toggleSort("clicks_30d")}
                    />
                  </th>
                  <th className="py-3 pr-4 text-right font-semibold">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line/80">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-small text-ink-muted"
                    >
                      Nenhuma empresa encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const displayName =
                      row.business_name || row.full_name || row.email || row.id;
                    const createdParts = formatCreatedPartsUtc3(row.created_at);
                    const statusBadge = row.suspended_at
                      ? {
                          label: "SUSPENSA",
                          cls: "bg-negative-soft text-negative",
                        }
                      : row.blocked
                        ? {
                            label: "BLOQUEADA",
                            cls: "bg-negative-soft text-negative",
                          }
                        : row.published
                          ? {
                              label: "ATIVA",
                              cls: "bg-positive-soft text-positive",
                            }
                          : row.slug
                            ? {
                                label: "RASCUNHO",
                                cls: "bg-warning-soft text-warning",
                              }
                            : null;

                    const subMeta = row.sub_status
                      ? (SUB_STATUS_META[row.sub_status] ?? {
                          label: row.sub_status.toUpperCase(),
                          tone: "neutral" as const,
                        })
                      : null;

                    const statusPill = subMeta
                      ? {
                          label: row.sub_cancel_at_end
                            ? "CANCEL. AGEND."
                            : subMeta.label,
                          cls:
                            subMeta.tone === "positive"
                              ? "bg-positive-soft text-positive"
                              : subMeta.tone === "warning"
                                ? "bg-warning-soft text-warning"
                                : subMeta.tone === "negative"
                                  ? "bg-negative-soft text-negative"
                                  : "bg-paper text-ink-muted",
                        }
                      : row.published
                        ? {
                            label: "PUBLICADA",
                            cls: "bg-positive-soft text-positive",
                          }
                        : {
                            label: "ONBOARDING",
                            cls: "bg-paper text-ink-soft",
                          };

                    const isBusy = pendingId === row.id;

                    return (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-paper/45"
                      >
                        {/* Criada UTC-3 (two lines) */}
                        <td className="py-3.5 pr-3 pl-4 align-middle whitespace-nowrap text-caption">
                          <div className="flex flex-col leading-tight">
                            <span className="font-medium text-ink">
                              {createdParts.date}
                            </span>
                            <span className="text-ink-muted">
                              {createdParts.time}
                            </span>
                          </div>
                        </td>

                        {/* Empresa */}
                        <td className="max-w-[270px] py-3.5 pr-3 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate font-semibold text-ink">
                              {displayName}
                            </span>
                            {statusBadge && (
                              <span
                                className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[10px] font-bold tracking-wide ${statusBadge.cls}`}
                              >
                                {statusBadge.label}
                              </span>
                            )}
                            {row.role === "admin" && (
                              <span className="inline-flex items-center rounded-pill bg-ink px-2 py-0.5 text-[10px] font-bold text-paper">
                                ADMIN
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-col gap-0.5 text-caption text-ink-muted">
                            <span className="truncate">
                              Página:{" "}
                              {row.slug ? (
                                <Link
                                  href={`/${row.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-ink hover:underline"
                                >
                                  /{row.slug}
                                </Link>
                              ) : (
                                "—"
                              )}
                              {row.city ? ` · ${row.city}` : ""}
                            </span>
                            <span className="truncate">
                              E-mail: {row.email ?? "—"}
                            </span>
                          </div>
                        </td>

                        {/* Origem (pill + mini modal) */}
                        <td className="py-3.5 pr-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveModal({ kind: "origin", rowId: row.id })
                            }
                            aria-haspopup="dialog"
                            className={`inline-flex min-h-7 max-w-[120px] cursor-pointer items-center justify-center truncate rounded-pill border px-3 py-1 text-caption font-medium transition-colors ${
                              activeModal?.kind === "origin" &&
                              activeModal.rowId === row.id
                                ? "border-ink bg-lime text-on-lime"
                                : row.origin.source || row.origin.referer
                                  ? "border-line-strong bg-paper text-ink hover:border-ink"
                                  : "border-line bg-paper/60 text-ink-muted hover:border-line-strong hover:text-ink"
                            }`}
                          >
                            <span className="truncate">{row.origin.label}</span>
                          </button>
                        </td>

                        {/* Plano (pill only + mini modal) */}
                        <td className="py-3.5 pr-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveModal({ kind: "plan", rowId: row.id })
                            }
                            aria-haspopup="dialog"
                            className={`inline-flex min-h-7 cursor-pointer items-center rounded-pill px-3 py-1 text-caption font-semibold transition-opacity hover:opacity-85 ${
                              row.plan === "business"
                                ? "bg-lime text-on-lime"
                                : row.plan === "pro"
                                  ? "bg-positive-soft text-positive"
                                  : "border border-line bg-paper text-ink-soft hover:border-line-strong"
                            }`}
                          >
                            {PLAN_LABELS[row.plan] ?? row.plan}
                          </button>
                        </td>

                        {/* Status (pill + mini modal) */}
                        <td className="py-3.5 pr-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveModal({ kind: "status", rowId: row.id })
                            }
                            aria-haspopup="dialog"
                            className={`inline-flex min-h-7 cursor-pointer items-center rounded-pill px-3 py-1 text-[11px] font-bold tracking-wide transition-opacity hover:opacity-85 ${statusPill.cls}`}
                          >
                            {statusPill.label}
                          </button>
                        </td>

                        {/* Links */}
                        <td className="py-3.5 pr-3 text-center align-middle font-medium text-ink">
                          {formatMetricNumber(row.links_count)}
                        </td>

                        {/* Visitas */}
                        <td className="py-3.5 pr-3 text-center align-middle font-medium text-ink">
                          {formatMetricNumber(row.views_30d)}
                        </td>

                        {/* Cliques */}
                        <td className="py-3.5 pr-3 text-center align-middle font-medium text-ink">
                          {formatMetricNumber(row.clicks_30d)}
                        </td>

                        {/* Ações (...) */}
                        <td className="py-3.5 pr-4 text-right align-middle">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={(e) => {
                              if (openMenu?.rowId === row.id) {
                                setOpenMenu(null);
                                return;
                              }
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const menuWidth = 192;
                              const menuEstHeight = 148;
                              const openUp =
                                window.innerHeight - rect.bottom <
                                menuEstHeight + 12;
                              const left = Math.max(
                                12,
                                Math.min(
                                  window.innerWidth - menuWidth - 12,
                                  rect.right - menuWidth,
                                ),
                              );
                              const top = openUp
                                ? rect.top - 6
                                : rect.bottom + 6;
                              setOpenMenu({
                                rowId: row.id,
                                top,
                                left,
                                openUp,
                              });
                            }}
                            aria-label={`Ações para ${displayName}`}
                            aria-expanded={openMenu?.rowId === row.id}
                            className="inline-grid size-9 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors hover:bg-hover hover:text-ink disabled:opacity-40"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width={16}
                              height={16}
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <circle cx="5" cy="12" r="1.7" />
                              <circle cx="12" cy="12" r="1.7" />
                              <circle cx="19" cy="12" r="1.7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Fixed Floating Row Action Menu (never clipped by table overflow) */}
      {(() => {
        const menuRow = openMenu
          ? rows.find((r) => r.id === openMenu.rowId)
          : null;
        if (!openMenu || !menuRow) return null;
        return (
          <div
            ref={actionMenuRef}
            role="menu"
            style={{
              top: openMenu.top,
              left: openMenu.left,
              transform: openMenu.openUp ? "translateY(-100%)" : undefined,
            }}
            className="animate-pop-in fixed z-50 flex w-48 flex-col gap-0.5 rounded-2xl border border-line bg-surface p-1.5 text-left shadow-lg"
          >
            {menuRow.page_id && (
              <Link
                href={`/editor/${menuRow.page_id}`}
                onClick={() => setOpenMenu(null)}
                className="flex min-h-9 items-center rounded-xl px-3 text-caption font-medium text-ink hover:bg-hover"
              >
                Abrir no Editor Visual
              </Link>
            )}

            {menuRow.slug && (
              <Link
                href={`/${menuRow.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpenMenu(null)}
                className="flex min-h-9 items-center rounded-xl px-3 text-caption font-medium text-ink hover:bg-hover"
              >
                Abrir página pública ↗
              </Link>
            )}

            {menuRow.page_id && (
              <button
                type="button"
                onClick={() =>
                  menuRow.blocked
                    ? runAction(
                        menuRow.id,
                        () => unblockPageAction(menuRow.page_id!),
                        "Página desbloqueada",
                      )
                    : runAction(
                        menuRow.id,
                        () => blockPageAction(menuRow.page_id!),
                        "Página bloqueada",
                      )
                }
                className="flex min-h-9 w-full cursor-pointer items-center rounded-xl px-3 text-left text-caption font-medium text-ink hover:bg-hover"
              >
                {menuRow.blocked ? "Desbloquear página" : "Bloquear página"}
              </button>
            )}

            {menuRow.role !== "admin" && (
              <button
                type="button"
                onClick={() =>
                  menuRow.suspended_at
                    ? runAction(
                        menuRow.id,
                        () => reactivateUserAction(menuRow.id),
                        "Conta reativada",
                      )
                    : runAction(
                        menuRow.id,
                        () => suspendUserAction(menuRow.id),
                        "Conta suspensa",
                      )
                }
                className={`flex min-h-9 w-full cursor-pointer items-center rounded-xl px-3 text-left text-caption font-semibold hover:bg-hover ${
                  menuRow.suspended_at ? "text-positive" : "text-negative"
                }`}
              >
                {menuRow.suspended_at ? "Reativar conta" : "Suspender conta"}
              </button>
            )}
          </div>
        );
      })()}

      {/* Mini Modals: Origin / Plan / Status */}
      {(() => {
        const activeRow = activeModal
          ? rows.find((r) => r.id === activeModal.rowId)
          : null;
        if (!activeModal || !activeRow) return null;

        const activeName =
          activeRow.business_name ||
          activeRow.full_name ||
          activeRow.email ||
          activeRow.id;

        const modalTitle =
          activeModal.kind === "origin"
            ? "Detalhes da origem"
            : activeModal.kind === "plan"
              ? "Detalhes do plano"
              : "Detalhes do status";

        const subMeta = activeRow.sub_status
          ? (SUB_STATUS_META[activeRow.sub_status]?.label ??
            activeRow.sub_status)
          : "Sem assinatura";

        const onboardingStep = Math.min(7, activeRow.onboarding_step);
        const onboardingPct = Math.min(
          100,
          Math.round((onboardingStep / 7) * 100),
        );

        const entries: readonly (readonly [string, string | null])[] =
          activeModal.kind === "origin"
            ? [
                ["Referer", activeRow.origin.referer],
                ["Campaign", activeRow.origin.campaign],
                ["Content", activeRow.origin.content],
                ["Medium", activeRow.origin.medium],
                ["Source", activeRow.origin.source],
                ["Term", activeRow.origin.term],
              ]
            : activeModal.kind === "plan"
              ? [
                  ["Plano", PLAN_LABELS[activeRow.plan] ?? activeRow.plan],
                  [
                    "Cobrança",
                    activeRow.has_stripe
                      ? activeRow.sub_interval === "year"
                        ? "Stripe · Anual"
                        : "Stripe · Mensal"
                      : "Gratuito",
                  ],
                  ["Assinatura", subMeta],
                  ["Período até", formatFullDate(activeRow.sub_period_end)],
                  [
                    "Cancelamento",
                    activeRow.sub_cancel_at_end ? "Agendado" : "Não",
                  ],
                  ["Páginas", String(activeRow.pages_count)],
                ]
              : [
                  ["Conta", activeRow.suspended_at ? "Suspensa" : "Ativa"],
                  [
                    "Página",
                    activeRow.blocked
                      ? "Bloqueada"
                      : activeRow.published
                        ? "Publicada"
                        : activeRow.slug
                          ? "Rascunho"
                          : "Sem página",
                  ],
                  ["Assinatura", subMeta],
                  ["Modelo", activeRow.template ?? "—"],
                  [
                    "WhatsApp",
                    activeRow.has_whatsapp ? "Configurado" : "Não configurado",
                  ],
                  [
                    "Domínio próprio",
                    activeRow.has_domain ? "Conectado" : "linkmural.com",
                  ],
                ];

        return (
          <div className="animate-fade-in fixed inset-0 z-50 grid place-items-center bg-overlay/35 p-4 backdrop-blur-[1px]">
            <div
              ref={modalCardRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${modalTitle} de ${activeName}`}
              className="animate-pop-in w-full max-w-md rounded-2xl border border-line bg-surface p-5 text-left shadow-lg"
            >
              <div className="mb-3.5 flex items-start justify-between gap-3 border-b border-line pb-3">
                <div className="min-w-0">
                  <h3 className="font-display text-body font-semibold text-ink">
                    {modalTitle}
                  </h3>
                  <p className="truncate text-caption text-ink-muted">
                    {activeName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label={`Fechar ${modalTitle.toLowerCase()}`}
                  className="inline-grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors hover:bg-hover hover:text-ink"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={15}
                    height={15}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              {activeModal.kind === "status" && (
                <div className="mb-4 rounded-xl border border-line bg-paper p-3">
                  <div className="mb-1.5 flex items-center justify-between text-caption">
                    <span className="font-medium text-ink-soft">
                      Progresso do onboarding
                    </span>
                    <span className="font-semibold text-ink">
                      Passo {onboardingStep} de 7 ({onboardingPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-pill bg-surface">
                    <div
                      className="h-full rounded-pill bg-positive transition-all"
                      style={{ width: `${onboardingPct}%` }}
                    />
                  </div>
                </div>
              )}

              <dl className="flex flex-col gap-2.5 text-small">
                {entries.map(([label, val]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[110px_1fr] items-start gap-3"
                  >
                    <dt className="text-caption font-medium text-ink-muted">
                      {label}
                    </dt>
                    <dd
                      className={`text-right text-caption break-all ${
                        val ? "font-medium text-ink" : "text-ink-muted/60"
                      }`}
                    >
                      {val ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
