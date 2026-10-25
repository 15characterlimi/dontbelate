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
  at the scheduled time, the meeting still opens up to 6 minutes after it
  started.
- **Settings:** lead time (0–10 minutes), and pausing for an hour or until
  tomorrow.
- **Toolbar badge:** a red **!** when no account is connected or an account
  needs to sign in again, and **off** while paused.

Only each account's primary calendar is checked. Meeting invitations always
land there.

## Privacy

The extension only reads your calendar events. It requests read-only access
to events on calendars you own (`calendar.events.owned.readonly`) and your
email address, to tell accounts apart. Calendar data is only stored in the browser and only sent to
Google. Access tokens are kept in memory only. See the full
[privacy policy](https://dontbelate.codepilot.org/privacy.html)
([source](docs/privacy.md)).

## Installing from source

Requires Node.js 26 or newer.

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
     `https://www.googleapis.com/auth/calendar.events.owned.readonly`.
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

## Configuration

### Default OAuth client

The client ID in `DEFAULT_CLIENT` in [`src/config.ts`](src/config.ts) is
built into every copy of the extension. It's used for the
"Connect a Google account" button, and works for any Google account the
consent screen admits: test users while the app is in *Testing* status,
everyone once it's in production.

### Google Workspace OAuth client (optional)

An External consent screen shows an "unverified app" warning until Google
verifies the app. To avoid that for the users of one Google Workspace
organization, the extension can use a second OAuth client from a Google
Cloud project that belongs to that organization and has an **Internal**
consent screen. Internal apps need no verification, but only accounts of
that organization can use them.

To create this client, sign in to the Google Cloud console with an account
of the organization, create a project, and follow steps 2–4 of the
[Google Cloud setup](#google-cloud-setup), choosing **Internal** as the
audience, with the same redirect URI.

Once a Workspace client is configured, the settings page shows two
buttons:

| Button | OAuth client | Account chooser |
|---|---|---|
| Connect a *workspaceDomain* account | Workspace client | Only accounts of *workspaceDomain* (Google's `hd` parameter) |
| Connect another Google account | Default client | All accounts |

Each connected account remembers the client it was connected with, and
renews its tokens through that client. Removing or changing the Workspace
configuration later doesn't affect accounts that are already connected.
Disconnect and reconnect them to switch clients.

The Workspace client takes two settings. Neither is part of the source code
or of the published package; they're supplied in one of two ways.

| Setting | Type | Example | Meaning |
|---|---|---|---|
| `workspaceDomain` | string | `example.com` | Domain of the Workspace organization. Shown on the button and passed to Google as `hd`. |
| `workspaceClientId` | string | `123…apps.googleusercontent.com` | Client ID of the Internal OAuth client (type *Web application*). |

Both must be set and non-empty; if only one is, the extension ignores the
setting and logs a warning in the service worker console.

#### Through Chrome policy (published extension)

This is the intended way: a Workspace admin sets the values for the
organization's users only. Users outside the organization, including
testers who install the same Web Store package, never receive them. The
policy schema is in [`static/managed_schema.json`](static/managed_schema.json),
and the extension reads the values from `chrome.storage.managed`.

In the [Google Admin console](https://admin.google.com):

1. Go to *Devices → Chrome → Apps & extensions → Users & browsers*, and
   select the organizational unit.
2. Add the extension by its Web Store ID (or select it, if it's already
   listed), and choose its installation policy (see below).
3. In the extension's settings panel, enter the following under
   *Policy for extensions*, then save:

   ```json
   {
     "workspaceDomain": { "Value": "example.com" },
     "workspaceClientId": { "Value": "123456789012-abc….apps.googleusercontent.com" }
   }
   ```

**Installation stays opt-in if the admin wants it to.** The configuration
is set independently of the installation policy:

| Installation policy | Effect |
|---|---|
| *Allow install* | Users may install the extension from the Web Store themselves. Those who do get the configuration immediately. |
| *Force install* | Installed automatically for every user in the organizational unit. Users can't remove it. |
| *Force install + pin to browser toolbar* | Like *Force install*, and the icon is pinned to the toolbar. |

For either option, the extension must be available from somewhere the
admin can point to: normally the Chrome Web Store, where an *Unlisted*
listing is enough. Alternatively, admins can add a self-hosted extension by
the URL of its update manifest; this repository doesn't provide one.

**Policies only reach Chrome profiles that the organization manages.**
That means the Chrome profile is signed in to Chrome with the Workspace
account (for policies set under *Users & browsers*), or the computer is
enrolled in the organization's Chrome browser management. A user who works
in a personal Chrome profile, and only uses the Workspace account in a tab,
doesn't receive the policy. They see only "Connect a Google account", which
uses the default client. It still works if that client's consent screen
admits them, but with the "unverified app" warning.

Policies can take a while to reach browsers. To check, open
`chrome://policy` in a user's browser. With *Show policies with no value
set* enabled, the extension's values appear under its ID. *Reload policies*
fetches them immediately. The settings page reads the values when it
opens, so reload it after a change.

To try policy-based configuration on your own computer without the Admin
console, set the policy locally for the extension's ID, then click
*Reload policies* on `chrome://policy`:

- **Windows** (Command Prompt):

  ```bat
  set KEY=HKCU\Software\Policies\Google\Chrome\3rdparty\extensions\knehdcieoogihbpggambkjdofadnnpnp\policy
  reg add "%KEY%" /v workspaceDomain /t REG_SZ /d example.com /f
  reg add "%KEY%" /v workspaceClientId /t REG_SZ /d 123456789012-abc....apps.googleusercontent.com /f
  ```

  Remove it again with `reg delete "%KEY%" /f`. If `chrome://policy`
  doesn't list the values, use `HKLM` instead of `HKCU`, from a Command
  Prompt run as administrator.

- **Linux:** create `/etc/opt/chrome/policies/managed/dontbelate.json`
  (`/etc/chromium/policies/managed/` for Chromium):

  ```json
  {
    "3rdparty": {
      "extensions": {
        "knehdcieoogihbpggambkjdofadnnpnp": {
          "workspaceDomain": "example.com",
          "workspaceClientId": "123456789012-abc….apps.googleusercontent.com"
        }
      }
    }
  }
  ```

#### Through `config.local.json` (development builds only)

For unpacked development builds, the values can also come from a
`config.local.json` file in the project root. Copy
[`config.local.example.json`](config.local.example.json) and fill it in:

```json
{
  "workspace": {
    "domain": "example.com",
    "clientId": "123456789012-abc….apps.googleusercontent.com"
  }
}
```

- `npm run build` and `npm run watch` build the values into `dist/`, and
  print `Using the Workspace OAuth client for <domain>`. Rebuild after
  changing the file.
- Git ignores the file, so the values stay out of the repository.
- `npm run package` and `node scripts/build.mjs --release` **ignore** the
  file, so the values can't end up in a published package.
- If Chrome policy also sets both values, the policy takes precedence.

### Who can see the Workspace domain

| Who | Policy | `config.local.json` |
|---|---|---|
| Readers of the Git repository | No | No |
| Users outside the organization who install the published extension | No | No (release builds ignore the file) |
| Users who get the policy (the organization's users) | Yes, on the settings page | — |
| Anyone you give a development build to | — | Yes |

The client IDs don't reveal the domain to anyone except Google.

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
| `src/config.ts` | OAuth clients and scopes |
| `src/settings.ts`, `src/badge.ts` | Settings storage, toolbar badge |
| `src/options.ts`, `static/options.*` | Settings page |
| `static/manifest.json` | Extension manifest |
| `static/managed_schema.json` | Schema of the Chrome policy settings |
| `assets/icon.svg` | Icon source |
| `assets/store/` | Chrome Web Store promo tile |
| `docs/` | Website and privacy policy, published with GitHub Pages |

The icon PNGs in `static/icons/` are rendered from `assets/icon.svg`. After
changing the SVG, regenerate them:

```sh
npm install --no-save @resvg/resvg-js && node scripts/render-icons.mjs
```

The Chrome Web Store promo tile, `assets/store/promo-tile.png`, is rendered
from `assets/store/promo-tile.svg` without an alpha channel, as the store
requires. It needs the [Roboto](https://fonts.google.com/specimen/Roboto)
font file:

```sh
npm install --no-save @resvg/resvg-js && node scripts/render-store-assets.mjs path/to/Roboto.ttf
```

## License

Apache License 2.0; see [LICENSE](LICENSE).
