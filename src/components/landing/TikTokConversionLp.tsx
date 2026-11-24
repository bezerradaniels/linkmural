"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestBrandSlugAction,
  type BrandRequestState,
} from "@/app/(site)/comecar/actions";
import {
  signInWithEmail,
  signInWithGoogle,
  verifyEmailOtp,
  type EmailState,
  type VerifyOtpState,
} from "@/app/(site)/entrar/actions";
import { trackGaEvent } from "@/lib/gtm";
import {
  finalizeSlug,
  isFamousBrandSlug,
  isOffensiveSlug,
  isPlatformReservedSlug,
  isValidSlug,
} from "@/lib/slug";

type SlugCheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "livre"; slug: string }
  | { status: "ocupado" | "reservado" | "invalido"; slug: string; suggestions: string[] }
  | { status: "error"; message: string };

const NEXT_AFTER_SIGNUP = "/onboarding/iniciar?confirmado=1";

function SendEmailButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#CDF54A] px-5 text-[15px] font-bold text-[#0E0E0E] shadow-[0_0_24px_rgba(205,245,74,0.28)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Enviando link…" : "Receber link no e-mail →"}
    </button>
  );
}

function VerifyOtpButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#CDF54A] px-5 text-[15px] font-bold text-[#0E0E0E] shadow-[0_0_24px_rgba(205,245,74,0.28)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Confirmando…" : "Confirmar e entrar →"}
    </button>
  );
}

const initialEmailState: EmailState = { status: "idle" };
const initialOtpState: VerifyOtpState = { status: "idle" };
const initialBrandState: BrandRequestState = { status: "idle" };

