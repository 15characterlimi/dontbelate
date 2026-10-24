// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log(`Don't Be Late installed (reason: ${reason})`);
});
