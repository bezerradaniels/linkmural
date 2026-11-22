"use client";

import { useActionState, useCallback, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { UnsplashPicker } from "@/components/app/UnsplashPicker";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Alert, Avatar, Button, Icon, Input } from "@/components/ui";
import { CityInput } from "@/components/ui/CityInput";
import { formatBrPhoneMask } from "@/lib/br-inputs";
import { useLocalDraft } from "@/lib/use-local-draft";
import { createClient } from "@/utils/supabase/client";
import { saveBusinessDataAction, type StepActionState } from "../actions";

const MAX_LOGO_PX = 512;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** Resizes an image in the browser to at most 512×512 before uploading to Storage. */
async function resizeLogoToBlob(file: File): Promise<{
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

    const webpBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.86),
    );
    if (webpBlob && webpBlob.type === "image/webp") {
      return { blob: webpBlob, ext: "webp", contentType: "image/webp" };
    }

    const jpgBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88),
    );
    if (!jpgBlob) throw new Error("encode_failed");
    return { blob: jpgBlob, ext: "jpg", contentType: "image/jpeg" };
  } finally {
    bitmap.close();
  }
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      form="onboarding-business-form"
      size="lg"
      className="w-full"
      loading={pending}
      disabled={disabled}
    >
      {pending ? "Salvando…" : "Continuar"}
    </Button>
  );
}

const initialState: StepActionState = {};

