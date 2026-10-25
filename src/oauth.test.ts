// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { buildAuthUrl, isTokenFresh, OAuthError, parseAuthResponse } from "./oauth";
import { MINUTE_MS, SECOND_MS } from "./time";

const REDIRECT = "https://abc.chromiumapp.org/";
const CAL = "https://www.googleapis.com/auth/calendar.events.owned.readonly";
const SCOPES = ["openid", "email", CAL];
const NOW = 1_000_000;

function parseError(url: string): OAuthError {
  try {
    parseAuthResponse(url, "s1", [CAL], NOW);
  } catch (e) {
    if (e instanceof OAuthError) return e;
    throw e;
  }
  throw new Error("expected an OAuthError");
}

describe("buildAuthUrl", () => {
  const base = { clientId: "cid", redirectUri: REDIRECT, scopes: SCOPES, state: "s1" };

  it("builds an interactive request", () => {
    const url = new URL(buildAuthUrl({ ...base, interactive: true }));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("cid");
    expect(url.searchParams.get("redirect_uri")).toBe(REDIRECT);
    expect(url.searchParams.get("response_type")).toBe("token");
    expect(url.searchParams.get("scope")).toBe(`openid email ${CAL}`);
    expect(url.searchParams.get("state")).toBe("s1");
    expect(url.searchParams.get("prompt")).toBe("select_account");
    expect(url.searchParams.has("login_hint")).toBe(false);
    expect(url.searchParams.has("hd")).toBe(false);
  });

  it("restricts the account chooser to a Workspace domain", () => {
    const url = new URL(buildAuthUrl({ ...base, interactive: true, hostedDomain: "example.com" }));
    expect(url.searchParams.get("hd")).toBe("example.com");
  });

  it("builds a silent request for a specific account", () => {
    const url = new URL(buildAuthUrl({ ...base, interactive: false, loginHint: "a@example.com" }));
    expect(url.searchParams.get("prompt")).toBe("none");
    expect(url.searchParams.get("login_hint")).toBe("a@example.com");
  });
});

describe("parseAuthResponse", () => {
  it("parses a successful response", () => {
    const url = `${REDIRECT}#state=s1&access_token=tok&token_type=Bearer&expires_in=3599&scope=email%20openid%20${encodeURIComponent(CAL)}`;
    expect(parseAuthResponse(url, "s1", [CAL], NOW)).toEqual({
      accessToken: "tok",
      expiresAt: NOW + 3599 * SECOND_MS,
    });
  });

  it("rejects a mismatched state", () => {
    const url = `${REDIRECT}#state=other&access_token=tok&expires_in=3599&scope=${encodeURIComponent(CAL)}%20email`;
    expect(parseError(url).code).toBe("state_mismatch");
  });

  it("reports errors from the fragment", () => {
    expect(parseError(`${REDIRECT}#state=s1&error=interaction_required`).code).toBe(
      "interaction_required",
    );
  });

  it("reports errors from the query string", () => {
    expect(parseError(`${REDIRECT}?state=s1&error=access_denied`).code).toBe("access_denied");
  });

  it("rejects a response without a token", () => {
    expect(parseError(`${REDIRECT}#state=s1&expires_in=3599`).code).toBe("invalid_response");
  });

  it("rejects a response where the calendar scope was deselected", () => {
    const url = `${REDIRECT}#state=s1&access_token=tok&expires_in=3599&scope=email%20openid`;
    const error = parseError(url);
    expect(error.code).toBe("scope_denied");
    expect(error.message).toContain(CAL);
  });
});

describe("isTokenFresh", () => {
  it("applies the safety margin", () => {
    const token = { accessToken: "t", expiresAt: NOW + 10 * MINUTE_MS };
    expect(isTokenFresh(token, NOW)).toBe(true);
    expect(isTokenFresh(token, NOW + 5 * MINUTE_MS)).toBe(true);
    expect(isTokenFresh(token, NOW + 5 * MINUTE_MS + 1)).toBe(false);
  });
});
