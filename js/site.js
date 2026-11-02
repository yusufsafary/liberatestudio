// Liberate homepage: hero growth animation, sample works, mint ledger,
// wallet check, gallery of recent works, copy buttons.
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => n.toLocaleString('en');

  // ---------- hero: a cluster grows in a room, breaks out, starts over ----
  (function hero() {
    const cv = $('#field');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const SIZE = 44, INSET = 11;
    let W = 0, H = 0, cell = 0;
    function size() {
      const r = cv.parentElement.getBoundingClientRect();
      W = cv.width = Math.floor(r.width);
      H = cv.height = Math.floor(r.height);
      cell = Math.max(W, H) / SIZE;
    }
    size();
    addEventListener('resize', size);
    const B = new Set([3]), S = new Set([2, 3]);
    let g = null, t = 0, hold = 0;
    function seedWorld() {
      g = new Uint8Array(SIZE * SIZE);
      const C = SIZE / 2, R = 6;
      for (let y = C - R; y < C + R; y++) for (let x = C - R; x < C + R; x++) {
        const dx = x - C + 0.5, dy = y - C + 0.5;
        if (dx * dx + dy * dy <= R * R && Math.random() < 0.45) g[y * SIZE + x] = 1;
      }
      t = 0; hold = 0;
    }
    function zone(x, y) {
      const d = Math.min(x, SIZE - 1 - x, y, SIZE - 1 - y);
      return d >= INSET + 2 ? 2 : d >= INSET ? 1 : 0;
    }
    function step() {
      const n = new Uint8Array(SIZE * SIZE);
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE) continue;
          c += g[yy * SIZE + xx];
        }
        n[y * SIZE + x] = g[y * SIZE + x] ? (S.has(c) ? 1 : 0) : (B.has(c) ? 1 : 0);
      }
      g = n; t++;
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const ox = (W - SIZE * cell) / 2, oy = (H - SIZE * cell) / 2;
      let outside = 0;
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (!g[y * SIZE + x]) continue;
        const z = zone(x, y);
        if (z === 0) outside++;
        ctx.fillStyle = z === 2 ? 'rgba(255,255,255,.5)' : '#FFFFFF';
        ctx.fillRect(ox + x * cell + 0.5, oy + y * cell + 0.5, cell - 1, cell - 1);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 2 * cell;
      const c = (INSET + 1) * cell;
      ctx.strokeRect(ox + c, oy + c, (SIZE - 2 * (INSET + 1)) * cell, (SIZE - 2 * (INSET + 1)) * cell);
      return outside;
    }
    seedWorld();
    setInterval(function () {
      if (!g) seedWorld();
      const out = draw();
      if (out >= 3 || t > 240) { if (++hold > 14) seedWorld(); }
      else step();
    }, 130);
  })();

  // ---------- sample works (01 Room) ----------
  const SAMPLES = ['7932', '277178', '316773', '285097'];
  (function samples() {
    const grid = $('#formGrid');
    if (!grid || !window.LiberateArt) return;
    grid.innerHTML = '';
    SAMPLES.forEach(function (seed) {
      const r = window.LiberateArt.render(seed, 0);
      const d = document.createElement('figure');
      d.className = 'form';
      d.innerHTML = r.svg + '<figcaption><b>' + r.traits.Status + '</b><span>' + r.traits.Rule + ' · ' + r.traits.Palette + (r.traits.Breach !== 'None' ? ' · Breach ' + r.traits.Breach : '') + '</span></figcaption>';
      grid.appendChild(d);
    });
    const pals = $('#pals');
    if (pals) {
      pals.innerHTML = window.LiberateArt.PALETTES.map(function (p) {
        return '<span class="pal">' + p.name + '</span>';
      }).join('');
    }
  })();

  // ---------- two fates (02 Fates) ----------
  (function fates() {
    if (!window.LiberateArt) return;
    const rel = $('#fateReleased'), held = $('#fateHeld');
    if (rel) rel.innerHTML = window.LiberateArt.render('823589', 0).svg;
    if (held) held.innerHTML = window.LiberateArt.render('1354162', 0).svg;
  })();

  // ---------- mint ledger ----------
  function paintStats(s) {
    const bc = $('#barCount'); if (bc) bc.textContent = fmt(s.minted);
    const mm = $('#mMinted'); if (mm) mm.textContent = fmt(s.minted);
    const ml = $('#mLeft'); if (ml) ml.textContent = fmt(s.max - s.minted);
    const mf = $('#mFill'); if (mf) mf.style.width = (s.minted / s.max * 100).toFixed(2) + '%';
    const st = $('#mStatus');
    if (st) {
      if (s.minted >= s.max) st.textContent = 'Sold out';
      else if (s.open) st.textContent = 'Mint live';
      else if (typeof LAUNCH_AT !== 'undefined' && Date.now() < LAUNCH_AT) st.innerHTML = 'Opens 2 Nov 2026 · 09.00 UTC · <span data-cd></span>';
      else st.textContent = 'Opening soon';
      if (typeof applyLaunch === 'function') applyLaunch();
    }
  }
  function poll() {
    if (!window.LiberateChain) return;
    window.LiberateChain.stats().then(paintStats).catch(function () {});
  }
  poll();
  setInterval(poll, 15000);

  // ---------- gallery: recent works ----------
  (function gallery() {
    const box = $('#gallery');
    if (!box || !window.LiberateChain || !window.LiberateArt) return;
    window.LiberateChain.recent().then(function (j) {
      if (!j.items.length) return;
      box.innerHTML = '';
      j.items.forEach(function (it) {
        const r = window.LiberateArt.render(it.seed, it.id);
        const d = document.createElement('a');
        d.href = '/market';
        d.innerHTML = r.svg + '<span class="mono" style="display:block;padding:10px 12px">#' + it.id + ' · ' + r.traits.Status + '</span>';
        box.appendChild(d);
      });
    }).catch(function () {});
  })();

  // ---------- check a wallet ----------
  (function check() {
    const btn = $('#whoBtn'), out = $('#whoOut'), inp = $('#who');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const a = (inp.value || '').trim();
      if (!/^0x[0-9a-fA-F]{40}$/.test(a)) { out.textContent = 'That does not look like a wallet address.'; return; }
      out.textContent = 'Reading contract…';
      window.LiberateChain.walletInfo(a).then(function (w) {
        if (!w.hasAgentId) out.textContent = 'No Agent ID. This wallet cannot mint.';
        else if (w.minted >= 20) out.textContent = 'Agent ID held. 20 works minted. Wallet limit reached.';
        else out.textContent = 'Agent ID held. ' + w.minted + ' of 20 works minted. Ready.';
      }).catch(function () { out.textContent = 'Could not reach BNB Chain. Try again.'; });
    });
  })();

  // ---------- copy buttons ----------
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      const el = document.getElementById(b.getAttribute('data-copy'));
      if (!el) return;
      if (navigator.clipboard) navigator.clipboard.writeText(el.innerText);
      b.textContent = 'Copied';
      setTimeout(function () { b.textContent = 'Copy'; }, 1600);
    });
  });
})();
