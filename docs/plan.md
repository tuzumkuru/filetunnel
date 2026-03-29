# Release Plan
## FileTunnel

**Status:** Released
**Current version:** 1.0.0
**Target release:** 1.0.0
**Last updated:** 2026-03-28

Progress markers: `[ ]` not started · `[-]` in progress · `[x]` done · `[!]` blocked · `[~]` skipped

See [.sldc-framework/plan_guide.md](../.sldc-framework/plan_guide.md) for the full development loop and rules.
See [docs/backlog.md](backlog.md) for unscheduled items.

---

## Pre-implementation Checklist

- [x] docs/prd.md — agreed and finalised
- [x] docs/architecture.md — agreed and finalised
- [x] docs/design.md — agreed and finalised

---

## Version History

| Version | Milestone | Date |
|---------|-----------|------|
| — | — | — |

---

## Completed Work

<!-- Move version sections here as brief paragraphs when done. -->

---

## v0.1.0 — Project Skeleton
**Goal:** Bare HTML/CSS/JS files in place, CDN libraries loading, app opens in browser without errors.

### Tasks
- [x] Create `index.html` with both view containers (receiver, sender), hidden by default
- [x] Create `style.css` with base layout, typography, color tokens
- [x] Create `app.js` with mode detection only (`?peer=` check → show correct view)
- [x] Add PeerJS CDN script tag and confirm it loads without console errors
- [x] Add qrcode-generator CDN script tag and confirm it loads
- [x] chore: bump version to 0.1.0

**Success criteria:** Opening `index.html` in a browser shows the receiver view (QR placeholder) with no console errors. Opening `index.html?peer=test` shows the sender view.

---

## v0.2.0 — Receiver: QR Code & Signaling
**Goal:** Receiver connects to PeerJS, gets a peer ID, and renders a working QR code.

### Tasks
- [x] Initialise `Peer` on receiver side and handle `peer.on('open')`
- [x] On peer ID received, build the full sender URL (`<origin>?peer=<id>`)
- [x] Render the URL as a QR code onto the `<canvas>` element
- [x] Display the fallback URL as a clickable link below the QR code
- [x] Show "Waiting for connection…" status
- [x] Handle PeerJS connection error → show error message + regenerate button
- [x] chore: bump version to 0.2.0

**Success criteria:** Opening the page shows a scannable QR code. Scanning it with a phone opens the correct sender URL. PeerJS error is handled gracefully.

---

## v0.3.0 — Sender: Connect & File Picker
**Goal:** Sender connects to the receiver peer and shows the validated file picker.

### Tasks
- [x] Initialise `Peer` on sender side and call `peer.connect(receiverId)`
- [x] Handle connection open → show file picker, hide spinner
- [x] Handle peer-not-found / connection error → show error message
- [x] Render file picker button with `accept` attribute (PDF, Word, Excel, PowerPoint, TXT, JPG, PNG)
- [x] On file selected: validate MIME type against allowlist → reject with error if invalid
- [x] On file selected: validate size ≤ 25MB → reject with error if too large
- [x] Show accepted file types and size limit as hint text below picker
- [x] chore: bump version to 0.3.0

**Success criteria:** Sender connects to a waiting receiver. File picker only accepts allowed types. Selecting a disallowed type or oversized file shows the correct error without crashing.

---

## v0.4.0 — File Transfer
**Goal:** A valid file selected on the sender is transferred to the receiver and downloaded automatically.

### Tasks
- [x] Sender: read selected file as `ArrayBuffer` via `FileReader.readAsArrayBuffer()`
- [x] Sender: send metadata JSON message `{ type: "meta", name, size, mime }`
- [x] Sender: send file `ArrayBuffer` over the data channel
- [x] Sender: compute SHA-256 via `crypto.subtle.digest` and send hash JSON `{ type: "hash", sha256 }`
- [x] Receiver: handle incoming `data` events — route by type (string → JSON, ArrayBuffer → file data)
- [x] Receiver: on meta message → display file name and size
- [x] Receiver: accumulate `ArrayBuffer` chunks into array
- [x] Receiver: on hash message → assemble full buffer, compute SHA-256, compare hashes
- [x] Receiver: on hash match → create `Blob`, trigger auto-download via hidden `<a>` click
- [x] Receiver: on hash mismatch → show integrity error, suppress download
- [x] chore: bump version to 0.4.0

