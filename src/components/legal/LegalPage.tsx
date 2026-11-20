import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Simple reading layout for legal pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="self-start"
        aria-label="linkmural, página inicial"
      >
        <Image src="/brand/linkmural-logo.svg" alt="" width={150} height={22} />
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
          {title}
        </h1>
        <p className="text-small text-ink-muted">
          Última atualização: {updated}
        </p>
      </header>
      <article className="flex flex-col gap-4 rounded-xl bg-surface p-6 text-body sm:p-8 [&_a]:font-medium [&_a]:underline [&_a]:decoration-lime [&_a]:decoration-2 [&_a]:underline-offset-2 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-title [&_h2]:tracking-[-0.03em] [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </article>
      <nav className="flex gap-4 text-small text-ink-muted">
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos de uso</Link>
        <a href="mailto:oi@linkmural.com">oi@linkmural.com</a>
      </nav>
    </main>
  );
}
