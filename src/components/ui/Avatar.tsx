/* eslint-disable @next/next/no-img-element -- avatars come from Supabase Storage at many sizes */
import { cx } from "./cx";

export type AvatarSize = 32 | 48 | 56 | 64;

/** Up to two initials from a name ("Studio Força" → "SF"). */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toLocaleUpperCase("pt-BR");
}

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  /** Rounded square on ink, for businesses. */
  square?: boolean;
  /** Lime ring for whoever is in focus (e.g. the public page profile). */
  ring?: boolean;
  className?: string;
};

export function Avatar({
  name,
  src,
  size = 48,
  square = false,
  ring = false,
  className,
}: AvatarProps) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cx(
        "inline-grid shrink-0 place-items-center overflow-hidden font-display font-semibold tracking-[-0.03em]",
        square
          ? "rounded-[28%] bg-ink text-paper"
          : "rounded-full bg-lime text-on-lime",
        ring && "shadow-[0_0_0_3px_var(--paper),0_0_0_5px_var(--lime)]",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        <span aria-label={name} role="img">
          {initials(name)}
        </span>
      )}
    </span>
  );
}
