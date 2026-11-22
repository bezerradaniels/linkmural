"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createLinkAction,
  deleteLinkAction,
  reorderLinksAction,
  restoreLinkAction,
  updateLinkAction,
  updatePageActionsAction,
} from "@/app/(site)/app/actions/links";
import { IconPicker } from "@/components/app/IconPicker";
import { LinkIconGlyph } from "@/components/app/LinkIconGlyph";
import { PhonePreview } from "@/components/app/PhonePreview";
import { UnsplashPicker } from "@/components/app/UnsplashPicker";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Dialog,
  EmptyState,
  Icon,
  Input,
  Progress,
  Switch,
  useToast,
} from "@/components/ui";
import { detectLink, linkUrlSchema } from "@/lib/link-detect";
import { trackGaEvent } from "@/lib/gtm";
import { reorderById } from "@/lib/panel-helpers";
import { planInfo, type Plan } from "@/lib/plans";
import { parsePageActions, type PageActions } from "@/lib/public-actions";
import type { PublicPage } from "@/lib/public-page";
import {
  extractYoutubeId,
  isRichBlockKind,
  parseGalleryData,
  parseServiceData,
  type GalleryImage,
} from "@/lib/rich-blocks";
import type { LinkSize } from "@/lib/styles";
import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/utils/supabase/types";

type LinkRow = Tables<"links">;
type BlockModalType = "link" | "gallery" | "youtube" | "service";

const SIZE_OPTIONS: { value: LinkSize; label: string }[] = [
  { value: "2x1", label: "2×1" },
  { value: "1x1", label: "1×1" },
  { value: "2x2", label: "2×2" },
];

const MAX_GALLERY_PX = 1200;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

