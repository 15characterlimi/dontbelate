// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Browser-independent logic for deciding which calendar events are meetings
// to open, and which URL to open for them.

/** The subset of a Google Calendar API Event resource that we use. */
export interface CalendarEvent {
  id: string;
  status?: string;
  summary?: string;
  eventType?: string;
  start?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  attendees?: { self?: boolean; responseStatus?: string }[];
  location?: string;
  description?: string;
}

export interface Meeting {
  /** Unique per account, event and start time, so rescheduled events open again. */
  key: string;
  title: string;
  /** Milliseconds since the epoch. */
  start: number;
  url: string;
}

/** Video meeting links found in event locations or descriptions. */
const MEETING_URL_PATTERN =
  /https:\/\/(?:meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}|[\w-]+\.zoom\.us\/[jw]\/\d+|teams\.microsoft\.com\/l\/meetup-join\/|teams\.live\.com\/meet\/)[^\s"'<>]*/i;

/** Event types that never represent meetings. */
const NON_MEETING_EVENT_TYPES = new Set(["workingLocation", "outOfOffice", "focusTime", "birthday"]);

/** Returns the URL to join `event`'s video call, if it has one. */
export function getJoinUrl(event: CalendarEvent): string | undefined {
  const video = event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video" && e.uri);
  if (video?.uri) return video.uri;
  if (event.hangoutLink) return event.hangoutLink;
  for (const text of [event.location, event.description]) {
    const match = text?.match(MEETING_URL_PATTERN);
    if (match) return match[0].replace(/&amp;/g, "&");
  }
  return undefined;
}

/**
 * For Google Meet links, selects the account that the meeting should be
 * joined with; Meet would otherwise use the browser's default Google account.
 */
export function withAuthUser(url: string, email: string): string {
  const parsed = new URL(url);
  if (parsed.hostname !== "meet.google.com") return url;
  parsed.searchParams.set("authuser", email);
  return parsed.toString();
}

/**
 * A tabs.query() URL pattern matching tabs that show the same Google Meet
 * meeting as `url`, regardless of query parameters. Undefined for other
 * links, since the extension may only see the URLs of Meet tabs.
 */
export function meetTabPattern(url: string): string | undefined {
  const parsed = new URL(url);
  if (parsed.hostname !== "meet.google.com" || !/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(parsed.pathname)) {
    return undefined;
  }
  return `https://meet.google.com${parsed.pathname}*`;
}

/** Converts calendar events of the account `accountId`/`email` into meetings to open. */
export function selectMeetings(events: CalendarEvent[], accountId: string, email: string): Meeting[] {
  const meetings: Meeting[] = [];
  for (const event of events) {
    if (event.status === "cancelled") continue;
    if (event.eventType !== undefined && NON_MEETING_EVENT_TYPES.has(event.eventType)) continue;
    // All-day events only have start.date.
    const startTime = event.start?.dateTime;
    if (startTime === undefined) continue;
    const start = Date.parse(startTime);
    if (Number.isNaN(start)) continue;
    const self = event.attendees?.find((a) => a.self);
    if (self?.responseStatus === "declined") continue;
    const url = getJoinUrl(event);
    if (url === undefined) continue;
    meetings.push({
      key: `${accountId}/${event.id}/${start}`,
      title: event.summary ?? "(No title)",
      start,
      url: withAuthUser(url, email),
    });
  }
  return meetings;
}

/**
 * When to open `meeting`, or undefined if it's too late to bother: meetings
 * are still opened up to `graceMs` after they started, e.g. when the
 * computer was asleep or the browser wasn't running at the scheduled time.
 */
export function openTime(meeting: Meeting, now: number, leadMs: number, graceMs: number): number | undefined {
  if (now > meeting.start + graceMs) return undefined;
  return Math.max(meeting.start - leadMs, now);
}
