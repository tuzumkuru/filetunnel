# Design
## FileTunnel

**Status:** Draft
**Version:** 0.1.0
**Last updated:** 2026-03-28

---

## UI Framework

Vanilla HTML / CSS / JS. No component framework. Two views (receiver, sender) live in the same `index.html` and are toggled by adding/removing a `hidden` attribute. No page navigation occurs.

---

## Application Flow

```
Open site
    │
    ├─ No ?peer= in URL ──► [Receiver View]
    │                           │
    │                           ├─ Connecting to PeerJS...
    │                           ├─ QR code displayed
    │                           ├─ Waiting for sender...
    │                           ├─ Sender connected → Receiving...
    │                           ├─ Transfer complete → Auto-download
    │                           └─ [Error state] → Regenerate QR
    │
    └─ ?peer=<ID> in URL ──► [Sender View]
                                │
                                ├─ Connecting to receiver...
                                ├─ Connected → File picker shown
                                ├─ File selected → Validating...
                                ├─ Sending...
                                ├─ Transfer complete → Done
                                └─ [Error state] → Retry / guidance
```

---

## Layout — Receiver View (Desktop)

The receiver view is designed for a desktop browser at a library terminal. Centered, minimal, easy to read from a standing position.

```
┌─────────────────────────────────────────┐
│                                         │
│           FileTunnel                  │  ← app name, small
│                                         │
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   │         [QR CODE]               │   │  ← large, ~280×280px
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│   Scan with your phone to send a file   │  ← instruction text
│                                         │
│   Or open: https://site.com?peer=xxxx   │  ← fallback URL, copyable
│                                         │
│   ● Waiting for connection...           │  ← status indicator
│                                         │
└─────────────────────────────────────────┘
```

**Receiving state** (replaces QR once sender connects):
```
┌─────────────────────────────────────────┐
│                                         │
│           FileTunnel                  │
│                                         │
│   Receiving: resume.pdf (240 KB)        │  ← file name + size
│                                         │
│   [████████████████░░░░░░░░░░░]  62%   │  ← progress bar
│                                         │
│   ● Receiving...                        │
│                                         │
└─────────────────────────────────────────┘
```

**Done state**:
```
┌─────────────────────────────────────────┐
│                                         │
│           FileTunnel                  │
│                                         │
│   ✓ resume.pdf received successfully    │  ← success message
│   File integrity verified (SHA-256)     │  ← hash confirmation
│                                         │
│         [ New transfer ]                │  ← reset button
│                                         │
└─────────────────────────────────────────┘
```

---

## Layout — Sender View (Mobile)

The sender view is designed for a phone screen (minimum 375px wide). Single-column, large tap targets.

**Connecting state**:
```
┌─────────────────────┐
│                     │
│    FileTunnel     │
│                     │
│  Connecting to      │
│  library computer…  │
│                     │
│  [spinner]          │
│                     │
└─────────────────────┘
```

**Ready state** (connected, awaiting file selection):
```
┌─────────────────────┐
│                     │
│    FileTunnel     │
│                     │
│  ● Connected        │
│                     │
│  ┌───────────────┐  │
│  │  Choose file  │  │  ← large tap target, full width
│  └───────────────┘  │
│                     │
│  PDF, Word, Excel,  │
│  PowerPoint,        │  ← accepted types hint
│  TXT, JPG, PNG      │
│  Max 25 MB          │
│                     │
└─────────────────────┘
```

**Sending state**:
```
┌─────────────────────┐
│                     │
│    FileTunnel     │
│                     │
│  Sending:           │
│  resume.pdf         │
│  240 KB             │
│                     │
│  [████████░░░]  72% │  ← progress bar
│                     │
│  ● Sending...       │
│                     │
└─────────────────────┘
```

**Done state**:
```
┌─────────────────────┐
│                     │
│    FileTunnel     │
│                     │
│  ✓ Sent!            │
│  resume.pdf         │
│  delivered.         │
│                     │
│  [ Send another ]   │
│                     │
└─────────────────────┘
```

---

## Error States

| Trigger | Message shown | Action available |
|---|---|---|
| PeerJS connection fails (receiver) | "Could not connect to signaling service. Check your internet connection." | Regenerate QR (retries) |
| Receiver peer not found (sender) | "Could not reach the library computer. The QR code may have expired — ask for a new one." | — (user must rescan) |
| File type not allowed | "This file type is not supported. Please choose a PDF, Word, Excel, PowerPoint, TXT, JPG, or PNG file." | File picker reopens |
| File too large | "File is too large (max 25 MB). Please choose a smaller file." | File picker reopens |
| Integrity mismatch | "Transfer error: file may be corrupted. Please try again." | New transfer button |
| Connection lost mid-transfer | "Connection lost. Please scan the QR code again to retry." | New transfer button |

---

## Component Inventory

| Component | Element | Views | Notes |
|---|---|---|---|
| App title | `<h1>` | Both | "FileTunnel" |
| QR code canvas | `<canvas>` | Receiver | Rendered by qrcode-generator |
| Fallback URL | `<a>` | Receiver | Full sender URL, opens in new tab |
| Status indicator | `<p class="status">` | Both | Prefixed with colored dot (●) |
| File name + size | `<p class="file-info">` | Both (during transfer) | Shown after meta message received |
| Progress bar | `<progress>` | Both | Native HTML element |
| Progress percent | `<span>` | Both | Next to progress bar |
| File picker button | `<button>` wrapping `<input type="file">` | Sender | `accept` attribute restricts types |
| Accepted types hint | `<p class="hint">` | Sender | Listed below picker button |
| Success message | `<p class="success">` | Both | Shown on completion |
| Error message | `<p class="error">` | Both | Shown on any error |
| New transfer button | `<button>` | Both | Resets state without page reload |
| Spinner | CSS animation on `<div>` | Sender (connecting) | Pure CSS, no image |

---

## Visual States Per View

| State | Receiver shows | Sender shows |
|---|---|---|
| Initialising | Spinner, "Connecting…" | — |
| Ready / waiting | QR code, fallback URL, "Waiting…" | Spinner, "Connecting…" |
| Connected | QR hidden, "Connected — ready to receive" | File picker, type/size hint |
| Transferring | File info, progress bar | File info, progress bar |
| Done | Success message, hash confirmed, New transfer button | "Sent!", Send another button |
| Error | Error message, Regenerate / New transfer button | Error message, guidance |

---

## Color & Typography

| Token | Value | Usage |
|---|---|---|
| Background | `#f9f9f9` | Page background |
| Surface | `#ffffff` | Card / container background |
| Primary | `#2563eb` | Buttons, links, QR border |
| Success | `#16a34a` | ✓ messages, success dot |
| Error | `#dc2626` | Error messages, error dot |
| Waiting | `#d97706` | Waiting / connecting dot |
| Text primary | `#111827` | Headings, body |
| Text secondary | `#6b7280` | Hints, fallback URL |
| Font | System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) | No external font load |
| Border radius | `12px` (card), `8px` (button) | Rounded, approachable feel |

---

## Open Questions

- None blocking. All decisions resolved.
