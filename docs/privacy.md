---
title: Privacy Policy
---

# Privacy Policy for Don't Be Late

*Effective date: November 1, 2026*

Don't Be Late ("the extension") is a Chrome extension that opens your
Google Calendar meetings in a browser tab shortly before they start. This
policy explains what data the extension accesses, how it uses that data, and
what it does not do.

## Summary

- The extension reads your Google Calendar events **only** to find upcoming
  meetings and open them.
- All data stays **in your browser**. The extension sends it only to Google,
  never to the developer or any other party. Opening a meeting loads its
  join link, just as if you clicked it.
- There is no server, analytics, advertising or tracking, and no AI or
  machine learning.

## Data the extension accesses

When you connect a Google account, you grant the extension the following
access through Google's OAuth consent screen:

| Google permission | What the extension uses it for |
|---|---|
| See the events on Google calendars you own (`calendar.events.owned.readonly`) | Reading upcoming events on your primary calendar, to find video meetings and open them |
| See your primary email address (`email`, `openid`) | Telling connected accounts apart, and opening Google Meet with the matching account |

From your primary calendar, the extension requests only the events that
start in the next three hours (or started in the last few minutes), and only
these fields of each event:

- its ID, start time, title and status (for example, cancelled);
- its event type (for example, out-of-office or focus time);
- your own response to the invitation (yes, no, maybe or not responded).
  Other guests aren't requested;
- its video call (Google Meet link, or the links of a Zoom or Microsoft Teams
  Calendar add-on), its location and its description, which the extension
  searches for a Google Meet, Zoom or Microsoft Teams link.

From your Google account, it receives your account ID and email address.

The extension can't create, change or delete calendar events, and it doesn't
access any other Google data, including other calendars. It doesn't create
any aggregated or anonymized data from your Google data.

The extension also asks Chrome for permission to see the addresses of open
`meet.google.com` tabs. It uses this only to bring a meeting's tab to the
front if that meeting is already open. It doesn't read or change the content
of those pages.

## How data is used and stored

- **Calendar events:** fetched from the Google Calendar API every five
  minutes. The extension picks the meetings to open, and keeps only those
  in a list of upcoming meetings (event ID, title, start time and join link)
  in Chrome's local extension storage on your computer. It uses the list to
  schedule opening each meeting. Other events and fields are discarded right
  after they are checked.
- **Account information:** your Google account ID and email address are
  stored in local extension storage, so the extension remembers which
  accounts you connected.
- **Access tokens:** the short-lived OAuth access tokens issued by Google are
  kept in Chrome's in-memory session storage only, and are discarded when the
  browser closes.
- **Settings:** your settings, such as the lead time, which meetings to
  open and title texts to ignore, are stored in local extension storage.

Your Google data is used only to open your meetings and to show your
connected accounts on the extension's settings page.

The extension sends data only to Google, as part of signing in and making
Google Calendar API requests. The developer doesn't operate any server and
doesn't receive any of your data.

When a meeting is due, the extension opens its join link in a browser tab.
As when you click the link yourself, your browser then loads the meeting
page from the meeting's service (Google Meet, Zoom or Microsoft Teams),
which receives the link. The extension doesn't send that service anything
else.

## Sharing

The extension doesn't sell, share or transfer your data, whether raw,
aggregated or anonymized, to anyone: not to the developer, advertisers, data
brokers, AI services or any other party. It doesn't use your data for
advertising, creditworthiness or lending decisions, or any purpose other than
opening your meetings. Nobody, including the developer, reads your data.
The only exception is opening a meeting's join link, described above, which
you ask for by connecting your account.

## AI and machine learning

The extension doesn't use AI or machine learning. Your Google data isn't
used to develop, improve or train AI or machine learning models, and isn't
sent to any AI service.

## How data is protected

- The extension sends data only to Google, and only over encrypted HTTPS
  connections. Join links that it opens are HTTPS links too.
- Data is stored only in Chrome's extension storage on your computer, which
  websites and other extensions can't read.
- Access tokens are kept in memory only, never written to disk, and expire
  after about an hour.
- The extension requests only the calendar data it needs (see
  [Data the extension accesses](#data-the-extension-accesses)), and read-only
  access to it.
- There is no server or developer account that holds your data, so there is
  nothing to be breached outside your browser.
- The source code is public, so anyone can check how data is handled.

## Data retention

| Data | Kept until |
|---|---|
| Upcoming meetings (event ID, title, start time, join link) | Replaced at the next sync, every five minutes. A meeting that's no longer on your calendar is dropped then. If the calendar can't be read, for example while offline, a meeting is dropped at the first sync more than six minutes after its start, when it can no longer open. |
| Record of which meetings were already opened (event ID and start time) | One day after the meeting's start |
| Other events and event fields | Not kept: discarded right after they are checked |
| Account ID and email address | You remove the account, or uninstall the extension |
| Access tokens | They're replaced by a new token, you remove the account, or the browser closes. Google stops accepting each token after about an hour. |
| Settings | You uninstall the extension |

## Limited Use

Don't Be Late's use and transfer of information received from Google APIs
adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

## Deleting your data

- **Disconnect an account:** click *Remove* next to the account on the
  extension's settings page. This immediately deletes the account's stored
  data, including its upcoming meetings, and revokes the extension's access.
- **Revoke access through Google:** go to
  [your Google Account's third-party connections](https://myaccount.google.com/connections).
  The extension then can't read your calendar any more. The meetings it
  already stored are dropped as described under
  [Data retention](#data-retention); the account ID and email address remain
  until you remove the account on the settings page.
- **Uninstall the extension:** Chrome then deletes all data the extension
  stored.

## Changes to this policy

Changes to this policy will be published in this document, with an updated
effective date. Its history is available in the project's
[Git repository](https://github.com/15characterlimi/dontbelate).

## Contact

For questions about this policy, open an issue at
<https://github.com/15characterlimi/dontbelate/issues>.
