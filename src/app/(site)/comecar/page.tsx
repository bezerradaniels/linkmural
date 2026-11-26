import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { TikTokConversionLp } from "@/components/landing/TikTokConversionLp";
import { resolveHeroVariant } from "@/lib/hero-variants";
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

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function ComecarLpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawUtmContent = firstParam(params.utm_content);
  const { key, content } = resolveHeroVariant(rawUtmContent);

  const utmParams: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = firstParam(params[k])?.trim();
    if (v) utmParams[k] = v;
  }

  return (
    <div className={`${figtree.className} font-medium`}>
      <TikTokConversionLp
        variantKey={key}
        variant={content}
        utmParams={utmParams}
      />
    </div>
  );
}
