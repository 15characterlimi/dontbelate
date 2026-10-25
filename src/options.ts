// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import {
  type Account,
  connectAccount,
  disconnectAccount,
  getAccessToken,
  InteractionRequiredError,
  listAccounts,
  reconnectAccount,
} from "./accounts";
import { getWorkspaceClient } from "./config";
import {
  getSettings,
  isPaused,
  MAX_LEAD_MINUTES,
  normalizeTitles,
  SETTINGS_KEY,
  startOfNextDay,
  updateSettings,
} from "./settings";
import { HOUR_MS, SECOND_MS } from "./time";

function element<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (e === null) throw new Error(`Missing element #${id}`);
  return e as T;
}

const accountList = element<HTMLUListElement>("accounts");
const noAccounts = element<HTMLParagraphElement>("no-accounts");
const connectButton = element<HTMLButtonElement>("connect");
const connectWorkspaceButton = element<HTMLButtonElement>("connect-workspace");
const errorText = element<HTMLParagraphElement>("error");
const openMaybeInput = element<HTMLInputElement>("open-maybe");
const openNotRespondedInput = element<HTMLInputElement>("open-not-responded");
const ignoredTitlesInput = element<HTMLTextAreaElement>("ignored-titles");
const leadInput = element<HTMLInputElement>("lead-minutes");
const pauseStatus = element<HTMLParagraphElement>("pause-status");
const pauseHourButton = element<HTMLButtonElement>("pause-hour");
const pauseDayButton = element<HTMLButtonElement>("pause-day");
const resumeButton = element<HTMLButtonElement>("resume");

function showError(e: unknown): void {
  errorText.textContent = e instanceof Error ? e.message : String(e);
  errorText.hidden = false;
}

/** Disables `button` while `action` runs, and reports any error. */
async function runAction(button: HTMLButtonElement, action: () => Promise<unknown>): Promise<void> {
  errorText.hidden = true;
  button.disabled = true;
  try {
    await action();
  } catch (e) {
    showError(e);
  } finally {
    button.disabled = false;
  }
}

function button(label: string, action: () => Promise<unknown>): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.addEventListener("click", () => void runAction(b, action));
  return b;
}

async function updateStatus(account: Account, status: HTMLElement, item: HTMLElement): Promise<void> {
  try {
    await getAccessToken(account);
    status.textContent = "Connected";
    status.className = "status ok";
  } catch (e) {
    status.className = "status warn";
    if (e instanceof InteractionRequiredError) {
      status.textContent = "Sign-in required";
      item.insertBefore(button("Sign in", () => reconnectAccount(account)), status.nextSibling);
    } else {
      status.textContent = "Error";
      status.title = e instanceof Error ? e.message : String(e);
    }
  }
}

async function render(): Promise<void> {
  const accounts = await listAccounts();
  accountList.replaceChildren(
    ...accounts.map((account) => {
      const item = document.createElement("li");
      const email = document.createElement("span");
      email.className = "email";
      email.textContent = account.email;
      const status = document.createElement("span");
      status.className = "status";
      status.textContent = "Checking…";
      item.append(email, status, button("Remove", () => disconnectAccount(account)));
      void updateStatus(account, status, item);
      return item;
    }),
  );
  noAccounts.hidden = accounts.length > 0;
}

async function renderSettings(): Promise<void> {
  const settings = await getSettings();
  openMaybeInput.checked = settings.openMaybe;
  openNotRespondedInput.checked = settings.openNotResponded;
  if (document.activeElement !== ignoredTitlesInput) ignoredTitlesInput.value = settings.ignoredTitles.join("\n");
  if (document.activeElement !== leadInput) leadInput.value = String(settings.leadMinutes);
  const paused = isPaused(settings, Date.now());
  if (paused && settings.pausedUntil !== undefined) {
    const until = new Date(settings.pausedUntil).toLocaleString(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
    pauseStatus.textContent = `Paused until ${until}. No meetings will be opened until then.`;
    pauseStatus.className = "status warn";
  } else {
    pauseStatus.textContent = "Active.";
    pauseStatus.className = "status ok";
  }
  resumeButton.hidden = !paused;
}

connectButton.addEventListener("click", () => void runAction(connectButton, () => connectAccount()));
const workspaceClient = await getWorkspaceClient();
if (workspaceClient !== undefined) {
  const client = workspaceClient;
  connectWorkspaceButton.textContent = `Connect a ${client.hostedDomain} account`;
  connectWorkspaceButton.hidden = false;
  connectWorkspaceButton.addEventListener("click", () =>
    void runAction(connectWorkspaceButton, () => connectAccount(client)),
  );
  connectButton.textContent = "Connect another Google account";
}

openMaybeInput.addEventListener("change", () => void updateSettings({ openMaybe: openMaybeInput.checked }));
openNotRespondedInput.addEventListener("change", () =>
  void updateSettings({ openNotResponded: openNotRespondedInput.checked }),
);
// Saved when the text area loses focus, so that a sync doesn't run on every keystroke.
ignoredTitlesInput.addEventListener("change", () => {
  void updateSettings({ ignoredTitles: normalizeTitles(ignoredTitlesInput.value.split("\n")) });
});
ignoredTitlesInput.addEventListener("blur", () => void renderSettings());

leadInput.max = String(MAX_LEAD_MINUTES);
leadInput.addEventListener("change", () => {
  if (leadInput.checkValidity()) {
    void updateSettings({ leadMinutes: leadInput.valueAsNumber });
  } else {
    void renderSettings();
  }
});
pauseHourButton.addEventListener("click", () =>
  void runAction(pauseHourButton, () => updateSettings({ pausedUntil: Date.now() + HOUR_MS })),
);
pauseDayButton.addEventListener("click", () =>
  void runAction(pauseDayButton, () => updateSettings({ pausedUntil: startOfNextDay(Date.now()) })),
);
resumeButton.addEventListener("click", () =>
  void runAction(resumeButton, () => updateSettings({ pausedUntil: undefined })),
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if ("accounts" in changes) void render();
  if (SETTINGS_KEY in changes) void renderSettings();
});

// Show "Active" again once a pause ends while the page is open.
setInterval(() => void renderSettings(), 30 * SECOND_MS);

void render();
void renderSettings();
