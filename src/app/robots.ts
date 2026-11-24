import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/redirect";

const PRODUCTION_HOST = "linkmural.com";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  // Beta and local builds show the same customer pages on another domain:
  // keep them out of search engines entirely.
  if (new URL(base).hostname !== PRODUCTION_HOST) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app",
          "/editor",
          "/admin",
          "/onboarding",
          "/api",
          "/auth",
          "/dev",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
