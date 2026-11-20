"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  changeSlugAction,
  saveInfoAction,
} from "@/app/(site)/app/actions/info";
import { PhonePreview } from "@/components/app/PhonePreview";
import {
  Alert,
  Avatar,
  Button,
  DraftNotice,
  Icon,
  Input,
  Spinner,
  Switch,
  useToast,
} from "@/components/ui";
import { CityInput } from "@/components/ui/CityInput";
import { formatBrPhoneMask } from "@/lib/br-inputs";
import { useLocalDraft } from "@/lib/use-local-draft";
import type { DayKey } from "@/lib/hours";
import {
  DAY_NAMES_PT,
  DAY_ORDER,
  editorStateToHours,
  hoursToEditorState,
  type HoursEditorState,
} from "@/lib/panel-helpers";
import type { PublicPage } from "@/lib/public-page";
import {
  finalizeSlug,
  isValidSlug,
  normalizeSlugInput,
  type SlugStatus,
} from "@/lib/slug";
import { createClient } from "@/utils/supabase/client";

const MAX_LOGO_PX = 512;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

async function resizeLogo(file: File): Promise<{
  blob: Blob;
  ext: "webp" | "jpg";
  contentType: string;
}> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(
      1,
      MAX_LOGO_PX / Math.max(bitmap.width, bitmap.height),
    );
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

