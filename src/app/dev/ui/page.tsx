import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Showcase } from "./showcase";

export const metadata: Metadata = {
  title: "Componentes",
  robots: { index: false, follow: false },
};

/** Component gallery. Development only. */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Showcase />;
}
