"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { saveAppearanceAction } from "@/app/(site)/app/actions/appearance";
import { PhonePreview } from "@/components/app/PhonePreview";
import { UnsplashPicker } from "@/components/app/UnsplashPicker";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  DraftNotice,
  Icon,
  Segmented,
  Switch,
  useToast,
} from "@/components/ui";
import { planInfo, type Plan } from "@/lib/plans";
import { trackGaEvent } from "@/lib/gtm";
import { publicFont } from "@/lib/public-fonts";
import type { PublicPage } from "@/lib/public-page";
import { useLocalDraft } from "@/lib/use-local-draft";
import {
  BG_DOODLES,
  BG_GRADIENTS,
  BG_IMAGE_PRESETS,
  CARD_EFFECTS,
  CARD_FILLS,
  CARD_SIZES,
  COVER_HEIGHTS,
  COVER_STYLES,
  FONTS,
  HEADER_ALIGNS,
  LOGO_SHAPES,
  LOGO_SIZES,
  RADIUS,
  STYLE_KEYS,
  STYLES,
  TEMPLATE_DEFAULTS,
  TEMPLATES,
  type BgDoodleKey,
  type BgGradientKey,
  type BgImagePresetKey,
  type BgType,
  type CardEffect,
  type CardFill,
  type CardSize,
  type CoverHeightKey,
  type CoverStyleKey,
  type FontName,
  type HeaderAlignKey,
  type LogoShapeKey,
  type LogoSizeKey,
  type StyleKey,
  type TemplateKey,
} from "@/lib/styles";
import type { Theme } from "@/lib/theme";
import { createClient } from "@/utils/supabase/client";

type AppearanceSection = "cabecalho" | "cards" | "estilo";

const MAX_LOGO_PX = 512;
const MAX_COVER_PX = 1280;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

async function resizeImage(
  file: File,
  maxPx: number,
): Promise<{
  blob: Blob;
  ext: "webp" | "jpg";
  contentType: string;
}> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas_unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const webp = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/webp", 0.86),
    );
    if (webp && webp.type === "image/webp") {
      return { blob: webp, ext: "webp", contentType: "image/webp" };
    }
    const jpg = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", 0.88),
    );
    if (!jpg) throw new Error("encode_failed");
    return { blob: jpg, ext: "jpg", contentType: "image/jpeg" };
  } finally {
    bitmap.close();
  }
}

