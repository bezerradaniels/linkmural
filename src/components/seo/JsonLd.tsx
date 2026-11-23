import { serializeJsonLd } from "@/lib/seo";

/** Renders a JSON-LD structured data script tag safely. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
