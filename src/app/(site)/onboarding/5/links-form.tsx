"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Alert, Badge, Button, Chip, Icon, Input } from "@/components/ui";
import type { IconName } from "@/components/ui/icons";
import { detectLink, linkUrlSchema } from "@/lib/link-detect";
import { saveLinksAction, type StepActionState } from "../actions";

type ChipPreset = {
  key: string;
  label: string;
  icon: string;
  uiIcon: IconName;
  placeholder: string;
};

const PRESETS: ChipPreset[] = [
  {
    key: "agenda",
    label: "Agenda",
    icon: "lm:calendar",
    uiIcon: "calendar",
    placeholder: "https://calendly.com/seu-negocio",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "si:whatsapp",
    uiIcon: "chat",
    placeholder: "https://wa.me/5511999999999",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: "si:instagram",
    uiIcon: "link",
    placeholder: "https://instagram.com/seunegocio",
  },
  {
    key: "loja",
    label: "Loja",
    icon: "lm:shop",
    uiIcon: "shop",
    placeholder: "https://sualoja.com.br",
  },
  {
    key: "cardapio",
    label: "Cardápio",
    icon: "lm:menu",
    uiIcon: "menu",
    placeholder: "https://seucardapio.com.br",
  },
  {
    key: "portfolio",
    label: "Portfólio",
    icon: "lm:portfolio",
    uiIcon: "portfolio",
    placeholder: "https://behance.net/voce",
  },
  {
    key: "site",
    label: "Site",
    icon: "lm:site",
    uiIcon: "site",
    placeholder: "https://seusite.com.br",
  },
];

type LinkDraft = {
  clientKey: string;
  presetKey?: string;
  id?: string;
  title: string;
  titleEdited: boolean;
  url: string;
  icon: string;
  placeholder: string;
  error?: string;
};

function guessPresetKey(title: string, icon: string): string | undefined {
  const lower = title.toLowerCase();
  if (icon === "si:whatsapp" || lower.includes("whatsapp")) return "whatsapp";
  if (icon === "si:instagram" || lower.includes("instagram"))
    return "instagram";
  if (icon === "lm:calendar" || lower.includes("agenda")) return "agenda";
  if (icon === "lm:shop" || lower.includes("loja")) return "loja";
  if (
    icon === "lm:menu" ||
    lower.includes("cardápio") ||
    lower.includes("cardapio")
  )
    return "cardapio";
  if (
    icon === "lm:portfolio" ||
    lower.includes("portfólio") ||
    lower.includes("portfolio")
  )
    return "portfolio";
  if (icon === "lm:site" || lower.includes("site")) return "site";
  return undefined;
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
    initialLinks.map((l) => {
      const presetKey = guessPresetKey(l.title, l.icon);
      const preset = PRESETS.find((p) => p.key === presetKey);
      return {
        clientKey: l.id,
        presetKey,
        id: l.id,
        title: l.title,
        titleEdited: true,
        url: l.url,
        icon: l.icon,
        placeholder: preset?.placeholder ?? "https://...",
      };
    }),
  );

  function togglePreset(preset: ChipPreset) {
    setDrafts((prev) => {
      const exists = prev.find((d) => d.presetKey === preset.key);
      if (exists) {
        return prev.filter((d) => d.presetKey !== preset.key);
      }
      return [
        ...prev,
        {
          clientKey: `${preset.key}-${Date.now()}`,
          presetKey: preset.key,
          title: preset.label,
          titleEdited: false,
          url: "",
          icon: preset.icon,
          placeholder: preset.placeholder,
        },
      ];
    });
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

  function updateTitle(clientKey: string, nextTitle: string) {
    setDrafts((prev) =>
      prev.map((item) =>
        item.clientKey === clientKey
          ? { ...item, title: nextTitle, titleEdited: true, error: undefined }
          : item,
      ),
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
  }

  function handleSkip() {
    const fd = new FormData();
    fd.set("skip", "1");
    startSkip(() => {
      formAction(fd);
    });
  }

  const activeCount = drafts.filter((d) => d.url.trim().length > 0).length;

  return (
    <OnboardingShell
      step={5}
      title="Adicione seus primeiros links"
      subtitle="Toque nos tipos que você usa e cole os endereços. Reconhecemos o ícone automaticamente."
      backHref="/onboarding/4"
      slug={slug}
      footer={<SubmitButton onSkip={handleSkip} skipping={skipping} />}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-small font-medium text-ink-muted">
          O que você quer mostrar?
        </span>
        <Badge variant="neutral" dot={activeCount > 5 ? "warning" : undefined}>
          {activeCount} de 5 no Grátis
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const isSelected = drafts.some((d) => d.presetKey === preset.key);
          return (
            <Chip
              key={preset.key}
              selected={isSelected}
              className="min-h-11"
              onClick={() => togglePreset(preset)}
            >
              <Icon name={preset.uiIcon} size={16} />
              {preset.label}
            </Chip>
          );
        })}
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
        className="flex flex-col gap-4"
        noValidate
      >
        <input type="hidden" name="links" defaultValue="[]" />

        {drafts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface/60 px-5 py-7 text-center text-small text-ink-muted">
            Escolha um ou mais chips acima para colar seus links, ou toque em{" "}
            <strong className="text-ink">Pular por agora</strong>.
          </div>
        ) : (
          drafts.map((item) => (
            <div
              key={item.clientKey}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  aria-label={`Título do link ${item.title}`}
                  value={item.title}
                  maxLength={80}
                  onChange={(e) => updateTitle(item.clientKey, e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-small font-semibold text-ink focus:outline-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  iconOnly
                  aria-label={`Remover ${item.title}`}
                  onClick={() => removeDraft(item.clientKey)}
                >
                  <Icon name="close" size={16} />
                </Button>
              </div>

              <Input
                label="Endereço"
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={item.placeholder}
                value={item.url}
                onChange={(e) => updateUrl(item.clientKey, e.target.value)}
                onBlur={() => validateUrl(item.clientKey)}
                error={item.error}
              />
            </div>
          ))
        )}
      </form>
    </OnboardingShell>
  );
}
