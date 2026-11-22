"use client";

import { useActionState, useCallback, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { IconPicker } from "@/components/app/IconPicker";
import { LinkIconGlyph } from "@/components/app/LinkIconGlyph";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Alert, Badge, Button, Icon } from "@/components/ui";
import { detectLink, linkUrlSchema } from "@/lib/link-detect";
import { useLocalDraft } from "@/lib/use-local-draft";
import { saveLinksAction, type StepActionState } from "../actions";

type DefaultSlot = {
  slotKey: "whatsapp" | "instagram" | "tiktok" | "site";
  title: string;
  ctaPlaceholder: string;
  icon: string;
  placeholder: string;
};

const DEFAULT_SLOTS: DefaultSlot[] = [
  {
    slotKey: "whatsapp",
    title: "Chamar no WhatsApp",
    ctaPlaceholder: "Ex.: Chamar no WhatsApp",
    icon: "si:whatsapp",
    placeholder: "https://wa.me/5511999999999",
  },
  {
    slotKey: "instagram",
    title: "Instagram",
    ctaPlaceholder: "Ex.: Seguir no Instagram",
    icon: "si:instagram",
    placeholder: "https://instagram.com/seuperfil",
  },
  {
    slotKey: "tiktok",
    title: "TikTok",
    ctaPlaceholder: "Ex.: Vídeos no TikTok",
    icon: "si:tiktok",
    placeholder: "https://tiktok.com/@seuperfil",
  },
  {
    slotKey: "site",
    title: "Site ou YouTube",
    ctaPlaceholder: "Ex.: Meu canal / Loja oficial",
    icon: "lm:site",
    placeholder: "https://seusite.com.br",
  },
];

type LinkDraft = {
  clientKey: string;
  id?: string;
  title: string;
  ctaPlaceholder: string;
  titleEdited: boolean;
  url: string;
  icon: string;
  placeholder: string;
  isDefault?: boolean;
  error?: string;
};

function matchesSlot(
  link: { title: string; icon: string; url: string },
  slot: DefaultSlot,
): boolean {
  const lowerTitle = link.title.toLowerCase();
  const lowerUrl = link.url.toLowerCase();
  if (slot.slotKey === "whatsapp") {
    return (
      link.icon === "si:whatsapp" ||
      lowerTitle.includes("whatsapp") ||
      lowerUrl.includes("wa.me") ||
      lowerUrl.includes("whatsapp.com")
    );
  }
  if (slot.slotKey === "instagram") {
    return (
      link.icon === "si:instagram" ||
      lowerTitle.includes("instagram") ||
      lowerUrl.includes("instagram.com")
    );
  }
  if (slot.slotKey === "tiktok") {
    return (
      link.icon === "si:tiktok" ||
      lowerTitle.includes("tiktok") ||
      lowerUrl.includes("tiktok.com")
    );
  }
  return link.icon === "lm:site" || lowerTitle === "site";
}

function buildInitialDrafts(
  initialLinks: { id: string; title: string; url: string; icon: string }[],
): LinkDraft[] {
  const usedIds = new Set<string>();
  const drafts: LinkDraft[] = [];

  for (const slot of DEFAULT_SLOTS) {
    const existing = initialLinks.find(
      (l) => !usedIds.has(l.id) && matchesSlot(l, slot),
    );
    if (existing) {
      usedIds.add(existing.id);
      drafts.push({
        clientKey: existing.id,
        id: existing.id,
        title: existing.title,
        ctaPlaceholder: slot.ctaPlaceholder,
        titleEdited: true,
        url: existing.url,
        icon: existing.icon || slot.icon,
        placeholder: slot.placeholder,
        isDefault: true,
      });
    } else {
      drafts.push({
        clientKey: `default-${slot.slotKey}`,
        title: slot.title,
        ctaPlaceholder: slot.ctaPlaceholder,
        titleEdited: false,
        url: "",
        icon: slot.icon,
        placeholder: slot.placeholder,
        isDefault: true,
      });
    }
  }

  // Keep any other previously saved links below the defaults.
  for (const link of initialLinks) {
    if (usedIds.has(link.id)) continue;
    drafts.push({
      clientKey: link.id,
      id: link.id,
      title: link.title,
      ctaPlaceholder: "Texto do botão (ex.: Agendar horário)",
      titleEdited: true,
      url: link.url,
      icon: link.icon || "lm:link",
      placeholder: "https://...",
    });
  }

  return drafts;
}

