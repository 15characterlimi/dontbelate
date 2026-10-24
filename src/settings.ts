// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

export interface Settings {
  /** How many minutes before a meeting's start to open it. */
  leadMinutes: number;
  /** While paused, no meetings are opened. Milliseconds since the epoch. */
  pausedUntil?: number;
}

export const SETTINGS_KEY = "settings";
export const MAX_LEAD_MINUTES = 10;
const DEFAULT_LEAD_MINUTES = 1;

/** Fills in defaults and clamps out-of-range values in stored settings. */
export function normalizeSettings(stored: Partial<Settings> | undefined): Settings {
  const lead = Math.round(Number(stored?.leadMinutes ?? DEFAULT_LEAD_MINUTES));
  const settings: Settings = {
    leadMinutes: Number.isFinite(lead) ? Math.min(Math.max(lead, 0), MAX_LEAD_MINUTES) : DEFAULT_LEAD_MINUTES,
  };
  if (typeof stored?.pausedUntil === "number") settings.pausedUntil = stored.pausedUntil;
  return settings;
}

export function isPaused(settings: Settings, now: number): boolean {
  return settings.pausedUntil !== undefined && now < settings.pausedUntil;
}

/** The next local midnight after `now`. */
export function startOfNextDay(now: number): number {
  const date = new Date(now);
  date.setHours(24, 0, 0, 0);
  return date.getTime();
}

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY] as Partial<Settings> | undefined);
}

export async function updateSettings(changes: Partial<Settings>): Promise<void> {
  const settings: Settings = { ...(await getSettings()), ...changes };
  await chrome.storage.local.set({ [SETTINGS_KEY]: normalizeSettings(settings) });
}
