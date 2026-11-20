import type { Metadata } from "next";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: "Ajuda e sugestões",
};

export default function AjudaPage() {
  const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(
    /\D/g,
    "",
  );
  return <FeedbackForm supportWhatsapp={supportWhatsapp || null} />;
}
