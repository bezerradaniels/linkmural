import { redirect } from "next/navigation";
import { getPanelContext } from "@/lib/panel-data";

export default async function EditorIndexRedirectPage() {
  const { page } = await getPanelContext();
  redirect(`/editor/${page.id}`);
}
