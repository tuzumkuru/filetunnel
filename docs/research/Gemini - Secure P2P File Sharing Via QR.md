# **Architectural Design and Feasibility Analysis of a Serverless Peer-to-Peer File Transfer System via QR-Mediated WebRTC Signaling**

The challenge of transferring data between a public terminal and a private mobile device remains one of the most persistent friction points in modern cybersecurity. Traditional methodologies—ranging from the use of physical USB storage to logging into cloud-based accounts—present significant vectors for credential theft, session hijacking, and malware propagation.1 A physical USB drive, while seemingly convenient, exposes the user to "badUSB" attacks where the device firmware is compromised to emulate a keyboard and execute malicious commands. Conversely, logging into a personal email or cloud storage account on a public computer invites the risk of keyloggers and persistent browser sessions that may remain active after the user departs.1 The requirement for a zero-state, serverless, and browser-to-browser file transfer system arises from these specific vulnerabilities, necessitating a solution where no sensitive data is stored on the intermediary computer and no credentials are exchanged over the network.

## **The WebRTC Framework: Foundation of Peer-to-Peer Communication**

The fundamental technology enabling direct browser-to-browser communication without an intermediary file server is WebRTC (Web Real-Time Communication). While frequently categorized as a media streaming protocol, WebRTC provides a robust set of APIs for the exchange of arbitrary binary data via the RTCDataChannel.3 This data channel operates atop a sophisticated protocol stack that ensures both reliability and security, making it ideal for the ad-hoc transfer of sensitive files in untrusted environments.5

The security architecture of WebRTC is predicated on mandatory encryption. Every data channel is secured using Datagram Transport Layer Security (DTLS), which is a derivative of the TLS protocol used to secure HTTPS connections.3 This ensures that even if the network path is compromised, the file data remains encrypted from the moment it leaves the sender's browser until it is decrypted within the receiver's browser environment.8 Furthermore, the protocol does not utilize a central relay for the data itself; instead, it leverages the Stream Control Transmission Protocol (SCTP) to manage packet delivery, retransmissions, and congestion control directly between the two endpoints.5

## **Comparative Protocol Analysis for Direct Data Exchange**

| Feature | WebSocket | WebRTC Data Channel | HTTP/3 (QUIC) |
| :---- | :---- | :---- | :---- |
| Topology | Client-Server | Peer-to-Peer 9 | Client-Server |
| Encryption | TLS (Optional) | DTLS (Mandatory) 3 | TLS 1.3 |
| Transport | TCP | UDP/SCTP 5 | UDP |
| NAT Traversal | Simple | Complex (ICE/STUN) 11 | Moderate |
| Intermediary | Server-mediated | Direct P2P 12 | Server-mediated |

The architectural implications of choosing WebRTC for a serverless project are profound. Because WebRTC is a peer-to-peer protocol, the primary technical hurdle is not the transfer of data, but the "signaling" phase—the initial handshake where two browsers discover each other's network addresses and cryptographic parameters.11 In a standard implementation, this signaling is handled by a centralized WebSocket server.14 To achieve a truly serverless deployment on platforms like GitHub Pages, the signaling must be moved to an out-of-band channel, such as visual QR codes scanned between device screens.16

## **Signaling Architecture: From WebSockets to Air-Gapped Handshakes**

Signaling is the process by which two peers exchange Session Description Protocol (SDP) blobs and Interactive Connectivity Establishment (ICE) candidates.13 The SDP contains vital information about the peer's capabilities, including supported codecs (though irrelevant for data-only channels) and, more importantly, the DTLS fingerprint used to verify the identity of the certificate.7 ICE candidates are the potential network paths—including local IP addresses, public IP addresses discovered via STUN, and relay addresses from TURN servers—that the browsers will attempt to use to establish a connection.11

In a serverless environment, the absence of a backend necessitates a manual or visual exchange of these SDP blobs. Early experiments in serverless WebRTC involved copying and pasting large blocks of text between browser windows.12 While functional for educational purposes, this method is too cumbersome for the secure sharing of files in a public setting. The use of QR codes streamlines this process, allowing one device to "offer" a connection and the other to "answer" it through a simple camera scan.16

