import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui";

export function MarketingChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" aria-label="linkmural, página inicial">
          <Image
            src="/brand/linkmural-logo.svg"
            alt="Linkmural"
            width={154}
            height={24}
            priority
          />
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 text-small text-ink-muted md:flex"
        >
          <Link href="/planos" className="hover:text-ink">
            Planos
          </Link>
          <Link href="/comparar" className="hover:text-ink">
            Comparar
          </Link>
          <Link href="/para" className="hover:text-ink">
            Por nicho
          </Link>
          <Link href="/ferramentas/gerador-de-utm" className="hover:text-ink">
            Gerador de UTM
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/entrar"
            className={buttonClasses({ variant: "ghost", size: "md" })}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            Criar grátis
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-5 pt-6 pb-20 sm:px-8">
        {children}
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-6 text-caption text-ink-muted sm:px-8">
        <span>© {new Date().getFullYear()} linkmural</span>
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/" className="hover:text-ink">
            Início
          </Link>
          <Link href="/planos" className="hover:text-ink">
            Planos
          </Link>
          <Link href="/comparar" className="hover:text-ink">
            Comparar
          </Link>
          <Link href="/para" className="hover:text-ink">
            Nichos
          </Link>
          <Link href="/ferramentas/gerador-de-utm" className="hover:text-ink">
            Gerador de UTM
          </Link>
          <Link href="/termos" className="hover:text-ink">
            Termos
          </Link>
          <Link href="/privacidade" className="hover:text-ink">
            Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}
