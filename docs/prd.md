# Product Requirements Document (PRD)
## QR File Drop

**Status:** Draft
**Version:** 0.1.0
**Last updated:** 2026-03-28

---

## Overview & Goals

Using a public computer (e.g. a library printing station) to access a personal file is a significant security risk. The conventional approach — logging into an email or cloud storage account — exposes credentials to keyloggers, leaves active browser sessions behind, and stores files on third-party servers. Physical USB drives introduce "badUSB" risks. Neither option is acceptable for a security-conscious user.

QR File Drop solves this by enabling a direct, browser-to-browser file transfer triggered by a QR code scan. The library computer displays a QR code; the user scans it on their phone; the file travels directly from the phone to the library computer via an encrypted peer-to-peer channel. No credentials are entered on the public computer, no file data touches any server, and no session persists after the transfer.

Success for this version means: a user can scan a QR code, select a file, and have it available for download on the library computer in under 30 seconds — without installing any app, creating any account, or touching a server.

---

## Target Users

**Primary user — the file sender (phone user):** Any person who needs to transfer a file to a public computer. No technical knowledge required. Uses a modern smartphone (iOS/Android) with a browser and camera. Network: mobile data or public Wi-Fi.

**Secondary user — the file receiver (library/public computer):** The same person, acting as the operator of the public terminal. Opens the website in a modern desktop browser (Chrome, Firefox, Edge). No login, no configuration.

Both roles are played by the same individual in a single session.

---

## Feature Summary

| Feature | Priority | Description |
|---|---|---|
| Receiver mode | MUST | Public computer shows a QR code encoding a one-time peer connection URL |
| Sender mode | MUST | Phone browser opens the URL, shows a file picker and sends the file P2P |
| P2P file transfer | MUST | File data travels directly between browsers via WebRTC DataChannel — DTLS encrypted |
| No server for file data | MUST | File bytes never leave the two browsers |
| Document types only | MUST | File picker restricted to PDF, Word, Excel, PowerPoint, TXT, JPG, PNG |
| File size limit | MUST | Maximum 25MB per transfer |
| Transfer progress | MUST | Both sides show a live progress bar during transfer |
| Auto-download on receiver | MUST | Received file triggers a browser download automatically |
| SHA-256 integrity check | MUST | Sender and receiver compare hashes; mismatch shown as an error |
| SAS verification | SHOULD | 4-digit Short Authentication String shown on both devices to confirm no MITM |
| Mobile-friendly UI | MUST | Sender page usable on a small phone screen without zooming |
| Static file deployment | MUST | Deployable to any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.) with no build step |
| Multi-file transfer | COULD | Queue and send multiple files in one session |
| PWA / offline cache | COULD | Service Worker caches the app for use after first load |

---

## User Stories

### Receiver (Library Computer)

- As a library user, I want to open the website and immediately see a QR code so that I can invite my phone to send a file without typing anything.
- As a library user, I want the received file to download automatically so that I can print it right away.
- As a library user, I want to see a progress bar so that I know the transfer is still running.
- As a library user, I want to see a "transfer complete" state so that I know it is safe to close the browser.

### Sender (Phone)

- As a phone user, I want to scan a QR code and land on a simple upload page so that I don't need to type a URL.
- As a phone user, I want to pick a document file from my phone so that I can transfer it to print or use on the public computer.
- As a phone user, I want to see a progress bar so that I know when the transfer is done.
- As a phone user, I want confirmation that the file arrived intact so that I trust the result.

### Security

- As a user, I want the file to travel encrypted so that no one on the library network can intercept it.
- As a user, I want the connection to be one-time and ephemeral so that nothing persists on the public computer after I leave.
- As a user, I want an optional Short Authentication String so that I can verify I'm connected directly to the right computer.

---

## Functional Requirements

### FR-1: Receiver Mode
- [MUST] FR-1.1: When the site is opened with no peer ID in the URL, it enters receiver mode automatically.
- [MUST] FR-1.2: The receiver generates a new ephemeral peer ID on each page load.
- [MUST] FR-1.3: The receiver displays a QR code encoding the full sender URL (`<site>?peer=<ID>`).
- [MUST] FR-1.4: The receiver displays the sender URL as clickable text below the QR code as a fallback.
- [MUST] FR-1.5: The receiver shows a "waiting for connection" status until a sender connects.
- [MUST] FR-1.6: When a file transfer completes, the receiver triggers a browser file download automatically.
- [MUST] FR-1.7: The receiver shows a live progress bar (bytes received / total bytes) during transfer.
- [SHOULD] FR-1.8: The receiver displays a 4-digit SAS code once the data channel opens, for the user to compare with the sender's screen.

### FR-2: Sender Mode
- [MUST] FR-2.1: When the site is opened with `?peer=<ID>` in the URL, it enters sender mode automatically.
- [MUST] FR-2.2: The sender connects to the receiver's peer ID via PeerJS.
- [MUST] FR-2.3: The sender shows a file picker restricted to: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), plain text (.txt), and images (.jpg/.jpeg/.png).
- [MUST] FR-2.4: The sender rejects files larger than 25MB and shows a clear error message before attempting to send.
- [MUST] FR-2.5: After the user selects a valid file, the transfer starts automatically.
- [MUST] FR-2.6: The sender shows a live progress bar (bytes sent / total bytes).
- [MUST] FR-2.7: The sender sends file metadata (name, size, MIME type) before the file data.
- [MUST] FR-2.8: The sender computes SHA-256 of the file and sends the hash after the file data.
- [SHOULD] FR-2.9: The sender displays a 4-digit SAS code for the user to compare with the receiver's screen.