## **The Challenge of SDP Voluminosity**

A significant engineering constraint in QR-based signaling is the size of the SDP message. A standard WebRTC SDP offer is a text-heavy block of approximately 2,500 to 3,000 characters.7 Standard QR codes, while capable of storing up to 2,953 bytes in their highest-density version (Version 40), become increasingly difficult for mobile cameras to parse as the data density grows.16 Lighting conditions, camera resolution, and screen glare frequently prevent the reliable scanning of high-density QR codes.16

To solve this, the signaling payload must be compressed or minified by stripping away all non-essential SDP fields.16 Modern implementations like the QR-WebRTC Bootstrap Protocol (QWBP) achieve a 97% reduction in size by using a binary packing format instead of text.7 By representing IP addresses as raw bytes and ports as 16-bit integers, the entire handshake can be reduced to less than 100 bytes, which fits comfortably within a low-density QR code that scans almost instantaneously.7

## **Signaling Payload Compression Metrics**

| Data Point | Standard Format | Compressed Format | Savings |
| :---- | :---- | :---- | :---- |
| Version / Header | Omitted | Implicit | 100% |
| DTLS Fingerprint | 95-char Hex string | 32-byte Binary | \~66% 16 |
| IPv4 Candidate | 100-char string | 6-byte Binary | \~94% 16 |
| ICE Credentials | 40-char string | Derived via HKDF | 100% 7 |

## **NAT Traversal and Connectivity: The Role of ICE and STUN**

For two browsers to connect directly, they must overcome the barriers imposed by Network Address Translation (NAT) and firewalls.24 Most consumer devices exist behind a router that assigns a private IP address (e.g., 192.168.1.x), which is not reachable from the public internet. WebRTC employs the Interactive Connectivity Establishment (ICE) protocol to find a viable network path.11

The ICE agent performs "candidate gathering" by contacting a STUN (Session Traversal Utilities for NAT) server.24 The STUN server simply "echoes" back the public IP address and port from which the request originated, allowing the browser to identify its own public-facing identity.24 This "Server Reflexive" (srflx) candidate is then included in the signaling offer. Because STUN servers are stateless and do not store data, they can be utilized for free by a serverless application without violating the privacy of the file transfer.14

However, certain network environments—particularly corporate firewalls and some cellular networks—employ "Symmetric NAT," which prevents direct STUN-based hole punching.7 In these scenarios, a TURN (Traversal Using Relays around NAT) server is required to relay the data.11 Unlike STUN, TURN servers are bandwidth-intensive and generally require a paid subscription or private infrastructure.1 For a project hosted on GitHub Pages with no backend, the most feasible approach is to rely on STUN for public-to-mobile transfers and Host candidates for devices on the same local network.1

## **Protocol Engineering: Data Channels and SCTP Internals**

The actual movement of file data occurs over the RTCDataChannel, which abstracts the Stream Control Transmission Protocol (SCTP).5 SCTP provides several features that are critical for file transfer: it is message-oriented (allowing the preservation of data boundaries), it supports multi-homing, and it provides both reliable and unordered delivery options.5

For file transfers, the data channel must be configured for "Reliable and Ordered" delivery.6 This ensures that if a packet is lost due to network congestion, the SCTP layer will automatically handle the retransmission before passing the data to the application layer.5 This reliability is managed using Transmission Sequence Numbers (TSN) and Selective Acknowledgments (SACK), allowing the protocol to recover from packet loss without the overhead of the full TCP state machine.5

## **SCTP Chunk Structure for File Transfers**

| Chunk Type | Purpose | Impact on File Transfer |
| :---- | :---- | :---- |
| DATA | Carries user payload | Contains file chunks 5 |
| INIT | Initiates association | Sets up the P2P connection |
| SACK | Acknowledges received data | Manages flow control and retransmissions 10 |
| HEARTBEAT | Monitors connectivity | Prevents connection timeout |
| FORWARD TSN | Partial reliability | Not typically used for file transfer 5 |

One of the nuances of SCTP in the browser is its message size limit. Although the specification allows for large messages, most browser implementations have historically limited individual send() calls to approximately 64KB or 256KB to prevent blocking the main thread and to manage internal buffer space.18 This necessitates an application-level chunking strategy.

