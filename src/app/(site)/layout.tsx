import { braveold, inter } from "@/lib/fonts";

/**
 * Panel, login and marketing pages use the brand fonts (Inter + Braveold).
 * Public pages (/[slug]) live outside this group so they only load the font
 * of their own style.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${inter.variable} ${braveold.variable} min-h-dvh font-sans`}
    >
      {children}
    </div>
  );
}