### FR-3: File Transfer Engine
- [MUST] FR-3.1: File data is transferred via WebRTC RTCDataChannel in binary mode. All data is DTLS-encrypted in transit — no party on the network can read the file contents.
- [MUST] FR-3.2: The sender reads the entire file as an `ArrayBuffer` and sends it as a single message.
- [MUST] FR-3.3: The receiver accumulates the incoming `ArrayBuffer` and computes its SHA-256 hash on receipt.
- [MUST] FR-3.4: On transfer complete, the receiver compares the received hash to the sender's hash and displays success or an integrity error.

### FR-4: Connection & Signaling
- [MUST] FR-4.1: Signaling uses the PeerJS public server (`0.peerjs.com`). Only SDP/ICE metadata passes through it; no file data.
- [MUST] FR-4.2: ICE candidate gathering uses Google's public STUN servers (`stun.l.google.com:19302`).
- [MUST] FR-4.3: The data channel is configured as reliable and ordered.
- [MUST] FR-4.4: On connection failure or peer-not-found, the receiver shows a clear error and a "Regenerate QR" button.
- [MUST] FR-4.5: Peer IDs are ephemeral — not stored in `localStorage` or cookies.

### FR-5: UI / UX
- [MUST] FR-5.1: The entire application is a single HTML file with no server-side rendering.
- [MUST] FR-5.2: The sender page is fully usable on a 375px-wide mobile screen without horizontal scrolling.
- [MUST] FR-5.3: All states (waiting, connecting, transferring, done, error) are visually distinct.
- [MUST] FR-5.4: A "New transfer" button resets both modes to their initial state without a full page reload.

---

## Non-Functional Requirements

### NFR-1: Performance
- [MUST] NFR-1.1: Transfer throughput must not be artificially throttled beyond browser and network limits.
- [MUST] NFR-1.2: The UI must remain responsive (non-blocking) during transfer; file I/O must not freeze the main thread.
- [SHOULD] NFR-1.3: Initial page load (all assets) completes in under 3 seconds on a 10 Mbps connection.

### NFR-2: Security
- [MUST] NFR-2.1: All WebRTC data channels use mandatory DTLS encryption.
- [MUST] NFR-2.2: No file data is sent to any server at any time.
- [MUST] NFR-2.3: Peer IDs are not reused across sessions.
- [SHOULD] NFR-2.4: The SAS is derived from the DTLS fingerprints of both peers, making MITM injection detectable.

### NFR-3: Compatibility
- [MUST] NFR-3.1: Functions on latest versions of Chrome, Firefox, and Edge (desktop).
- [MUST] NFR-3.2: Sender mode functions on iOS Safari 16+ and Android Chrome 110+.
- [SHOULD] NFR-3.3: Handles Safari's mDNS candidate obfuscation gracefully by falling back to STUN candidates.

### NFR-4: Deployment
- [MUST] NFR-4.1: Deploys to any static file host (GitHub Pages, Netlify, Cloudflare Pages, or a plain web server) with no build step and no backend.
- [MUST] NFR-4.2: All third-party libraries loaded from CDN; no npm/bundler required for deployment.
- [MUST] NFR-4.3: The application must be served over HTTPS (required for WebRTC and camera access).

### NFR-5: Maintainability
- [MUST] NFR-5.1: Code follows conventions in `.sldc-framework/conventions/`.
- [MUST] NFR-5.2: No framework dependencies beyond PeerJS, a QR library, and `@noble/hashes`.

---

## Out of Scope

- User accounts, authentication, or login of any kind.
- Server-side file storage or relay (beyond PeerJS signaling metadata).
- Non-document file types (videos, executables, archives, etc.).
- Files larger than 25MB — deferred to backlog with chunked transfer support.
- Multi-file transfers (deferred to backlog).
- Folder transfers.
- File preview before download.
- Transfer history or logging.
- Mobile app (native iOS/Android).
- QWBP/air-gapped signaling (two QR scan approach) — requires library camera; deferred to backlog.
- TURN server support — symmetric NAT environments will fail to connect; this is an accepted limitation for v1.0.0.

---

## Backlog

- **Large file support (>25MB)**: Chunked transfer with `bufferedAmount` backpressure and File System Access API for streaming writes to disk.
- **QWBP signaling**: Fully serverless "QR Tango" using compressed binary SDP — eliminates PeerJS dependency but requires library camera.
- **Multi-file transfer**: Queue multiple files and send them in sequence.
- **PWA / Service Worker**: Cache assets for offline use after first load.
- **TURN server support**: Allow connection through symmetric NAT / corporate firewalls.
- **Drag-and-drop**: Accept files via drag-and-drop on the sender page.
- **Transfer speed indicator**: Show current throughput (MB/s) during transfer.

---

## Open Questions

- None blocking. All decisions resolved.
