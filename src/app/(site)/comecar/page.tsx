import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { TikTokConversionLp } from "@/components/landing/TikTokConversionLp";
import { siteUrl } from "@/lib/redirect";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title:
    "Linkmural | Organize links, capture leads e aproxime clientes da sua empresa",
  description:
    "Facilite a comunicação de clientes com a empresa, organize seus links, capture leads, monetize sua audiência e reforce a sua marca.",
  alternates: { canonical: `${siteUrl()}/comecar` },
};

export default function ComecarLpPage() {
  return (
    <div className={`${figtree.className} font-medium`}>
      <TikTokConversionLp />
    </div>
  );
}