export function TikTokConversionLp() {
  const [step, setStep] = useState<"slug" | "email">("slug");
  const [rawSlug, setRawSlug] = useState("");
  const [slugCheckResult, setSlugCheckResult] = useState<SlugCheckState>({
    status: "idle",
  });
  const [reserving, setReserving] = useState(false);
  const [reservedSlug, setReservedSlug] = useState("");
  const [email, setEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [requestingBrand, setRequestingBrand] = useState(false);

  const [emailState, emailAction] = useActionState(
    signInWithEmail,
    initialEmailState,
  );
  const [otpState, otpAction] = useActionState(
    verifyEmailOtp,
    initialOtpState,
  );
  const [brandState, brandAction] = useActionState(
    requestBrandSlugAction,
    initialBrandState,
  );

  const normalizedSlug = finalizeSlug(rawSlug);
  const offensiveSlug = isOffensiveSlug(normalizedSlug);
  const platformReservedSlug = isPlatformReservedSlug(normalizedSlug);
  const famousBrandSlug = isFamousBrandSlug(normalizedSlug);
  const blockedSlug = offensiveSlug || platformReservedSlug;
  const previewSlug =
    normalizedSlug && !blockedSlug ? normalizedSlug : "seunome";

  const slugState: SlugCheckState =
    !normalizedSlug || normalizedSlug.length < 3
      ? { status: "idle" }
      : !isValidSlug(normalizedSlug)
        ? { status: "invalido", slug: normalizedSlug, suggestions: [] }
        : slugCheckResult;

  // Debounced live availability check
  useEffect(() => {
    if (!normalizedSlug || normalizedSlug.length < 3 || !isValidSlug(normalizedSlug)) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setSlugCheckResult({ status: "checking" });
      try {
        const res = await fetch(
          `/api/slug/check?slug=${encodeURIComponent(normalizedSlug)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          status?: "livre" | "ocupado" | "reservado" | "invalido";
          slug?: string;
          suggestions?: string[];
        };
        if (data.status === "livre" && data.slug) {
          setSlugCheckResult({ status: "livre", slug: data.slug });
        } else if (data.status) {
          setSlugCheckResult({
            status: data.status,
            slug: data.slug ?? normalizedSlug,
            suggestions: data.suggestions ?? [],
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setSlugCheckResult({
            status: "error",
            message: "Não foi possível verificar agora.",
          });
        }
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedSlug]);

  async function handleReserveSlug(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidSlug(normalizedSlug) || reserving) return;

    setReserving(true);
    try {
      const res = await fetch("/api/slug/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: normalizedSlug }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        status?: "livre" | "ocupado" | "reservado" | "invalido";
        slug?: string;
        suggestions?: string[];
        error?: string;
      };
      if (res.ok && data.ok && data.slug) {
        trackGaEvent("endereco_reservado", {
          origem: "landing",
          com_indicacao: "nao",
        });
        setReservedSlug(data.slug);
        setStep("email");
        setEditingEmail(false);
      } else {
        setSlugCheckResult({
          status: data.status ?? "ocupado",
          slug: data.slug ?? normalizedSlug,
          suggestions: data.suggestions ?? [],
        });
      }
    } catch {
      setSlugCheckResult({
        status: "error",
        message: "Erro ao reservar o endereço. Tente de novo.",
      });
    } finally {
      setReserving(false);
    }
  }

  const isSent = emailState.status === "sent" && !editingEmail;
  const otpDigits = otpToken.replace(/\D/g, "").slice(0, 6);
  const canSubmitEmail = email.trim().includes("@") && email.trim().length >= 5;

  return (
    <div className="relative flex min-h-dvh flex-col justify-between overflow-x-hidden bg-[#0B0C10] text-white lg:h-dvh lg:overflow-hidden">
      {/* Full-bleed Hero Background Image (same treatment as Home) */}
      <picture className="pointer-events-none absolute inset-0 size-full select-none">
        <img
          src="/images/hero-influencer-carioca.jpg"
          alt="Influenciadora carioca sorrindo ao pôr do sol no Rio de Janeiro"
          fetchPriority="high"
          className="size-full object-cover object-[72%_20%] lg:object-[78%_22%]"
        />
      </picture>

      {/* Mobile & Desktop diagonal/bottom gradients (same as Home) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,12,16,0.48) 0%, rgba(11,12,16,0.08) 26%, rgba(11,12,16,0.76) 52%, rgba(11,12,16,0.96) 72%, #0B0C10 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(108deg, #0B0C10 0%, rgba(11,12,16,0.94) 32%, rgba(11,12,16,0.68) 48%, rgba(11,12,16,0.18) 70%, rgba(11,12,16,0.05) 100%), linear-gradient(180deg, rgba(11,12,16,0.55) 0%, transparent 22%, transparent 80%, rgba(11,12,16,0.82) 100%)",
        }}
      />

      {/* Minimal Top Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" aria-label="Linkmural">
          <Image
            src="/brand/linkmural-logo-negativo.svg"
            alt="Linkmural"
            width={118}
            height={18}
            priority
          />
        </Link>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-white/75">
          Grátis · Sem cartão
        </span>
      </header>

      {/* Main 100dvh Stage */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:pb-10">
        {/* Left: Copy + 2-Step Inline Signup */}
        <div className="flex w-full max-w-xl flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white/90">
            <span className="size-2 animate-pulse rounded-full bg-[#CDF54A]" />
            <span>Para empresas, criadores e marcas</span>
          </div>

          <div>
            <h1 className="font-display text-[28px] leading-[1.08] font-bold tracking-[-0.03em] text-white sm:text-[40px]">
              Organize seus links,{" "}
              <span className="bg-gradient-to-r from-[#CDF54A] via-[#25F4EE] to-[#CDF54A] bg-clip-text text-transparent">
                capture leads e monetize
              </span>{" "}
              sua audiência.
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-white/75 sm:text-[15px]">
              Facilite a comunicação de clientes com a sua empresa e reforce sua
              marca em uma página única, pronta em 60 segundos.
            </p>
          </div>

          {/* Interactive 2-Step Conversion Card with Subtle Animated Prismatic Border */}
          <div className="relative overflow-hidden rounded-[18px] p-[1px] shadow-[0_16px_44px_rgba(0,0,0,0.5)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[140%] animate-[spin_9s_linear_infinite]"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(255,255,255,0.10) 0deg, rgba(205,245,74,0.45) 75deg, rgba(37,244,238,0.40) 155deg, rgba(255,255,255,0.10) 230deg, rgba(254,44,85,0.36) 305deg, rgba(255,255,255,0.10) 360deg)",
              }}
            />
            <div className="relative rounded-[17px] bg-[#141520]/95 p-4 backdrop-blur-xl sm:p-5">
            {isSent ? (
              /* Step 3: Email sent + 6-digit OTP */
              <div className="flex flex-col gap-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CDF54A]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#CDF54A]">
                      ✓ Quase lá! Falta só confirmar
                    </span>
                    <h2 className="mt-1.5 text-[18px] font-bold text-white">
                      Confira seu e-mail
                    </h2>
                    <p className="mt-0.5 text-[13px] text-white/75">
                      Enviamos um link de confirmação e um código para{" "}
                      <strong className="text-white">{emailState.email}</strong>.
                    </p>
                  </div>
                </div>

                <form action={otpAction} className="flex flex-col gap-2.5" noValidate>
                  <input type="hidden" name="email" value={emailState.email} />
                  <input type="hidden" name="next" value={NEXT_AFTER_SIGNUP} />

                  <label className="text-[12px] font-medium text-white/85">
                    Ou digite o código de 6 dígitos do e-mail:
                  </label>
                  <input
                    name="token"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={otpDigits}
                    onChange={(e) => setOtpToken(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white bg-white px-4 text-center font-mono text-[20px] font-bold tracking-[0.32em] text-[#0E0E0E] placeholder-[#98A2B3] outline-none focus:ring-2 focus:ring-[#CDF54A]"
                  />

                  {otpState.status === "error" && (
                    <p className="text-[12px] font-medium text-[#FE2C55]">
                      {otpState.message}
                    </p>
                  )}

                  <VerifyOtpButton disabled={otpDigits.length < 6} />
                </form>

                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  className="cursor-pointer self-center text-[12px] font-medium text-white/70 underline-offset-2 hover:text-white hover:underline"
                >
                  Usar outro e-mail
                </button>
              </div>
            ) : step === "slug" ? (
              /* Step 1: Choose Link Name */
              <form onSubmit={handleReserveSlug} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold tracking-wide text-white/90 uppercase">
                    Passo 1 de 2 · Escolha seu link
                  </span>
                  {slugState.status === "checking" && (
                    <span className="text-[12px] text-white/75">
                      Verificando…
                    </span>
                  )}
                  {slugState.status === "livre" && (
                    <span className="text-[12px] font-semibold text-[#CDF54A]">
                      ✓ Disponível!
                    </span>
                  )}
                  {slugState.status === "ocupado" && (
                    <span className="text-[12px] font-semibold text-[#FE2C55]">
                      Já em uso
                    </span>
                  )}
                  {famousBrandSlug && !blockedSlug && (
                    <span className="text-[12px] font-semibold text-[#F59E0B]">
                      Marca protegida
                    </span>
                  )}
                  {(blockedSlug || slugState.status === "reservado") && (
                    <span className="text-[12px] font-semibold text-[#FE2C55]">
                      Não disponível
                    </span>
                  )}
                </div>

                <div className="flex h-12 items-center overflow-hidden rounded-xl border border-white bg-white px-3.5 shadow-inner focus-within:ring-2 focus-within:ring-[#CDF54A]">
                  <span className="shrink-0 text-[15px] font-semibold text-[#667085]">
                    linkmural.com/
                  </span>
                  <input
                    type="text"
                    value={rawSlug}
                    onChange={(e) => {
                      setRawSlug(e.target.value);
                      setRequestingBrand(false);
                    }}
                    placeholder="seunome"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Escolha o endereço da sua página"
                    className="h-full min-w-0 flex-1 bg-transparent pl-0.5 text-[15px] font-bold text-[#0E0E0E] placeholder-[#98A2B3] outline-none"
                  />
                </div>

                {slugState.status === "invalido" &&
                  !blockedSlug &&
                  !famousBrandSlug &&
                  rawSlug.trim().length > 0 && (
                    <p className="text-[12px] font-medium text-[#FE2C55]">
                      Use pelo menos 3 letras ou números (sem espaços).
                    </p>
                  )}

                {famousBrandSlug && !blockedSlug && (
                  <div className="rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 p-3 text-[12.5px] text-white/90">
                    {brandState.status === "sent" &&
                    brandState.slug === normalizedSlug ? (
                      <p className="font-medium text-[#CDF54A]">
                        ✓ Solicitação enviada! Nossa equipe analisará e entrará
                        em contato pelo e-mail informado.
                      </p>
                    ) : !requestingBrand ? (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>Representa oficialmente esta marca?</span>
                        <button
                          type="button"
                          onClick={() => setRequestingBrand(true)}
                          className="cursor-pointer font-semibold text-[#CDF54A] underline underline-offset-2 hover:brightness-110"
                        >
                          Solicitar uso ao administrador →
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-white">
                          Solicitar liberação de{" "}
                          <span className="text-[#CDF54A]">
                            linkmural.com/{normalizedSlug}
                          </span>
                        </p>
                        <input
                          type="email"
                          name="brand_email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Seu e-mail corporativo (ex: voce@marca.com)"
                          className="h-9 w-full rounded-lg border border-white bg-white px-2.5 text-[13px] font-semibold text-[#0E0E0E] placeholder-[#98A2B3] outline-none"
                        />
                        {brandState.status === "error" && (
                          <p className="text-[11.5px] text-[#FE2C55]">
                            {brandState.message}
                          </p>
                        )}
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRequestingBrand(false)}
                            className="cursor-pointer px-2 py-1 text-[12px] text-white/70 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={!canSubmitEmail}
                            onClick={() => {
                              const fd = new FormData();
                              fd.set("slug", normalizedSlug);
                              fd.set("email", email);
                              brandAction(fd);
                            }}
                            className="cursor-pointer rounded-lg bg-[#CDF54A] px-3 py-1.5 text-[12px] font-bold text-[#0E0E0E] disabled:opacity-50"
                          >
                            Enviar solicitação
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {slugState.status === "error" && (
                  <p className="text-[12px] text-[#FE2C55]">
                    {slugState.message}
                  </p>
                )}

                {(slugState.status === "ocupado" ||
                  slugState.status === "reservado") &&
                  slugState.suggestions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-white/70">
                        Sugestões:
                      </span>
                      {slugState.suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setRawSlug(sug)}
                          className="cursor-pointer rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[12px] font-medium text-[#25F4EE] hover:bg-white/15"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                <button
                  type="submit"
                  disabled={!isValidSlug(normalizedSlug) || reserving}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#CDF54A] px-5 text-[15px] font-bold text-[#0E0E0E] shadow-[0_0_24px_rgba(205,245,74,0.35)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {reserving ? "Reservando…" : "Garantir meu link grátis →"}
                </button>
              </form>
            ) : (
              /* Step 2: Enter Email to Send Confirmation */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[#CDF54A]/30 bg-[#CDF54A]/15 px-3 py-2">
                  <span className="truncate text-[13px] font-semibold text-[#CDF54A]">
                    ✓ linkmural.com/{reservedSlug} reservado
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep("slug")}
                    className="shrink-0 cursor-pointer text-[12px] font-medium text-white/80 underline hover:text-white"
                  >
                    Alterar
                  </button>
                </div>

                <form
                  action={(fd) => {
                    trackGaEvent("login_iniciado", { metodo: "email" });
                    setEditingEmail(false);
                    emailAction(fd);
                  }}
                  className="flex flex-col gap-2.5"
                  noValidate
                >
                  <input type="hidden" name="next" value={NEXT_AFTER_SIGNUP} />
                  <label className="text-[12px] font-bold tracking-wide text-white/90 uppercase">
                    Passo 2 de 2 · Para qual e-mail enviamos o acesso?
                  </label>
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@seunegocio.com.br"
                    className="h-12 w-full rounded-xl border border-white bg-white px-3.5 text-[15px] font-semibold text-[#0E0E0E] placeholder-[#98A2B3] outline-none focus:ring-2 focus:ring-[#CDF54A]"
                  />

                  {emailState.status === "error" && (
                    <p className="text-[12px] font-medium text-[#FE2C55]">
                      {emailState.message}
                    </p>
                  )}

                  <SendEmailButton disabled={!canSubmitEmail} />
                </form>

                <form
                  action={signInWithGoogle}
                  onSubmit={() =>
                    trackGaEvent("login_iniciado", { metodo: "google" })
                  }
                >
                  <input type="hidden" name="next" value={NEXT_AFTER_SIGNUP} />
                  <button
                    type="submit"
                    className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 text-[13px] font-semibold text-white transition-colors hover:bg-white/15"
                  >
                    Ou continuar com Google
                  </button>
                </form>
              </div>
            )}
            </div>
          </div>

          {/* Core platform pillars */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center text-[12.5px] font-medium text-white/75">
            <span>✓ Comunicação com clientes</span>
            <span>✓ Links organizados</span>
            <span>✓ Captura de leads</span>
            <span>✓ Monetização &amp; marca</span>
          </div>
        </div>

        {/* Right: Discreet Floating Live Link Pill (keeps influencer photo unobstructed) */}
        <div className="hidden self-end lg:flex">
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/55 px-4 py-3 shadow-2xl backdrop-blur-md">
            <span className="grid size-9 place-items-center rounded-xl bg-[#CDF54A] text-[13px] font-bold text-[#0E0E0E]">
              {previewSlug.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-[13px] font-bold text-white">
                linkmural.com/<span className="text-[#CDF54A]">{previewSlug}</span>
              </p>
              <p className="text-[11px] text-white/70">
                Links · Leads · Clientes · Marca
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
