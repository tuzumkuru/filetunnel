// QR File Drop — v0.2.0

(function () {
  'use strict';

  // ── Mode detection ─────────────────────────────────────────────────
  const params   = new URLSearchParams(window.location.search);
  const peerId   = params.get('peer');
  const isSender = peerId !== null;

  if (isSender) {
    document.getElementById('view-sender').removeAttribute('hidden');
    // sender logic added in v0.3.0
  } else {
    document.getElementById('view-receiver').removeAttribute('hidden');
    initReceiver();
  }

  // ── Receiver ────────────────────────────────────────────────────────
  function initReceiver() {
    var statusEl = document.getElementById('receiver-status');
    statusEl.textContent = 'Connecting…';

    var peer = new Peer();

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

    peer.on('error', function () {
      showReceiverError('Could not connect to signaling service. Check your internet connection.');
    });

    peer.on('connection', function () {
      // handled in v0.4.0
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

}());
