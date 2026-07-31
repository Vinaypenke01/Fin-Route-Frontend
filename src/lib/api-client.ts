/**
 * Core API Client for Fintech ERP.
 * Handles base URL resolution, JWT token attachment, automatic token refresh,
 * and standardized error parsing.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://finroute01.pythonanywhere.com/";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string | string[]> | null;
  meta?: {
    count: number;
    num_pages: number;
    current_page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  } | null;
  error_code?: string;
  usage?: Record<string, any>;
  upgrade_prompt?: {
    message: string;
    upgrade_url: string;
  };
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string | string[]> | null;
  errorCode?: string;
  usage?: Record<string, any>;
  upgradePrompt?: { message: string; upgrade_url: string };

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string | string[]> | null,
    errorCode?: string,
    usage?: Record<string, any>,
    upgradePrompt?: { message: string; upgrade_url: string }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.errorCode = errorCode;
    this.usage = usage;
    this.upgradePrompt = upgradePrompt;
  }
}

// Token Storage Keys
const ACCESS_TOKEN_KEY = "fintech_access_token";
const REFRESH_TOKEN_KEY = "fintech_refresh_token";

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken: string, refreshToken?: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Flag to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Perform an HTTP request to the backend.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized, attempt token refresh
  if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/token/refresh")) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            headers.set("Authorization", `Bearer ${newToken}`);
            return fetch(url, { ...options, headers }).then((res) => parseResponse<T>(res));
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newAccessToken = data.access || data.access_token;
          setTokens(newAccessToken);
          processQueue(null, newAccessToken);
          isRefreshing = false;

          headers.set("Authorization", `Bearer ${newAccessToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          processQueue(new Error("Token refresh failed"), null);
          isRefreshing = false;
          clearTokens();
          window.location.href = "/login";
          throw new ApiError("Session expired. Please log in again.", 401);
        }
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        clearTokens();
        throw err;
      }
    } else {
      clearTokens();
    }
  }

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let body: any;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body?.message || body?.detail || "An unexpected error occurred.";
    const errors = body?.errors || null;
    const errorCode = body?.error_code || undefined;
    const usage = body?.usage || undefined;
    const upgradePrompt = body?.upgrade_prompt || undefined;

    throw new ApiError(message, response.status, errors, errorCode, usage, upgradePrompt);
  }

  return body as ApiResponse<T>;
}
