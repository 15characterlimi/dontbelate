// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { type CalendarEvent, getJoinUrl, type MeetingFilter, meetTabPattern, openTime, selectMeetings, withAuthUser } from "./meetings";
import { HOUR_MS, MINUTE_MS, SECOND_MS } from "./time";

const MEET = "https://meet.google.com/abc-defg-hij";
const START = "2026-10-24T10:00:00+02:00";
const START_MS = Date.parse(START);

const OPEN_ALL: MeetingFilter = { openMaybe: true, openNotResponded: true, ignoredTitles: [] };

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return { id: "e1", summary: "Standup", start: { dateTime: START }, hangoutLink: MEET, ...overrides };
}

describe("getJoinUrl", () => {
  it("prefers the conference video entry point", () => {
    const e = event({
      conferenceData: {
        entryPoints: [
          { entryPointType: "phone", uri: "tel:+1-555" },
          { entryPointType: "video", uri: "https://example.zoom.us/j/123" },
        ],
      },
    });
    expect(getJoinUrl(e)).toBe("https://example.zoom.us/j/123");
  });

  it("falls back to hangoutLink", () => {
    expect(getJoinUrl(event())).toBe(MEET);
  });

  it("finds links in the location", () => {
    const e = event({ hangoutLink: undefined, location: "Room 1, https://acme.zoom.us/j/987?pwd=x" });
    expect(getJoinUrl(e)).toBe("https://acme.zoom.us/j/987?pwd=x");
  });

  it("finds Teams links in an HTML description", () => {
    const e = event({
      hangoutLink: undefined,
      description:
        '<a href="https://teams.microsoft.com/l/meetup-join/19%3ameeting_x/0?context=%7b%7d&amp;a=b">Join</a>',
    });
    expect(getJoinUrl(e)).toBe("https://teams.microsoft.com/l/meetup-join/19%3ameeting_x/0?context=%7b%7d&a=b");
  });

  it.each([
    "https://zoom.us/j/1234567890?pwd=abc",
    "https://us02web.zoom.us/j/1234567890",
    "https://acme.zoom.us/w/1234567890",
    "https://zoom.us/my/jane.doe",
    "https://teams.microsoft.com/meet/2345678901234?p=AbCdEf",
    "https://teams.live.com/meet/9876543210",
  ])("finds %s in the description", (url) => {
    expect(getJoinUrl(event({ hangoutLink: undefined, description: `Join: ${url}\nThanks` }))).toBe(url);
  });

  it("ignores Zoom and Teams links that aren't meetings", () => {
    const description = "https://zoom.us/download https://teams.microsoft.com/l/channel/x https://zoom.us/j/abc";
    expect(getJoinUrl(event({ hangoutLink: undefined, description }))).toBeUndefined();
  });

  it("uses the first link in the text", () => {
    const description = "https://zoom.us/j/111 or https://meet.google.com/abc-defg-hij";
    expect(getJoinUrl(event({ hangoutLink: undefined, description }))).toBe("https://zoom.us/j/111");
  });

  it("prefers the location over the description", () => {
    const e = event({ hangoutLink: undefined, location: "https://zoom.us/j/111", description: MEET });
    expect(getJoinUrl(e)).toBe("https://zoom.us/j/111");
  });

  it("returns undefined without a video link", () => {
    expect(getJoinUrl(event({ hangoutLink: undefined, location: "Room 1" }))).toBeUndefined();
  });
});

describe("withAuthUser", () => {
  it("adds authuser to Meet links", () => {
    expect(withAuthUser(MEET, "a@example.com")).toBe(`${MEET}?authuser=a%40example.com`);
  });

  it("leaves other links alone", () => {
    expect(withAuthUser("https://x.zoom.us/j/1", "a@example.com")).toBe("https://x.zoom.us/j/1");
  });
});

describe("meetTabPattern", () => {
  it("matches the meeting regardless of query parameters", () => {
    expect(meetTabPattern(`${MEET}?authuser=a%40example.com`)).toBe(`${MEET}*`);
  });

  it("ignores other links", () => {
    expect(meetTabPattern("https://x.zoom.us/j/1")).toBeUndefined();
    expect(meetTabPattern("https://meet.google.com/lookup/abc")).toBeUndefined();
  });
});

describe("selectMeetings", () => {
  it("converts a meeting", () => {
    expect(selectMeetings([event()], "acc", "a@example.com", OPEN_ALL)).toEqual([
      { key: `acc/e1/${START_MS}`, title: "Standup", start: START_MS, url: `${MEET}?authuser=a%40example.com` },
    ]);
  });

  it.each<[string, Partial<CalendarEvent>]>([
    ["cancelled events", { status: "cancelled" }],
    ["all-day events", { start: { date: "2026-10-24" } }],
    ["declined events", { attendees: [{ self: false }, { self: true, responseStatus: "declined" }] }],
    ["out-of-office events", { eventType: "outOfOffice" }],
    ["events without a video link", { hangoutLink: undefined }],
  ])("skips %s", (_, overrides) => {
    expect(selectMeetings([event(overrides)], "acc", "a@example.com", OPEN_ALL)).toEqual([]);
  });

  const responses = [
    event({ id: "yes", attendees: [{ self: true, responseStatus: "accepted" }] }),
    event({ id: "maybe", attendees: [{ self: true, responseStatus: "tentative" }] }),
    event({ id: "none", attendees: [{ self: true, responseStatus: "needsAction" }] }),
    event({ id: "no", attendees: [{ self: true, responseStatus: "declined" }] }),
    event({ id: "noGuests" }),
  ];

  function selectedIds(events: CalendarEvent[], filter: Partial<MeetingFilter>): string[] {
    return selectMeetings(events, "acc", "a@example.com", { ...OPEN_ALL, ...filter }).map(
      (m) => m.key.split("/")[1] ?? "",
    );
  }

  it("opens Maybe and Not responded events when enabled", () => {
    expect(selectedIds(responses, {})).toEqual(["yes", "maybe", "none", "noGuests"]);
  });

  it("skips Maybe events when disabled", () => {
    expect(selectedIds(responses, { openMaybe: false })).toEqual(["yes", "none", "noGuests"]);
  });

  it("skips Not responded events when disabled", () => {
    expect(selectedIds(responses, { openNotResponded: false })).toEqual(["yes", "maybe", "noGuests"]);
  });

  it("skips events whose title contains an ignored text, ignoring case", () => {
    const events = [
      event({ id: "ooo", summary: "Jane OOO" }),
      event({ id: "standup", summary: "Standup" }),
      event({ id: "away", summary: "Out of Office until Monday" }),
      event({ id: "untitled", summary: undefined }),
    ];
    expect(selectedIds(events, { ignoredTitles: ["ooo", "out of office"] })).toEqual(["standup", "untitled"]);
  });
});

describe("openTime", () => {
  const start = 10 * HOUR_MS;
  const meeting = { key: "k", title: "t", start, url: MEET };
  const lead = MINUTE_MS;
  const grace = 5 * MINUTE_MS;

  it("opens the lead time before the start", () => {
    expect(openTime(meeting, start - HOUR_MS, lead, grace)).toBe(start - MINUTE_MS);
  });

  it("opens right away when already due", () => {
    expect(openTime(meeting, start - 30 * SECOND_MS, lead, grace)).toBe(start - 30 * SECOND_MS);
    expect(openTime(meeting, start + grace, lead, grace)).toBe(start + grace);
  });

  it("gives up once the grace period has passed", () => {
    expect(openTime(meeting, start + grace + 1, lead, grace)).toBeUndefined();
  });
});
