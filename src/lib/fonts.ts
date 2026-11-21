import { Inter } from "next/font/google";
import localFont from "next/font/local";

/** Panel fonts. The public page loads only its style's font (Phase 1). */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const braveold = localFont({
  src: [
    {
      path: "../fonts/braveold-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/braveold-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/braveold-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-braveold",
  display: "swap",
});
