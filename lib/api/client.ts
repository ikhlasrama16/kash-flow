import { ApiResponse } from "@/types/api";

export function getBaseApiUrl(): string {
  if (typeof window === "undefined") {
    const envUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!envUrl || envUrl.includes("127.0.0.1") || envUrl.includes("localhost:8080")) {
      return "https://finance.mikra.my.id";
    }
    return envUrl;
  }
  // Client-side: use proxy route to avoid CORS and hide sensitive headers
  return "/api/backend";
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getBaseApiUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let fullUrl: string;
  if (baseUrl.startsWith("http")) {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    fullUrl = `${cleanBase}${cleanEndpoint}`;
  } else {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    fullUrl = `${cleanBase}${cleanEndpoint}`;
  }

  const { timeoutMs = 30000, headers, signal: userSignal, ...restOptions } = options;

  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  // If caller provided their own signal, listen to it
  if (userSignal) {
    userSignal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(fullUrl, {
      ...restOptions,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data: ApiResponse<T> | T | null = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : null) ||
        `Request failed with status ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    // Check if the response follows { success: true, data: ... } convention
    if (data && typeof data === "object" && "success" in data && "data" in data) {
      const apiResp = data as ApiResponse<T>;
      if (!apiResp.success) {
        throw new ApiError(apiResp.error || "Unknown API error", response.status, data);
      }
      return apiResp.data as T;
    }

    return data as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    const isAbort =
      timedOut ||
      (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) ||
      (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError");

    if (isAbort) {
      if (typeof window !== "undefined") {
        console.warn(`[KashFlow] Request to ${fullUrl} was aborted or timed out after ${timeoutMs}ms.`);
      }
      throw new ApiError("Request timeout or canceled", 408);
    }

    if (typeof window !== "undefined") {
      console.error(`[KashFlow] Error calling ${fullUrl}:`, error);
    }

    const message = error instanceof Error ? error.message : "Network error or API unavailable";
    throw new ApiError(message, 500);
  } finally {
    clearTimeout(timeoutId);
  }
}
