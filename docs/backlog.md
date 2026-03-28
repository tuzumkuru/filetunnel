# Backlog
## QR File Drop

**Last updated:** 2026-03-28

Unscheduled items. Nothing here has a version target yet. Items are promoted to `docs/plan.md` when scheduled.

See [docs/plan.md](plan.md) for scheduled work.

Priority labels: `[SHOULD]` high value · `[COULD]` nice-to-have · `[IDEA]` needs discussion

---

## Pre-release (v0.6.0 — must be done, not to be deferred)

These items must be implemented during the v0.6.0 backlog review — they are not optional candidates.

- **App branding** — apply FileTunnel branding to the UI: logo/wordmark, color scheme, favicon, page title, and any other visual identity elements.
- **About page** — a separate page (or modal/section) that briefly explains what FileTunnel is, how the WebRTC peer-to-peer transfer works, and why it is secure. Link to it from the main page.
- **Brief security blurb on main page** — one-liner on the receiver view explaining it is a secure, direct transfer with a "Learn more" / "About" link for details.
- **GitHub link in app** — small footer or header link to the GitHub repository.
- **Sponsor link in app** — "Buy me a coffee" link (https://buymeacoffee.com/tuzumkuru) in the footer or about page.
- **Modern README** — replace the minimal README planned for v1.0.0 with a best-practices README: badges, feature list, demo screenshot/GIF, how it works section, local setup instructions, and contribution guide.

---

## Features

- `[SHOULD]` **Large file support (>25MB)** — chunked transfer with `bufferedAmount` backpressure and File System Access API for streaming writes to disk. Requires rework of FR-3 in prd.md.
- `[SHOULD]` **TURN server support** — allow connections through symmetric NAT / corporate firewalls. Requires a hosted or third-party TURN server.
- `[COULD]` **Multi-file transfer** — queue multiple files and send them in one session.
- `[COULD]` **Drag-and-drop** — accept files via drag-and-drop on the sender page in addition to the file picker.
- `[COULD]` **Transfer speed indicator** — show current throughput (MB/s) during transfer.
- `[COULD]` **PWA / Service Worker** — cache assets after first load for offline use.
- `[IDEA]`  **QWBP / air-gapped signaling** — fully serverless "QR Tango" using compressed binary SDP (no PeerJS). Requires a camera on the library computer.
- `[IDEA]`  **Private PeerJS server** — self-hosted signaling to remove dependency on `0.peerjs.com`.

## Quality

- `[COULD]` **SAS verification** — 4-digit Short Authentication String derived from both peers' DTLS fingerprints, displayed on both screens to confirm no MITM.

## Known Glitches

- `[SHOULD]` **Receiver status not resetting on sender disconnect (desktop)** — when the sender closes their browser tab/window, the receiver stays on "Connected — ready to receive" indefinitely. ICE state change events (`disconnected`, `failed`, `closed`) and `conn.on('close')` are unreliable for detecting abrupt tab closure in desktop browsers. Fix: implement a heartbeat/ping so the receiver can detect a stale connection and reset.
- `[SHOULD]` **iOS Safari background disconnect** — when the receiver closes Safari on iPhone without closing the tab (e.g. swipes home or locks screen), the sender stays in "Connected — ready to receive" state indefinitely. Fix: detect `visibilitychange` / `pagehide` on the receiver side and send a close signal before the connection drops, or implement a heartbeat/ping so the sender can detect a stale connection and reset.
- `[SHOULD]` **QR broken-image flash** — while PeerJS is connecting, the `<img id="qr-img">` has no `src` and shows a broken-image icon for ~1 second. Fix: hide the img until the QR is ready (show a spinner or placeholder instead), then reveal it once `qr.createDataURL()` is called.

## Infrastructure

- `[SHOULD]` **Rename project to FileTunnel** — update all references (repo name, page titles, UI copy, README, AGENTS.md) from the current name to "FileTunnel".
- `[SHOULD]` **Custom domain: filetunnel.app** — point filetunnel.app at the GitHub Pages deployment and configure CNAME.
