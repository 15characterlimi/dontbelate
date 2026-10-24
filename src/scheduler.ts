// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Periodically fetches upcoming meetings from all connected accounts and
// schedules an alarm to open each one shortly before it starts.
//
// The service worker can be stopped at any time, so all state lives in
// chrome.storage and chrome.alarms rather than in variables.

import { InteractionRequiredError, listAccounts } from "./accounts";
import { updateBadge } from "./badge";
import { fetchEvents } from "./calendar";
import { type Meeting, meetTabPattern, openTime, selectMeetings } from "./meetings";
import { getSettings, isPaused } from "./settings";

/** How often to re-fetch calendars, i.e. how late short-notice meetings may be noticed. */
const SYNC_PERIOD_MINUTES = 5;
/**
 * Meetings are still opened up to this long after they started. Longer than
 * the sync period, so that a meeting created just before it starts is found
 * in time even if the sync alarm fires a little late.
 */
const GRACE_MS = (SYNC_PERIOD_MINUTES + 1) * 60_000;
/** How far ahead to look for meetings on each sync. */
const LOOKAHEAD_MS = 3 * 60 * 60_000;
/** Remember opened meetings for this long, so they don't open twice. */
const OPENED_RETENTION_MS = 24 * 60 * 60_000;

const SYNC_ALARM = "sync";
/** Fires when a pause ends. */
const RESUME_ALARM = "resume";
const OPEN_ALARM_PREFIX = "open:";
const MEETINGS_KEY = "meetings";
const OPENED_KEY = "opened";

type Meetings = Record<string, Meeting>;
/** Meeting key → start time of meetings that were already opened. */
type Opened = Record<string, number>;

async function load<T>(key: string): Promise<T | undefined> {
  return (await chrome.storage.local.get(key))[key] as T | undefined;
}

/** Makes sure periodic syncing is set up, and syncs right away. */
export async function startSyncing(): Promise<void> {
  if ((await chrome.alarms.get(SYNC_ALARM)) === undefined) {
    await chrome.alarms.create(SYNC_ALARM, { periodInMinutes: SYNC_PERIOD_MINUTES });
  }
  await sync();
}

let syncInProgress: Promise<void> = Promise.resolve();

/** Re-fetches meetings and reschedules their alarms. Concurrent calls run one after another. */
export function sync(): Promise<void> {
  syncInProgress = syncInProgress.then(doSync, doSync);
  return syncInProgress;
}

async function doSync(): Promise<void> {
  const now = Date.now();
  const previous = (await load<Meetings>(MEETINGS_KEY)) ?? {};
  const meetings: Meetings = {};
  const accounts = await listAccounts();
  const needsSignIn: string[] = [];
  for (const account of accounts) {
    try {
      const events = await fetchEvents(account, now - GRACE_MS, now + LOOKAHEAD_MS);
      for (const meeting of selectMeetings(events, account.id, account.email)) {
        meetings[meeting.key] = meeting;
      }
    } catch (e) {
      // E.g. offline or signed out: keep what we knew about this account's meetings.
      console.warn(`Syncing ${account.email} failed:`, e);
      if (e instanceof InteractionRequiredError) needsSignIn.push(account.email);
      for (const [key, meeting] of Object.entries(previous)) {
        if (key.startsWith(`${account.id}/`)) meetings[key] = meeting;
      }
    }
  }

  const opened = (await load<Opened>(OPENED_KEY)) ?? {};
  for (const [key, start] of Object.entries(opened)) {
    if (start < now - OPENED_RETENTION_MS) delete opened[key];
  }
  await chrome.storage.local.set({ [MEETINGS_KEY]: meetings, [OPENED_KEY]: opened });

  for (const alarm of await chrome.alarms.getAll()) {
    if (alarm.name.startsWith(OPEN_ALARM_PREFIX) || alarm.name === RESUME_ALARM) {
      await chrome.alarms.clear(alarm.name);
    }
  }
  const settings = await getSettings();
  const pausedUntil = isPaused(settings, now) ? settings.pausedUntil : undefined;
  if (pausedUntil !== undefined) {
    // Meetings that are due when the pause ends still open, within the grace period.
    await chrome.alarms.create(RESUME_ALARM, { when: pausedUntil });
  }
  for (const meeting of Object.values(meetings)) {
    if (meeting.key in opened) continue;
    const when = openTime(meeting, now, settings.leadMinutes * 60_000, GRACE_MS);
    if (when !== undefined && (pausedUntil === undefined || when >= pausedUntil)) {
      await chrome.alarms.create(OPEN_ALARM_PREFIX + meeting.key, { when });
    }
  }
  await updateBadge({ accountCount: accounts.length, needsSignIn, pausedUntil });
}

async function openMeeting(key: string): Promise<void> {
  const meeting = ((await load<Meetings>(MEETINGS_KEY)) ?? {})[key];
  const opened = (await load<Opened>(OPENED_KEY)) ?? {};
  if (meeting === undefined || key in opened) return;
  const now = Date.now();
  const settings = await getSettings();
  if (isPaused(settings, now)) return;
  // The alarm may fire late, e.g. after the computer woke up from sleep.
  if (openTime(meeting, now, settings.leadMinutes * 60_000, GRACE_MS) === undefined) return;

  opened[key] = meeting.start;
  await chrome.storage.local.set({ [OPENED_KEY]: opened });

  // If the meeting is already open (e.g. joined early, or a recurring
  // meeting's tab left open), bring that tab to the front instead.
  const pattern = meetTabPattern(meeting.url);
  const [existing] = pattern === undefined ? [] : await chrome.tabs.query({ url: pattern });
  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
    return;
  }

  try {
    const tab = await chrome.tabs.create({ url: meeting.url, active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  } catch {
    // tabs.create fails if no browser window is open.
    await chrome.windows.create({ url: meeting.url, focused: true });
  }
}

export async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  if (alarm.name === SYNC_ALARM || alarm.name === RESUME_ALARM) {
    await sync();
  } else if (alarm.name.startsWith(OPEN_ALARM_PREFIX)) {
    await openMeeting(alarm.name.slice(OPEN_ALARM_PREFIX.length));
  }
}