## **File Engineering: Chunking, Buffering, and Backpressure**

To transfer a file of significant size (e.g., several gigabytes) through the browser, the application cannot simply load the entire file into memory as a single Blob or ArrayBuffer.18 Doing so would quickly exceed the browser's memory allocation, causing the tab to crash, particularly on mobile devices with limited RAM.31 Instead, the engineering practice of "streaming" must be applied.

The file is read as a stream or a series of slices using the File API.18 Each slice (typically 64KB) is sent over the data channel. However, the network cannot always keep up with the speed at which the CPU can read the file. If the application continues to call send() without checking the status of the network, the browser's internal outgoing buffer will fill up and eventually fail.31

## **Implementing Backpressure with bufferedAmount**

The most critical engineering practice in P2P file transfer is the management of backpressure.31 The RTCDataChannel object exposes a bufferedAmount property, which indicates the number of bytes currently queued for transmission but not yet sent.18 A sophisticated sender will monitor this value and stop reading from the file once the bufferedAmount exceeds a high-water mark (e.g., 16MB).31 The sender then waits for the bufferedamountlow event before continuing to send the next batch of chunks.31

## **Receiver-Side Reconstruction and Disk Writing**

On the receiving side, the browser receives these chunks as ArrayBuffer objects.31 For smaller files, these chunks can be stored in an array and finally combined into a single Blob for download.31 However, for very large files, this again risks memory exhaustion. The modern solution is to use the File System Access API's FileSystemWritableFileStream.32 This allows the browser to write incoming chunks directly to the user's disk as they arrive, ensuring that the memory footprint remains constant regardless of the file size.32

## **Security and Integrity: Cryptographic Protection in Untrusted Environments**

The security model for a P2P file transfer system must address two distinct threats: the exfiltration of data by a third party (privacy) and the modification of data in transit (integrity).7 WebRTC addresses the former through mandatory DTLS encryption, ensuring that only the peer with the correct private key can decrypt the data.3

However, the signaling phase remains a potential vector for Man-in-the-Middle (MITM) attacks.16 If an attacker can intercept the QR code exchange and substitute their own fingerprint, they could intercept the encrypted stream.16 In a physical environment like a public terminal, the risk is mitigated by the direct visual scanning of the code.7 To provide higher-tier security, the application should implement a Short Authentication String (SAS).

## **Short Authentication String (SAS) Verification**

The SAS is a set of human-readable words or a short numeric code derived from the combined DTLS fingerprints of both peers.7 Once the browsers establish a connection, they display this code. If the user can visually verify that the code on the public computer matches the code on their mobile device, the connection is cryptographically proven to be direct and untampered.16 This technique, pioneered in voice protocols like ZRTP, is a highly effective way to provide out-of-band authentication in serverless systems.16

## **Integrity Verification via Checksumming**

To ensure that the file arrived perfectly intact, a cryptographic hash (e.g., SHA-256) should be calculated during the transfer.33 Because the Web Crypto API's crypto.subtle.digest() does not support streaming input, the hash must be calculated incrementally as chunks are read or received.33 The sender calculates the hash of the original file, and the receiver calculates the hash of the incoming data. Upon completion, the hashes are compared to verify that no bit-rot or tampering occurred.33

| Hashing Method | Memory Usage | Speed | Suitability for Large Files |
| :---- | :---- | :---- | :---- |
| crypto.subtle.digest | High (loads full file) | Fast (HW accelerated) | Poor 33 |
| @noble/hashes (JS) | Low (Chunked) | Moderate | Excellent 33 |
| WebAssembly (WASM) | Low (Chunked) | Fast | Excellent 33 |

## **Tech Stack Selection for Static Hosting on GitHub Pages**

The requirement for no server logic and hosting on GitHub Pages mandates a purely frontend-driven stack.8 GitHub Pages provides a secure HTTPS environment, which is necessary for both WebRTC and the camera access required for QR scanning.24

## **Core Technologies**

