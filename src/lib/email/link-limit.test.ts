import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const insertMock = vi.fn();
const deleteEqMock = vi.fn();
const sendEmailMock = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: insertMock,
      delete: () => ({
        eq: () => ({
          eq: deleteEqMock,
        }),
      }),
    }),
  }),
}));

vi.mock("./send", async (orig) => {
  const actual = await orig<typeof import("./send")>();
  return {
    ...actual,
    sendEmail: (...args: unknown[]) => sendEmailMock(...args),
  };
});

import { sendFreeLinkLimitEmail } from "./link-limit";

describe("sendFreeLinkLimitEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_123";
  });

  it("skips when recipient email or RESEND_API_KEY is missing", async () => {
    expect(
      await sendFreeLinkLimitEmail({
        userId: "u1",
        pageId: "p1",
        to: null,
        businessName: "Studio",
      }),
    ).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();

    delete process.env.RESEND_API_KEY;
    expect(
      await sendFreeLinkLimitEmail({
        userId: "u1",
        pageId: "p1",
        to: "a@b.com",
        businessName: "Studio",
      }),
    ).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("skips when email_logs already has a record for the user", async () => {
    insertMock.mockResolvedValue({ error: { code: "23505" } });
    const ok = await sendFreeLinkLimitEmail({
      userId: "u1",
      pageId: "p1",
      to: "a@b.com",
      businessName: "Studio",
    });
    expect(ok).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("sends the email once and rolls back the log if Resend fails", async () => {
    insertMock.mockResolvedValue({ error: null });
    sendEmailMock.mockResolvedValue(true);

    const ok = await sendFreeLinkLimitEmail({
      userId: "u1",
      pageId: "p1",
      to: "a@b.com",
      businessName: "Studio Força",
    });
    expect(ok).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "a@b.com",
        context: "free-link-limit",
      }),
    );

    sendEmailMock.mockResolvedValue(false);
    const failed = await sendFreeLinkLimitEmail({
      userId: "u1",
      pageId: "p1",
      to: "a@b.com",
      businessName: "Studio Força",
    });
    expect(failed).toBe(false);
    expect(deleteEqMock).toHaveBeenCalled();
  });
});
