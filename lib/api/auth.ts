import { apiClient } from "./client";
import { User, LoginRequest } from "@/types/auth";

/**
 * Login with single-owner email & password.
 * Backend sets the HttpOnly `finance_session` cookie upon successful authentication.
 * Never returns or stores the raw session token in JS memory/localStorage.
 */
export async function loginUser(credentials: LoginRequest): Promise<User> {
  return await apiClient<User>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    skipAuthRedirect: true, // Do not trigger auto-redirect on failed login
  });
}

/**
 * Get current authenticated user session on startup or verification.
 * Calls GET /api/v1/auth/me using browser HttpOnly cookie.
 */
export async function getCurrentUser(signal?: AbortSignal): Promise<User> {
  return await apiClient<User>("/api/v1/auth/me", {
    method: "GET",
    signal,
    timeoutMs: 15000,
    skipAuthRedirect: true, // Let the AuthProvider handle the 401 gracefully
  });
}

/**
 * Logout current session.
 * Backend invalidates the session in DB and clears the HttpOnly cookie.
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiClient<void>("/api/v1/auth/logout", {
      method: "POST",
      skipAuthRedirect: true,
      timeoutMs: 10000,
    });
  } catch (err) {
    // Even if network fails, continue clearing local state
    console.warn("[Auth] Logout request failed or timed out:", err);
  }
}
