"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Dialog } from "@/components/ui";

export type CroppedImageResult = {
  blob: Blob;
  ext: "webp" | "jpg";
  contentType: string;
};

type ImageCropModalProps = {
  file: File | null;
  onClose: () => void;
  onConfirm: (result: CroppedImageResult) => void | Promise<void>;
  /** Target width / height ratio (e.g. 1 for avatar, 2.5 for cover, 9/16 for background). */
  aspectRatio?: number;
  /** Maximum output width in pixels. */
  maxWidth?: number;
  title?: string;
  /** Optional circular guide overlay for avatars. */
  circularGuide?: boolean;
};

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function ImageCropEditor({
  file,
  onClose,
  onConfirm,
  aspectRatio = 1,
  maxWidth = 1080,
  title = "Ajustar e recortar imagem",
  circularGuide = false,
}: Omit<ImageCropModalProps, "file"> & { file: File }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const reader = new FileReader();
    reader.onload = () => {
      if (active && typeof reader.result === "string") {
        setImgUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    return () => {
      active = false;
    };
  }, [file]);

  const maxStageW = 340;
  const maxStageH = 260;
  let viewW = maxStageW;
  let viewH = Math.round(viewW / aspectRatio);
  if (viewH > maxStageH) {
    viewH = maxStageH;
    viewW = Math.round(viewH * aspectRatio);
  }

  const natW = naturalSize?.w ?? 1;
  const natH = naturalSize?.h ?? 1;
  const baseScale = Math.max(viewW / natW, viewH / natH);
  const dispW = natW * baseScale * zoom;
  const dispH = natH * baseScale * zoom;
  const maxOffsetX = Math.max(0, (dispW - viewW) / 2);
  const maxOffsetY = Math.max(0, (dispH - viewH) / 2);

  const clampedX = clamp(offset.x, -maxOffsetX, maxOffsetX);
  const clampedY = clamp(offset.y, -maxOffsetY, maxOffsetY);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: clampedX,
      startY: clampedY,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    setOffset({
      x: clamp(dragStartRef.current.startX + dx, -maxOffsetX, maxOffsetX),
      y: clamp(dragStartRef.current.startY + dy, -maxOffsetY, maxOffsetY),
    });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragging(false);
    dragStartRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  async function handleApplyCrop() {
    const img = imgRef.current;
    if (!img || !naturalSize) return;
    setProcessing(true);
    try {
      const totalScale = baseScale * zoom;
      const sw = viewW / totalScale;
      const sh = viewH / totalScale;
      const sx = clamp(
        (naturalSize.w - sw) / 2 - clampedX / totalScale,
        0,
        Math.max(0, naturalSize.w - sw),
      );
      const sy = clamp(
        (naturalSize.h - sh) / 2 - clampedY / totalScale,
        0,
        Math.max(0, naturalSize.h - sh),
      );

      const outW = Math.min(maxWidth, Math.max(1, Math.round(sw)));
      const outH = Math.max(1, Math.round(outW / aspectRatio));

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas_unavailable");

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const webp = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/webp", 0.86),
      );
      if (webp && webp.type === "image/webp") {
        await onConfirm({
          blob: webp,
          ext: "webp",
          contentType: "image/webp",
        });
        return;
      }

      const jpg = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/jpeg", 0.88),
      );
      if (!jpg) throw new Error("encode_failed");
      await onConfirm({
        blob: jpg,
        ext: "jpg",
        contentType: "image/jpeg",
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      description="Arraste a imagem para enquadrar e ajuste o zoom."
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={processing}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            loading={processing}
            disabled={!naturalSize}
            onClick={handleApplyCrop}
          >
            {processing ? "Enviando…" : "Recortar e usar"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full items-center justify-center rounded-xl bg-[#0B0C10] p-4">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width: `${viewW}px`, height: `${viewH}px` }}
            className={`relative overflow-hidden border-2 border-lime shadow-lg select-none touch-none ${
              circularGuide ? "rounded-full" : "rounded-lg"
            } ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            {imgUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={imgUrl}
                alt="Área de recorte"
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  if (el.naturalWidth && el.naturalHeight) {
                    setNaturalSize({
                      w: el.naturalWidth,
                      h: el.naturalHeight,
                    });
                  }
                }}
                style={{
                  width: `${dispW}px`,
                  height: `${dispH}px`,
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`,
                }}
                className="pointer-events-none absolute max-w-none select-none"
              />
            )}

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
            >
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>
          </div>
        </div>

        <div className="flex w-full items-center gap-3">
          <span className="text-caption font-semibold text-ink-muted">
            Zoom
          </span>
          <input
            type="range"
            aria-label="Zoom do recorte"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer accent-ink"
          />
          <span className="w-10 text-right text-caption font-semibold text-ink">
            {zoom.toFixed(1)}×
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
          >
            Centralizar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function ImageCropModal({ file, ...rest }: ImageCropModalProps) {
  if (!file) return null;
  return (
    <ImageCropEditor
      key={`${file.name}-${file.lastModified}-${file.size}`}
      file={file}
      {...rest}
    />
  );
}
