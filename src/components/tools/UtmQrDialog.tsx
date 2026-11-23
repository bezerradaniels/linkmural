"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button, Dialog, Icon, useToast } from "@/components/ui";

export function UtmQrDialog({
  open,
  url,
  label,
  onClose,
}: {
  open: boolean;
  url: string;
  label: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!open || !url) return;
    let active = true;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#111214", light: "#FFFFFF" },
    })
      .then((out) => {
        if (active) setDataUrl(out);
      })
      .catch(() => {
        if (active) setDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [open, url]);

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    const safeName =
      label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "link-utm";
    link.href = dataUrl;
    link.download = `qrcode-${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("QR Code baixado em PNG.");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toast("URL com UTM copiada.");
    } catch {
      toast("Não foi possível copiar automaticamente.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={label ? `QR Code · ${label}` : "QR Code do link com UTM"}
      description="Aponte a câmera para testar ou baixe em alta resolução (PNG) para materiais impressos."
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-56 items-center justify-center rounded-2xl border border-line bg-white p-3">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt={`QR Code para ${label || url}`}
              className="size-full object-contain"
            />
          ) : (
            <span className="text-caption text-ink-muted">
              Gerando QR Code...
            </span>
          )}
        </div>

        <p className="w-full break-all rounded-lg border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink-muted">
          {url}
        </p>

        <div className="flex w-full flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="flex-1"
            onClick={handleDownload}
            disabled={!dataUrl}
          >
            <Icon name="arrow" size={15} className="rotate-90" />
            Baixar PNG
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={handleCopy}
          >
            <Icon name="copy" size={15} />
            Copiar URL
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
