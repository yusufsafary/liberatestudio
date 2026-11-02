// Liberate claim section: ledger, status, check a work.
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => n.toLocaleString('en');
  const fmtTok = (wei) => fmt(Number(BigInt(wei) / 1000000000000000000n));
  if (!$('#claim')) return;

  function paint(c) {
    const cc = $('#cClaimed'); if (cc) cc.textContent = fmt(c.claimed);
    const cf = $('#cFill'); if (cf) cf.style.width = (c.claimed / c.max * 100).toFixed(2) + '%';
    const st = $('#cStatus');
    if (st) st.textContent = c.open ? 'Claims open' : 'Opening soon';
  }
  function poll() {
    if (!window.LiberateChain) return;
    window.LiberateChain.claim().then(paint).catch(function () {});
  }
  poll();
  setInterval(poll, 30000);

  const btn = $('#workBtn'), out = $('#workOut'), inp = $('#work');
  if (btn) btn.addEventListener('click', function () {
    const id = parseInt((inp.value || '').replace(/[^0-9]/g, ''), 10);
    if (!id || id < 1 || id > 9999) { out.textContent = 'Enter a work number from 1 to 9,999.'; return; }
    out.textContent = 'Reading contracts…';
    window.LiberateChain.stats().then(function (s) {
      if (id > s.minted) { out.textContent = 'Work #' + id + ' has not been minted yet.'; return null; }
      return window.LiberateChain.claim(id).then(function (c) {
        if (c.claimedForId) { out.textContent = 'Work #' + id + ': $LIB already claimed.'; return; }
        out.textContent = 'Work #' + id + ': unclaimed. Worth ' + fmtTok(c.amountWei) + ' $LIB (mint order ' + c.mintIndex + ' in its first wallet). Owner ' + (c.owner ? c.owner.slice(0, 6) + '…' + c.owner.slice(-4) : 'unknown') + ' can claim it.';
      });
    }).catch(function () { out.textContent = 'Could not reach BNB Chain. Try again.'; });
  });
})();
