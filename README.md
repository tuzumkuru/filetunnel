# FileTunnel

**Secure peer-to-peer file transfer via QR code. No server. No login. No trace.**

A library computer (or any computer) shows a QR code. You scan it on your phone, pick a file, and it transfers directly — browser to browser, encrypted end-to-end. Nothing is uploaded to any server.

---

## How it works

1. Open FileTunnel on the receiving computer — a QR code appears
2. Scan the QR code with your phone — the sender view opens in your mobile browser
3. Pick a file — it transfers directly via an encrypted WebRTC channel
4. The file downloads automatically on the receiving computer

The only server contact is a brief signaling handshake (SDP exchange via PeerJS) to establish the connection. File bytes never leave the two browsers.

---

## Features

- **Zero server storage** — file data travels peer-to-peer via WebRTC DataChannel
- **End-to-end encrypted** — DTLS encryption is mandatory in WebRTC; no one on the network can read the transfer
- **Integrity verified** — SHA-256 hash computed before sending and checked on arrival
- **No account or app required** — works in any modern browser; receiver just opens a URL
- **Supported formats** — PDF, Word, Excel, PowerPoint, TXT, Markdown, JPG, PNG (max 25 MB)
- **Live progress** — both sides show a real-time progress bar during transfer
- **Ephemeral sessions** — connection ID is generated fresh each time and discarded on close

---

## Security model

| Concern | How it is handled |
|---|---|
| File confidentiality | WebRTC DTLS — encrypted in transit, unreadable to any relay |
| File integrity | SHA-256 hash sent separately; receiver rejects mismatches |
| Session isolation | Ephemeral PeerJS ID, discarded after session |
| Signaling trust | Only SDP/ICE metadata (no file bytes) touches the PeerJS server |
| Static host compromise | Use SRI hashes on CDN scripts (see v1.0.0 plan) |

---

## Local setup

No build step required — open the files directly.

```bash
git clone https://github.com/tuzumkuru/filetunnel.git
cd filetunnel/src
# open index.html in your browser, or serve with any static server:
npx serve .
```

For real-device testing, serve over HTTPS (required for WebRTC on mobile):

```bash
npx serve . --ssl-cert cert.pem --ssl-key key.pem
```

---

## Deployment

Drop the three files (`index.html`, `style.css`, `app.js`) onto any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.). HTTPS is required for WebRTC to work on mobile browsers.

---

## Known limitations

- **Same-network recommended** — direct P2P works best when both devices are on the same network. Cross-network connections (e.g. phone on 5G, computer on Wi-Fi) may fail without a TURN relay server.
- **Max 25 MB** — large file support with streaming writes is planned for a future release.
- **Keep screen on** — on iOS Safari, locking the screen mid-transfer may drop the connection.

---

## Contributing

Issues and pull requests are welcome. See [docs/plan.md](docs/plan.md) for the current roadmap and [docs/backlog.md](docs/backlog.md) for future ideas.

---

## Support

If FileTunnel saved you from logging into your email on a public computer, consider buying me a coffee:
[buymeacoffee.com/tuzumkuru](https://buymeacoffee.com/tuzumkuru)
