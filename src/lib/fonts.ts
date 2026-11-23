import { Inter, Stack_Sans_Headline } from "next/font/google";

/** Panel and marketing fonts. Public pages load only their style's font. */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const stackSansHeadline = Stack_Sans_Headline({
  subsets: ["latin"],
  variable: "--font-stack-sans-headline",
  display: "swap",
});
