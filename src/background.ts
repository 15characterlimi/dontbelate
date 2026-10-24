// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

import { handleAlarm, startSyncing, sync } from "./scheduler";
import { SETTINGS_KEY } from "./settings";

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    void chrome.runtime.openOptionsPage();
  }
  void startSyncing();
});

chrome.runtime.onStartup.addListener(() => {
  void startSyncing();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  void handleAlarm(alarm);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && ("accounts" in changes || SETTINGS_KEY in changes)) void sync();
});

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});
