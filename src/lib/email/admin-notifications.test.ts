import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import {
  isFirstSignIn,
  notifyAdminNewSubscriber,
  notifyAdminNewUser,
} from "./admin-notifications";

describe("isFirstSignIn", () => {
  it("returns true when last_sign_in_at is missing", () => {
    expect(isFirstSignIn({ created_at: "2026-11-21T10:00:00Z" })).toBe(true);
  });

  it("returns true when last_sign_in_at is within 15 minutes of created_at", () => {
    expect(
      isFirstSignIn({
        created_at: "2026-11-21T10:00:00Z",
        last_sign_in_at: "2026-11-21T10:04:00Z",
      }),
    ).toBe(true);
  });

  it("returns false for returning users", () => {
    expect(
      isFirstSignIn({
        created_at: "2026-11-20T10:00:00Z",
        last_sign_in_at: "2026-11-21T10:00:00Z",
      }),
    ).toBe(false);
  });
});

describe("admin notifications", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ error: null });
    process.env.RESEND_API_KEY = "re_test_123";
    process.env.ADMIN_NOTIFY_EMAIL = "daniel.ddsb@gmail.com";
    process.env.EMAIL_FROM = "Linkmural <noreply@linkmural.com>";
    process.env.NEXT_PUBLIC_SITE_URL = "https://linkmural.com";
  });

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it("skips when ADMIN_NOTIFY_EMAIL is not configured", async () => {
    delete process.env.ADMIN_NOTIFY_EMAIL;
    const ok = await notifyAdminNewUser({
      userId: "user_1",
      email: "novo@exemplo.com",
      provider: "email",
    });
    expect(ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends new user notification with escaped html", async () => {
    const ok = await notifyAdminNewUser({
      userId: "user_1",
      email: "cliente@loja.com",
      provider: "google",
    });
    expect(ok).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Linkmural <noreply@linkmural.com>",
        to: "daniel.ddsb@gmail.com",
        subject: "[linkmural] Novo cadastro: cliente@loja.com",
        html: expect.stringContaining("cliente@loja.com"),
      }),
    );
  });

  it("sends new subscriber notification with plan, interval, and amount", async () => {
    const ok = await notifyAdminNewSubscriber({
      userId: "user_1",
      email: "pagante@loja.com",
      plan: "pro",
      interval: "year",
      amountTotal: 3000,
      currency: "brl",
      subscriptionId: "sub_123",
    });
    expect(ok).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "daniel.ddsb@gmail.com",
        subject: "[linkmural] Novo pagante: Pro (anual)",
        html: expect.stringContaining("pagante@loja.com"),
      }),
    );
  });
});
