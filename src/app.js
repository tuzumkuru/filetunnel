// QR File Drop — v0.5.0

(function () {
  'use strict';

  var MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
  var CHUNK_SIZE    = 65536;            // 64 KB

  var ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'image/jpeg',
    'image/png'
  ];

  var ALLOWED_EXTENSIONS = ['md'];

  function isAllowedFile(file) {
    if (ALLOWED_MIME_TYPES.includes(file.type)) return true;
    var ext = file.name.split('.').pop().toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  }

  // ── Mode detection ─────────────────────────────────────────────────
  var params   = new URLSearchParams(window.location.search);
  var peerId   = params.get('peer');
  var isSender = peerId !== null;

  if (isSender) {
    document.getElementById('view-sender').removeAttribute('hidden');
    initSender(peerId);
  } else {
    document.getElementById('view-receiver').removeAttribute('hidden');
    initReceiver();
  }

  // ── Receiver ────────────────────────────────────────────────────────
  function initReceiver() {
    var peer          = new Peer();
    var activeConn    = null;
    var meta          = null;
    var chunks        = [];
    var bytesReceived = 0;

    peer.on('open', function (id) {
      var url = window.location.origin
              + window.location.pathname
              + '?peer=' + encodeURIComponent(id);
      renderQR(url);
      var fallbackEl = document.getElementById('fallback-url');
      fallbackEl.href        = url;
      fallbackEl.textContent = url;
      setReceiverStatus('Waiting for connection…', 'waiting');
    });

    peer.on('disconnected', function () {
      if (activeConn === null && !peer.destroyed) {
        peer.reconnect();
      }
    });

    peer.on('error', function () {
      showReceiverError('Could not connect to signaling service. Check your internet connection.');
    });

    peer.on('connection', function (conn) {
      activeConn = conn;

      conn.on('open', function () {
        setReceiverStatus('Connected — ready to receive', 'success');
        conn.peerConnection.oniceconnectionstatechange = function () {
          var state = conn.peerConnection.iceConnectionState;
          if ((state === 'disconnected' || state === 'failed') && activeConn) {
            activeConn = null;
            setReceiverStatus('Waiting for connection…', 'waiting');
          }
        };
      });

      conn.on('data', function (data) {
        if (typeof data === 'string') {
          var msg = JSON.parse(data);

          if (msg.type === 'meta') {
            meta          = msg;
            chunks        = [];
            bytesReceived = 0;
            hideReceiverCards();
            document.getElementById('receiver-transfer').removeAttribute('hidden');
            document.getElementById('receiver-file-info').textContent =
              msg.name + ' (' + formatSize(msg.size) + ')';
            setProgress('receiver-progress', 'receiver-percent', 0);

          } else if (msg.type === 'hash') {
            receiveComplete(msg.sha256);
          }

        } else if (data instanceof ArrayBuffer) {
          chunks.push(data);
          bytesReceived += data.byteLength;
          var pct = meta ? Math.min(100, Math.round(bytesReceived / meta.size * 100)) : 0;
          setProgress('receiver-progress', 'receiver-percent', pct);
        }
      });

      conn.on('close', function () {
        activeConn = null;
        setReceiverStatus('Waiting for connection…', 'waiting');
      });
    });

    function receiveComplete(senderHash) {
      var totalBytes = chunks.reduce(function (acc, c) { return acc + c.byteLength; }, 0);
      var assembled  = new Uint8Array(totalBytes);
      var offset     = 0;
      chunks.forEach(function (chunk) {
        assembled.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      });
      var fullBuffer = assembled.buffer;

      crypto.subtle.digest('SHA-256', fullBuffer).then(function (hashBuffer) {
        var hashHex = bufferToHex(hashBuffer);

        if (hashHex !== senderHash) {
          showReceiverError('Transfer error: file integrity check failed. Please try again.');
          return;
        }

        var blob   = new Blob([fullBuffer], { type: meta.mime });
        var url    = URL.createObjectURL(blob);
        var anchor = document.createElement('a');
        anchor.href     = url;
        anchor.download = meta.name;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        hideReceiverCards();
        document.getElementById('receiver-done').removeAttribute('hidden');
      });
    }

    document.getElementById('receiver-reset').addEventListener('click', function () {
      meta          = null;
      chunks        = [];
      bytesReceived = 0;
      hideReceiverCards();
      document.getElementById('receiver-init').removeAttribute('hidden');
      if (activeConn) {
        setReceiverStatus('Connected — ready to receive', 'success');
      } else {
        setReceiverStatus('Waiting for connection…', 'waiting');
      }
    });

    document.getElementById('receiver-regenerate').addEventListener('click', function () {
      peer.destroy();
      hideReceiverCards();
      document.getElementById('receiver-init').removeAttribute('hidden');
      initReceiver();
    });
  }

  // ── Sender ──────────────────────────────────────────────────────────
  function initSender(receiverId) {
    var peer = new Peer();
    var conn = null;

    peer.on('open', function () {
      conn = peer.connect(receiverId, { reliable: true, serialization: 'raw' });
      conn.on('open', showSenderReady);
      conn.on('error', function () {
        showSenderError('Connection lost. Please scan the QR code again to retry.');
      });
    });

    peer.on('error', function (err) {
      if (err.type === 'peer-unavailable') {
        showSenderError('Could not reach the library computer. The QR code may have expired — ask for a new one.');
      } else {
        showSenderError('Connection failed. Check your internet connection and try again.');
      }
    });

    document.getElementById('file-input').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;

      if (!isAllowedFile(file)) {
        showFileError('This file type is not supported. Please choose a PDF, Word, Excel, PowerPoint, TXT, MD, JPG, or PNG file.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showFileError('File is too large (max 25 MB). Please choose a smaller file.');
        return;
      }

      document.getElementById('sender-file-error').setAttribute('hidden', '');
      sendFile(file);
    });

    document.getElementById('sender-reset').addEventListener('click', function () {
      document.getElementById('file-input').value = '';
      document.getElementById('sender-file-error').setAttribute('hidden', '');
      showSenderReady();
    });

    function showSenderReady() {
      hideSenderCards();
      document.getElementById('sender-ready').removeAttribute('hidden');
    }

    function sendFile(file) {
      hideSenderCards();
      document.getElementById('sender-transfer').removeAttribute('hidden');
      document.getElementById('sender-file-info').textContent =
        file.name + ' (' + formatSize(file.size) + ')';
      setProgress('sender-progress', 'sender-percent', 0);
      document.getElementById('sender-transfer-status').textContent = 'Sending…';

      var reader    = new FileReader();
      reader.onload = function (e) {
        var buffer = e.target.result;
        var total  = buffer.byteLength;
        var offset = 0;
        var paused = false;

        var dc = conn.dataChannel;
        dc.bufferedAmountLowThreshold = CHUNK_SIZE;

        function updateSenderProgress() {
          var transmitted = Math.max(0, offset - dc.bufferedAmount);
          var pct = total > 0 ? Math.min(99, Math.round(transmitted / total * 100)) : 0;
          setProgress('sender-progress', 'sender-percent', pct);
        }

        crypto.subtle.digest('SHA-256', buffer).then(function (hb) {
          var hashHex = bufferToHex(hb);

          // Send remaining chunks; resume here after backpressure pause.
          // Channel is reliable+ordered so hash arrives after all chunks.
          function sendChunks() {
            while (offset < buffer.byteLength) {
              if (dc.bufferedAmount >= CHUNK_SIZE * 16) {
                paused = true;
                return;
              }
              conn.send(buffer.slice(offset, offset + CHUNK_SIZE));
              offset += CHUNK_SIZE;
              updateSenderProgress();
            }
            dc.onbufferedamountlow = null;
            conn.send(JSON.stringify({ type: 'hash', sha256: hashHex }));
            setProgress('sender-progress', 'sender-percent', 100);
            hideSenderCards();
            document.getElementById('sender-done').removeAttribute('hidden');
            document.getElementById('sender-file-name').textContent =
              document.getElementById('sender-file-info').textContent;
          }

          dc.onbufferedamountlow = function () {
            updateSenderProgress();
            if (paused) { paused = false; sendChunks(); }
          };

          conn.send(JSON.stringify({ type: 'meta', name: file.name, size: file.size, mime: file.type }));
          sendChunks();
        });
      };
      reader.readAsArrayBuffer(file);
    }
  }

  // ── Shared helpers ───────────────────────────────────────────────────
  function renderQR(url) {
    var qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    document.getElementById('qr-img').src = qr.createDataURL(6, 2);
  }

  function setReceiverStatus(text, state) {
    var el = document.getElementById('receiver-status');
    el.textContent = text;
    el.className   = 'status status--' + state;
  }

  function setProgress(progressId, percentId, pct) {
    document.getElementById(progressId).value      = pct;
    document.getElementById(percentId).textContent = pct + '%';
  }

  function showReceiverError(msg) {
    hideReceiverCards();
    document.getElementById('receiver-error').removeAttribute('hidden');
    document.getElementById('receiver-error-msg').textContent = msg;
  }

  function hideReceiverCards() {
    ['receiver-init', 'receiver-transfer', 'receiver-done', 'receiver-error']
      .forEach(function (id) { document.getElementById(id).setAttribute('hidden', ''); });
  }

  function showFileError(msg) {
    var el = document.getElementById('sender-file-error');
    el.textContent = msg;
    el.removeAttribute('hidden');
    document.getElementById('file-input').value = '';
  }

  function showSenderError(msg) {
    hideSenderCards();
    document.getElementById('sender-error').removeAttribute('hidden');
    document.getElementById('sender-error-msg').textContent = msg;
  }

  function hideSenderCards() {
    ['sender-connecting', 'sender-ready', 'sender-transfer', 'sender-done', 'sender-error']
      .forEach(function (id) { document.getElementById(id).setAttribute('hidden', ''); });
  }

  function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  function formatSize(bytes) {
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

}());
