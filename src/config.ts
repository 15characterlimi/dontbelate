// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

/** OAuth client ("Web application" type) registered in the Google Cloud project. */
export const OAUTH_CLIENT_ID =
  "952121776021-i34jc133ur7i69lade3hapkmvp1t5uqj.apps.googleusercontent.com";

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";

/** "openid" and "email" identify which account a token belongs to. */
export const OAUTH_SCOPES = ["openid", "email", CALENDAR_SCOPE];
