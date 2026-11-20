"use client";

import { useState, useTransition } from "react";
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
import type { Tables } from "@/utils/supabase/types";

type LinkRow = Tables<"links">;

function SortableLinkRow({
  link,
  onEdit,
  onToggleActive,
  onToggleFeatured,
  onRequestDelete,
}: {
  link: LinkRow;
  onEdit: (link: LinkRow) => void;
  onToggleActive: (link: LinkRow, active: boolean) => void;
  onToggleFeatured: (link: LinkRow) => void;
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
          <div className="flex items-center gap-2">
            <p className="truncate text-small font-semibold text-ink">
              {link.title}
            </p>
            {link.featured && <Badge variant="pro">Destaque</Badge>}
          </div>
          <p className="truncate text-caption text-ink-muted">{link.url}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 border-t border-line pt-2 sm:border-t-0 sm:pt-0">
        {link.kind !== "pix" && (
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
  title: string;
  titleEdited: boolean;
  subtitle: string;
  url: string;
  icon: string;
  featured: boolean;
  error?: string;
};

export function LinksEditor({
  initialLinks,
  previewBase,
  pageUrl,
  plan,
}: {
  initialLinks: LinkRow[];
  previewBase: PublicPage;
  pageUrl: string;
  plan: Plan;
}) {
  const toast = useToast();
  const limits = planInfo(plan);
  const [links, setLinks] = useState<LinkRow[]>(initialLinks);
  const [actions, setActions] = useState<PageActions>(() =>
    parsePageActions(previewBase.actions),
  );
  const [limitError, setLimitError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  // Add/Edit dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [draft, setDraft] = useState<ModalDraft>({
    title: "",
    titleEdited: false,
    subtitle: "",
    url: "",
    icon: "lm:link",
    featured: false,
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

  function openCreate() {
    setLimitError(null);
    setDraft({
      title: "",
      titleEdited: false,
      subtitle: "",
      url: "",
      icon: "lm:link",
      featured: false,
    });
    setModalOpen(true);
  }

  function openEdit(link: LinkRow) {
    setDraft({
      id: link.id,
      title: link.title,
      titleEdited: true,
      subtitle: link.subtitle ?? "",
      url: link.url,
      icon: link.icon ?? "lm:link",
      featured: link.featured,
    });
    setModalOpen(true);
  }

  function handleUrlChange(nextUrl: string) {
    const detected = detectLink(nextUrl);
    setDraft((prev) => ({
      ...prev,
      url: nextUrl,
      icon: detected ? detected.icon : prev.icon,
      title: detected && !prev.titleEdited ? detected.title : prev.title,
      error: undefined,
    }));
  }

  function handleSaveModal(e: React.FormEvent) {
    e.preventDefault();
    const urlCheck = linkUrlSchema.safeParse(draft.url);
    if (!urlCheck.success) {
      setDraft((p) => ({
        ...p,
        error: urlCheck.error.issues[0]?.message ?? "Endereço inválido.",
      }));
      return;
    }
    const title = draft.title.trim();
    if (!title) {
      setDraft((p) => ({ ...p, error: "Digite um título para o link." }));
      return;
    }

    startSaving(async () => {
      if (draft.id) {
        const res = await updateLinkAction({
          id: draft.id,
          title,
          subtitle: draft.subtitle.trim() || null,
          url: draft.url,
          icon: draft.icon,
          featured: draft.featured,
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
          title,
          subtitle: draft.subtitle.trim(),
          url: draft.url,
          icon: draft.icon,
          featured: draft.featured,
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
        toast("Link adicionado");
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
        toast(res.error);
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
          message: "Link excluído",
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
                });
                if (restored.ok && restored.data) {
                  setLinks((prev) =>
                    [...prev, restored.data!].sort(
                      (a, b) => a.position - b.position,
                    ),
                  );
                  toast("Link restaurado");
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

  const featuredLink = links.find((l) => l.featured && l.active) ?? null;

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
      })),
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-display-md tracking-[-0.03em]">
              Página e links
            </h1>
            <p className="text-small text-ink-muted">
              Adicione, destaque e arraste para ordenar. Tudo salva na hora.
            </p>
          </div>
          <Button size="md" onClick={openCreate}>
            <Icon name="plus" size={18} />
            Adicionar link
          </Button>
        </div>

        {/* Free plan link counter */}
        {limits.maxLinks !== null && (
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-2 text-small">
              <span className="font-semibold">
                {links.length} de {limits.maxLinks} links no Grátis
              </span>
              {links.length >= limits.maxLinks && (
                <Link
                  href="/app/plano"
                  className="text-small font-semibold underline"
                >
                  Ver planos
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

        {limitError && (
          <Alert tone="warning" title="Limite de links atingido">
            {limitError}{" "}
            <Link href="/app/plano" className="font-semibold underline">
              Ver planos
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

        {/* Sortable links list */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-small font-semibold">Seus links</h2>
            <span className="text-caption text-ink-muted">
              Segure e arraste para reordenar
            </span>
          </div>

          {links.length === 0 ? (
            <EmptyState
              icon="link"
              title="Nenhum link ainda"
              text="Adicione seu Instagram, WhatsApp, cardápio, agenda ou site."
              action={
                <Button size="md" onClick={openCreate}>
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
                      onEdit={openEdit}
                      onToggleActive={handleToggleActive}
                      onToggleFeatured={handleToggleFeatured}
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

      {/* Add / Edit Link Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={draft.id ? "Editar link" : "Novo link"}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" form="link-modal-form" loading={saving}>
              {saving ? "Salvando…" : "Salvar link"}
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

          <Input
            label="Endereço (URL ou chave Pix)"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="https://instagram.com/seunegocio"
            value={draft.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
          />

          <div className="flex items-end gap-2.5">
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
            <Input
              label="Título"
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
              placeholder="Ex.: Instagram"
              className="flex-1"
              required
            />
          </div>

          <Input
            label="Subtítulo (opcional)"
            value={draft.subtitle}
            maxLength={120}
            onChange={(e) =>
              setDraft((p) => ({ ...p, subtitle: e.target.value }))
            }
            placeholder="Ex.: @seunegocio"
          />

          <Checkbox
            label="Destacar como botão principal (com alfinete)"
            checked={draft.featured}
            onChange={(e) =>
              setDraft((p) => ({ ...p, featured: e.target.checked }))
            }
          />
        </form>
      </Dialog>

      <IconPicker
        open={iconPickerOpen}
        value={draft.icon}
        onSelect={(iconRef) => setDraft((p) => ({ ...p, icon: iconRef }))}
        onClose={() => setIconPickerOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Excluir este link?"
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
              Excluir link
            </Button>
          </>
        }
      />
    </div>
  );
}
