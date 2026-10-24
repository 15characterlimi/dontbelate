// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import { type Account, getAccessToken, invalidateAccessToken } from "./accounts";
import type { CalendarEvent } from "./meetings";

const EVENTS_ENDPOINT = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/** Only request the fields that meetings.ts uses. */
const EVENT_FIELDS =
  "items(id,status,summary,eventType,start,hangoutLink,conferenceData/entryPoints,attendees(self,responseStatus),location,description)";

/** Fetches the events on `account`'s primary calendar that start in [timeMin, timeMax). */
export async function fetchEvents(account: Account, timeMin: number, timeMax: number): Promise<CalendarEvent[]> {
  const url = new URL(EVENTS_ENDPOINT);
  url.searchParams.set("timeMin", new Date(timeMin).toISOString());
  url.searchParams.set("timeMax", new Date(timeMax).toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "100");
  // With maxAttendees=1, large guest lists are reduced to just our own entry.
  url.searchParams.set("maxAttendees", "1");
  url.searchParams.set("fields", EVENT_FIELDS);

  // Retry once with a fresh token if the cached one was rejected (e.g. revoked).
  for (let attempt = 1; ; attempt++) {
    const token = await getAccessToken(account);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401 && attempt === 1) {
      await invalidateAccessToken(account);
      continue;
    }
    if (!response.ok) {
      throw new Error(`Fetching events for ${account.email} failed: HTTP ${response.status}`);
    }
    const body = (await response.json()) as { items?: CalendarEvent[] };
    return body.items ?? [];
  }
}
