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
 * Returns the optional OAuth client with an Internal consent screen, for the
 * accounts of one Google Workspace organization. It's configured by the
 * organization's admin through Chrome policy (see static/managed_schema.json)
 * or, in development builds only, in config.local.json. Neither value is
 * part of the source code or of release builds.
 */
export async function getWorkspaceClient(): Promise<OAuthClient | undefined> {
  let policy: Record<string, unknown> = {};
  try {
    policy = await chrome.storage.managed.get(["workspaceDomain", "workspaceClientId"]);
  } catch (e) {
    console.warn("Reading managed storage failed:", e);
  }
  const { workspaceDomain: domain, workspaceClientId: clientId } = policy;
  if (typeof domain === "string" && domain && typeof clientId === "string" && clientId) {
    return { clientId, hostedDomain: domain };
  }
  if (domain !== undefined || clientId !== undefined) {
    console.warn("Ignoring Workspace policy: workspaceDomain and workspaceClientId must both be set");
  }
  if (__WORKSPACE_CLIENT__ !== null) {
    return { clientId: __WORKSPACE_CLIENT__.clientId, hostedDomain: __WORKSPACE_CLIENT__.domain };
  }
  return undefined;
}

/**
 * Read-only access to events on calendars the user owns, which includes the
 * primary calendar that meeting invitations land on. Narrower than
 * calendar.events.readonly, which also covers other people's calendars.
 */
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events.owned.readonly";

/** "openid" and "email" identify which account a token belongs to. */
export const OAUTH_SCOPES = ["openid", "email", CALENDAR_SCOPE];
