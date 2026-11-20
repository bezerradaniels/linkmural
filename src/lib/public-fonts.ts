import {
  DM_Sans,
  Fraunces,
  Inter,
  Plus_Jakarta_Sans,
  Sora,
  Space_Grotesk,
} from "next/font/google";
import type { FontName } from "./styles";

/*
 * Public page fonts. All six are declared (next/font needs static calls),
 * but preload is off: the browser only downloads the font a page uses.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--pf-inter",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--pf-dm-sans",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--pf-jakarta",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--pf-space-grotesk",
});
const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--pf-sora",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--pf-fraunces",
});

const BY_NAME: Record<FontName, { className: string; family: string }> = {
  Inter: { className: inter.className, family: inter.style.fontFamily },
  "DM Sans": { className: dmSans.className, family: dmSans.style.fontFamily },
  "Plus Jakarta Sans": {
    className: jakarta.className,
    family: jakarta.style.fontFamily,
  },
  "Space Grotesk": {
    className: spaceGrotesk.className,
    family: spaceGrotesk.style.fontFamily,
  },
  Sora: { className: sora.className, family: sora.style.fontFamily },
  Fraunces: {
    className: fraunces.className,
    family: fraunces.style.fontFamily,
  },
};

/** className that applies the font, and its CSS font-family (for OG images, inline styles). */
export function publicFont(name: FontName) {
  return BY_NAME[name] ?? BY_NAME.Inter;
}
