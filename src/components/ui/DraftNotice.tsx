import { Button } from "./Button";
import { Icon } from "./Icon";

/** Shown when a form was refilled from an unsaved draft on this device. */
export function DraftNotice({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-lg bg-warning-soft px-4 py-3 text-[14px] leading-5 text-ink"
    >
      <Icon name="edit" className="shrink-0 text-warning" />
      <span className="min-w-0 flex-1">
        <strong className="font-semibold">Alterações não salvas.</strong>{" "}
        Recuperamos o que você tinha digitado neste aparelho. Salve para
        publicar ou descarte para voltar ao que está no ar.
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onDiscard}>
        Descartar
      </Button>
    </div>
  );
}
