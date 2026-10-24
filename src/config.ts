// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

export interface OAuthClient {
  clientId: string;
  /** Restricts Google's account chooser to this Google Workspace domain. */
  hostedDomain?: string;
}

/** OAuth client ("Web application" type) with an External consent screen. */
export const DEFAULT_CLIENT: OAuthClient = {
  clientId: "952121776021-i34jc133ur7i69lade3hapkmvp1t5uqj.apps.googleusercontent.com",
};

/**
 * Optional OAuth client with an Internal consent screen, for the accounts of
 * one Google Workspace organization. Configured in config.local.json, which
 * isn't checked in; see config.local.example.json.
 */
export const WORKSPACE_CLIENT: OAuthClient | undefined =
  __WORKSPACE_CLIENT__ === null
    ? undefined
    : { clientId: __WORKSPACE_CLIENT__.clientId, hostedDomain: __WORKSPACE_CLIENT__.domain };

/** The client with ID `clientId`; the default client if it's unknown or undefined. */
export function clientFor(clientId: string | undefined): OAuthClient {
  return WORKSPACE_CLIENT !== undefined && clientId === WORKSPACE_CLIENT.clientId ? WORKSPACE_CLIENT : DEFAULT_CLIENT;
}

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";

/** "openid" and "email" identify which account a token belongs to. */
export const OAUTH_SCOPES = ["openid", "email", CALENDAR_SCOPE];
