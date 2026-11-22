import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  CURATED_UNSPLASH_PHOTOS,
  isValidUnsplashDownloadUrl,
  mapUnsplashApiPhoto,
  type UnsplashPhoto,
} from "@/lib/unsplash";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/unsplash?q=...&orientation=landscape|squarish|portrait
 * Proxies search requests to the official Unsplash API using UNSPLASH_ACCESS_KEY
 * on the server so the key is never exposed to the browser.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rl = checkRateLimit(request, {
    bucket: `unsplash:${userId}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas buscas seguidas. Aguarde alguns segundos." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80);
  const orientationParam = searchParams.get("orientation");
  const orientation =
    orientationParam === "landscape" ||
    orientationParam === "portrait" ||
    orientationParam === "squarish"
      ? orientationParam
      : "landscape";

  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey) {
    return NextResponse.json({
      photos: CURATED_UNSPLASH_PHOTOS,
      configured: false,
    });
  }

  try {
    const endpoint = query
      ? `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=18&orientation=${orientation}&content_filter=high`
      : `https://api.unsplash.com/photos?per_page=18&order_by=popular`;

    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({
        photos: CURATED_UNSPLASH_PHOTOS,
        configured: true,
      });
    }

    const payload = (await res.json()) as unknown;
    const rawList = Array.isArray(payload)
      ? payload
      : payload &&
          typeof payload === "object" &&
          Array.isArray((payload as { results?: unknown[] }).results)
        ? (payload as { results: unknown[] }).results
        : [];

    const photos: UnsplashPhoto[] = [];
    for (const item of rawList) {
      const mapped = mapUnsplashApiPhoto(
        item as Parameters<typeof mapUnsplashApiPhoto>[0],
      );
      if (mapped) photos.push(mapped);
    }

    return NextResponse.json({
      photos: photos.length > 0 || query ? photos : CURATED_UNSPLASH_PHOTOS,
      configured: true,
    });
  } catch {
    return NextResponse.json({
      photos: CURATED_UNSPLASH_PHOTOS,
      configured: true,
    });
  }
}

/**
 * POST /api/unsplash
 * Triggers the Unsplash `download_location` endpoint when a user selects a photo,
 * as required by the official Unsplash API Guidelines.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey) {
    return NextResponse.json({ ok: true });
  }

  const body = (await request.json().catch(() => null)) as {
    downloadLocation?: unknown;
  } | null;
  const downloadLocation =
    typeof body?.downloadLocation === "string" ? body.downloadLocation : null;

  if (!isValidUnsplashDownloadUrl(downloadLocation)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await fetch(downloadLocation!, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