async function resizeGalleryImage(file: File): Promise<{
  blob: Blob;
  ext: "webp" | "jpg";
  contentType: string;
}> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(
      1,
      MAX_GALLERY_PX / Math.max(bitmap.width, bitmap.height),
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
      canvas.toBlob(r, "image/webp", 0.85),
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

function blockTypeBadge(kind: LinkRow["kind"]): string | null {
  if (kind === "gallery") return "Galeria · Studio";
  if (kind === "youtube") return "YouTube · Studio";
  if (kind === "service") return "Serviço · Studio";
  return null;
}

function blockSummaryLine(link: LinkRow): string {
  if (link.kind === "gallery") {
    const g = parseGalleryData(link.data);
    return `${g.images.length} ${g.images.length === 1 ? "foto no carrossel" : "fotos no carrossel"}`;
  }
  if (link.kind === "service") {
    const s = parseServiceData(link.data);
    const parts = [s.price, s.duration, s.ctaLabel].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : link.url;
  }
  return link.url;
}

function SortableLinkRow({
  link,
  canResize,
  onEdit,
  onToggleActive,
  onToggleFeatured,
  onChangeSize,
  onRequestDelete,
}: {
  link: LinkRow;
  canResize: boolean;
  onEdit: (link: LinkRow) => void;
  onToggleActive: (link: LinkRow, active: boolean) => void;
  onToggleFeatured: (link: LinkRow) => void;
  onChangeSize: (link: LinkRow, size: LinkSize) => void;
  onRequestDelete: (link: LinkRow) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const richBadge = blockTypeBadge(link.kind);
  const isRich = isRichBlockKind(link.kind);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-3 rounded-xl border bg-surface p-3.5 transition-shadow sm:flex-row sm:items-center ${
        isDragging
          ? "border-ink shadow-lg"
          : link.active
            ? "border-line"
            : "border-line opacity-65"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          aria-label={`Arrastar ${link.title} para reordenar`}
          className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-md text-ink-muted hover:bg-hover hover:text-ink active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <Icon name="grip" size={18} />
        </button>

        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-paper text-ink">
          <LinkIconGlyph iconRef={link.icon} size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-small font-semibold text-ink">
              {link.title}
            </p>
            {richBadge && <Badge variant="pro">{richBadge}</Badge>}
            {link.featured && <Badge variant="pro">Destaque</Badge>}
          </div>
          <p className="truncate text-caption text-ink-muted">
            {blockSummaryLine(link)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-line pt-2 sm:border-t-0 sm:pt-0">
        {/* Bento Grid card size selector */}
        <div
          role="group"
          aria-label={`Tamanho do card ${link.title}`}
          className="mr-auto inline-flex items-center rounded-pill border border-line bg-paper p-0.5 sm:mr-1"
        >
          {SIZE_OPTIONS.map((opt) => {
            const currentSize: LinkSize =
              canResize && (link.size === "1x1" || link.size === "2x2")
                ? link.size
                : "2x1";
            const active = currentSize === opt.value;
            const locked = !canResize && opt.value !== "2x1";
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                title={
                  locked
                    ? "Redimensionar no grid é exclusivo do plano Pro"
                    : `Tamanho ${opt.label}`
                }
                onClick={() => onChangeSize(link, opt.value)}
                className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-pill px-2.5 text-[11px] font-semibold transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : locked
                      ? "text-ink-muted/70 hover:text-ink"
                      : "text-ink-muted hover:text-ink"
                }`}
              >
                {opt.label}
                {locked && <Icon name="lock" size={10} />}
              </button>
            );
          })}
        </div>

        {link.kind !== "pix" && !isRich && (
          <Button
            type="button"
            variant={link.featured ? "secondary" : "ghost"}
            size="md"
            iconOnly
            aria-label={
              link.featured
                ? `Remover destaque de ${link.title}`
                : `Destacar ${link.title}`
            }
            title={
              link.featured ? "Remover destaque" : "Destacar botão principal"
            }
            onClick={() => onToggleFeatured(link)}
          >
            <Icon name="pin" size={16} />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="md"
          iconOnly
          aria-label={`Editar ${link.title}`}
          onClick={() => onEdit(link)}
        >
          <Icon name="edit" size={16} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="md"
          iconOnly
          aria-label={`Excluir ${link.title}`}
          onClick={() => onRequestDelete(link)}
        >
          <Icon name="close" size={16} />
        </Button>

        <Switch
          label={<span className="sr-only">Ativar {link.title}</span>}
          checked={link.active}
          onChange={(e) => onToggleActive(link, e.target.checked)}
        />
      </div>
    </div>
  );
}

type ModalDraft = {
  id?: string;
  blockKind: BlockModalType;
  title: string;
  titleEdited: boolean;
  subtitle: string;
  url: string;
  icon: string;
  featured: boolean;
  size: LinkSize;
  // Gallery fields
  images: GalleryImage[];
  newImageUrl: string;
  newImageCaption: string;
  // Service fields
  price: string;
  duration: string;
  ctaLabel: string;
  badge: string;
  error?: string;
};

export function LinksEditor({
  userId,
  initialLinks,
  previewBase,
  pageUrl,
  plan,
  downgraded = false,
}: {
  userId: string;
  initialLinks: LinkRow[];
  previewBase: PublicPage;
  pageUrl: string;
  plan: Plan;
  downgraded?: boolean;
}) {
  const toast = useToast();
  const limits = planInfo(plan);
  const [links, setLinks] = useState<LinkRow[]>(initialLinks);
  const [actions, setActions] = useState<PageActions>(() =>
    parsePageActions(previewBase.actions),
  );
  const [limitError, setLimitError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  // Add/Edit dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [draft, setDraft] = useState<ModalDraft>({
    blockKind: "link",
    title: "",
    titleEdited: false,
    subtitle: "",
    url: "",
    icon: "lm:link",
    featured: false,
    size: "2x1",
    images: [],
    newImageUrl: "",
    newImageCaption: "",
    price: "",
    duration: "",
    ctaLabel: "Agendar no WhatsApp",
    badge: "",
  });

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<LinkRow | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function openCreateBlock(kind: BlockModalType = "link") {
    if (kind !== "link" && !limits.businessFeatures) {
      toast({
        message:
          "Galeria, Vídeo do YouTube e Card de Serviços são do plano Studio.",
        action: {
          label: "Ver Studio",
          onClick: () => {
            window.location.href = "/app/plano";
          },
        },
      });
      return;
    }

    setLimitError(null);
    const defaultWa = previewBase.whatsapp
      ? `https://wa.me/${previewBase.whatsapp.replace(/\D/g, "")}`
      : "";
    setDraft({
      blockKind: kind,
      title:
        kind === "gallery"
          ? "Galeria de fotos"
          : kind === "youtube"
            ? "Vídeo em destaque"
            : "",
      titleEdited: kind === "gallery" || kind === "youtube",
      subtitle: "",
      url: kind === "service" ? defaultWa : "",
      icon:
        kind === "gallery"
          ? "lm:grid"
          : kind === "youtube"
            ? "si:youtube"
            : kind === "service"
              ? "lm:star"
              : "lm:link",
      featured: false,
      size: kind === "link" ? "2x1" : "2x2",
      images: [],
      newImageUrl: "",
      newImageCaption: "",
      price: "",
      duration: "",
      ctaLabel: "Agendar no WhatsApp",
      badge: "",
    });
    setModalOpen(true);
  }

  function openEdit(link: LinkRow) {
    const blockKind: BlockModalType = isRichBlockKind(link.kind)
      ? link.kind
      : "link";
    const gallery =
      link.kind === "gallery" ? parseGalleryData(link.data) : { images: [] };
    const svc =
      link.kind === "service"
        ? parseServiceData(link.data)
        : { price: "", duration: "", ctaLabel: "Solicitar", badge: "" };

    setDraft({
      id: link.id,
      blockKind,
      title: link.title,
      titleEdited: true,
      subtitle: link.subtitle ?? "",
      url: link.kind === "gallery" ? "" : link.url,
      icon: link.icon ?? "lm:link",
      featured: link.featured,
      size:
        link.size === "1x1" || link.size === "2x2" ? link.size : "2x1",
      images: gallery.images,
      newImageUrl: "",
      newImageCaption: "",
      price: svc.price ?? "",
      duration: svc.duration ?? "",
      ctaLabel: svc.ctaLabel ?? "Solicitar",
      badge: svc.badge ?? "",
    });
    setModalOpen(true);
  }

  function handleUrlChange(nextUrl: string) {
    if (draft.blockKind !== "link") {
      setDraft((prev) => ({ ...prev, url: nextUrl, error: undefined }));
      return;
    }
    const detected = detectLink(nextUrl);
    setDraft((prev) => ({
      ...prev,
      url: nextUrl,
      icon: detected ? detected.icon : prev.icon,
      title: detected && !prev.titleEdited ? detected.title : prev.title,
      error: undefined,
    }));
  }

  async function handleUploadGalleryPhoto(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (draft.images.length >= 10) {
      setDraft((p) => ({
        ...p,
        error: "Máximo de 10 fotos por galeria.",
      }));
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      setDraft((p) => ({
        ...p,
        error: "Envie uma imagem PNG, JPG ou WEBP.",
      }));
      return;
    }

    setUploadingPhoto(true);
    try {
      const { blob, ext, contentType } = await resizeGalleryImage(file);
      if (blob.size > MAX_UPLOAD_BYTES) {
        setDraft((p) => ({
          ...p,
          error: "A imagem ficou acima de 2 MB.",
        }));
        setUploadingPhoto(false);
        return;
      }
      const path = `${userId}/${previewBase.id}-gallery-${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("media")
        .upload(path, blob, { contentType, upsert: true });
      if (error) {
        setDraft((p) => ({
          ...p,
          error: "Não conseguimos enviar a foto agora.",
        }));
        setUploadingPhoto(false);
        return;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setDraft((p) => ({
        ...p,
        images: [
          ...p.images,
          { url: data.publicUrl, caption: p.newImageCaption.trim() },
        ],
        newImageCaption: "",
        error: undefined,
      }));
    } catch {
      setDraft((p) => ({
        ...p,
        error: "Não foi possível processar essa imagem.",
      }));
    } finally {
      setUploadingPhoto(false);
      if (galleryFileRef.current) galleryFileRef.current.value = "";
    }
  }

  function handleAddImageUrl() {
    const rawUrl = draft.newImageUrl.trim();
    if (!rawUrl) return;
    if (draft.images.length >= 10) {
      setDraft((p) => ({ ...p, error: "Máximo de 10 fotos por galeria." }));
      return;
    }
    try {
      const u = new URL(
        /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`,
      );
      setDraft((p) => ({
        ...p,
        images: [
          ...p.images,
          { url: u.toString(), caption: p.newImageCaption.trim() },
        ],
        newImageUrl: "",
        newImageCaption: "",
        error: undefined,
      }));
    } catch {
      setDraft((p) => ({ ...p, error: "Informe uma URL de imagem válida." }));
    }
  }

  function handleSaveModal(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      setDraft((p) => ({ ...p, error: "Digite um título." }));
      return;
    }

    let payloadData: Record<string, unknown> | undefined;
    if (draft.blockKind === "gallery") {
      if (draft.images.length === 0) {
        setDraft((p) => ({
          ...p,
          error: "Adicione pelo menos 1 foto na galeria.",
        }));
        return;
      }
      payloadData = { images: draft.images };
    } else if (draft.blockKind === "youtube") {
      const videoId = extractYoutubeId(draft.url);
      if (!videoId) {
        setDraft((p) => ({
          ...p,
          error:
            "Cole um link válido do YouTube (ex.: youtube.com/watch?v=... ou youtu.be/...).",
        }));
        return;
      }
      payloadData = { videoId };
    } else if (draft.blockKind === "service") {
      const urlCheck = linkUrlSchema.safeParse(draft.url);
      if (!urlCheck.success) {
        setDraft((p) => ({
          ...p,
          error:
            urlCheck.error.issues[0]?.message ??
            "Informe o link de contato ou agendamento do serviço.",
        }));
        return;
      }
      payloadData = {
        price: draft.price.trim(),
        duration: draft.duration.trim(),
        ctaLabel: draft.ctaLabel.trim() || "Solicitar",
        badge: draft.badge.trim(),
      };
    } else {
      const urlCheck = linkUrlSchema.safeParse(draft.url);
      if (!urlCheck.success) {
        setDraft((p) => ({
          ...p,
          error: urlCheck.error.issues[0]?.message ?? "Endereço inválido.",
        }));
        return;
      }
    }

    startSaving(async () => {
      if (draft.id) {
        const res = await updateLinkAction({
          id: draft.id,
          blockKind: draft.blockKind,
          title,
          subtitle: draft.subtitle.trim() || null,
          url: draft.blockKind === "gallery" ? undefined : draft.url,
          icon: draft.icon,
          featured: draft.featured,
          data: payloadData,
        });
        if (!res.ok) {
          setDraft((p) => ({ ...p, error: res.error }));
          return;
        }
        if (res.data) {
          const updated = res.data;
          setLinks((prev) =>
            prev.map((item) => {
              if (item.id === updated.id) return updated;
              return updated.featured ? { ...item, featured: false } : item;
            }),
          );
        }
        setModalOpen(false);
        toast("Salvo");
      } else {
        const res = await createLinkAction({
          blockKind: draft.blockKind,
          title,
          subtitle: draft.subtitle.trim(),
          url: draft.url,
          icon: draft.icon,
          featured: draft.featured,
          size: draft.size,
          data: payloadData,
        });
        if (!res.ok) {
          if (res.code === "plan_limit_links") {
            setModalOpen(false);
            setLimitError(res.error);
          } else {
            setDraft((p) => ({ ...p, error: res.error }));
          }
          return;
        }
        if (res.data) {
          const created = res.data;
          setLinks((prev) => [
            ...prev.map((item) =>
              created.featured ? { ...item, featured: false } : item,
            ),
            created,
          ]);
        }
        trackGaEvent("link_adicionado", {
          icone: draft.icon,
          destaque: draft.featured ? "sim" : "nao",
        });
        setModalOpen(false);
        toast(
          draft.blockKind === "gallery"
            ? "Galeria adicionada"
            : draft.blockKind === "youtube"
              ? "Vídeo adicionado"
              : draft.blockKind === "service"
                ? "Card de serviço adicionado"
                : "Link adicionado",
        );
      }
    });
  }

  function handleToggleActive(link: LinkRow, active: boolean) {
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, active } : l)),
    );
    startSaving(async () => {
      const res = await updateLinkAction({ id: link.id, active });
      if (res.ok) {
        toast("Salvo");
      } else {
        setLinks((prev) =>
          prev.map((l) => (l.id === link.id ? { ...l, active: !active } : l)),
        );
        if (res.code === "plan_limit_links") {
          setLimitError(res.error);
        } else {
          toast(res.error);
        }
      }
    });
  }

  function handleToggleFeatured(link: LinkRow) {
    const nextFeatured = !link.featured;
    setLinks((prev) =>
      prev.map((l) =>
        l.id === link.id
          ? { ...l, featured: nextFeatured }
          : nextFeatured
            ? { ...l, featured: false }
            : l,
      ),
    );
    startSaving(async () => {
      const res = await updateLinkAction({
        id: link.id,
        featured: nextFeatured,
      });
      if (res.ok) {
        toast(nextFeatured ? "Destaque atualizado" : "Destaque removido");
      } else {
        toast(res.error);
      }
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setLinks((prev) => prev.filter((l) => l.id !== target.id));

    startSaving(async () => {
      const res = await deleteLinkAction(target.id);
      if (res.ok) {
        trackGaEvent("link_removido", { tipo_link: target.kind });
        toast({
          message: "Bloco excluído",
          action: {
            label: "Desfazer",
            onClick: () => {
              startSaving(async () => {
                const restored = await restoreLinkAction({
                  kind: target.kind,
                  title: target.title,
                  subtitle: target.subtitle,
                  url: target.url,
                  icon: target.icon,
                  featured: target.featured,
                  position: target.position,
                  active: target.active,
                  size:
                    target.size === "1x1" || target.size === "2x2"
                      ? target.size
                      : "2x1",
                  data: target.data,
                });
                if (restored.ok && restored.data) {
                  setLinks((prev) =>
                    [...prev, restored.data!].sort(
                      (a, b) => a.position - b.position,
                    ),
                  );
                  toast("Bloco restaurado");
                }
              });
            },
          },
        });
      } else {
        setLinks((prev) =>
          [...prev, target].sort((a, b) => a.position - b.position),
        );
        toast(res.error);
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const reordered = reorderById(
      links,
      String(active.id),
      String(over.id),
    ).map((item, idx) => ({ ...item, position: idx }));
    setLinks(reordered);

    startSaving(async () => {
      const res = await reorderLinksAction(reordered.map((l) => l.id));
      if (res.ok) {
        toast("Ordem salva");
      } else {
        toast(res.error);
      }
    });
  }

  function handleChangeSize(link: LinkRow, nextSize: LinkSize) {
    if (!limits.customTheme && nextSize !== "2x1") {
      toast({
        message: "Cards 1×1 e 2×2 são do plano Pro.",
        action: {
          label: "Ver Pro",
          onClick: () => {
            window.location.href = "/app/plano";
          },
        },
      });
      return;
    }
    const prevSize = link.size;
    if (prevSize === nextSize) return;
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, size: nextSize } : l)),
    );
    startSaving(async () => {
      const res = await updateLinkAction({ id: link.id, size: nextSize });
      if (res.ok) {
        toast("Tamanho atualizado");
      } else {
        setLinks((prev) =>
          prev.map((l) => (l.id === link.id ? { ...l, size: prevSize } : l)),
        );
        toast(res.error);
      }
    });
  }

  function handleToggleAction(key: keyof PageActions, checked: boolean) {
    const next = { ...actions, [key]: checked };
    setActions(next);
    startSaving(async () => {
      const res = await updatePageActionsAction(next);
      if (res.ok) {
        toast("Salvo");
      } else {
        setActions(actions);
        toast(res.error);
      }
    });
  }

  const featuredLink =
    links.find(
      (l) => l.featured && l.active && !isRichBlockKind(l.kind),
    ) ?? null;

  const livePreviewPage: PublicPage = {
    ...previewBase,
    actions,
    links: links
      .filter((l) => l.active)
      .sort((a, b) => a.position - b.position)
      .map((l) => ({
        id: l.id,
        kind: l.kind,
        title: l.title,
        subtitle: l.subtitle,
        url: l.url,
        icon: l.icon,
        featured: l.featured,
        position: l.position,
        size: l.size,
        data: l.data,
      })),
  };

  const modalTitle =
    draft.blockKind === "gallery"
      ? draft.id
        ? "Editar galeria (carrossel)"
        : "Nova galeria (carrossel)"
      : draft.blockKind === "youtube"
        ? draft.id
          ? "Editar vídeo do YouTube"
          : "Novo vídeo do YouTube"
        : draft.blockKind === "service"
          ? draft.id
            ? "Editar card de serviço"
            : "Novo card de serviço"
          : draft.id
            ? "Editar link"
            : "Novo link";

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-display-md tracking-[-0.03em]">
              Página e links
            </h1>
            <p className="text-small text-ink-muted">
              Adicione links e blocos ricos, redimensione no Bento Grid e
              arraste para ordenar.
            </p>
          </div>
          <Button size="md" onClick={() => openCreateBlock("link")}>
            <Icon name="plus" size={18} />
            Adicionar link
          </Button>
        </div>

        {/* Studio Rich Blocks Toolbar */}
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-small font-semibold">
                Blocos ricos no Bento Grid
              </span>
              <Badge variant="pro">
                {!limits.businessFeatures && <Icon name="lock" size={11} />}
                Studio
              </Badge>
            </div>
            {!limits.businessFeatures && (
              <Link
                href="/app/plano"
                className="text-caption font-semibold text-ink underline underline-offset-2"
              >
                Conhecer o plano Studio →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {(
              [
                {
                  kind: "gallery" as const,
                  title: "Galeria (Carrossel)",
                  desc: "Fotos deslizáveis de produtos ou portfólio",
                  icon: "lm:grid",
                },
                {
                  kind: "youtube" as const,
                  title: "Vídeo do YouTube",
                  desc: "Player 16:9 embutido direto na página",
                  icon: "si:youtube",
                },
                {
                  kind: "service" as const,
                  title: "Card de Serviço",
                  desc: "Título, descrição, preço, duração e CTA",
                  icon: "lm:star",
                },
              ]
            ).map((b) => (
              <button
                key={b.kind}
                type="button"
                onClick={() => openCreateBlock(b.kind)}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper p-3 text-left transition-colors hover:border-ink"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface text-ink shadow-2xs">
                  <LinkIconGlyph iconRef={b.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-small font-semibold text-ink">
                      + {b.title}
                    </span>
                    {!limits.businessFeatures && (
                      <Icon
                        name="lock"
                        size={12}
                        className="shrink-0 text-ink-muted"
                      />
                    )}
                  </div>
                  <p className="truncate text-[11px] text-ink-muted">
                    {b.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Free plan link counter */}
        {limits.maxLinks !== null && (
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-small">
              <span className="font-semibold">
                {links.length} de {limits.maxLinks} links no Grátis
              </span>
              {links.length >= limits.maxLinks && (
                <Link
                  href="/app/plano"
                  className="text-small font-semibold underline"
                >
                  Desbloquear links ilimitados no Pro →
                </Link>
              )}
            </div>
            <Progress
              value={links.length}
              max={limits.maxLinks}
              label="Links usados"
              tone={links.length >= limits.maxLinks ? "warning" : "default"}
            />
          </div>
        )}

        {downgraded && links.some((l) => !l.active) && (
          <Alert tone="warning" title="Links pausados no retorno ao Grátis">
            Links acima do limite de 5 foram pausados automaticamente (nenhum foi
            apagado). Para reativar todos de uma vez, volte para o{" "}
            <Link href="/app/plano" className="font-semibold underline">
              plano Pro →
            </Link>
          </Alert>
        )}

        {limitError && (
          <Alert tone="warning" title="Limite de links atingido">
            {limitError}{" "}
            <Link href="/app/plano" className="font-semibold underline">
              Assinar o Pro →
            </Link>
          </Alert>
        )}

        {/* Featured summary */}
        <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-small font-semibold">Botão principal</span>
            <Badge variant="neutral">Alfinete</Badge>
          </div>
          {featuredLink ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3.5 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <LinkIconGlyph iconRef={featuredLink.icon} size={18} />
                <span className="truncate text-small font-medium">
                  {featuredLink.title}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleFeatured(featuredLink)}
              >
                Remover
              </Button>
            </div>
          ) : (
            <p className="text-small text-ink-muted">
              Toque no ícone de alfinete em qualquer link abaixo para destacá-lo
              no topo da página.
            </p>
          )}
        </section>

        {/* Contact shortcuts */}
        <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
          <h2 className="text-small font-semibold">Atalhos de contato</h2>
          <p className="text-caption text-ink-muted">
            Escolha quais botões rápidos aparecem quando você preencher os dados
            em Informações.
          </p>
          <div className="mt-1 flex flex-col divide-y divide-line">
            <Switch
              label="WhatsApp"
              checked={actions.whatsapp}
              onChange={(e) => handleToggleAction("whatsapp", e.target.checked)}
            />
            <Switch
              label="Salvar contato (.vcf)"
              checked={actions.contact}
              onChange={(e) => handleToggleAction("contact", e.target.checked)}
            />
            <Switch
              label="Como chegar (mapa)"
              checked={actions.directions}
              onChange={(e) =>
                handleToggleAction("directions", e.target.checked)
              }
            />
          </div>
        </section>

        {/* Sortable links & blocks list */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-small font-semibold">
              Seus cards e blocos ({links.length})
            </h2>
            <span className="text-caption text-ink-muted">
              Segure e arraste para misturar e reordenar
            </span>
          </div>

          {links.length === 0 ? (
            <EmptyState
              icon="link"
              title="Nenhum link ainda"
              text="Adicione seu Instagram, WhatsApp, galeria de fotos, vídeo ou card de serviço."
              action={
                <Button size="md" onClick={() => openCreateBlock("link")}>
                  <Icon name="plus" size={16} />
                  Adicionar primeiro link
                </Button>
              }
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={links.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <SortableLinkRow
                      key={link.id}
                      link={link}
                      canResize={limits.customTheme}
                      onEdit={openEdit}
                      onToggleActive={handleToggleActive}
                      onToggleFeatured={handleToggleFeatured}
                      onChangeSize={handleChangeSize}
                      onRequestDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>

      <PhonePreview page={livePreviewPage} pageUrl={pageUrl} />

      {/* Add / Edit Link or Rich Block Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving || uploadingPhoto}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="link-modal-form"
              loading={saving}
              disabled={uploadingPhoto}
            >
              {saving ? "Salvando…" : "Salvar no grid"}
            </Button>
          </>
        }
      >
        <form
          id="link-modal-form"
          onSubmit={handleSaveModal}
          className="flex flex-col gap-4"
          noValidate
        >
          {draft.error && (
            <Alert tone="error" title="Confira os dados">
              {draft.error}
            </Alert>
          )}

          {/* Block Type Switcher when creating new */}
          {!draft.id && limits.businessFeatures && (
            <div className="grid grid-cols-4 gap-1.5 rounded-lg border border-line bg-paper p-1">
              {(
                [
                  { id: "link", label: "Link" },
                  { id: "gallery", label: "Galeria" },
                  { id: "youtube", label: "YouTube" },
                  { id: "service", label: "Serviço" },
                ] as { id: BlockModalType; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      blockKind: t.id,
                      icon:
                        t.id === "gallery"
                          ? "lm:grid"
                          : t.id === "youtube"
                            ? "si:youtube"
                            : t.id === "service"
                              ? "lm:star"
                              : "lm:link",
                      size: t.id === "link" ? "2x1" : "2x2",
                      error: undefined,
                    }))
                  }
                  className={`h-8 cursor-pointer rounded-md text-caption font-semibold ${
                    draft.blockKind === t.id
                      ? "bg-ink text-paper"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* URL Field (for Link, YouTube, Service) */}
          {draft.blockKind !== "gallery" && (
            <Input
              label={
                draft.blockKind === "youtube"
                  ? "Link do vídeo no YouTube"
                  : draft.blockKind === "service"
                    ? "Link de ação (WhatsApp, agendamento ou checkout)"
                    : "Endereço (URL ou chave Pix)"
              }
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={
                draft.blockKind === "youtube"
                  ? "https://www.youtube.com/watch?v=..."
                  : draft.blockKind === "service"
                    ? "https://wa.me/5511999999999"
                    : "https://instagram.com/seunegocio"
              }
              value={draft.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              required
            />
          )}

          <div className="flex items-end gap-2.5">
            {draft.blockKind !== "youtube" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-small font-semibold">Ícone</span>
                <button
                  type="button"
                  aria-label="Escolher ícone"
                  onClick={() => setIconPickerOpen(true)}
                  className="grid size-11 cursor-pointer place-items-center rounded-md border border-line-strong bg-surface hover:border-ink"
                >
                  <LinkIconGlyph iconRef={draft.icon} size={20} />
                </button>
              </div>
            )}
            <Input
              label={
                draft.blockKind === "service"
                  ? "Nome do serviço"
                  : draft.blockKind === "gallery"
                    ? "Título da galeria"
                    : "Título (CTA)"
              }
              value={draft.title}
              maxLength={80}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  title: e.target.value,
                  titleEdited: true,
                  error: undefined,
                }))
              }
              placeholder={
                draft.blockKind === "service"
                  ? "Ex.: Consultoria Individual"
                  : draft.blockKind === "gallery"
                    ? "Ex.: Nosso Portfólio"
                    : "Ex.: Chamar no WhatsApp"
              }
              className="flex-1"
              required
            />
          </div>

          <Input
            label={
              draft.blockKind === "service"
                ? "Descrição do serviço (opcional)"
                : "Subtítulo (opcional)"
            }
            value={draft.subtitle}
            maxLength={120}
            onChange={(e) =>
              setDraft((p) => ({ ...p, subtitle: e.target.value }))
            }
            placeholder={
              draft.blockKind === "service"
                ? "Ex.: Atendimento completo de 1h com diagnóstico e plano."
                : "Ex.: Resposta rápida"
            }
          />

          {/* GALLERY SPECIFIC FIELDS */}
          {draft.blockKind === "gallery" && (
            <div className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-small font-semibold">
                  Fotos do carrossel ({draft.images.length}/10)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <input
                    ref={galleryFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={handleUploadGalleryPhoto}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={uploadingPhoto}
                    onClick={() => galleryFileRef.current?.click()}
                  >
                    + Enviar foto
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setUnsplashOpen(true)}
                  >
                    Buscar no Unsplash
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  label="Legenda da próxima foto (opcional)"
                  value={draft.newImageCaption}
                  maxLength={80}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      newImageCaption: e.target.value,
                    }))
                  }
                  placeholder="Ex.: Antes e depois"
                  className="flex-1"
                />
              </div>

              <div className="flex items-end gap-2">
                <Input
                  label="Ou adicione por URL de imagem"
                  value={draft.newImageUrl}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, newImageUrl: e.target.value }))
                  }
                  placeholder="https://..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleAddImageUrl}
                >
                  Adicionar
                </Button>
              </div>

              {draft.images.length > 0 && (
                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {draft.images.map((img, idx) => (
                    <div
                      key={`${img.url}-${idx}`}
                      className="group relative overflow-hidden rounded-md border border-line bg-surface"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.caption || `Foto ${idx + 1}`}
                        className="h-20 w-full object-cover"
                      />
                      {img.caption && (
                        <p className="truncate px-1.5 py-1 text-[10px] text-ink-muted">
                          {img.caption}
                        </p>
                      )}
                      <button
                        type="button"
                        aria-label={`Remover foto ${idx + 1}`}
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            images: p.images.filter((_, i) => i !== idx),
                          }))
                        }
                        className="absolute top-1 right-1 grid size-6 cursor-pointer place-items-center rounded-full bg-black/70 text-white"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SERVICE SPECIFIC FIELDS */}
          {draft.blockKind === "service" && (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-line bg-paper p-3.5 sm:grid-cols-2">
              <Input
                label="Preço (opcional)"
                value={draft.price}
                maxLength={32}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, price: e.target.value }))
                }
                placeholder="Ex.: R$ 150"
              />
              <Input
                label="Duração / Detalhe (opcional)"
                value={draft.duration}
                maxLength={32}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, duration: e.target.value }))
                }
                placeholder="Ex.: 60 min"
              />
              <Input
                label="Texto do botão CTA"
                value={draft.ctaLabel}
                maxLength={40}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, ctaLabel: e.target.value }))
                }
                placeholder="Ex.: Agendar no WhatsApp"
              />
              <Input
                label="Selo de destaque (opcional)"
                value={draft.badge}
                maxLength={28}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, badge: e.target.value }))
                }
                placeholder="Ex.: Mais pedido"
              />
            </div>
          )}

          {draft.blockKind === "link" && (
            <Checkbox
              label="Destacar como botão principal (com alfinete)"
              checked={draft.featured}
              onChange={(e) =>
                setDraft((p) => ({ ...p, featured: e.target.checked }))
              }
            />
          )}
        </form>
      </Dialog>

      <IconPicker
        open={iconPickerOpen}
        value={draft.icon}
        onSelect={(iconRef) => setDraft((p) => ({ ...p, icon: iconRef }))}
        onClose={() => setIconPickerOpen(false)}
      />

      <UnsplashPicker
        open={unsplashOpen}
        onClose={() => setUnsplashOpen(false)}
        title="Adicionar foto do Unsplash à galeria"
        onSelect={(photo) => {
          if (draft.images.length >= 10) {
            setDraft((p) => ({
              ...p,
              error: "Máximo de 10 fotos por galeria.",
            }));
            return;
          }
          setDraft((p) => ({
            ...p,
            images: [
              ...p.images,
              {
                url: photo.regularUrl,
                caption:
                  p.newImageCaption.trim() || `Foto por ${photo.authorName}`,
              },
            ],
            newImageCaption: "",
            error: undefined,
          }));
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Excluir este item?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” será removido da sua página.`
            : undefined
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </>
        }
      />
    </div>
  );
}
