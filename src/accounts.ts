// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Connected Google accounts and their access tokens.
//
// The account list is kept in chrome.storage.local. Access tokens are kept in
// chrome.storage.session, i.e. in memory only; after a browser restart they
// are silently re-obtained while the user is still signed in to Google.

import { CALENDAR_SCOPE, clientFor, DEFAULT_CLIENT, type OAuthClient, OAUTH_SCOPES } from "./config";
import { type AccessToken, buildAuthUrl, isTokenFresh, OAuthError, parseAuthResponse } from "./oauth";

export interface Account {
  /** Google's stable account ID (the OpenID "sub" claim). */
  id: string;
  email: string;
  /** The OAuth client the account was connected with; absent for the default client. */
  clientId?: string;
}

/** Thrown when a token can only be obtained by showing the Google sign-in UI. */
export class InteractionRequiredError extends Error {
  constructor(readonly account: Account) {
    super(`Signing in again is required for ${account.email}`);
    this.name = "InteractionRequiredError";
  }
}

const ACCOUNTS_KEY = "accounts";
const TOKENS_KEY = "tokens";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";

export async function listAccounts(): Promise<Account[]> {
  const stored = await chrome.storage.local.get(ACCOUNTS_KEY);
  return (stored[ACCOUNTS_KEY] as Account[] | undefined) ?? [];
}

async function saveAccounts(accounts: Account[]): Promise<void> {
  await chrome.storage.local.set({ [ACCOUNTS_KEY]: accounts });
}

async function loadTokens(): Promise<Record<string, AccessToken>> {
  const stored = await chrome.storage.session.get(TOKENS_KEY);
  return (stored[TOKENS_KEY] as Record<string, AccessToken> | undefined) ?? {};
}

async function storeToken(accountId: string, token: AccessToken | undefined): Promise<void> {
  const tokens = await loadTokens();
  if (token === undefined) {
    delete tokens[accountId];
  } else {
    tokens[accountId] = token;
  }
  await chrome.storage.session.set({ [TOKENS_KEY]: tokens });
}

/** Runs the OAuth flow; throws OAuthError or the error from launchWebAuthFlow. */
async function authorize(client: OAuthClient, interactive: boolean, loginHint?: string): Promise<AccessToken> {
  const state = crypto.randomUUID();
  const url = buildAuthUrl({
    clientId: client.clientId,
    hostedDomain: client.hostedDomain,
    redirectUri: chrome.identity.getRedirectURL(),
    scopes: OAUTH_SCOPES,
    state,
    interactive,
    loginHint,
  });
  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url,
    interactive,
    // Give Google's sign-in page time to redirect when no UI may be shown.
    abortOnLoadForNonInteractive: false,
    timeoutMsForNonInteractive: 15_000,
  });
  if (responseUrl === undefined) {
    throw new OAuthError("no_response", "Sign-in did not complete");
  }
  return parseAuthResponse(responseUrl, state, [CALENDAR_SCOPE], Date.now());
}

async function fetchAccount(token: AccessToken): Promise<{ id: string; email: string }> {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Fetching account info failed: HTTP ${response.status}`);
  }
  const info = (await response.json()) as { sub?: string; email?: string };
  if (!info.sub || !info.email) {
    throw new Error("Account info lacks an ID or email address");
  }
  return { id: info.sub, email: info.email };
}

/**
 * Lets the user pick a Google account and grant access through `client`,
 * then adds it to the connected accounts (or refreshes its token if it was
 * already connected). Must be called from a user gesture in an extension page.
 */
export async function connectAccount(client: OAuthClient = DEFAULT_CLIENT, loginHint?: string): Promise<Account> {
  const token = await authorize(client, true, loginHint);
  const account: Account = await fetchAccount(token);
  if (client !== DEFAULT_CLIENT) account.clientId = client.clientId;
  const accounts = (await listAccounts()).filter((a) => a.id !== account.id);
  await saveAccounts([...accounts, account]);
  await storeToken(account.id, token);
  return account;
}

/** Signs in to `account` again interactively, e.g. after silent renewal failed. */
export async function reconnectAccount(account: Account): Promise<Account> {
  return connectAccount(clientFor(account.clientId), account.email);
}

const pendingRefreshes = new Map<string, Promise<string>>();

/**
 * Returns a valid access token for `account`, silently re-authorizing if
 * needed. Throws InteractionRequiredError if the user needs to sign in again
 * (e.g. because they signed out of Google or revoked access).
 */
export async function getAccessToken(account: Account): Promise<string> {
  const cached = (await loadTokens())[account.id];
  if (cached !== undefined && isTokenFresh(cached, Date.now())) {
    return cached.accessToken;
  }
  let pending = pendingRefreshes.get(account.id);
  if (pending === undefined) {
    pending = refreshToken(account).finally(() => pendingRefreshes.delete(account.id));
    pendingRefreshes.set(account.id, pending);
  }
  return pending;
}

async function refreshToken(account: Account): Promise<string> {
  let token: AccessToken;
  try {
    token = await authorize(clientFor(account.clientId), false, account.email);
  } catch (e) {
    console.warn(`Silent sign-in failed for ${account.email}:`, e);
    throw new InteractionRequiredError(account);
  }
  // login_hint is only a hint; make sure we didn't get another account's token.
  const actual = await fetchAccount(token);
  if (actual.id !== account.id) {
    throw new InteractionRequiredError(account);
  }
  await storeToken(account.id, token);
  return token.accessToken;
}

/** Forgets the cached token for `account`, e.g. after an API call rejected it. */
export async function invalidateAccessToken(account: Account): Promise<void> {
  await storeToken(account.id, undefined);
}

/** Removes `account` and revokes the extension's access to it (best effort). */
export async function disconnectAccount(account: Account): Promise<void> {
  const token = (await loadTokens())[account.id];
  await saveAccounts((await listAccounts()).filter((a) => a.id !== account.id));
  await storeToken(account.id, undefined);
  if (token !== undefined) {
    try {
      // The revoke endpoint doesn't support CORS. A no-cors form POST still
      // reaches it; we just can't read the response.
      await fetch(REVOKE_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams({ token: token.accessToken }),
      });
    } catch (e) {
      console.warn(`Revoking access for ${account.email} failed:`, e);
    }
  }
}
