"use client";

import dynamic from "next/dynamic";
import type { MuralDocument } from "@/lib/editor/types";
import type { Plan } from "@/lib/plans";

const LazyVisualEditorApp = dynamic(
  () => import("@/components/editor/VisualEditorApp"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-dvh w-screen place-items-center bg-[#0E0E0E] text-white">
        <div className="flex flex-col items-center gap-3">
          <span className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-[#CDF54A]" />
          <span className="text-small text-white/70">
            Carregando editor visual...
          </span>
        </div>
      </div>
    ),
  },
);

export function EditorLoader({
  initialDoc,
  ownerId,
  plan,
  pageUrl,
}: {
  initialDoc: MuralDocument;
  ownerId: string;
  plan: Plan;
  pageUrl: string;
}) {
  return (
    <LazyVisualEditorApp
      initialDoc={initialDoc}
      ownerId={ownerId}
      plan={plan}
      pageUrl={pageUrl}
    />
  );
}
