// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import {
  type Account,
  connectAccount,
  disconnectAccount,
  getAccessToken,
  InteractionRequiredError,
  listAccounts,
} from "./accounts";

function element<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (e === null) throw new Error(`Missing element #${id}`);
  return e as T;
}

const accountList = element<HTMLUListElement>("accounts");
const noAccounts = element<HTMLParagraphElement>("no-accounts");
const connectButton = element<HTMLButtonElement>("connect");
const errorText = element<HTMLParagraphElement>("error");

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
      item.insertBefore(button("Sign in", () => connectAccount(account.email)), status.nextSibling);
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

connectButton.addEventListener("click", () => void runAction(connectButton, () => connectAccount()));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && "accounts" in changes) void render();
});

void render();
