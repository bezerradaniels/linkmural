import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Link href="/" aria-label="linkmural, página inicial">
        <Image src="/brand/linkmural-logo.svg" alt="" width={176} height={26} />
      </Link>
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Página não encontrada
        </h1>
        <p className="text-ink-muted">
          Esta página não existe ou está indisponível. Confira o endereço ou
          crie a sua.
        </p>
      </div>
      <Link href="/" className={buttonClasses()}>
        Criar minha página
      </Link>
    </main>
  );
}
