---
title: Don't Be Late
---

# Don't Be Late

**Don't Be Late** is a free, open-source Chrome extension that opens your
Google Calendar meetings in a browser tab shortly before they start, so that
joining is a single click.

One minute before each meeting (you can choose 0–10 minutes), the meeting's
Google Meet waiting room, or its Zoom or Microsoft Teams link, opens in a new
tab and the browser window comes to the front.

## Features

- Works with any number of Google accounts, both personal and Google
  Workspace.
- Opens only meetings with a video link that you haven't declined. All-day,
  out-of-office and focus-time events are skipped.
- Opens Google Meet with the account whose calendar the meeting is on.
- If the meeting is already open in a tab, brings that tab to the front
  instead of opening another one.
- Still opens a meeting shortly after its start if the computer was asleep.
- Can be paused for an hour or until tomorrow.

## How it works

You connect your Google accounts on the extension's settings page and grant
it read-only access to your calendar events. The extension then checks your
primary calendars for upcoming meetings every few minutes. Your calendar
data stays in your browser: the extension sends it only to Google, never
to the developer or anyone else. See the [privacy policy](privacy.html).

## Getting started

1. Install Don't Be Late from the
   [Chrome Web Store](https://chromewebstore.google.com/detail/knehdcieoogihbpggambkjdofadnnpnp).
2. Its settings page opens automatically. You can reopen it later by
   clicking the extension's icon in the Chrome toolbar.
3. Click **Connect a Google account**, choose your account, and allow
   Don't Be Late to see the events on Google calendars you own.
4. That's it: from now on, meetings on your primary calendar with a Google
   Meet, Zoom or Microsoft Teams link open one minute before they start.
   To try it, create an event with a Google Meet link that starts in two
   minutes.

To stop, click **Remove** next to the account on the settings page, or
uninstall the extension.

## Open source

The source code is available on GitHub under the Apache License 2.0:
<https://github.com/15characterlimi/dontbelate>

To report a problem or ask a question, open an issue at
<https://github.com/15characterlimi/dontbelate/issues>.

---

Don't Be Late isn't affiliated with or endorsed by Google. Google Calendar
and Google Meet are trademarks of Google LLC.
