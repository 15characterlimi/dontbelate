// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { isPaused, normalizeSettings, startOfNextDay } from "./settings";

describe("normalizeSettings", () => {
  it("uses defaults when nothing is stored", () => {
    expect(normalizeSettings(undefined)).toEqual({ leadMinutes: 1 });
  });

  it("keeps valid values", () => {
    expect(normalizeSettings({ leadMinutes: 3, pausedUntil: 42 })).toEqual({ leadMinutes: 3, pausedUntil: 42 });
  });

  it("clamps and rounds the lead time", () => {
    expect(normalizeSettings({ leadMinutes: -2 }).leadMinutes).toBe(0);
    expect(normalizeSettings({ leadMinutes: 99 }).leadMinutes).toBe(10);
    expect(normalizeSettings({ leadMinutes: 2.6 }).leadMinutes).toBe(3);
    expect(normalizeSettings({ leadMinutes: Number.NaN }).leadMinutes).toBe(1);
  });

  it("drops a missing pause", () => {
    expect(normalizeSettings({ leadMinutes: 2, pausedUntil: undefined })).toEqual({ leadMinutes: 2 });
  });
});

describe("isPaused", () => {
  it("is paused only before pausedUntil", () => {
    expect(isPaused({ leadMinutes: 1 }, 100)).toBe(false);
    expect(isPaused({ leadMinutes: 1, pausedUntil: 200 }, 100)).toBe(true);
    expect(isPaused({ leadMinutes: 1, pausedUntil: 200 }, 200)).toBe(false);
  });
});

describe("startOfNextDay", () => {
  it("returns the next local midnight", () => {
    const now = new Date(2026, 9, 24, 15, 30).getTime();
    expect(startOfNextDay(now)).toBe(new Date(2026, 9, 25).getTime());
  });

  it("moves to the following day at exactly midnight", () => {
    const midnight = new Date(2026, 9, 24).getTime();
    expect(startOfNextDay(midnight)).toBe(new Date(2026, 9, 25).getTime());
  });
});