export function InfoForm({
  userId,
  pageId,
  initialSlug,
  initialBusinessName,
  initialKind,
  initialBio,
  initialAvatarPath,
  initialAvatarUrl,
  initialWhatsapp,
  initialPhone,
  initialEmail,
  initialAddress,
  initialCity,
  initialHours,
  previewBase,
  pageUrl,
}: {
  userId: string;
  pageId: string;
  initialSlug: string;
  initialBusinessName: string;
  initialKind: string;
  initialBio: string;
  initialAvatarPath: string;
  initialAvatarUrl: string | null;
  initialWhatsapp: string;
  initialPhone: string;
  initialEmail: string;
  initialAddress: string;
  initialCity: string;
  initialHours: unknown;
  previewBase: PublicPage;
  pageUrl: string;
}) {
  const toast = useToast();
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [kind, setKind] = useState(initialKind);
  const [bio, setBio] = useState(initialBio);
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialAvatarUrl,
  );
  const [whatsapp, setWhatsapp] = useState(() =>
    formatBrPhoneMask(initialWhatsapp),
  );
  const [phone, setPhone] = useState(() => formatBrPhoneMask(initialPhone));
  const [email, setEmail] = useState(initialEmail);
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity);
  const [hoursState, setHoursState] = useState<HoursEditorState>(() =>
    hoursToEditorState(initialHours),
  );

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const infoDraft = useMemo(
    () => ({
      businessName,
      kind,
      bio,
      avatarPath,
      avatarPreview,
      whatsapp,
      phone,
      email,
      address,
      city,
      hoursState,
    }),
    [
      businessName,
      kind,
      bio,
      avatarPath,
      avatarPreview,
      whatsapp,
      phone,
      email,
      address,
      city,
      hoursState,
    ],
  );
  const restoreInfoDraft = useCallback((d: typeof infoDraft) => {
    if (typeof d.businessName === "string") setBusinessName(d.businessName);
    if (typeof d.kind === "string") setKind(d.kind);
    if (typeof d.bio === "string") setBio(d.bio);
    if (typeof d.avatarPath === "string") setAvatarPath(d.avatarPath);
    if (d.avatarPreview !== undefined) setAvatarPreview(d.avatarPreview);
    if (typeof d.whatsapp === "string")
      setWhatsapp(formatBrPhoneMask(d.whatsapp));
    if (typeof d.phone === "string") setPhone(formatBrPhoneMask(d.phone));
    if (typeof d.email === "string") setEmail(d.email);
    if (typeof d.address === "string") setAddress(d.address);
    if (typeof d.city === "string") setCity(d.city);
    if (d.hoursState && typeof d.hoursState === "object")
      setHoursState(d.hoursState);
  }, []);
  const {
    clear: clearInfoDraft,
    discard: discardInfoDraft,
    restored: infoDraftRestored,
  } = useLocalDraft(`panel-info:${pageId}`, infoDraft, restoreInfoDraft);

  // Slug change section
  const [currentSlug, setCurrentSlug] = useState(initialSlug);
  const [slugInput, setSlugInput] = useState(initialSlug);
  const [slugCheck, setSlugCheck] = useState<{
    slug: string;
    status: SlugStatus | "checking";
  } | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [savingSlug, startSavingSlug] = useTransition();

  const finalizedSlug = finalizeSlug(slugInput);
  const slugChanged = finalizedSlug !== currentSlug;

  useEffect(() => {
    if (!slugChanged || !isValidSlug(finalizedSlug)) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSlugCheck({ slug: finalizedSlug, status: "checking" });
      try {
        const res = await fetch(
          `/api/slug/check?slug=${encodeURIComponent(finalizedSlug)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { slug: string; status: SlugStatus };
        setSlugCheck({ slug: data.slug, status: data.status });
      } catch {
        // Ignore abort/network errors
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [finalizedSlug, slugChanged]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (!ALLOWED_TYPES.has(file.type)) {
      setUploadError("Envie uma imagem PNG, JPG ou WEBP.");
      return;
    }

    setUploading(true);
    try {
      const { blob, ext, contentType } = await resizeLogo(file);
      if (blob.size > MAX_UPLOAD_BYTES) {
        setUploadError("A imagem ficou acima de 2 MB.");
        setUploading(false);
        return;
      }
      const path = `${userId}/${pageId}-logo-${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("media")
        .upload(path, blob, { contentType, upsert: true });
      if (error) {
        setUploadError("Não conseguimos enviar o logo agora.");
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setAvatarPath(path);
      setAvatarPreview(data.publicUrl);
    } catch {
      setUploadError("Não foi possível processar essa imagem.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function updateDay(
    day: DayKey,
    updater: (prev: HoursEditorState[DayKey]) => HoursEditorState[DayKey],
  ) {
    setHoursState((prev) => ({ ...prev, [day]: updater(prev[day]) }));
  }

  function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const serializedHours = editorStateToHours(hoursState);
    startSaving(async () => {
      const res = await saveInfoAction({
        business_name: businessName,
        kind,
        bio,
        avatar_path: avatarPath,
        whatsapp,
        phone,
        email,
        address,
        city,
        hours: serializedHours,
      });
      if (res.ok) {
        clearInfoDraft();
        toast("Salvo");
      } else {
        setSaveError(res.error);
      }
    });
  }

  function handleSlugSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slugChanged || !isValidSlug(finalizedSlug)) return;
    setSlugError(null);
    startSavingSlug(async () => {
      const res = await changeSlugAction(finalizedSlug);
      if (res.ok && res.data) {
        setCurrentSlug(res.data.slug);
        setSlugInput(res.data.slug);
        setSlugCheck(null);
        toast("Endereço atualizado");
      } else if (!res.ok) {
        setSlugError(res.error);
      }
    });
  }

  const slugStatus = !slugChanged
    ? null
    : !isValidSlug(finalizedSlug)
      ? ("invalido" as const)
      : slugCheck?.slug === finalizedSlug
        ? slugCheck.status
        : ("checking" as const);

  const livePreview: PublicPage = {
    ...previewBase,
    slug: currentSlug,
    business_name: businessName || currentSlug,
    kind: kind || null,
    bio: bio || null,
    avatarUrl: avatarPreview,
    whatsapp: whatsapp || null,
    phone: phone || null,
    email: email || null,
    address: address || null,
    city: city || null,
    hours: editorStateToHours(hoursState),
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-display-md tracking-[-0.03em]">
              Informações
            </h1>
            <p className="text-small text-ink-muted">
              Dados do negócio, contato, horários e endereço da página.
            </p>
          </div>
          <Button
            type="submit"
            form="info-main-form"
            size="md"
            loading={saving}
            disabled={uploading}
          >
            {saving ? "Salvando…" : "Salvar informações"}
          </Button>
        </div>

        <form
          id="info-main-form"
          onSubmit={handleSaveInfo}
          className="flex flex-col gap-6"
          noValidate
        >
          {infoDraftRestored && <DraftNotice onDiscard={discardInfoDraft} />}
          {saveError && (
            <Alert tone="error" title="Confira os dados">
              {saveError}
            </Alert>
          )}

          {/* Identity */}
          <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-small font-semibold">Identidade</h2>

            <div className="flex items-center gap-4">
              <Avatar
                src={avatarPreview}
                name={businessName || currentSlug}
                size={64}
                square
              />
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    loading={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading
                      ? "Enviando…"
                      : avatarPreview
                        ? "Trocar logo"
                        : "Enviar logo"}
                  </Button>
                  {avatarPreview && !uploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setAvatarPath("");
                        setAvatarPreview(null);
                      }}
                    >
                      Remover
                    </Button>
                  )}
                </div>
                <span className="text-caption text-ink-muted">
                  PNG, JPG ou WEBP (ajustado para 512 px).
                </span>
                {uploadError && (
                  <span className="text-caption text-negative">
                    {uploadError}
                  </span>
                )}
              </div>
            </div>

            <Input
              label="Nome do negócio *"
              value={businessName}
              maxLength={60}
              onChange={(e) => setBusinessName(e.target.value)}
              help={`${businessName.trim().length}/60 caracteres`}
              required
            />

            <Input
              label="Categoria (opcional)"
              value={kind}
              maxLength={60}
              onChange={(e) => setKind(e.target.value)}
              placeholder="Ex.: Academia · Treino funcional"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="info-bio" className="text-small font-semibold">
                Descrição (opcional)
              </label>
              <textarea
                id="info-bio"
                rows={3}
                maxLength={160}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte em poucas palavras o que o seu negócio faz."
                className="w-full rounded-md border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:shadow-[0_0_0_3px_var(--lime)] focus:outline-none"
              />
              <span className="text-caption text-ink-muted">
                {bio.length}/160 caracteres
              </span>
            </div>
          </section>

          {/* Contact */}
          <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-small font-semibold">Contato e localização</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="WhatsApp"
                type="tel"
                inputMode="tel"
                maxLength={15}
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatBrPhoneMask(e.target.value))}
                placeholder="(11) 99999-9999"
              />
              <Input
                label="Telefone (Ligar e vCard)"
                type="tel"
                inputMode="tel"
                maxLength={15}
                value={phone}
                onChange={(e) => setPhone(formatBrPhoneMask(e.target.value))}
                placeholder="(11) 3333-4444"
                help="Se vazio, usa o WhatsApp."
              />
            </div>

            <Input
              label="E-mail"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@seunegocio.com.br"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Endereço"
                value={address}
                maxLength={160}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua Exemplo, 123"
              />
              <CityInput label="Cidade" value={city} onChange={setCity} />
            </div>
          </section>

          {/* Opening Hours */}
          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
            <div>
              <h2 className="text-small font-semibold">
                Horário de funcionamento
              </h2>
              <p className="text-caption text-ink-muted">
                Mostra “Aberto agora” automaticamente na página (horário de
                Brasília). Adicione uma segunda faixa para intervalo de almoço.
              </p>
            </div>

            <div className="flex flex-col divide-y divide-line">
              {DAY_ORDER.map((day) => {
                const entry = hoursState[day];
                return (
                  <div key={day} className="flex flex-col gap-2.5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Switch
                        label={DAY_NAMES_PT[day]}
                        checked={entry.enabled}
                        onChange={(e) =>
                          updateDay(day, (prev) => ({
                            ...prev,
                            enabled: e.target.checked,
                          }))
                        }
                      />
                      {entry.enabled && entry.ranges.length < 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateDay(day, (prev) => ({
                              ...prev,
                              ranges: [
                                ...prev.ranges,
                                { open: "13:30", close: "18:00" },
                              ],
                            }))
                          }
                        >
                          + Intervalo
                        </Button>
                      )}
                    </div>

                    {entry.enabled && (
                      <div className="flex flex-col gap-2 pl-2">
                        {entry.ranges.map((range, idx) => (
                          <div
                            key={idx}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <input
                              type="time"
                              aria-label={`${DAY_NAMES_PT[day]} abertura ${idx + 1}`}
                              value={range.open}
                              onChange={(e) =>
                                updateDay(day, (prev) => ({
                                  ...prev,
                                  ranges: prev.ranges.map((r, i) =>
                                    i === idx
                                      ? { ...r, open: e.target.value }
                                      : r,
                                  ),
                                }))
                              }
                              className="h-11 rounded-md border border-line-strong bg-paper px-3 text-small"
                            />
                            <span className="text-small text-ink-muted">
                              às
                            </span>
                            <input
                              type="time"
                              aria-label={`${DAY_NAMES_PT[day]} fechamento ${idx + 1}`}
                              value={range.close}
                              onChange={(e) =>
                                updateDay(day, (prev) => ({
                                  ...prev,
                                  ranges: prev.ranges.map((r, i) =>
                                    i === idx
                                      ? { ...r, close: e.target.value }
                                      : r,
                                  ),
                                }))
                              }
                              className="h-11 rounded-md border border-line-strong bg-paper px-3 text-small"
                            />
                            {entry.ranges.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-label={`Remover faixa ${idx + 1} de ${DAY_NAMES_PT[day]}`}
                                onClick={() =>
                                  updateDay(day, (prev) => ({
                                    ...prev,
                                    ranges: prev.ranges.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  }))
                                }
                              >
                                <Icon name="close" size={14} />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              loading={saving}
              disabled={uploading}
            >
              {saving ? "Salvando…" : "Salvar informações"}
            </Button>
          </div>
        </form>

        {/* Page Slug */}
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
          <div>
            <h2 className="text-small font-semibold">Endereço da página</h2>
            <p className="text-caption text-ink-muted">
              Ao trocar o endereço, o link antigo para de funcionar.
            </p>
          </div>

          <form onSubmit={handleSlugSubmit} className="flex flex-col gap-3">
            <Input
              label="Novo endereço"
              prefix="linkmural.com/"
              value={slugInput}
              maxLength={30}
              onChange={(e) => {
                setSlugInput(normalizeSlugInput(e.target.value));
                setSlugError(null);
              }}
              error={
                slugError ??
                (slugStatus === "invalido"
                  ? "Use de 3 a 30 letras minúsculas, números ou hífen."
                  : slugStatus === "ocupado"
                    ? "Esse endereço já está em uso."
                    : slugStatus === "reservado"
                      ? "Esse endereço é reservado."
                      : undefined)
              }
              success={
                slugStatus === "livre" ? "Endereço disponível!" : undefined
              }
              help={
                slugStatus === "checking" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Spinner className="size-3.5" />
                    Verificando…
                  </span>
                ) : undefined
              }
            />

            {slugChanged && (
              <Alert tone="warning" title="Atenção ao trocar o endereço">
                O link antigo <strong>linkmural.com/{currentSlug}</strong> para
                de funcionar assim que você confirmar. Lembre-se de atualizar
                sua bio e seus QR codes.
              </Alert>
            )}

            <Button
              type="submit"
              variant="secondary"
              size="md"
              className="self-start"
              disabled={!slugChanged || slugStatus !== "livre" || savingSlug}
              loading={savingSlug}
            >
              {savingSlug ? "Alterando…" : "Alterar endereço"}
            </Button>
          </form>
        </section>
      </div>

      <PhonePreview page={livePreview} pageUrl={pageUrl} />
    </div>
  );
}
