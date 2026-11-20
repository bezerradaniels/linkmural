import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://linkmural.com",
  ),
  title: { default: "linkmural", template: "%s · linkmural" },
  description: "A página de links do seu negócio, pronta em 3 minutos.",
};

export const viewport: Viewport = {
  themeColor: "#F4F4EF",
};

// Fonts are set per section: (site)/layout.tsx for the panel and marketing,
// the style font for public pages (src/lib/public-fonts.ts).
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