function SubmitButton({
  onSkip,
  skipping,
}: {
  onSkip: () => void;
  skipping: boolean;
}) {
  const { pending } = useFormStatus();
  const busy = pending || skipping;
  return (
    <>
      <Button
        type="submit"
        form="onboarding-links-form"
        size="lg"
        className="w-full"
        loading={pending}
        disabled={skipping}
      >
        {pending ? "Salvando links…" : "Continuar"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="md"
        className="w-full"
        disabled={busy}
        onClick={onSkip}
      >
        Pular por agora
      </Button>
    </>
  );
}

const initialState: StepActionState = {};

export function LinksForm({
  slug,
  initialLinks,
}: {
  slug: string;
  initialLinks: { id: string; title: string; url: string; icon: string }[];
}) {
  const [state, formAction] = useActionState(saveLinksAction, initialState);
  const [skipping, startSkip] = useTransition();
  const [drafts, setDrafts] = useState<LinkDraft[]>(() =>
    buildInitialDrafts(initialLinks),
  );
  const [pickerTargetKey, setPickerTargetKey] = useState<string | null>(null);

  const restoreDraft = useCallback((saved: LinkDraft[]) => {
    if (Array.isArray(saved) && saved.length > 0) {
      setDrafts(saved);
    }
  }, []);
  const { clear: clearDraft } = useLocalDraft(
    `onboarding-5:${slug}`,
    drafts,
    restoreDraft,
  );

  function updateTitle(clientKey: string, nextTitle: string) {
    setDrafts((prev) =>
      prev.map((item) =>
        item.clientKey === clientKey
          ? {
              ...item,
              title: nextTitle,
              titleEdited: nextTitle.trim().length > 0,
            }
          : item,
      ),
    );
  }

  function updateUrl(clientKey: string, nextUrl: string) {
    setDrafts((prev) =>
      prev.map((item) => {
        if (item.clientKey !== clientKey) return item;
        const detected = detectLink(nextUrl);
        return {
          ...item,
          url: nextUrl,
          icon: detected ? detected.icon : item.icon,
          title: detected && !item.titleEdited ? detected.title : item.title,
          error: undefined,
        };
      }),
    );
  }

  function validateUrl(clientKey: string) {
    setDrafts((prev) =>
      prev.map((item) => {
        if (item.clientKey !== clientKey || !item.url.trim()) return item;
        const res = linkUrlSchema.safeParse(item.url);
        return {
          ...item,
          error: res.success ? undefined : res.error.issues[0]?.message,
        };
      }),
    );
  }

  function addExtraLink() {
    setDrafts((prev) => [
      ...prev,
      {
        clientKey: `extra-${Date.now()}`,
        title: "",
        ctaPlaceholder: "Texto do botão (ex.: Ver cardápio, Agendar)",
        titleEdited: false,
        url: "",
        icon: "lm:link",
        placeholder: "Cole qualquer link ou chave Pix",
      },
    ]);
  }

  function removeDraft(clientKey: string) {
    setDrafts((prev) => prev.filter((item) => item.clientKey !== clientKey));
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    const filled = drafts.filter((d) => d.url.trim().length > 0);
    let hasInvalid = false;

    const validated = drafts.map((item) => {
      if (!item.url.trim()) return { ...item, error: undefined };
      const res = linkUrlSchema.safeParse(item.url);
      if (!res.success) {
        hasInvalid = true;
        return { ...item, error: res.error.issues[0]?.message };
      }
      return { ...item, error: undefined };
    });

    if (hasInvalid) {
      e.preventDefault();
      setDrafts(validated);
      return;
    }

    const payloadInput = e.currentTarget.elements.namedItem(
      "links",
    ) as HTMLInputElement | null;
    if (payloadInput) {
      payloadInput.value = JSON.stringify(
        filled.map((item) => ({
          id: item.id,
          title: item.title.trim() || "Link",
          url: item.url.trim(),
          icon: item.icon,
        })),
      );
    }
    clearDraft();
  }

  function handleSkip() {
    clearDraft();
    const fd = new FormData();
    fd.set("skip", "1");
    startSkip(() => {
      formAction(fd);
    });
  }

  const activeCount = drafts.filter((d) => d.url.trim().length > 0).length;
  const pickerItem = pickerTargetKey
    ? drafts.find((d) => d.clientKey === pickerTargetKey)
    : null;

  return (
    <OnboardingShell
      step={5}
      title="Adicione seus primeiros links"
      subtitle="Defina o texto do botão que aparece na página e cole o endereço."
      backHref="/onboarding/4"
      slug={slug}
      footer={<SubmitButton onSkip={handleSkip} skipping={skipping} />}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-small font-medium text-ink-muted">
          Seus links principais
        </span>
        <Badge variant="neutral" dot={activeCount > 5 ? "warning" : undefined}>
          {activeCount} de 5 no Grátis
        </Badge>
      </div>

      {state.error && (
        <Alert tone="warning" title="Atenção">
          {state.error}
        </Alert>
      )}

      <form
        id="onboarding-links-form"
        action={formAction}
        onSubmit={handleFormSubmit}
        className="flex flex-col gap-3"
        noValidate
      >
        <input type="hidden" name="links" defaultValue="[]" />

        {drafts.map((item) => (
          <div
            key={item.clientKey}
            className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-3.5"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Trocar ícone de ${item.title || "link"}`}
                title="Trocar ícone"
                onClick={() => setPickerTargetKey(item.clientKey)}
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md border border-line-strong bg-paper text-ink transition-colors hover:border-ink"
              >
                <LinkIconGlyph iconRef={item.icon} size={20} />
              </button>

              <input
                type="text"
                aria-label={`Texto do botão (${item.ctaPlaceholder})`}
                placeholder={item.ctaPlaceholder}
                maxLength={80}
                value={item.title}
                onChange={(e) => updateTitle(item.clientKey, e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-3.5 text-[15px] font-semibold text-ink transition-[border-color,box-shadow] duration-(--duration-fast) ease-out placeholder:font-normal placeholder:text-ink-muted hover:border-ink-muted focus:border-ink focus:shadow-[0_0_0_3px_var(--lime)] focus:outline-none"
              />

              {!item.isDefault && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  iconOnly
                  aria-label={`Remover ${item.title || "link"}`}
                  onClick={() => removeDraft(item.clientKey)}
                >
                  <Icon name="close" size={16} />
                </Button>
              )}
            </div>

            <input
              type="url"
              inputMode="url"
              aria-label={`Endereço de ${item.title || "link"}`}
              aria-invalid={item.error ? true : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={item.placeholder}
              value={item.url}
              onChange={(e) => updateUrl(item.clientKey, e.target.value)}
              onBlur={() => validateUrl(item.clientKey)}
              className="h-10 w-full rounded-md border border-line bg-paper/70 px-3.5 text-[14px] text-ink transition-[border-color,box-shadow] duration-(--duration-fast) ease-out placeholder:text-ink-muted hover:border-ink-muted focus:border-ink focus:bg-surface focus:shadow-[0_0_0_3px_var(--lime)] focus:outline-none aria-invalid:border-negative"
            />

            {item.error && (
              <p className="flex items-center gap-1.5 text-[12.5px] leading-[18px] text-negative">
                <Icon name="warning" size={14} />
                {item.error}
              </p>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="md"
          className="mt-1 self-start"
          onClick={addExtraLink}
        >
          <Icon name="plus" size={16} />
          Adicionar outro link
        </Button>
      </form>

      <IconPicker
        open={Boolean(pickerItem)}
        value={pickerItem?.icon ?? "lm:link"}
        onSelect={(iconRef) => {
          if (!pickerTargetKey) return;
          setDrafts((prev) =>
            prev.map((d) =>
              d.clientKey === pickerTargetKey ? { ...d, icon: iconRef } : d,
            ),
          );
        }}
        onClose={() => setPickerTargetKey(null)}
      />
    </OnboardingShell>
  );
}
