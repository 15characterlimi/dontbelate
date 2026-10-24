// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Browser-independent parts of Google's OAuth 2.0 implicit flow
// (https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow).

export const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

export interface AccessToken {
  accessToken: string;
  /** Milliseconds since the epoch. */
  expiresAt: number;
}

export class OAuthError extends Error {
  constructor(
    /** An OAuth error code such as "access_denied", or one of our own codes. */
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "OAuthError";
  }
}

export interface AuthUrlParams {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  /** If false, the request must complete without any UI (prompt=none). */
  interactive: boolean;
  /** Email address of the account to pre-select or silently re-authorize. */
  loginHint?: string;
}

export function buildAuthUrl(p: AuthUrlParams): string {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", p.clientId);
  url.searchParams.set("redirect_uri", p.redirectUri);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", p.scopes.join(" "));
  url.searchParams.set("state", p.state);
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", p.interactive ? "select_account" : "none");
  if (p.loginHint !== undefined) {
    url.searchParams.set("login_hint", p.loginHint);
  }
  return url.toString();
}

/**
 * Parses the URL that Google redirected to at the end of the flow.
 * Throws OAuthError if the flow failed, the state doesn't match, or not all
 * of `requiredScopes` were granted (users can deselect individual scopes).
 */
export function parseAuthResponse(
  responseUrl: string,
  expectedState: string,
  requiredScopes: string[],
  now: number,
): AccessToken {
  // Successful responses carry their parameters in the fragment; some errors
  // are reported in the query string instead.
  const url = new URL(responseUrl);
  const params = new URLSearchParams(url.hash.slice(1));
  for (const [key, value] of url.searchParams) {
    if (!params.has(key)) params.set(key, value);
  }

  if (params.get("state") !== expectedState) {
    throw new OAuthError("state_mismatch", "OAuth response has an unexpected state parameter");
  }
  const error = params.get("error");
  if (error !== null) {
    throw new OAuthError(error, params.get("error_description") ?? `OAuth error: ${error}`);
  }

  const accessToken = params.get("access_token");
  const expiresIn = Number(params.get("expires_in"));
  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new OAuthError("invalid_response", "OAuth response lacks a valid access token");
  }

  const granted = new Set((params.get("scope") ?? "").split(" "));
  const missing = requiredScopes.filter((s) => !granted.has(s));
  if (missing.length > 0) {
    throw new OAuthError("scope_denied", `Required permissions were not granted: ${missing.join(", ")}`);
  }

  return { accessToken, expiresAt: now + expiresIn * 1000 };
}

/** Whether `token` remains valid for at least `marginMs` after `now`. */
export function isTokenFresh(token: AccessToken, now: number, marginMs = 5 * 60_000): boolean {
  return token.expiresAt - now >= marginMs;
}