1. **WebRTC Management**: While the native RTCPeerConnection API is powerful, it is verbose. Libraries like simple-peer provide a simpler abstraction for handling the offer/answer flow and data channel management.39 However, to implement custom binary signaling like QWBP, direct use of the native API may be necessary to ensure the signaling blobs remain small enough for QR codes.7  
2. **QR Code Generation**: The nayuki/QR-Code-generator library is recommended for its high efficiency and lack of external dependencies.41 It supports encoding raw binary sequences, which is essential for our compressed signaling format.41  
3. **QR Code Scanning**: The jsQR library is a lightweight, pure-JavaScript implementation that can process raw image data from a canvas element.43 It is ideal for serverless environments as it does not require complex binary dependencies.43  
4. **UI Development**: A "Zero-State" UI can be built using minimalist frameworks like Preact or simply Vanilla JS with CSS Grid. The focus should be on a single-page application (SPA) model where the state is reset on every refresh.9

## **The PWA Advantage**

Converting the application into a Progressive Web App (PWA) adds significant value for users in public spaces.1 By utilizing Service Workers, the application can be cached locally. This means that even if the public computer loses internet connectivity after the initial page load, the P2P transfer—which relies on local host candidates or pre-gathered SRFLX candidates—can continue uninterrupted.1

## **Engineering Practice: Handling Cross-Browser Discrepancies**

A robust P2P file transfer system must navigate the varied implementations of WebRTC across browser engines. While Chrome and Firefox have largely converged on the standard, Safari (WebKit) presents unique challenges, particularly on iOS.1

## **mDNS and Host Candidate Obfuscation**

For privacy reasons, modern browsers (especially Safari) often obfuscate local IP addresses using mDNS hostnames (e.g., 7a2b3c-4d5e.local) instead of raw IPv4 addresses.16 While this protects the user's local network topology from malicious websites, it can complicate P2P connections if the receiving device cannot resolve mDNS names. The application must be designed to gracefully fall back to STUN-based public IPs or prompt the user for "Local Network" permissions where applicable.7

## **Maximum Message Size Negotiation**

Different browsers have different limits on the maximum size of an SCTP message. During the signaling phase, browsers exchange the max-message-size attribute.3 If this attribute is absent, the protocol defaults to 64KB.3 A well-engineered application will read this value from the remote peer's SDP and adjust its chunking size dynamically to maximize throughput while avoiding packet drops.3

## **Implementation Logic: The "QR Tango" Handshake**

The user experience for establishing a connection should be frictionless. The following sequence describes the technical steps behind the visual handshake:

1. **Initialization**: The public terminal opens the website and immediately generates a self-signed DTLS certificate.7 It gathers its local IP addresses and contacts a public STUN server for its public identity.11  
2. **Offer Generation**: The terminal compresses this information into a 60-byte QWBP offer and displays it as a QR code.7  
3. **Scan and Answer**: The user scans the QR code with their phone. The phone's browser parses the offer, generates its own DTLS certificate and candidates, and displays a "Response" QR code.16  
4. **Connection**: The terminal's camera (active during this period) scans the phone's response. Both browsers now have each other's network addresses and fingerprints.16  
5. **ICE Negotiation**: The browsers start "ICE connectivity checks," sending STUN packets to each other's candidates to see which path is open.11 Once a path is confirmed, the DTLS handshake occurs, and the data channel opens.3

This bidirectional scan—the "QR Tango"—ensures that no third party can facilitate the connection, as the physical presence of both devices is required to complete the loop.16

## **Feasibility Conclusion: Serverless Ad-Hoc Transfers**

Research into current WebRTC implementations and binary signaling protocols confirms that a fully serverless, QR-mediated file transfer system is not only feasible but represents the state-of-the-art for secure ad-hoc sharing.7 By hosting the static assets on GitHub Pages and leveraging public STUN infrastructure, developers can provide a high-security utility that requires zero infrastructure maintenance.8

The primary engineering burden lies in the reliable management of large file streams within the constraints of the browser's memory and the SCTP protocol's windowing mechanisms.31 By adhering to practices such as chunked reading, backpressure monitoring via bufferedAmount, and utilizing modern APIs like the File System Access API for direct disk I/O, developers can build an application that rivals native transfer tools in both speed and reliability.31 The resulting system provides a critical security bridge, allowing users to move data safely without ever compromising their digital identity on untrusted hardware.

