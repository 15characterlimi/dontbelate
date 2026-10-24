// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { type CalendarEvent, getJoinUrl, meetTabPattern, openTime, selectMeetings, withAuthUser } from "./meetings";

const MEET = "https://meet.google.com/abc-defg-hij";
const START = "2026-10-24T10:00:00+02:00";
const START_MS = Date.parse(START);

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
    expect(selectMeetings([event()], "acc", "a@example.com")).toEqual([
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
    expect(selectMeetings([event(overrides)], "acc", "a@example.com")).toEqual([]);
  });

  it("keeps events with a tentative or missing response", () => {
    const events = [
      event({ id: "a", attendees: [{ self: true, responseStatus: "tentative" }] }),
      event({ id: "b", attendees: [{ self: true, responseStatus: "needsAction" }] }),
    ];
    expect(selectMeetings(events, "acc", "a@example.com").map((m) => m.key)).toEqual([
      `acc/a/${START_MS}`,
      `acc/b/${START_MS}`,
    ]);
  });
});

describe("openTime", () => {
  const meeting = { key: "k", title: "t", start: 100_000, url: MEET };

  it("opens the lead time before the start", () => {
    expect(openTime(meeting, 0, 60_000, 300_000)).toBe(40_000);
  });

  it("opens right away when already due", () => {
    expect(openTime(meeting, 90_000, 60_000, 300_000)).toBe(90_000);
    expect(openTime(meeting, 400_000, 60_000, 300_000)).toBe(400_000);
  });

  it("gives up once the grace period has passed", () => {
    expect(openTime(meeting, 400_001, 60_000, 300_000)).toBeUndefined();
  });
});
