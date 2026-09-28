import { clearAuthTokens, getAuthTokens, isAccessTokenExpired, saveAuthTokens } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
let refreshRequest: Promise<string | null> | null = null;

function getApiUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

async function refreshAccessToken() {
  const tokens = getAuthTokens();
  if (!tokens) return null;
  if (refreshRequest) return refreshRequest;

  refreshRequest = fetch(getApiUrl("/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Session expired");
      const refreshed = (await response.json()) as { access?: string };
      if (!refreshed.access) throw new Error("Session expired");
      saveAuthTokens({ access: refreshed.access, refresh: tokens.refresh });
      return refreshed.access;
    })
    .catch(() => {
      clearAuthTokens();
      return null;
    })
    .finally(() => {
      refreshRequest = null;
    });

  return refreshRequest;
}

export async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  let tokens = getAuthTokens();
  if (tokens && isAccessTokenExpired(tokens.access)) {
    const access = await refreshAccessToken();
    tokens = access ? getAuthTokens() : null;
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (tokens?.access) headers.set("Authorization", `Bearer ${tokens.access}`);

  let response = await fetch(getApiUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401 && tokens) {
    const access = await refreshAccessToken();
    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
      response = await fetch(getApiUrl(path), { ...init, headers, cache: "no-store" });
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (typeof errorJson === "string") {
        errorDetail = errorJson;
      } else if (errorJson && typeof errorJson === "object") {
        const messages = Object.entries(errorJson).map(([k, v]) => {
          const val = Array.isArray(v) ? v.join(", ") : String(v);
          return k === "detail" || k === "non_field_errors" || k === "error" ? val : `${k}: ${val}`;
        });
        if (messages.length > 0) errorDetail = messages.join(" | ");
      }
    } catch {
      // fallback to status code message
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  return fetchJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchJson<T>(path: string, body: unknown): Promise<T> {
  return fetchJson<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function uploadFormData<T>(path: string, formData: FormData, method: "POST" | "PATCH" | "PUT" = "POST"): Promise<T> {
  return fetchJson<T>(path, {
    method,
    body: formData,
  });
}

export async function getApiEndpoint(path: string) {
  return getApiUrl(path);
}

