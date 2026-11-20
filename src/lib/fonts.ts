import { Inter, Unbounded } from "next/font/google";

/** Panel fonts. The public page loads only its style's font (Phase 1). */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-unbounded",
  display: "swap",
});
