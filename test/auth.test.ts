import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loginUser, getCurrentUser, logoutUser } from "../lib/api/auth";
import { apiClient, ApiError, setUnauthorizedHandler } from "../lib/api/client";
import { createSessionToken, verifySessionToken } from "../lib/auth";

describe("Authentication JWT Helpers (Legacy fallback)", () => {
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

describe("Single-Owner Backend Auth API Integration", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setUnauthorizedHandler(null);
    vi.restoreAllMocks();
  });

  it("loginUser sends POST /api/v1/auth/login and returns User on 200", async () => {
    const mockUser = {
      id: "usr_123",
      email: "owner@example.com",
      created_at: "2026-09-06T10:00:00Z",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: true,
        data: mockUser,
      }),
    });

    const result = await loginUser({ email: "owner@example.com", password: "securepassword123" });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/api/v1/auth/login");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body)).toEqual({
      email: "owner@example.com",
      password: "securepassword123",
    });
    expect(result).toEqual(mockUser);
  });

  it("loginUser throws ApiError with status 401 on invalid credentials", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: false,
        error: "invalid email or password",
      }),
    });

    await expect(
      loginUser({ email: "wrong@example.com", password: "wrongpassword" })
    ).rejects.toThrowError(ApiError);

    try {
      await loginUser({ email: "wrong@example.com", password: "wrongpassword" });
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(401);
      expect((err as ApiError).message).toBe("invalid email or password");
    }
  });

  it("getCurrentUser calls GET /api/v1/auth/me with credentials: include", async () => {
    const mockUser = {
      id: "usr_123",
      email: "owner@example.com",
      created_at: "2026-09-06T10:00:00Z",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: true,
        data: mockUser,
      }),
    });

    const result = await getCurrentUser();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/api/v1/auth/me");
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("include");
    expect(result).toEqual(mockUser);
  });

  it("logoutUser calls POST /api/v1/auth/logout with credentials: include", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      json: async () => null,
    });

    await logoutUser();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/api/v1/auth/logout");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("apiClient invokes global unauthorizedHandler when receiving 401", async () => {
    const unauthorizedSpy = vi.fn();
    setUnauthorizedHandler(unauthorizedSpy);

    // Mock window object for client-side test environment
    (global as unknown as { window: unknown }).window = {};

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        success: false,
        error: "unauthorized",
      }),
    });

    await expect(apiClient("/api/v1/transactions")).rejects.toThrowError(ApiError);
    expect(unauthorizedSpy).toHaveBeenCalledTimes(1);
  });
});
