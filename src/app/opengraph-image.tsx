import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0E0E0E",
        color: "#F4F4EF",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          fontSize: "28px",
          fontWeight: 700,
        }}
      >
        <span
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "999px",
            background: "#CDF54A",
          }}
        />
        <span>linkmural</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          A página de links do seu negócio, pronta em 3 minutos.
        </div>
        <div style={{ fontSize: "28px", color: "#A3A39C" }}>
          WhatsApp, Salvar contato, QR code e 3 modelos. Comece grátis em
          linkmural.com
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <span
          style={{
            background: "#CDF54A",
            color: "#0E0E0E",
            padding: "14px 28px",
            borderRadius: "999px",
            fontSize: "24px",
            fontWeight: 700,
          }}
        >
          linkmural.com
        </span>
      </div>
    </div>,
    { ...size },
  );
}
