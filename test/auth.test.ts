import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "../lib/auth";

describe("Authentication JWT Sessions", () => {
  it("creates a signed JWT and verifies payload successfully", async () => {
    const token = await createSessionToken("Ikhlas");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.name).toBe("Ikhlas");
    expect(payload?.role).toBe("admin");
    expect(payload?.sub).toBe("user_1");
  });

  it("returns null for invalid or tampered token", async () => {
    const payload = await verifySessionToken("invalid.tampered.token");
    expect(payload).toBeNull();
  });
});
