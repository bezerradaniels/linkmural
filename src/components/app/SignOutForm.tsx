"use client";

import type { ReactNode } from "react";
import { signOut } from "@/app/auth/actions";
import { clearAllLocalDrafts } from "@/lib/use-local-draft";

/** Sign-out form that also wipes unsaved drafts (phone, address…) from this device. */
export function SignOutForm({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={signOut}
      onSubmit={() => clearAllLocalDrafts()}
      className={className}
    >
      {children}
    </form>
  );
}
