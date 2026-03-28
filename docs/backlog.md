# Backlog
## QR File Drop

**Last updated:** 2026-03-28

Unscheduled items. Nothing here has a version target yet. Items are promoted to `docs/plan.md` when scheduled.

See [docs/plan.md](plan.md) for scheduled work.

Priority labels: `[SHOULD]` high value · `[COULD]` nice-to-have · `[IDEA]` needs discussion

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

## Infrastructure

- `[COULD]` **Custom domain** — point a domain at the GitHub Pages deployment.
