// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { computeBadge } from "./badge";

const format = (time: number) => `t${time}`;

describe("computeBadge", () => {
  it("is empty when everything is fine", () => {
    expect(computeBadge({ accountCount: 1, needsSignIn: [] }, format).text).toBe("");
  });

  it("asks to connect an account when there is none", () => {
    const badge = computeBadge({ accountCount: 0, needsSignIn: [] }, format);
    expect(badge.text).toBe("!");
    expect(badge.title).toContain("connect a Google account");
  });

  it("names the accounts that need to sign in again", () => {
    const badge = computeBadge({ accountCount: 3, needsSignIn: ["a@x.com", "b@y.com"] }, format);
    expect(badge.text).toBe("!");
    expect(badge.title).toContain("a@x.com, b@y.com");
  });

  it("shows a pause", () => {
    const badge = computeBadge({ accountCount: 1, needsSignIn: [], pausedUntil: 42 }, format);
    expect(badge.text).toBe("off");
    expect(badge.title).toContain("paused until t42");
  });

  it("prioritizes sign-in problems over a pause", () => {
    const badge = computeBadge({ accountCount: 1, needsSignIn: ["a@x.com"], pausedUntil: 42 }, format);
    expect(badge.text).toBe("!");
  });
});
