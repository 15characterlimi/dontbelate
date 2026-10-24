# Don't Be Late

A Chrome extension that opens your Google Calendar meetings shortly before
they start, so that joining is a single click.

One minute before each meeting (configurable), the meeting's Google Meet
waiting room, or its Zoom or Teams link, opens in a new tab and the browser
window comes to the front.

## Features

- **Any number of Google accounts**, both personal and Google Workspace,
  independent of which account is signed in to Chrome.
- **Picks the right meetings:** events with a Meet, Zoom or Teams link that
  you haven't declined. All-day, out-of-office and focus-time events are
  skipped.
- **Joins with the right account:** Meet links open with the account whose
  calendar the meeting is on.
- **No duplicate tabs:** if the meeting is already open in a tab, that tab is
  brought to the front instead (Google Meet only).
- **Copes with sleep:** if the computer was asleep or Chrome wasn't running
  at the scheduled time, the meeting still opens up to 5 minutes after it
  started.
- **Settings:** lead time (0–10 minutes), and pausing for an hour or until
  tomorrow.
- **Toolbar badge:** a red **!** when no account is connected or an account
  needs to sign in again, and **off** while paused.

Only each account's primary calendar is checked. Meeting invitations always
land there.

## Privacy

The extension only reads your calendar events. It requests read-only access
to events (`calendar.events.readonly`) and your email address, to tell
accounts apart. Calendar data is only stored in the browser and only sent to
Google. Access tokens are kept in memory only. See the full
[privacy policy](PRIVACY.md).

## Installing from source

Requires Node.js 20 or newer.

```sh
npm install
npm run build
```

In Chrome, open `chrome://extensions`, enable *Developer mode*, click
*Load unpacked* and select the `dist/` directory. Then connect your Google
accounts on the settings page, which opens automatically. You can reopen it
later by clicking the toolbar icon.

## Google Cloud setup

Reading calendars requires an OAuth client in a Google Cloud project. The
client ID in [`src/config.ts`](src/config.ts) only accepts accounts that its
owner added as test users. To run your own copy, create your own client and
replace that ID:

1. In the [Google Cloud console](https://console.cloud.google.com), create a
   project. A free Gmail account works, and no billing is needed.
2. Under *APIs & Services → Library*, enable the **Google Calendar API**.
3. Configure the **OAuth consent screen** (*Google Auth Platform*):
   - Audience: **External**. Choose *Internal* instead only if every user
     belongs to your Google Workspace organization.
   - Data access: add the scope
     `https://www.googleapis.com/auth/calendar.events.readonly`.
   - While the app is in *Testing* status, add every account that should
     be able to connect as a **test user**.
4. Under *Clients*, create an OAuth client of type **Web application** (not
   *Chrome Extension*), with the authorized redirect URI
   `https://knehdcieoogihbpggambkjdofadnnpnp.chromiumapp.org/`.
5. Put the client ID into `src/config.ts` and rebuild.

The redirect URI is derived from the extension ID. The manifest's `key` is
the public key of the extension's Chrome Web Store item, so an unpacked
build has the same ID as the published extension,
`knehdcieoogihbpggambkjdofadnnpnp`, and one redirect URI covers both. If you
publish your own copy, replace the `key` with your store item's public key
(Developer Dashboard → *Package* → *View public key*, without the
`BEGIN`/`END` lines and line breaks), and use the resulting ID in the
redirect URI.

## Development

```sh
npm run build      # bundle into dist/
npm run watch      # rebuild on changes
npm run check      # typecheck + unit tests
npm run package    # check, then build release/dontbelate-<version>.zip
```

`npm run package` builds without source maps and leaves the manifest's `key`
out of the zip, because the Chrome Web Store doesn't accept it. The store
signs the extension with the matching private key, so the ID stays the same.

After rebuilding, click the reload icon on the extension's card in
`chrome://extensions`. The service worker's console, reachable via the card's
*service worker* link, logs sync failures.

| Path | Contents |
|---|---|
| `src/background.ts` | Service worker entry point: wires up events |
| `src/scheduler.ts` | Periodic sync, an alarm per meeting, opening tabs |
| `src/meetings.ts` | Choosing meetings and their join links (pure, tested) |
| `src/calendar.ts` | Google Calendar API requests |
| `src/accounts.ts`, `src/oauth.ts` | Connecting accounts, OAuth tokens |
| `src/settings.ts`, `src/badge.ts` | Settings storage, toolbar badge |
| `src/options.ts`, `static/options.*` | Settings page |
| `static/manifest.json` | Extension manifest |
| `assets/icon.svg` | Icon source |

The icon PNGs in `static/icons/` are rendered from `assets/icon.svg`. After
changing the SVG, regenerate them:

```sh
npm install --no-save @resvg/resvg-js && node scripts/render-icons.mjs
```

## License

Apache License 2.0; see [LICENSE](LICENSE).
