# Don't Be Late

A Chrome extension that opens your Google Calendar meeting's waiting room
(Google Meet, Zoom, Teams, …) in a new tab shortly before the meeting starts,
so that joining is a single click.

Status: early development.

## Development

Requires Node.js 20 or newer.

```sh
npm install
npm run build      # bundle into dist/
npm run watch      # rebuild on changes
npm run check      # typecheck + unit tests
```

Load the extension in Chrome: open `chrome://extensions`, enable
*Developer mode*, click *Load unpacked* and select the `dist/` directory.
After rebuilding, click the reload icon on the extension's card.

The manifest's `key` is the public key of the extension's Chrome Web Store
item, so an unpacked build has the same ID as the published extension,
`knehdcieoogihbpggambkjdofadnnpnp`. The Google OAuth client is registered
for the redirect URL derived from that ID:
`https://knehdcieoogihbpggambkjdofadnnpnp.chromiumapp.org/`.

## License

Apache License 2.0; see [LICENSE](LICENSE).