**Success criteria:** Selecting a valid file on the sender results in an automatic download on the receiver. SHA-256 of the downloaded file matches the original. Tested with PDF, DOCX, and JPG.

---

## v0.5.0 — Progress & Polish
**Goal:** Both sides show live transfer progress. All visual states match the design doc. App is usable on a real phone.

### Tasks
- [x] Receiver: track bytes received vs total (from meta); update `<progress>` and percent label
- [x] Sender: track bytes sent vs total; update `<progress>` and percent label
- [x] Implement all visual states per design.md: initialising, waiting, connected, transferring, done, error
- [x] Style all states with correct colors (success green, error red, waiting amber)
- [x] Implement "New transfer" / "Send another" button — destroys Peer, re-initialises without page reload
- [x] Verify sender view is fully usable at 375px width (no horizontal scroll, large tap targets)
- [x] Test on real devices: Chrome/Firefox desktop (receiver) + iOS Safari and Android Chrome (sender)
- [x] chore: bump version to 0.5.0

**Success criteria:** Progress bar updates smoothly during transfer. All error and success states display correctly. Full end-to-end transfer works on a real phone scanning a real QR code.

---

## v0.6.0 — Rename & Branding
**Goal:** Rename the project to FileTunnel and apply visual identity throughout.

### Tasks
- [x] Rename all "QR File Drop" references to "FileTunnel" (page title, meta tags, app.js header, docs)
- [x] Apply FileTunnel color scheme and visual identity to style.css
- [x] Add favicon
- [x] chore: bump version to 0.6.0

**Success criteria:** App displays as "FileTunnel" in the browser tab and UI. Visual identity applied consistently across all pages and docs.

---

## v0.6.1 — About & Links
**Goal:** Add security messaging, about content, and useful links.

### Tasks
- [x] Add security blurb to receiver view: one-liner explaining direct encrypted transfer, with "Learn more" link
- [x] Add About page or modal: what FileTunnel is, how WebRTC P2P works, why it is secure
- [x] Add GitHub repository link (footer or header)
- [x] Add sponsor link — https://buymeacoffee.com/tuzumkuru (footer or about page)
- [x] Write modern README: badges, feature list, how it works, local setup, contribution guide
- [x] chore: bump version to 0.6.1

**Success criteria:** Users understand what the app does and why it is safe without leaving the page. README ready for public release.

---

## v0.6.2 — Glitch Fixes
**Goal:** Fix known UX glitches before release.

### Tasks
- [x] Fix QR broken-image flash — hide `<img id="qr-img">` until QR is ready, show placeholder/spinner instead
- [x] Fix sender progress granularity — update in ~1% increments to match receiver
- [x] Implement heartbeat/ping — detect stale "Connected" state when either peer disappears, reset to waiting within ~5 seconds
- [x] chore: bump version to 0.6.2

**Success criteria:** No broken-image flash on load. Sender and receiver progress bars update at similar granularity. Stale connection detected and reset within ~5 seconds.

---

## v1.0.0 — Release
**Goal:** Production-ready. Deployed to static hosting. All acceptance criteria from prd.md met.

### Tasks
- [ ] Final review of all FRs and NFRs in prd.md — confirm each is met
- [ ] Verify no file data appears in browser DevTools Network tab during transfer
- [ ] Verify page works correctly when served over HTTPS (not just `file://`)
- [x] Add `<meta>` tags: viewport, description, charset
- [ ] Add SRI hashes to CDN script tags (PeerJS, qrcode-generator) — `integrity` + `crossorigin` attributes
- [ ] Add `.github/workflows/deploy.yml` — copies `src/` to `gh-pages` branch on push to `main`
- [ ] Configure custom domain: filetunnel.app (CNAME file + GitHub Pages settings)
- [ ] chore: bump version to 1.0.0

### Release Criteria
- [ ] End-to-end transfer works on Chrome/Firefox desktop + iOS Safari + Android Chrome
- [ ] File integrity check passes for PDF, DOCX, XLSX, JPG
- [ ] All error states handled (bad type, oversized, connection lost, integrity fail)
- [ ] Zero file bytes transmitted to any server (verified via DevTools)
- [ ] Deployable by dropping three files onto any static host

**Success criteria:** A user with no technical knowledge can scan the QR, pick a file, and have it download on the other device within 30 seconds.

---

## Backlog

See [docs/backlog.md](backlog.md) for post-release items (large file support, TURN, multi-file, PWA, QWBP).