export function AppearanceForm({
  userId,
  pageId,
  initialTemplate,
  initialStyle,
  initialTheme,
  initialShowBranding,
  initialAvatarPath,
  initialAvatarUrl,
  initialCoverPath,
  initialCoverUrl,
  previewBase,
  pageUrl,
  plan,
}: {
  userId: string;
  pageId: string;
  initialTemplate: TemplateKey;
  initialStyle: StyleKey;
  initialTheme: Theme;
  initialShowBranding: boolean;
  initialAvatarPath: string;
  initialAvatarUrl: string | null;
  initialCoverPath: string;
  initialCoverUrl: string | null;
  previewBase: PublicPage;
  pageUrl: string;
  plan: Plan;
}) {
  const toast = useToast();
  const limits = planInfo(plan);
  const [activeTab, setActiveTab] = useState<AppearanceSection>("cabecalho");
  const [template, setTemplate] = useState<TemplateKey>(initialTemplate);
  const [style, setStyle] = useState<StyleKey>(initialStyle);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [showBranding, setShowBranding] =
    useState<boolean>(initialShowBranding);

  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialAvatarUrl,
  );
  const [coverPath, setCoverPath] = useState(initialCoverPath);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialCoverUrl,
  );

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [unsplashTarget, setUnsplashTarget] = useState<
    "cover" | "background" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const tplDefaults = TEMPLATE_DEFAULTS[template];

  const appearanceDraft = useMemo(
    () => ({
      template,
      style,
      theme,
      showBranding,
      avatarPath,
      avatarPreview,
      coverPath,
      coverPreview,
    }),
    [
      template,
      style,
      theme,
      showBranding,
      avatarPath,
      avatarPreview,
      coverPath,
      coverPreview,
    ],
  );
  const restoreDraft = useCallback((d: typeof appearanceDraft) => {
    if (d.template) setTemplate(d.template);
    if (d.style) setStyle(d.style);
    if (d.theme && typeof d.theme === "object") setTheme(d.theme);
    if (typeof d.showBranding === "boolean") setShowBranding(d.showBranding);
    if (typeof d.avatarPath === "string") setAvatarPath(d.avatarPath);
    if (d.avatarPreview !== undefined) setAvatarPreview(d.avatarPreview);
    if (typeof d.coverPath === "string") setCoverPath(d.coverPath);
    if (d.coverPreview !== undefined) setCoverPreview(d.coverPreview);
  }, []);
  const {
    clear: clearDraft,
    discard: discardDraft,
    restored: draftRestored,
  } = useLocalDraft(
    `panel-appearance:${previewBase.id}`,
    appearanceDraft,
    restoreDraft,
  );

  async function handleUploadMedia(
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "logo" | "cover",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (!ALLOWED_TYPES.has(file.type)) {
      setUploadError("Envie uma imagem PNG, JPG ou WEBP.");
      return;
    }

    const setBusy = kind === "logo" ? setUploadingLogo : setUploadingCover;
    const inputRef = kind === "logo" ? logoInputRef : coverInputRef;
    setBusy(true);

    try {
      const { blob, ext, contentType } = await resizeImage(
        file,
        kind === "logo" ? MAX_LOGO_PX : MAX_COVER_PX,
      );
      if (blob.size > MAX_UPLOAD_BYTES) {
        setUploadError("A imagem ficou acima de 2 MB.");
        setBusy(false);
        return;
      }
      const path = `${userId}/${pageId}-${kind}-${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, blob, { contentType, upsert: true });
      if (upErr) {
        setUploadError(
          kind === "logo"
            ? "Não conseguimos enviar o logo agora."
            : "Não conseguimos enviar a capa agora.",
        );
        setBusy(false);
        return;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      if (kind === "logo") {
        setAvatarPath(path);
        setAvatarPreview(data.publicUrl);
      } else {
        setCoverPath(path);
        setCoverPreview(data.publicUrl);
      }
    } catch {
      setUploadError("Não foi possível processar essa imagem.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function resetHeaderToTemplate() {
    setTheme((prev) => {
      const next = { ...prev };
      delete next.coverHeight;
      delete next.coverStyle;
      delete next.logoShape;
      delete next.logoSize;
      delete next.headerAlign;
      return next;
    });
    toast(`Padrão do modelo ${TEMPLATES[template]} aplicado ao cabeçalho`);
  }

  function resetCardsToTemplate() {
    setTheme((prev) => {
      const next = { ...prev };
      delete next.cardEffect;
      delete next.cardSize;
      delete next.cardFill;
      delete next.radius;
      return next;
    });
    toast(`Padrão do modelo ${TEMPLATES[template]} aplicado aos cards`);
  }

  const hasHeaderOverrides = Boolean(
    theme.coverHeight ||
      theme.coverStyle ||
      theme.logoShape ||
      theme.logoSize ||
      theme.headerAlign,
  );
  const hasCardOverrides = Boolean(
    theme.cardEffect ||
      theme.cardSize ||
      theme.cardFill ||
      theme.radius !== undefined,
  );

  function handleSave() {
    setError(null);
    startSaving(async () => {
      const res = await saveAppearanceAction({
        template,
        style,
        theme,
        show_branding: showBranding,
        avatar_path: avatarPath,
        cover_path: coverPath,
      });
      if (res.ok) {
        trackGaEvent("aparencia_salva", {
          modelo: template,
          estilo: style,
          plano: plan,
        });
        clearDraft();
        toast("Salvo");
      } else {
        setError(res.error);
      }
    });
  }

  const livePreview: PublicPage = {
    ...previewBase,
    template,
    style,
    theme,
    avatarUrl: avatarPreview,
    coverUrl: coverPreview,
    show_branding: limits.removeBranding ? showBranding : true,
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-display-md tracking-[-0.03em]">
              Aparência
            </h1>
            <p className="text-small text-ink-muted">
              Personalize o modelo, o cabeçalho (logo e capa), os cards de links
              e o fundo da sua página.
            </p>
          </div>
          <Button
            size="md"
            loading={saving}
            disabled={uploadingLogo || uploadingCover}
            onClick={handleSave}
          >
            {saving ? "Salvando…" : "Salvar aparência"}
          </Button>
        </div>

        {draftRestored && <DraftNotice onDiscard={discardDraft} />}

        {error && (
          <Alert tone="error" title="Não foi possível salvar">
            {error}
          </Alert>
        )}

        {/* 1. Template Base Selector (always visible at top) */}
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-small font-semibold">Modelo base</h2>
              <p className="text-caption text-ink-muted">
                {tplDefaults.description}
              </p>
            </div>
            <Badge variant="neutral">Base: {TEMPLATES[template]}</Badge>
          </div>
          <Segmented<TemplateKey>
            label="Modelo da página"
            value={template}
            onChange={setTemplate}
            options={(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => ({
              value: key,
              label: TEMPLATES[key],
            }))}
          />
        </section>

        {/* 2. Section Tabs: Logo & Capa | Cards dos Links | Estilo & Fundo */}
        <div
          role="tablist"
          aria-label="Áreas de edição da aparência"
          className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-surface p-1.5"
        >
          {(
            [
              {
                id: "cabecalho",
                label: "Logo & Capa",
                sub: "Cabeçalho do modelo",
              },
              {
                id: "cards",
                label: "Cards dos Links",
                sub: "Bento, efeitos e cantos",
              },
              {
                id: "estilo",
                label: "Estilo & Fundo",
                sub: "Cores, fonte e fundo",
              },
            ] as { id: AppearanceSection; label: string; sub: string }[]
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-lg px-3 py-2 text-center transition-colors ${
                  active
                    ? "bg-ink text-paper shadow-xs"
                    : "bg-transparent text-ink hover:bg-paper"
                }`}
              >
                <span className="text-small font-semibold">{tab.label}</span>
                <span
                  className={`hidden text-[11px] sm:inline ${
                    active ? "text-paper/75" : "text-ink-muted"
                  }`}
                >
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: LOGO & CAPA */}
        {activeTab === "cabecalho" && (
          <div className="flex flex-col gap-5">
            {uploadError && (
              <Alert tone="error" title="Upload de imagem">
                {uploadError}
              </Alert>
            )}

            {/* Upload de Logo e Capa */}
            <section className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5">
              <div>
                <h2 className="text-small font-semibold">
                  Imagens de Logo e Capa
                </h2>
                <p className="text-caption text-ink-muted">
                  Todos os modelos exibem sua capa no topo com o logo em
                  destaque.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Logo Box */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-line bg-paper p-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      src={avatarPreview}
                      name={previewBase.business_name || previewBase.slug}
                      size={64}
                      square={
                        (theme.logoShape ?? tplDefaults.header.logoShape) !==
                        "circle"
                      }
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="text-small font-semibold">
                        Logo / Foto de perfil
                      </span>
                      <span className="text-caption text-ink-muted">
                        PNG, JPG ou WEBP (quadrada recomendada).
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => handleUploadMedia(e, "logo")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={uploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {avatarPreview ? "Trocar logo" : "Enviar logo"}
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAvatarPath("");
                          setAvatarPreview(null);
                        }}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>

                {/* Cover Box */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-line bg-paper p-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="relative h-[60px] w-24 shrink-0 overflow-hidden rounded-md border border-line"
                      style={{
                        backgroundColor:
                          theme.accent ?? STYLES[style].palette.accent,
                      }}
                    >
                      {coverPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverPreview}
                          alt="Prévia da capa"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-[11px] font-semibold text-ink/70">
                          Cor do tema
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-small font-semibold">
                        Imagem de Capa
                      </span>
                      <span className="text-caption text-ink-muted">
                        Horizontal (1200×480px). Sem foto, usa a cor de acento.
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => handleUploadMedia(e, "cover")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={uploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {coverPreview ? "Trocar capa" : "Enviar capa"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setUnsplashTarget("cover")}
                    >
                      Buscar no Unsplash
                    </Button>
                    {coverPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCoverPath("");
                          setCoverPreview(null);
                        }}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Customização visual do Logo & Capa baseada no Template */}
            <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-small font-semibold">
                    Formato do cabeçalho ({TEMPLATES[template]})
                  </h2>
                  <p className="text-caption text-ink-muted">
                    Ajuste o posicionamento, formato do logo e estilo da capa
                    sobre a estrutura do modelo {TEMPLATES[template]}.
                  </p>
                </div>
                {hasHeaderOverrides && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetHeaderToTemplate}
                  >
                    Restaurar padrão de {TEMPLATES[template]}
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-small font-semibold">
                  Alinhamento do logo e título
                </span>
                <Segmented<HeaderAlignKey>
                  label="Alinhamento do cabeçalho"
                  value={theme.headerAlign ?? tplDefaults.header.headerAlign}
                  onChange={(headerAlign) =>
                    setTheme((p) => ({ ...p, headerAlign }))
                  }
                  options={(Object.keys(HEADER_ALIGNS) as HeaderAlignKey[]).map(
                    (k) => ({
                      value: k,
                      label: HEADER_ALIGNS[k],
                    }),
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-small font-semibold">
                    Formato do logo
                  </span>
                  <Segmented<LogoShapeKey>
                    label="Formato do logo"
                    value={theme.logoShape ?? tplDefaults.header.logoShape}
                    onChange={(logoShape) =>
                      setTheme((p) => ({ ...p, logoShape }))
                    }
                    options={(Object.keys(LOGO_SHAPES) as LogoShapeKey[]).map(
                      (k) => ({
                        value: k,
                        label: LOGO_SHAPES[k],
                      }),
                    )}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-small font-semibold">
                    Tamanho do logo
                  </span>
                  <Segmented<LogoSizeKey>
                    label="Tamanho do logo"
                    value={theme.logoSize ?? tplDefaults.header.logoSize}
                    onChange={(logoSize) =>
                      setTheme((p) => ({ ...p, logoSize }))
                    }
                    options={(Object.keys(LOGO_SIZES) as LogoSizeKey[]).map(
                      (k) => ({
                        value: k,
                        label: LOGO_SIZES[k].label,
                      }),
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-small font-semibold">
                    Altura da capa
                  </span>
                  <Segmented<CoverHeightKey>
                    label="Altura da capa"
                    value={theme.coverHeight ?? tplDefaults.header.coverHeight}
                    onChange={(coverHeight) =>
                      setTheme((p) => ({ ...p, coverHeight }))
                    }
                    options={(
                      Object.keys(COVER_HEIGHTS) as CoverHeightKey[]
                    ).map((k) => ({
                      value: k,
                      label: COVER_HEIGHTS[k].label,
                    }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-small font-semibold">
                    Acabamento da capa
                  </span>
                  <Segmented<CoverStyleKey>
                    label="Acabamento da capa"
                    value={theme.coverStyle ?? tplDefaults.header.coverStyle}
                    onChange={(coverStyle) =>
                      setTheme((p) => ({ ...p, coverStyle }))
                    }
                    options={(Object.keys(COVER_STYLES) as CoverStyleKey[]).map(
                      (k) => ({
                        value: k,
                        label: COVER_STYLES[k],
                      }),
                    )}
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: CARDS DOS LINKS */}
        {activeTab === "cards" && (
          <div className="flex flex-col gap-5">
            {/* Cor dos ícones (todos os planos) */}
            <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
              <div>
                <h2 className="text-small font-semibold">
                  Ícones dos cards ({TEMPLATES[template]})
                </h2>
                <p className="text-caption text-ink-muted">
                  Escolha entre exibir a cor oficial de cada rede social ou
                  seguir a paleta do estilo.
                </p>
              </div>
              <Segmented<"brand" | "style">
                label="Cor dos ícones"
                value={theme.iconColor ?? "brand"}
                onChange={(iconColor) =>
                  setTheme((prev) => ({ ...prev, iconColor }))
                }
                options={[
                  { value: "brand", label: "Cor oficial" },
                  { value: "style", label: "Cor do estilo" },
                ]}
              />
            </section>

            {/* Estilo visual dos cards (Pro+) */}
            <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-small font-semibold">
                    Design dos cards ({TEMPLATES[template]})
                  </h2>
                  <p className="text-caption text-ink-muted">
                    Efeitos de transparência (glass) e glossy, preenchimento,
                    densidade e arredondamento baseados no modelo{" "}
                    {TEMPLATES[template]}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {limits.customTheme && hasCardOverrides && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetCardsToTemplate}
                    >
                      Restaurar padrão de {TEMPLATES[template]}
                    </Button>
                  )}
                  {!limits.customTheme && (
                    <Link
                      href="/app/plano"
                      className="inline-flex min-h-11 items-center gap-1.5"
                    >
                      <Badge variant="pro">
                        <Icon name="lock" size={12} />
                        Pro
                      </Badge>
                    </Link>
                  )}
                </div>
              </div>

              {!limits.customTheme ? (
                <div className="flex flex-col gap-3 rounded-lg border border-dashed border-line-strong bg-paper p-4">
                  <p className="text-small text-ink-muted">
                    No plano Grátis, os cards seguem o formato padrão em barra
                    (logo, texto de CTA e seta). No <strong>Pro</strong>, você
                    libera:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 opacity-60 sm:grid-cols-3">
                    <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                      <Icon name="lock" size={14} /> Transparência e Glossy
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                      <Icon name="lock" size={14} /> Cards 1×1 e 2×2 no grid
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                      <Icon name="lock" size={14} /> Preenchimento e Contorno
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                      <Icon name="lock" size={14} /> Densidade do card
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                      <Icon name="lock" size={14} /> Cantos (0–32 px)
                    </div>
                  </div>
                  <Link
                    href="/app/plano"
                    className="self-start text-small font-semibold underline underline-offset-2"
                  >
                    Desbloquear customização de cards no Pro →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-small font-semibold">
                      Efeito visual (Transparência / Glossy)
                    </span>
                    <Segmented<CardEffect>
                      label="Efeito dos cards"
                      value={theme.cardEffect ?? tplDefaults.cards.cardEffect}
                      onChange={(cardEffect) =>
                        setTheme((p) => ({ ...p, cardEffect }))
                      }
                      options={(Object.keys(CARD_EFFECTS) as CardEffect[]).map(
                        (k) => ({
                          value: k,
                          label: CARD_EFFECTS[k],
                        }),
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-small font-semibold">
                      Preenchimento dos cards
                    </span>
                    <Segmented<CardFill>
                      label="Preenchimento dos cards"
                      value={theme.cardFill ?? tplDefaults.cards.cardFill}
                      onChange={(cardFill) =>
                        setTheme((p) => ({ ...p, cardFill }))
                      }
                      options={(Object.keys(CARD_FILLS) as CardFill[]).map(
                        (k) => ({
                          value: k,
                          label: CARD_FILLS[k],
                        }),
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-small font-semibold">
                      Densidade / Tamanho interno
                    </span>
                    <Segmented<CardSize>
                      label="Tamanho dos cards"
                      value={theme.cardSize ?? tplDefaults.cards.cardSize}
                      onChange={(cardSize) =>
                        setTheme((p) => ({ ...p, cardSize }))
                      }
                      options={(Object.keys(CARD_SIZES) as CardSize[]).map(
                        (k) => ({
                          value: k,
                          label: CARD_SIZES[k].label,
                        }),
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-small font-semibold">
                        Arredondamento dos cantos:{" "}
                        {theme.radius ?? tplDefaults.cards.radius}px
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Reto", val: 6 },
                          { label: "Suave", val: 16 },
                          { label: "Bento", val: 22 },
                          { label: "Cápsula", val: 32 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() =>
                              setTheme((p) => ({ ...p, radius: preset.val }))
                            }
                            className={`cursor-pointer rounded-md border px-2 py-1 text-[11px] font-semibold ${
                              (theme.radius ?? tplDefaults.cards.radius) ===
                              preset.val
                                ? "border-ink bg-ink text-paper"
                                : "border-line bg-paper text-ink-muted hover:text-ink"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={RADIUS.min}
                      max={RADIUS.max}
                      step={RADIUS.step}
                      value={theme.radius ?? tplDefaults.cards.radius}
                      onChange={(e) =>
                        setTheme((p) => ({
                          ...p,
                          radius: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Atalho para redimensionamento Bento e drag-and-drop individual */}
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-5">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-small font-semibold">
                  Ordem e tamanho de cada card no Bento Grid (2×1, 1×1, 2×2)
                </h3>
                <p className="text-caption text-ink-muted">
                  Reordene com drag-and-drop e escolha o tamanho individual de
                  cada link na aba Minha página.
                </p>
              </div>
              <Link
                href="/app/pagina"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line-strong bg-paper px-3.5 text-small font-semibold text-ink no-underline hover:border-ink"
              >
                Organizar cards →
              </Link>
            </section>
          </div>
        )}

        {/* TAB 3: ESTILO & FUNDO */}
        {activeTab === "estilo" && (
          <div className="flex flex-col gap-5">
            {/* 8 Styles */}
            <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
              <h2 className="text-small font-semibold">Estilos prontos</h2>
              <div
                role="radiogroup"
                aria-label="Estilos disponíveis"
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {STYLE_KEYS.map((key) => {
                  const def = STYLES[key];
                  const font = publicFont(def.font);
                  const selected = style === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setStyle(key)}
                      className={`flex min-h-[108px] cursor-pointer flex-col justify-between rounded-lg border-2 p-3 text-left transition-[transform,border-color] active:scale-[0.98] ${
                        selected
                          ? "border-ink ring-2 ring-lime ring-offset-2 ring-offset-surface"
                          : "border-line hover:border-ink-muted"
                      }`}
                      style={{
                        backgroundColor: def.palette.bg,
                        color: def.palette.ink,
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={`${font.className} truncate text-[15px] font-bold`}
                          style={{ fontFamily: font.family }}
                        >
                          {def.label}
                        </span>
                        {selected && (
                          <span className="grid size-5 shrink-0 place-items-center rounded-pill bg-ink text-lime">
                            <Icon name="check" size={12} />
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span
                          className="h-4 rounded-sm"
                          style={{ backgroundColor: def.palette.accent }}
                        />
                        <span
                          className="h-3 rounded-sm border"
                          style={{
                            backgroundColor: def.palette.surface,
                            borderColor: def.palette.line,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Font, Colors & Background */}
            <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
              <div>
                <h2 className="text-small font-semibold">
                  Fonte, cores e fundo
                </h2>
                <p className="text-caption text-ink-muted">
                  Personalize a tipografia, paleta de cores e o preset de fundo
                  da página.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="custom-font"
                  className="text-small font-semibold"
                >
                  Fonte
                </label>
                <select
                  id="custom-font"
                  value={theme.font ?? STYLES[style].font}
                  onChange={(e) =>
                    setTheme((p) => ({
                      ...p,
                      font: e.target.value as FontName,
                    }))
                  }
                  className="h-11 rounded-md border border-line-strong bg-surface px-3 text-small"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-small font-semibold">Cores</span>
                <Segmented<"style" | "custom">
                  label="Paleta"
                  value={theme.palette ?? "style"}
                  onChange={(palette) =>
                    setTheme((p) => ({
                      ...p,
                      palette,
                      background: p.background ?? STYLES[style].palette.bg,
                      accent: p.accent ?? STYLES[style].palette.accent,
                    }))
                  }
                  options={[
                    { value: "style", label: "Do estilo" },
                    { value: "custom", label: "Personalizada" },
                  ]}
                />
                {theme.palette === "custom" && (
                  <div className="mt-1 flex flex-wrap gap-4">
                    {(theme.bgType ?? "solid") !== "gradient" &&
                      (theme.bgType ?? "solid") !== "image" && (
                        <label className="flex items-center gap-2 text-small">
                          <span>Fundo</span>
                          <input
                            type="color"
                            value={theme.background ?? STYLES[style].palette.bg}
                            onChange={(e) =>
                              setTheme((p) => ({
                                ...p,
                                background: e.target.value,
                              }))
                            }
                            className="size-10 cursor-pointer rounded border border-line"
                          />
                        </label>
                      )}
                    <label className="flex items-center gap-2 text-small">
                      <span>Acento</span>
                      <input
                        type="color"
                        value={theme.accent ?? STYLES[style].palette.accent}
                        onChange={(e) =>
                          setTheme((p) => ({ ...p, accent: e.target.value }))
                        }
                        className="size-10 cursor-pointer rounded border border-line"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-small font-semibold">
                    Tipo de fundo
                  </span>
                  {!limits.customTheme && (
                    <span className="text-caption text-ink-muted">
                      Doodles e Imagem no Pro
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      { value: "solid", label: "Cor sólida", pro: false },
                      { value: "gradient", label: "Gradiente", pro: false },
                      { value: "doodles", label: "Doodles", pro: true },
                      { value: "image", label: "Imagem", pro: true },
                    ] as { value: BgType; label: string; pro: boolean }[]
                  ).map((opt) => {
                    const locked = opt.pro && !limits.customTheme;
                    const active = (theme.bgType ?? "solid") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={locked}
                        onClick={() =>
                          setTheme((p) => ({ ...p, bgType: opt.value }))
                        }
                        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-3 text-small font-medium transition-colors ${
                          active
                            ? "border-ink bg-ink text-paper"
                            : locked
                              ? "cursor-not-allowed border-line bg-paper text-ink-muted/60"
                              : "cursor-pointer border-line bg-surface text-ink hover:border-ink-muted"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {locked && <Icon name="lock" size={12} />}
                      </button>
                    );
                  })}
                </div>

                {(theme.bgType ?? "solid") === "gradient" && (
                  <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {(Object.keys(BG_GRADIENTS) as BgGradientKey[]).map(
                      (gk) => {
                        const g = BG_GRADIENTS[gk];
                        const selected = (theme.bgGradient ?? "aurora") === gk;
                        return (
                          <button
                            key={gk}
                            type="button"
                            onClick={() =>
                              setTheme((p) => ({ ...p, bgGradient: gk }))
                            }
                            className={`flex h-14 cursor-pointer flex-col justify-end rounded-lg border-2 p-1.5 text-left transition-transform active:scale-[0.98] ${
                              selected
                                ? "border-ink ring-2 ring-lime ring-offset-1"
                                : "border-line"
                            }`}
                            style={{ background: g.css }}
                          >
                            <span className="truncate rounded bg-surface/85 px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                              {g.label}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}

                {limits.customTheme && theme.bgType === "doodles" && (
                  <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.keys(BG_DOODLES) as BgDoodleKey[]).map((dk) => {
                      const selected = (theme.bgDoodle ?? "dots") === dk;
                      return (
                        <button
                          key={dk}
                          type="button"
                          onClick={() =>
                            setTheme((p) => ({ ...p, bgDoodle: dk }))
                          }
                          className={`min-h-11 cursor-pointer rounded-lg border px-3 text-small font-medium ${
                            selected
                              ? "border-ink bg-lime-soft font-semibold text-ink"
                              : "border-line bg-paper text-ink-muted hover:text-ink"
                          }`}
                        >
                          {BG_DOODLES[dk].label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {limits.customTheme && theme.bgType === "image" && (
                  <div className="mt-1 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(
                        Object.keys(BG_IMAGE_PRESETS) as BgImagePresetKey[]
                      ).map((ik) => {
                        const img = BG_IMAGE_PRESETS[ik];
                        const selected =
                          !theme.bgImageUrl &&
                          (theme.bgImage ?? "mesh-lime") === ik;
                        return (
                          <button
                            key={ik}
                            type="button"
                            onClick={() =>
                              setTheme((p) => {
                                const next = { ...p, bgImage: ik };
                                delete next.bgImageUrl;
                                delete next.bgImageColor;
                                return next;
                              })
                            }
                            className={`flex h-14 cursor-pointer flex-col justify-end rounded-lg border-2 p-1.5 text-left ${
                              selected
                                ? "border-ink ring-2 ring-lime ring-offset-1"
                                : "border-line"
                            }`}
                            style={{ background: img.css }}
                          >
                            <span className="truncate rounded bg-surface/85 px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                              {img.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-paper p-3">
                      <div className="flex items-center gap-3">
                        {theme.bgImageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={theme.bgImageUrl}
                            alt="Fundo do Unsplash"
                            className="h-10 w-16 rounded border border-line object-cover"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-small font-semibold">
                            {theme.bgImageUrl
                              ? "Foto do Unsplash selecionada"
                              : "Ou escolha uma foto gratuita do Unsplash"}
                          </span>
                          <span className="text-caption text-ink-muted">
                            Milhares de fotos profissionais de alta resolução.
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setUnsplashTarget("background")}
                      >
                        {theme.bgImageUrl
                          ? "Trocar foto do Unsplash"
                          : "Buscar no Unsplash"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Rodapé / Branding */}
            <section className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5">
              {limits.removeBranding ? (
                <Switch
                  label="Mostrar “Feito com linkmural” no rodapé"
                  checked={showBranding}
                  onChange={(e) => setShowBranding(e.target.checked)}
                />
              ) : (
                <>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-small font-semibold">
                      Rodapé “Feito com linkmural”
                    </span>
                    <span className="text-caption text-ink-muted">
                      Remova a assinatura do Linkmural no plano Pro.
                    </span>
                  </div>
                  <Link href="/app/plano">
                    <Badge variant="pro">
                      <Icon name="lock" size={12} />
                      Pro
                    </Badge>
                  </Link>
                </>
              )}
            </section>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            loading={saving}
            disabled={uploadingLogo || uploadingCover}
            onClick={handleSave}
          >
            {saving ? "Salvando…" : "Salvar aparência"}
          </Button>
        </div>
      </div>

      <PhonePreview page={livePreview} pageUrl={pageUrl} />

      <UnsplashPicker
        open={unsplashTarget !== null}
        onClose={() => setUnsplashTarget(null)}
        orientation={unsplashTarget === "background" ? "portrait" : "landscape"}
        title={
          unsplashTarget === "background"
            ? "Escolher fundo da página no Unsplash"
            : "Escolher imagem de capa no Unsplash"
        }
        onSelect={(photo) => {
          if (unsplashTarget === "cover") {
            setCoverPath(photo.regularUrl);
            setCoverPreview(photo.regularUrl);
          } else if (unsplashTarget === "background") {
            setTheme((p) => ({
              ...p,
              bgType: "image",
              bgImageUrl: photo.regularUrl,
              bgImageColor: photo.color,
            }));
          }
        }}
      />
    </div>
  );
}
