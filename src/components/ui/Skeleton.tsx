import { cx } from "./cx";

export type SkeletonVariant = "text" | "title" | "avatar" | "card" | "block";

const variants: Record<SkeletonVariant, string> = {
  text: "h-3 rounded-sm",
  title: "h-[18px] rounded-sm",
  avatar: "size-16 rounded-full",
  card: "h-[72px] rounded-lg",
  block: "rounded-sm",
};

/** Loading placeholder shaped like the content. */
export function Skeleton({
  variant = "text",
  className,
}: {
  variant?: SkeletonVariant;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "relative block overflow-hidden bg-hover",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-[linear-gradient(90deg,transparent,var(--shimmer),transparent)] after:content-['']",
        variants[variant],
        className,
      )}
    />
  );
}
