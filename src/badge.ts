// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// The toolbar icon's badge flags situations in which meetings won't open.

export interface BadgeState {
  accountCount: number;
  /** Email addresses of accounts that need to sign in again. */
  needsSignIn: string[];
  /** Set while paused. Milliseconds since the epoch. */
  pausedUntil?: number;
}

export interface Badge {
  text: string;
  color: string;
  title: string;
}

const NAME = "Don't Be Late";
const ERROR_COLOR = "#d93025";
const INFO_COLOR = "#5f6368";

export function computeBadge(state: BadgeState, formatTime: (time: number) => string): Badge {
  if (state.accountCount === 0) {
    return { text: "!", color: ERROR_COLOR, title: `${NAME}: click to connect a Google account` };
  }
  if (state.needsSignIn.length > 0) {
    return {
      text: "!",
      color: ERROR_COLOR,
      title: `${NAME}: click to sign in again to ${state.needsSignIn.join(", ")}`,
    };
  }
  if (state.pausedUntil !== undefined) {
    return { text: "off", color: INFO_COLOR, title: `${NAME}: paused until ${formatTime(state.pausedUntil)}` };
  }
  return { text: "", color: INFO_COLOR, title: `${NAME} settings` };
}

export async function updateBadge(state: BadgeState): Promise<void> {
  const badge = computeBadge(state, (time) =>
    new Date(time).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }),
  );
  await chrome.action.setBadgeText({ text: badge.text });
  await chrome.action.setBadgeBackgroundColor({ color: badge.color });
  await chrome.action.setTitle({ title: badge.title });
}
