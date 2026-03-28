# Backlog
## FileTunnel

**Last updated:** 2026-03-28

Unscheduled post-release items. Items are promoted to `docs/plan.md` when scheduled.

See [docs/plan.md](plan.md) for scheduled work.

Priority labels: `[SHOULD]` high value · `[COULD]` nice-to-have · `[IDEA]` needs discussion

---

## Features

- `[SHOULD]` **TURN server support** — target: post-v1.0.0. Allow connections through symmetric NAT / corporate firewalls (e.g. phone on 5G). Requires a hosted or third-party TURN server. Note: file data passes through the relay but remains DTLS-encrypted end-to-end — the relay cannot read it.
- `[SHOULD]` **Large file support (>25MB)** — target: post-v1.0.0. Streaming chunked transfer with `bufferedAmount` backpressure and File System Access API for writing directly to disk. Requires rework of FR-3 in prd.md.
- `[COULD]` **Multi-file transfer** — target: post-v1.0.0. Queue multiple files and send them in one session.
- `[COULD]` **Drag-and-drop** — target: post-v1.0.0. Accept files via drag-and-drop on the sender page in addition to the file picker.
- `[COULD]` **Transfer speed indicator** — target: post-v1.0.0. Show current throughput (MB/s) during transfer.
- `[COULD]` **PWA / Service Worker** — target: post-v1.0.0. Cache assets after first load for offline use.
- `[IDEA]`  **QWBP / air-gapped signaling** — target: post-v1.0.0. Fully serverless "QR Tango" using compressed binary SDP (no PeerJS). Requires a camera on the receiver computer.
- `[IDEA]`  **Private PeerJS server** — target: post-v1.0.0. Self-hosted signaling to remove dependency on `0.peerjs.com`.

- `[COULD]` **QR session expiry** — target: post-v1.0.0. Auto-invalidate the QR code after 2–5 minutes and generate a new peer ID. Prevents a shoulder-surfer from scanning an old code and connecting after the intended user has left.
- `[SHOULD]` **Keep screen awake hint on sender** — target: post-v1.0.0. iOS Safari (and some Android browsers) drop the WebRTC connection when the screen dims or the user switches apps mid-transfer. Add a visible warning on the sender view to keep the screen on until transfer completes. Optionally use the Screen Wake Lock API where supported.
- `[SHOULD]` **Subresource Integrity (SRI) for CDN scripts** — target: v1.0.0. Add `integrity` and `crossorigin` attributes to the PeerJS and qrcode-generator `<script>` tags. If the CDN is compromised, a modified script could silently exfiltrate the transferred file — SRI prevents execution of any script whose hash doesn't match.

## Quality

- `[COULD]` **SAS verification** — target: post-v1.0.0. 4-digit Short Authentication String derived from both peers' DTLS fingerprints, displayed on both screens to confirm no MITM.
