// QR File Drop — v0.3.0

(function () {
  'use strict';

  var MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

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
    var statusEl = document.getElementById('receiver-status');
    statusEl.textContent = 'Connecting…';

    var peer = new Peer();
    var activeConn = null;

    peer.on('open', function (id) {
      var url = window.location.origin
              + window.location.pathname
              + '?peer=' + encodeURIComponent(id);

      renderQR(url);

      var fallbackEl = document.getElementById('fallback-url');
      fallbackEl.href        = url;
      fallbackEl.textContent = url;

      statusEl.textContent = 'Waiting for connection…';
    });

    peer.on('disconnected', function () {
      // PeerJS closes its signaling WebSocket after the offer/answer exchange
      // — before the data channel is fully open. Only reconnect if no
      // connection request has arrived yet (activeConn is the earlier signal).
      if (activeConn === null && !peer.destroyed) {
        peer.reconnect();
      }
    });

    peer.on('error', function () {
      showReceiverError('Could not connect to signaling service. Check your internet connection.');
    });

    peer.on('connection', function (conn) {
      activeConn = conn;
      conn.on('close', function () {
        activeConn = null;
      });
    });

    document.getElementById('receiver-regenerate').addEventListener('click', function () {
      peer.destroy();
      hideReceiverCards();
      document.getElementById('receiver-init').removeAttribute('hidden');
      initReceiver();
    });
  }

  function renderQR(url) {
    var qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    document.getElementById('qr-img').src = qr.createDataURL(6, 2);
  }

  function showReceiverError(msg) {
    hideReceiverCards();
    document.getElementById('receiver-error').removeAttribute('hidden');
    document.getElementById('receiver-error-msg').textContent = msg;
  }

  function hideReceiverCards() {
    ['receiver-init', 'receiver-transfer', 'receiver-done', 'receiver-error']
      .forEach(function (id) {
        document.getElementById(id).setAttribute('hidden', '');
      });
  }

  // ── Sender ──────────────────────────────────────────────────────────
  function initSender(receiverId) {
    var peer = new Peer();

    peer.on('open', function () {
      var conn = peer.connect(receiverId, { reliable: true });

      conn.on('open', function () {
        showSenderReady();
      });

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
  }

  function showSenderReady() {
    document.getElementById('sender-connecting').setAttribute('hidden', '');
    document.getElementById('sender-ready').removeAttribute('hidden');

    document.getElementById('file-input').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      validateFile(file);
    });
  }

  function validateFile(file) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      showFileError('This file type is not supported. Please choose a PDF, Word, Excel, PowerPoint, TXT, MD, JPG, or PNG file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showFileError('File is too large (max 25 MB). Please choose a smaller file.');
      return;
    }
    // file is valid — transfer logic added in v0.4.0
    document.getElementById('sender-file-error').setAttribute('hidden', '');
    hideSenderCards();
    document.getElementById('sender-transfer').removeAttribute('hidden');
    document.getElementById('sender-file-info').textContent = file.name + ' (' + formatSize(file.size) + ')';
  }

  function showFileError(msg) {
    var el = document.getElementById('sender-file-error');
    el.textContent = msg;
    el.removeAttribute('hidden');
    resetFileInput();
  }

  function showSenderError(msg) {
    hideSenderCards();
    document.getElementById('sender-error').removeAttribute('hidden');
    document.getElementById('sender-error-msg').textContent = msg;
  }

  function hideSenderCards() {
    ['sender-connecting', 'sender-ready', 'sender-transfer', 'sender-done', 'sender-error']
      .forEach(function (id) {
        document.getElementById(id).setAttribute('hidden', '');
      });
  }

  function resetFileInput() {
    document.getElementById('file-input').value = '';
  }

  function formatSize(bytes) {
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

}());
