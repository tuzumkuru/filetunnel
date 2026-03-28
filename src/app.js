// QR File Drop — v0.1.0
// Mode detection only. Transfer logic added in v0.4.0.

(function () {
  'use strict';

  const params   = new URLSearchParams(window.location.search);
  const peerId   = params.get('peer');
  const isSender = peerId !== null;

  if (isSender) {
    document.getElementById('view-sender').removeAttribute('hidden');
  } else {
    document.getElementById('view-receiver').removeAttribute('hidden');
  }
}());
