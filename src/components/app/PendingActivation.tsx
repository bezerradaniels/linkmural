"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Alert } from "@/components/ui";

/**
 * Shown right after paying while the webhook has not turned the plan on yet.
 * Refreshes the screen every 3 seconds for up to 45 seconds.
 */
export function PendingActivation() {
  const router = useRouter();

  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= 15) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <Alert tone="info" title="Estamos ativando o seu plano">
      O pagamento foi recebido. Isso leva alguns segundos; se demorar, atualize
      a página.
    </Alert>
  );
}
