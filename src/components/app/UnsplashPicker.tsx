"use client";

import { useCallback, useState } from "react";
import { Button, Dialog, Icon, Input, Spinner } from "@/components/ui";
import {
  CURATED_UNSPLASH_PHOTOS,
  UNSPLASH_HOME_URL,
  UNSPLASH_TOPICS,
  type UnsplashPhoto,
} from "@/lib/unsplash";

export function UnsplashPicker({
  open,
  onClose,
  onSelect,
  orientation = "landscape",
  title = "Buscar foto gratuita no Unsplash",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (photo: UnsplashPhoto) => void;
  orientation?: "landscape" | "portrait" | "squarish";
  title?: string;
}) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>(
    CURATED_UNSPLASH_PHOTOS,
  );
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/unsplash?q=${encodeURIComponent(q)}&orientation=${orientation}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { photos?: UnsplashPhoto[] };
        if (Array.isArray(data.photos)) {
          setPhotos(data.photos);
        }
      } catch {
        // Keep current photos on network error
      } finally {
        setLoading(false);
      }
    },
    [orientation],
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runSearch(query);
  }

  function handlePickPhoto(photo: UnsplashPhoto) {
    if (photo.downloadLocation) {
      void fetch("/api/unsplash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
      }).catch(() => {});
    }
    onSelect(photo);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description="Escolha uma imagem profissional gratuita. O crédito ao fotógrafo segue as diretrizes oficiais do Unsplash."
      actions={
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="flex flex-col gap-3.5">
        <form onSubmit={handleSearchSubmit} className="flex items-end gap-2">
          <Input
            label="Pesquisar no Unsplash"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: cafeteria, academia, estética, minimalista..."
            className="flex-1"
          />
          <Button type="submit" size="md" loading={loading}>
            Buscar
          </Button>
        </form>

        {/* Sugestões rápidas de nicho */}
        <div className="flex flex-wrap gap-1.5">
          {UNSPLASH_TOPICS.map((t) => (
            <button
              key={t.query}
              type="button"
              onClick={() => {
                setQuery(t.label);
                void runSearch(t.query);
              }}
              className="cursor-pointer rounded-pill border border-line bg-paper px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:border-ink hover:text-ink"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grade de fotos */}
        {loading ? (
          <div className="grid h-56 place-items-center">
            <Spinner />
          </div>
        ) : photos.length === 0 ? (
          <div className="grid h-44 place-items-center rounded-lg border border-dashed border-line bg-paper p-4 text-center text-small text-ink-muted">
            Nenhuma foto encontrada para “{query}”. Tente outro termo (em
            português ou inglês).
          </div>
        ) : (
          <div className="grid max-h-[360px] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-line bg-paper"
              >
                <button
                  type="button"
                  onClick={() => handlePickPhoto(photo)}
                  className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden border-0 p-0"
                  style={{ backgroundColor: photo.color }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Unsplash CDN hotlink required by Unsplash API guidelines */}
                  <img
                    src={photo.thumbUrl}
                    alt={photo.alt}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink shadow-xs">
                      <Icon name="check" size={12} />
                      Usar foto
                    </span>
                  </span>
                </button>
                <div className="truncate px-2 py-1 text-[10px] text-ink-muted">
                  Foto por{" "}
                  <a
                    href={photo.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink underline underline-offset-2"
                  >
                    {photo.authorName}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-right text-[11px] text-ink-muted">
          Fotos fornecidas por{" "}
          <a
            href={UNSPLASH_HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink underline underline-offset-2"
          >
            Unsplash
          </a>
        </p>
      </div>
    </Dialog>
  );
}
