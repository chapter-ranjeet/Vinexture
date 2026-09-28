"use client";

import { jwtDecode } from "jwt-decode";

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type DecodedToken = {
  exp?: number;
  email?: string;
  username?: string;
  user_id?: number;
};

export function saveAuthTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") return;
  localStorage.setItem("vinexture-access", tokens.access);
  localStorage.setItem("vinexture-refresh", tokens.refresh);
  window.dispatchEvent(new Event("vinexture_auth_changed"));
}

export function getAuthTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const access = localStorage.getItem("vinexture-access");
  const refresh = localStorage.getItem("vinexture-refresh");

  if (!access || !refresh) return null;
  return { access, refresh };
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("vinexture-access");
  localStorage.removeItem("vinexture-refresh");
  window.dispatchEvent(new Event("vinexture_auth_changed"));
}

export function getUserFromAccessToken(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string, bufferSeconds = 30) {
  const decoded = getUserFromAccessToken(token);
  return !decoded?.exp || decoded.exp * 1000 <= Date.now() + bufferSeconds * 1000;
}