export function BusinessForm({
  userId,
  pageId,
  slug,
  initialName,
  initialWhatsapp,
  initialCity,
  initialAvatarPath,
  initialAvatarUrl,
  initialCoverPath = "",
  initialCoverUrl = null,
}: {
  userId: string;
  pageId: string;
  slug: string;
  initialName: string;
  initialWhatsapp: string;
  initialCity: string;
  initialAvatarPath: string;
  initialAvatarUrl: string | null;
  initialCoverPath?: string;
  initialCoverUrl?: string | null;
}) {
  const [state, formAction] = useActionState(
    saveBusinessDataAction,
    initialState,
  );
  const [name, setName] = useState(initialName);
  const [whatsapp, setWhatsapp] = useState(() =>
    formatBrPhoneMask(initialWhatsapp),
  );
  const [city, setCity] = useState(initialCity);
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialAvatarUrl,
  );
  const [coverPath, setCoverPath] = useState(initialCoverPath);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialCoverUrl,
  );
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const draftValue = useMemo(
    () => ({
      name,
      whatsapp,
      city,
      avatarPath,
      avatarPreview,
      coverPath,
      coverPreview,
    }),
    [
      name,
      whatsapp,
      city,
      avatarPath,
      avatarPreview,
      coverPath,
      coverPreview,
    ],
  );
  const restoreDraft = useCallback((d: typeof draftValue) => {
    if (typeof d.name === "string" && d.name) setName(d.name);
    if (typeof d.whatsapp === "string" && d.whatsapp)
      setWhatsapp(formatBrPhoneMask(d.whatsapp));
    if (typeof d.city === "string" && d.city) setCity(d.city);
    if (typeof d.avatarPath === "string" && d.avatarPath)
      setAvatarPath(d.avatarPath);
    if (typeof d.avatarPreview === "string" && d.avatarPreview)
      setAvatarPreview(d.avatarPreview);
    if (typeof d.coverPath === "string" && d.coverPath)
      setCoverPath(d.coverPath);
    if (typeof d.coverPreview === "string" && d.coverPreview)
      setCoverPreview(d.coverPreview);
  }, []);
  // Kept until the server accepts the step; once saved, the server values
  // match the draft and the hook drops it on its own.
  useLocalDraft(`onboarding-4:${pageId}`, draftValue, restoreDraft);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (!ALLOWED_TYPES.has(file.type)) {
      setUploadError("Envie uma imagem PNG, JPG ou WEBP.");
      return;
    }

    setUploading(true);
    try {
      const { blob, ext, contentType } = await resizeLogoToBlob(file);
      if (blob.size > MAX_UPLOAD_BYTES) {
        setUploadError("A imagem ficou acima de 2 MB. Tente outra menor.");
        setUploading(false);
        return;
      }

      const path = `${userId}/${pageId}-logo-${Date.now()}.${ext}`;
      const supabase = createClient();
      // upsert must stay false: the media bucket only grants INSERT to owners
      // (upsert also needs SELECT and UPDATE). File names are unique anyway.
      const { error } = await supabase.storage
        .from("media")
        .upload(path, blob, { contentType, upsert: false });

      if (error) {
        setUploadError("Não conseguimos enviar o logo agora. Tente de novo.");
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setAvatarPath(path);
      setAvatarPreview(data.publicUrl);
    } catch {
      setUploadError("Não foi possível processar essa imagem. Tente outra.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <OnboardingShell
      step={4}
      title="Personalize seu perfil"
      subtitle="Só o nome é obrigatório agora. Adicione logo, capa do Unsplash e WhatsApp se quiser."
      backHref="/onboarding/3"
      slug={slug}
      footer={<SubmitButton disabled={uploading} />}
    >
      <form
        id="onboarding-business-form"
        action={formAction}
        className="flex flex-col gap-5"
        noValidate
      >
        {state.error && (
          <Alert tone="error" title="Confira os dados">
            {state.error}
          </Alert>
        )}

        <input type="hidden" name="avatar_path" value={avatarPath} />
        <input type="hidden" name="cover_path" value={coverPath} />

        <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
          <Avatar
            src={avatarPreview}
            name={name || slug}
            size={64}
            square
            className="shrink-0"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-small font-semibold">
              Foto de perfil ou logo (opcional)
            </span>
            <p className="text-caption text-ink-muted">
              PNG, JPG ou WEBP. Ajustamos automaticamente para 512 px.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                id="logo-upload"
                onChange={handleFileChange}
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
                    ? "Trocar foto"
                    : "Escolher imagem"}
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
            {uploadError && (
              <p className="flex items-center gap-1 text-caption text-negative">
                <Icon name="warning" size={14} />
                {uploadError}
              </p>
            )}
          </div>
        </div>

        {/* Cover picker via Unsplash */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="block text-small font-semibold">
                Imagem de capa (opcional)
              </span>
              <p className="text-caption text-ink-muted">
                Destaca o topo dos modelos Balcão, Mosaico e Cartão.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUnsplashOpen(true)}
            >
              {coverPreview ? "Trocar capa" : "Buscar no Unsplash"}
            </Button>
          </div>

          {coverPreview && (
            <div className="relative h-24 w-full overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPreview}
                alt="Capa selecionada"
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setCoverPath("");
                  setCoverPreview(null);
                }}
                className="absolute top-2 right-2 rounded-pill bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-black"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        <Input
          label="Nome do perfil ou negócio *"
          name="business_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          placeholder="Ex.: @clara.cria ou Studio Força"
          help={`${name.trim().length}/60 caracteres`}
        />

        <Input
          label="WhatsApp (opcional)"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={15}
          value={whatsapp}
          onChange={(e) => setWhatsapp(formatBrPhoneMask(e.target.value))}
          placeholder="(11) 99999-9999"
          help="Com DDD. Cria um botão direto de WhatsApp na sua página."
        />

        <CityInput
          label="Cidade (opcional)"
          name="city"
          value={city}
          onChange={setCity}
        />
      </form>

      <UnsplashPicker
        open={unsplashOpen}
        onClose={() => setUnsplashOpen(false)}
        orientation="landscape"
        title="Escolher capa gratuita no Unsplash"
        onSelect={(photo) => {
          setCoverPath(photo.regularUrl);
          setCoverPreview(photo.regularUrl);
        }}
      />
    </OnboardingShell>
  );
}
