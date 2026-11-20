import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Image
        src="/brand/linkmural-logo.svg"
        alt="Linkmural"
        width={220}
        height={32}
        priority
      />
      <h1 className="font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
        Olá! Estamos montando o mural.
      </h1>
      <p className="max-w-sm text-ink-muted">
        A página de links do seu negócio, pronta em 3 minutos. Em breve em
        linkmural.com.
      </p>
    </main>
  );
}
