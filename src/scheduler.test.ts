// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { GRACE_MS, SYNC_PERIOD_MINUTES } from "./scheduler";
import { MINUTE_MS } from "./time";

describe("timing constants", () => {
  it("opens meetings for at least 5 minutes after they started", () => {
    expect(GRACE_MS).toBeGreaterThanOrEqual(5 * MINUTE_MS);
  });

  it("has a grace period at least a minute longer than the sync period", () => {
    // Otherwise a meeting created just before its start could be noticed
    // too late to be opened.
    expect(GRACE_MS).toBeGreaterThanOrEqual((SYNC_PERIOD_MINUTES + 1) * MINUTE_MS);
  });
});
