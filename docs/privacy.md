---
title: Privacy Policy
---

# Privacy Policy for Don't Be Late

*Effective date: October 25, 2026*

Don't Be Late ("the extension") is a Chrome extension that opens your
Google Calendar meetings in a browser tab shortly before they start. This
policy explains what data the extension accesses, how it uses that data, and
what it does not do.

## Summary

- The extension reads your Google Calendar events **only** to find upcoming
  meetings and open them.
- All data stays **in your browser**. It is sent only to Google, never to the
  developer or any other party.
- There is no server, analytics, advertising or tracking.

## Data the extension accesses

When you connect a Google account, you grant the extension the following
access through Google's OAuth consent screen:

| Google permission | What the extension uses it for |
|---|---|
| See the events on Google calendars you own (`calendar.events.owned.readonly`) | Reading upcoming events on your primary calendar: start time, title, status, your response, and video meeting links (Google Meet, Zoom, Microsoft Teams) |
| See your primary email address (`email`, `openid`) | Telling connected accounts apart, and opening Google Meet with the matching account |

The extension can't create, change or delete calendar events, and it doesn't
access any other Google data.

The extension also asks Chrome for permission to see the addresses of open
`meet.google.com` tabs. It uses this only to bring a meeting's tab to the
front if that meeting is already open. It doesn't read or change the content
of those pages.

## How data is used and stored

- **Calendar events:** fetched from the Google Calendar API every few
  minutes, for the next few hours only. The extension keeps a list of
  upcoming meetings (title, start time and join link) in Chrome's local
  extension storage on your computer, and uses it to schedule opening each
  meeting.
- **Account information:** your Google account ID and email address are
  stored in local extension storage, so the extension remembers which
  accounts you connected.
- **Access tokens:** the short-lived OAuth access tokens issued by Google are
  kept in Chrome's in-memory session storage only, and are discarded when the
  browser closes.
- **Settings:** your lead time and pause settings are stored in local
  extension storage.

The extension sends data only to Google, as part of signing in and making
Google Calendar API requests. The developer doesn't operate any server and
doesn't receive any of your data.

## Sharing

The extension doesn't sell, share or transfer your data to anyone. It doesn't
use your data for advertising, creditworthiness or lending decisions, or any
purpose other than opening your meetings. Nobody, including the developer,
reads your data.

## Limited Use

Don't Be Late's use and transfer of information received from Google APIs
adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

## Removing your data

- **Disconnect an account:** click *Remove* next to the account on the
  extension's settings page. This deletes the account's stored data and
  revokes the extension's access.
- **Revoke access through Google:** go to
  [your Google Account's third-party connections](https://myaccount.google.com/connections).
- **Uninstall the extension:** Chrome then deletes all data the extension
  stored.

## Changes to this policy

Changes to this policy will be published in this document, with an updated
effective date. Its history is available in the project's
[Git repository](https://github.com/15characterlimi/dontbelate).

## Contact

For questions about this policy, open an issue at
<https://github.com/15characterlimi/dontbelate/issues>.
