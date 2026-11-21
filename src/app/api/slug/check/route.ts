import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { recordOnboardingEvent } from "@/lib/onboarding-events";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  buildSlugCandidates,
  finalizeSlug,
  isValidSlug,
  parseHoldCookie,
  serializeHoldCookie,
  SLUG_HOLD_COOKIE,
  SLUG_HOLD_MINUTES,
  type SlugStatus,
} from "@/lib/slug";
import { createAdminClient } from "@/utils/supabase/admin";

type CheckResult = {
  status: SlugStatus;
  slug: string;
  suggestions: string[];
};

async function findFreeSuggestions(
  admin: ReturnType<typeof createAdminClient>,
  baseSlug: string,
): Promise<string[]> {
  const candidates = buildSlugCandidates(baseSlug);
  if (candidates.length === 0) return [];

  const nowIso = new Date().toISOString();
  const [reservedRes, pagesRes, holdsRes] = await Promise.all([
    admin.from("reserved_slugs").select("slug").in("slug", candidates),
    admin.from("pages").select("slug").in("slug", candidates),
    admin
      .from("slug_holds")
      .select("slug")
      .in("slug", candidates)
      .gt("expires_at", nowIso),
  ]);

  const taken = new Set<string>();
  for (const row of reservedRes.data ?? []) taken.add(row.slug);
  for (const row of pagesRes.data ?? []) taken.add(row.slug);
  for (const row of holdsRes.data ?? []) taken.add(row.slug);

  return candidates.filter((c) => !taken.has(c)).slice(0, 3);
}

async function checkSlugStatus(
  rawSlug: string,
  cookieHold: { slug: string; token: string } | null,
): Promise<CheckResult> {
  const slug = finalizeSlug(rawSlug);
  if (!isValidSlug(slug)) {
    return { status: "invalido", slug, suggestions: [] };
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const [reservedRes, pageRes, holdRes] = await Promise.all([
    admin.from("reserved_slugs").select("slug").eq("slug", slug).maybeSingle(),
    admin.from("pages").select("slug").eq("slug", slug).maybeSingle(),
    admin
      .from("slug_holds")
      .select("slug, token, expires_at")
      .eq("slug", slug)
      .gt("expires_at", nowIso)
      .maybeSingle(),
  ]);

  if (reservedRes.data) {
    // No variations of reserved names: "instagram-oficial" or "meunubank"
    // are exactly the look-alikes the reserved list exists to prevent.
    return { status: "reservado", slug, suggestions: [] };
  }

  if (pageRes.data) {
    return {
      status: "ocupado",
      slug,
      suggestions: await findFreeSuggestions(admin, slug),
    };
  }

  if (holdRes.data) {
    const ownedByCaller =
      cookieHold?.slug === slug && cookieHold.token === holdRes.data.token;
    if (!ownedByCaller) {
      return {
        status: "ocupado",
        slug,
        suggestions: await findFreeSuggestions(admin, slug),
      };
    }
  }

  return { status: "livre", slug, suggestions: [] };
}

/** GET /api/slug/check?slug=... — checks availability and returns 3 suggestions if taken. */
export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, {
    bucket: "slug:get",
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return rateLimitResponse(
      rl.retryAfterSeconds,
      "Muitas consultas seguidas. Aguarde alguns segundos.",
    );
  }

  const raw = request.nextUrl.searchParams.get("slug") ?? "";
  const cookieHold = parseHoldCookie(
    request.cookies.get(SLUG_HOLD_COOKIE)?.value,
  );

  try {
    const result = await checkSlugStatus(raw, cookieHold);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[api/slug/check] GET failed:", error);
    return NextResponse.json(
      { error: "Não foi possível verificar o endereço agora." },
      { status: 500 },
    );
  }
}

const reserveBodySchema = z.object({
  slug: z.string().min(1).max(64),
  ref: z.string().max(64).optional(),
});

/** POST /api/slug/check — holds the slug for 30 minutes and sets the httpOnly hold cookie. */
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, {
    bucket: "slug:post",
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return rateLimitResponse(
      rl.retryAfterSeconds,
      "Muitas tentativas de reserva seguidas. Aguarde um instante.",
    );
  }

  const parsed = reserveBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalido" as const, slug: "", suggestions: [] },
      { status: 400 },
    );
  }

  const cookieHold = parseHoldCookie(
    request.cookies.get(SLUG_HOLD_COOKIE)?.value,
  );

  try {
    const check = await checkSlugStatus(parsed.data.slug, cookieHold);
    if (check.status !== "livre") {
      return NextResponse.json(check, {
        status: check.status === "invalido" ? 400 : 409,
      });
    }

    const admin = createAdminClient();
    const nowIso = new Date().toISOString();
    const token =
      cookieHold?.slug === check.slug ? cookieHold.token : crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + SLUG_HOLD_MINUTES * 60 * 1000,
    ).toISOString();

    // Prevent race conditions: remove only expired holds, then either refresh
    // the caller's own hold or insert atomically (concurrent racer gets 23505).
    await admin
      .from("slug_holds")
      .delete()
      .eq("slug", check.slug)
      .lte("expires_at", nowIso);

    let holdError: { code?: string; message: string } | null = null;
    if (cookieHold?.slug === check.slug) {
      const { data: updated, error } = await admin
        .from("slug_holds")
        .update({ expires_at: expiresAt })
        .eq("slug", check.slug)
        .eq("token", token)
        .select("slug")
        .maybeSingle();
      if (error) {
        holdError = error;
      } else if (!updated) {
        const ins = await admin
          .from("slug_holds")
          .insert({ slug: check.slug, token, expires_at: expiresAt });
        holdError = ins.error;
      }
    } else {
      const ins = await admin
        .from("slug_holds")
        .insert({ slug: check.slug, token, expires_at: expiresAt });
      holdError = ins.error;
    }

    if (holdError) {
      if (holdError.code === "23505") {
        const suggestions = await findFreeSuggestions(admin, check.slug);
        return NextResponse.json(
          { status: "ocupado" as const, slug: check.slug, suggestions },
          { status: 409 },
        );
      }
      console.error("[api/slug/check] hold insert failed:", holdError.message);
      return NextResponse.json(
        { error: "Não foi possível reservar esse endereço agora." },
        { status: 500 },
      );
    }

    const refSlug = parsed.data.ref ? finalizeSlug(parsed.data.ref) : "";
    const validRef = refSlug && isValidSlug(refSlug) ? refSlug : undefined;

    recordOnboardingEvent({
      event: "slug_escolhido",
      slug: check.slug,
      metadata: validRef ? { ref: validRef } : {},
    });

    const response = NextResponse.json({
      ok: true,
      status: "livre" as const,
      slug: check.slug,
    });

    response.cookies.set(
      SLUG_HOLD_COOKIE,
      serializeHoldCookie(check.slug, token),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SLUG_HOLD_MINUTES * 60,
        path: "/",
      },
    );

    if (validRef) {
      response.cookies.set("lm_ref", validRef, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("[api/slug/check] POST failed:", error);
    return NextResponse.json(
      { error: "Não foi possível reservar o endereço agora." },
      { status: 500 },
    );
  }
}