#### **Works cited**

1. Airdrop vs Snapdrop: Real Cross-Platform Efficiency \- LifeTips \- Alibaba.com, accessed March 27, 2026, [https://lifetips.alibaba.com/tech-efficiency/airdrop-vs-snapdrop-real-cross-platform-efficiency](https://lifetips.alibaba.com/tech-efficiency/airdrop-vs-snapdrop-real-cross-platform-efficiency)  
2. I build an open source no login file sharing platform : r/SideProject \- Reddit, accessed March 27, 2026, [https://www.reddit.com/r/SideProject/comments/1hzgbjh/i\_build\_an\_open\_source\_no\_login\_file\_sharing/](https://www.reddit.com/r/SideProject/comments/1hzgbjh/i_build_an_open_source_no_login_file_sharing/)  
3. Using WebRTC data channels \- Web APIs | MDN, accessed March 27, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/WebRTC\_API/Using\_data\_channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)  
4. RTCDataChannel WebRTC Tutorial \- GetStream.io, accessed March 27, 2026, [https://getstream.io/resources/projects/webrtc/basics/rtcdatachannel/](https://getstream.io/resources/projects/webrtc/basics/rtcdatachannel/)  
5. Data Communication | WebRTC for the Curious, accessed March 27, 2026, [https://webrtcforthecurious.com/docs/07-data-communication/](https://webrtcforthecurious.com/docs/07-data-communication/)  
6. Gaming with the WebRTC DataChannel – A Walkthrough with Arin Sime, accessed March 27, 2026, [https://webrtchacks.com/datachannel-multiplayer-game/](https://webrtchacks.com/datachannel-multiplayer-game/)  
7. GitHub \- magarcia/qwbp: Serverless WebRTC signaling via QR codes, accessed March 27, 2026, [https://github.com/magarcia/qwbp](https://github.com/magarcia/qwbp)  
8. perguth/peertransfer: :package: • Send a file p2p and e2e encrypted in your browser using WebRTC. \- GitHub, accessed March 27, 2026, [https://github.com/perguth/peertransfer](https://github.com/perguth/peertransfer)  
9. snapdrop/docs/faq.md at master \- GitHub, accessed March 27, 2026, [https://github.com/SnapDrop/snapdrop/blob/master/docs/faq.md](https://github.com/SnapDrop/snapdrop/blob/master/docs/faq.md)  
10. SCTP (rfc4960) : Underlying Protocol of WebRTC DataChannel \- YoshiTech Blog, accessed March 27, 2026, [https://yoshihisaonoue.wordpress.com/2018/10/30/sctp-underlying-protocol-of-webrtc-datachannel/](https://yoshihisaonoue.wordpress.com/2018/10/30/sctp-underlying-protocol-of-webrtc-datachannel/)  
11. WebRTC Signaling Server: How it Works?, accessed March 27, 2026, [https://antmedia.io/webrtc-signaling-servers-everything-you-need-to-know/](https://antmedia.io/webrtc-signaling-servers-everything-you-need-to-know/)  
12. nishant-kumarr/WAN\_P2P: A P2P file sharing system utilizing WebRTC for seamless global file transfers. \- GitHub, accessed March 27, 2026, [https://github.com/nishant-kumarr/WAN\_P2P](https://github.com/nishant-kumarr/WAN_P2P)  
13. WebRTC 102: \#4 Understanding SDP Internals \- Dyte, accessed March 27, 2026, [https://dyte.io/blog/webrtc-sdp-internals/](https://dyte.io/blog/webrtc-sdp-internals/)  
14. How to Build SnapDrop WebRTC App with JavaScript? \- VideoSDK, accessed March 27, 2026, [https://www.videosdk.live/developer-hub/media-server/snapdrop-webrtc](https://www.videosdk.live/developer-hub/media-server/snapdrop-webrtc)  
15. Signaling Server for WebRTC \- GetStream.io, accessed March 27, 2026, [https://getstream.io/resources/projects/webrtc/basics/signaling-server/](https://getstream.io/resources/projects/webrtc/basics/signaling-server/)  
16. Breaking the QR Limit: The Discovery of a Serverless WebRTC Protocol \- magarcia, accessed March 27, 2026, [https://magarcia.io/air-gapped-webrtc-breaking-the-qr-limit/](https://magarcia.io/air-gapped-webrtc-breaking-the-qr-limit/)  
17. Signaling | WebRTC for the Curious, accessed March 27, 2026, [https://webrtcforthecurious.com/docs/02-signaling/](https://webrtcforthecurious.com/docs/02-signaling/)  
18. Send data between browsers with WebRTC data channels | Articles \- web.dev, accessed March 27, 2026, [https://web.dev/articles/webrtc-datachannels](https://web.dev/articles/webrtc-datachannels)  
19. svarunan/serverless-webrtc: webrtc p2p without signalling server \- GitHub, accessed March 27, 2026, [https://github.com/svarunan/serverless-webrtc](https://github.com/svarunan/serverless-webrtc)  
20. A complete example for a WebRTC datachannel with manual signaling \- Stack Overflow, accessed March 27, 2026, [https://stackoverflow.com/questions/54980799/a-complete-example-for-a-webrtc-datachannel-with-manual-signaling](https://stackoverflow.com/questions/54980799/a-complete-example-for-a-webrtc-datachannel-with-manual-signaling)  
21. Serverless WebRTC using QR codes \- Franklin Ta, accessed March 27, 2026, [https://franklinta.com/2014/10/19/serverless-webrtc-using-qr-codes/](https://franklinta.com/2014/10/19/serverless-webrtc-using-qr-codes/)  
22. Air-gapped WebRTC: How I compressed the signaling handshake from 2.5KB to 60 bytes for QR codes \- Reddit, accessed March 27, 2026, [https://www.reddit.com/r/WebRTC/comments/1qlk942/airgapped\_webrtc\_how\_i\_compressed\_the\_signaling/](https://www.reddit.com/r/WebRTC/comments/1qlk942/airgapped_webrtc_how_i_compressed_the_signaling/)  
23. The Minimum Viable SDP \- webrtcHacks, accessed March 27, 2026, [https://webrtchacks.com/the-minimum-viable-sdp/](https://webrtchacks.com/the-minimum-viable-sdp/)  
24. STUN Server Free: Unlocking NAT Traversal for WebRTC, VoIP, and P2P (2025 Guide), accessed March 27, 2026, [https://www.videosdk.live/developer-hub/stun-turn-server/stun-server-free](https://www.videosdk.live/developer-hub/stun-turn-server/stun-server-free)  
25. List of WebRTC ICE Servers \- Metered, accessed March 27, 2026, [https://www.metered.ca/blog/list-of-webrtc-ice-servers/](https://www.metered.ca/blog/list-of-webrtc-ice-servers/)  
26. GitHub \- createunique/SIMPLE\_FILE\_SHARING\_WAN: A P2P file sharing system utilizing WebRTC for seamless global file transfers. Live at below link., accessed March 27, 2026, [https://github.com/createunique/SIMPLE\_FILE\_SHARING\_WAN](https://github.com/createunique/SIMPLE_FILE_SHARING_WAN)  
27. Stuntman \- open source STUN server, accessed March 27, 2026, [https://www.stunprotocol.org/](https://www.stunprotocol.org/)  
28. Creating a Peer to Peer File Transfer Tool. (As a learning project) \- Reddit, accessed March 27, 2026, [https://www.reddit.com/r/developersIndia/comments/1idm413/creating\_a\_peer\_to\_peer\_file\_transfer\_tool\_as\_a/](https://www.reddit.com/r/developersIndia/comments/1idm413/creating_a_peer_to_peer_file_transfer_tool_as_a/)  
29. Real-time object detection with WebRTC and YOLO | Modal Docs, accessed March 27, 2026, [https://modal.com/docs/examples/webrtc\_yolo](https://modal.com/docs/examples/webrtc_yolo)  
30. accessed March 27, 2026, [https://www.fullstack.com/labs/resources/blog/creating-a-simple-file-transfer-webrtc-react-web-application\#:\~:text=Files%20are%20sent%20using%20RTCDataChannel,can%20reassemble%20the%20file%20correctly.](https://www.fullstack.com/labs/resources/blog/creating-a-simple-file-transfer-webrtc-react-web-application#:~:text=Files%20are%20sent%20using%20RTCDataChannel,can%20reassemble%20the%20file%20correctly.)  
31. Creating a Simple File-Transfer WebRTC React Web Application \- FullStack Labs, accessed March 27, 2026, [https://www.fullstack.com/labs/resources/blog/creating-a-simple-file-transfer-webrtc-react-web-application](https://www.fullstack.com/labs/resources/blog/creating-a-simple-file-transfer-webrtc-react-web-application)  
32. Sending more than 2GB files with P2P WebRTC | by Lorenzo Repenning | Medium, accessed March 27, 2026, [https://medium.com/@hotrockxonotic/sending-more-than-2gb-with-p2p-webrtc-22032a86b783](https://medium.com/@hotrockxonotic/sending-more-than-2gb-with-p2p-webrtc-22032a86b783)  
33. Downloading large files with integrity checks in Javascript | by Adeel Khan \- Medium, accessed March 27, 2026, [https://adeelbarki.medium.com/downloading-large-files-with-integrity-checks-in-javascript-a9acb1b45298](https://adeelbarki.medium.com/downloading-large-files-with-integrity-checks-in-javascript-a9acb1b45298)  
34. Performance Evaluation of WebRTC Data Channels \- Tuhat, accessed March 27, 2026, [https://tuhat.helsinki.fi/ws/portalfiles/portal/167373638/Eskola\_webrtc.pdf](https://tuhat.helsinki.fi/ws/portalfiles/portal/167373638/Eskola_webrtc.pdf)  
35. A practical guide to building a secure peer-to-peer file sharing application with fairly modern C\#… \- Medium, accessed March 27, 2026, [https://medium.com/@jonschdev/a-practical-guide-to-building-a-secure-peer-to-peer-file-sharing-application-with-fairly-modern-c-5435a0370c88](https://medium.com/@jonschdev/a-practical-guide-to-building-a-secure-peer-to-peer-file-sharing-application-with-fairly-modern-c-5435a0370c88)  
36. SubtleCrypto: digest() method \- Web APIs | MDN, accessed March 27, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)  
37. Fast-Hash in JavaScript in Browser | Hashing and Validation in Multiple Programming Languages \- SSOJet, accessed March 27, 2026, [https://ssojet.com/hashing/fast-hash-in-javascript-in-browser](https://ssojet.com/hashing/fast-hash-in-javascript-in-browser)  
38. Verifying integrity of large files \- Cryptography Stack Exchange, accessed March 27, 2026, [https://crypto.stackexchange.com/questions/55602/verifying-integrity-of-large-files](https://crypto.stackexchange.com/questions/55602/verifying-integrity-of-large-files)  
39. nuzulul/awesome-webrtc \- GitHub, accessed March 27, 2026, [https://github.com/nuzulul/awesome-webrtc](https://github.com/nuzulul/awesome-webrtc)  
40. GitHub \- mebjas/html5-qrcode: A cross platform HTML5 QR code reader. See end to end implementation at: https://scanapp.org, accessed March 27, 2026, [https://github.com/mebjas/html5-qrcode](https://github.com/mebjas/html5-qrcode)  
41. QR Code generator library \- Project Nayuki, accessed March 27, 2026, [https://www.nayuki.io/page/qr-code-generator-library](https://www.nayuki.io/page/qr-code-generator-library)  
42. QR Code generator library \- GitHub, accessed March 27, 2026, [https://github.com/nayuki/QR-Code-generator](https://github.com/nayuki/QR-Code-generator)  
43. cozmo/jsQR: A pure javascript QR code reading library ... \- GitHub, accessed March 27, 2026, [https://github.com/cozmo/jsQR](https://github.com/cozmo/jsQR)  
44. Popular JavaScript Barcode Scanners: Open-Source Edition \- Scanbot SDK, accessed March 27, 2026, [https://scanbot.io/blog/popular-open-source-javascript-barcode-scanners/](https://scanbot.io/blog/popular-open-source-javascript-barcode-scanners/)