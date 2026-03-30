# Architecture
## FileTunnel

**Status:** Draft
**Version:** 0.1.0
**Last updated:** 2026-03-28

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| UI | Vanilla HTML / CSS / JS | No build step; deploys directly as static files; no framework overhead |
| P2P transport | WebRTC RTCDataChannel | Mandatory DTLS encryption; direct browser-to-browser; no file data on any server |
| Signaling | PeerJS 1.x (CDN) | Abstracts WebRTC offer/answer/ICE exchange; only metadata (never file bytes) passes through the PeerJS public server |
| STUN | `stun.l.google.com:19302` | Free, reliable; used by PeerJS for NAT traversal candidate discovery |
| QR generation | `qrcode-generator` (CDN) | Lightweight, no dependencies, produces a QR canvas/SVG from a string |
| Integrity | Web Crypto API (`crypto.subtle.digest`) | Built into all modern browsers; no library needed for SHA-256 on a single ArrayBuffer |
| Hosting | Any static file host (GitHub Pages, Netlify, Cloudflare Pages, etc.) | No backend required; HTTPS enforced by host |

---

## File Structure

```
/
├── src/
│   ├── index.html      # Application shell + all UI markup for both modes
│   ├── style.css       # All styles
│   └── app.js          # All application logic (mode detection, PeerJS, transfer, QR, integrity)
├── .github/
│   └── workflows/
│       └── deploy.yml  # Copies src/ to gh-pages branch on push to main
└── docs/
    ├── prd.md
    ├── architecture.md
    ├── design.md
    ├── plan.md
    └── research/
        └── Gemini - Secure P2P File Sharing Via QR.md
```

No build artefacts, no `node_modules`, no bundler. The three files in `src/` are the entire application. The deploy workflow is a plain file copy — not a build step.

---

## Data Flow

```
Library computer (Receiver)                     User phone (Sender)
        │                                               │
        │  1. Page load (no ?peer param)                │
        │  → PeerJS connects to 0.peerjs.com            │
        │  → Receives ephemeral Peer ID                 │
        │  → Encodes URL into QR code                   │
        │  → Displays QR + URL text                     │
        │                                               │
        │                           2. User scans QR    │
        │                    → Opens site/?peer=<ID>    │
        │                    → PeerJS connects sender   │
        │                                               │
        │◄──── 3. PeerJS signaling (SDP/ICE only) ─────►│
        │         (via 0.peerjs.com — no file data)     │
        │                                               │
        │◄══════ 4. WebRTC DataChannel established ════►│
        │              (DTLS encrypted, direct P2P)     │
        │                                               │
        │◄──── 5. JSON metadata message ───────────────►│
        │         { name, size, type }                  │
        │                                               │
        │◄──── 6. Binary chunks (file data) ────────────►│
        │       (~64KB slices, ≤ 25MB total)            │
        │                                               │
        │◄──── 7. JSON hash message ────────────────────│
        │         { sha256: "<hex>" }                   │
        │                                               │
        │  8. Receiver computes SHA-256 of received     │
        │     ArrayBuffer, compares to sender hash      │
        │  → Match: triggers browser file download      │
        │  → Mismatch: shows integrity error            │
```

The PeerJS server is contacted only during steps 1–3 to exchange connection parameters. It never sees the file.

---

## Module Responsibilities

### `index.html`
- Static markup for both modes (receiver view and sender view), hidden by default.
- Loads `style.css`, PeerJS CDN, qrcode-generator CDN, and `app.js`.
- Contains the QR code container, status messages, progress bar, file input, and action buttons.

### `style.css`
- Layout for desktop (receiver) and mobile (sender, min-width 375px).
- Visual states: waiting, connecting, transferring, done, error.
- No external font or icon dependencies.

### `app.js`
Responsibilities (in execution order):

1. **Mode detection** — reads `?peer=` from the URL. Present → sender mode. Absent → receiver mode.
2. **PeerJS initialisation** — creates a `Peer` instance. Receiver uses a random ID; sender targets the receiver's ID.
3. **QR generation** (receiver only) — encodes `<origin>?peer=<id>` as a QR code rendered into an `<img>` data URL.
4. **Connection handling** — receiver listens for `peer.on('connection')`; sender calls `peer.connect(receiverId)`.
5. **Message protocol** — defines the three-message sequence: metadata JSON → file ArrayBuffer → hash JSON.
6. **File reading** (sender) — uses `FileReader.readAsArrayBuffer()` to load the file into memory.
7. **File type & size validation** (sender) — checks MIME type against allowlist and rejects files > 25MB before reading.
8. **Integrity check** (receiver) — calls `crypto.subtle.digest('SHA-256', buffer)`, converts to hex, compares to received hash.
9. **Download trigger** (receiver) — creates a `Blob`, generates an object URL, programmatically clicks a hidden `<a>` element.
10. **Progress reporting** — receiver fires progress events as `data` messages arrive; both sides update a `<progress>` element.
11. **Error handling** — covers: peer-not-found, connection timeout, file type rejection, size rejection, integrity mismatch.
12. **Reset** — "New transfer" button destroys the current `Peer` instance and re-initialises without a page reload.

---

## Message Protocol

All messages are sent over a single PeerJS data connection. The sequence is always:

| Step | Direction | Format | Content |
|---|---|---|---|
| 1 | Sender → Receiver | JSON string | `{ "type": "meta", "name": "file.pdf", "size": 102400, "mime": "application/pdf" }` |
| 2 | Sender → Receiver | ArrayBuffer | Raw file bytes |
| 3 | Sender → Receiver | JSON string | `{ "type": "hash", "sha256": "<64-char hex>" }` |

The receiver distinguishes messages by type: `string` → parse as JSON (meta or hash); `ArrayBuffer` → file data.

---

## Security Model

| Threat | Mitigation |
|---|---|
| File intercepted on network | WebRTC DataChannel uses mandatory DTLS 1.2+ encryption. Nobody on the local network or ISP can read the bytes. |
| File stored on server | PeerJS receives only SDP/ICE metadata (≈ 1KB of connection parameters). File ArrayBuffer never leaves the two browsers. |
| Session persists after use | Peer ID is ephemeral (generated fresh on each page load, never written to `localStorage` or cookies). Closing the tab destroys all state. |
| Wrong file received | SHA-256 hash sent by sender is compared to hash computed by receiver. Mismatch blocks the download and shows an error. |
| MITM on signaling | PeerJS signaling is over HTTPS/WSS. A network attacker cannot inject a fake peer without breaking TLS. |
| Malicious file type | File picker `accept` attribute restricts selectable types. MIME type is also validated in JS before any data is read or sent. |

---

## Constraints & Known Limitations

- **Symmetric NAT**: Connections through some corporate firewalls or carrier-grade NAT may fail. No TURN relay is provided. This is an accepted limitation for v1.0.0 (see backlog).
- **File size**: 25MB maximum. Files above this are rejected before transfer begins. Chunked large-file support is deferred to backlog.
- **Single file per session**: One file per QR scan. A new QR must be generated for each transfer.
- **PeerJS public server availability**: If `0.peerjs.com` is unreachable, signaling fails. Hosting a private PeerJS server is a backlog item.
- **Safari LAN connections**: Safari obfuscates local IPs using mDNS hostnames. Connections rely on STUN-discovered public addresses, which adds latency on local networks.

---

## Open Questions

- None blocking. All decisions resolved.
