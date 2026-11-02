// Liberate hero: a live room. Runs the edition's own growth code in the
// browser, one seed at a time, from first cluster to breach or hold.
// Black and white by design; the drawing is the artwork itself.
(function () {
  'use strict';
  const cv = document.getElementById('simCanvas');
  if (!cv || !window.LiberateArt) return;
  const ctx = cv.getContext('2d');
  const A = window.LiberateArt;
  const SIZE = A.SIZE, INSET = A.INSET;
  const W = cv.width, CELL = W / SIZE;
  const el = (id) => document.getElementById(id);
  const seedEl = el('simSeed'), metaEl = el('simMeta'), statusEl = el('simStatus'),
    genEl = el('simGen'), outEl = el('simOut');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const zone = (x, y) => {
    const d = Math.min(x, SIZE - 1 - x, y, SIZE - 1 - y);
    return d >= INSET + 2 ? 2 : d >= INSET ? 1 : 0;
  };

  function drawWall(g, fin) {
    const wt = 2 * CELL, wIn = INSET * CELL, far = W - wIn, farIn = W - (wIn + wt);
    ctx.fillStyle = '#000';
    const bar = (x, y, w, h) => { if (w > 0 && h > 0) ctx.fillRect(x, y, w, h); };
    const gapHalf = W * 0.07;
    // Breach centres from the final grid, same method as the artwork.
    const pos = {};
    if (fin && fin.status === 'Released') {
      for (const s of ['North', 'East', 'South', 'West']) {
        if (!fin.sides[s]) continue;
        let sum = 0, n = 0;
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          if (!g[y * SIZE + x] || zone(x, y) !== 0) continue;
          if (s === 'North' && y < INSET) { sum += x; n++; }
          if (s === 'South' && y >= SIZE - INSET) { sum += x; n++; }
          if (s === 'West' && x < INSET) { sum += y; n++; }
          if (s === 'East' && x >= SIZE - INSET) { sum += y; n++; }
        }
        pos[s] = n ? (sum / n + 0.5) * CELL : W / 2;
      }
    }
    const cut = (c) => Math.max(wIn + gapHalf, Math.min(far - gapHalf, c));
    if (pos.North !== undefined) { const gx = cut(pos.North); bar(wIn, wIn, gx - gapHalf - wIn, wt); bar(gx + gapHalf, wIn, far - gx - gapHalf, wt); }
    else bar(wIn, wIn, far - wIn, wt);
    if (pos.South !== undefined) { const gx = cut(pos.South); bar(wIn, farIn, gx - gapHalf - wIn, wt); bar(gx + gapHalf, farIn, far - gx - gapHalf, wt); }
    else bar(wIn, farIn, far - wIn, wt);
    if (pos.West !== undefined) { const gy = cut(pos.West); bar(wIn, wIn, wt, gy - gapHalf - wIn); bar(wIn, gy + gapHalf, wt, far - gy - gapHalf); }
    else bar(wIn, wIn, wt, far - wIn);
    if (pos.East !== undefined) { const gy = cut(pos.East); bar(farIn, wIn, wt, gy - gapHalf - wIn); bar(farIn, gy + gapHalf, wt, far - gy - gapHalf); }
    else bar(farIn, wIn, wt, far - wIn);
  }

  function draw(g, fin) {
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, W, W);
    let outside = 0, band = 0;
    // Inside cells first.
    ctx.fillStyle = '#0A0A0A';
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (!g[y * SIZE + x]) continue;
      const z = zone(x, y);
      if (z === 2) ctx.fillRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
      else if (z === 1) band++;
      else outside++;
    }
    drawWall(g, fin);
    // Cells in the wall band, drawn over the wall.
    ctx.fillStyle = '#8F8F8F';
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (g[y * SIZE + x] && zone(x, y) === 1) ctx.fillRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
    }
    // Escaped cells: inverted, white core with a black frame.
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (!g[y * SIZE + x] || zone(x, y) !== 0) continue;
      ctx.fillStyle = '#FFF';
      ctx.fillRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x * CELL + 1.75, y * CELL + 1.75, CELL - 3.5, CELL - 3.5);
    }
    return { outside, band };
  }

  const CURATED = ['277178', '823589', '316773', '7932', '1354162', '285097'];
  let runId = 0, seedIdx = 0, currentSeed = null;

  function nextSeed() {
    if (seedIdx < CURATED.length) return CURATED[seedIdx++];
    return String(1 + Math.floor(Math.random() * 2000000));
  }

  function play(seed) {
    const my = ++runId;
    currentSeed = seed;
    const sim = A.simulate(seed, 0);
    const frames = sim.frames;
    const fin = { status: sim.status, sides: sim.sides };
    if (seedEl) seedEl.textContent = 'SEED ' + sim.traits.Seed;
    if (metaEl) metaEl.textContent = sim.traits.Rule + ' · ' + sim.traits.Palette + ' · ' + sim.traits.Density;
    let i = 0;
    const delay = Math.max(40, Math.min(220, Math.round(8000 / Math.max(frames.length, 1))));
    function step() {
      if (my !== runId) return;
      if (document.hidden) { setTimeout(step, 400); return; }
      const last = i >= frames.length - 1;
      const counts = draw(frames[i], last ? fin : null);
      if (genEl) genEl.textContent = 'GEN ' + String(Math.min(i, sim.steps)).padStart(3, '0') + ' / ' + String(sim.steps).padStart(3, '0');
      if (outEl) outEl.textContent = counts.outside + (counts.outside === 1 ? ' CELL OUT' : ' CELLS OUT');
      if (statusEl) {
        if (last) {
          statusEl.textContent = sim.status.toUpperCase();
          statusEl.classList.toggle('out', sim.status === 'Released');
        } else if (counts.outside > 0) { statusEl.textContent = 'BREACHING'; statusEl.classList.remove('out'); }
        else if (counts.band > 0) { statusEl.textContent = 'AT THE WALL'; statusEl.classList.remove('out'); }
        else { statusEl.textContent = 'INSIDE THE ROOM'; statusEl.classList.remove('out'); }
      }
      if (last) { setTimeout(() => { if (my === runId) play(nextSeed()); }, 3200); return; }
      i++;
      setTimeout(step, delay);
    }
    if (reduced) {
      draw(frames[frames.length - 1], fin);
      if (genEl) genEl.textContent = 'GEN ' + String(sim.steps).padStart(3, '0') + ' / ' + String(sim.steps).padStart(3, '0');
      if (statusEl) { statusEl.textContent = sim.status.toUpperCase(); statusEl.classList.toggle('out', sim.status === 'Released'); }
      const counts = { outside: sim.stats.outside };
      if (outEl) outEl.textContent = counts.outside + ' CELLS OUT';
      return;
    }
    step();
  }

  const newBtn = el('simNew'), reBtn = el('simReplay');
  if (newBtn) newBtn.addEventListener('click', () => play(nextSeed()));
  if (reBtn) reBtn.addEventListener('click', () => { if (currentSeed) play(currentSeed); });
  cv.addEventListener('click', () => play(nextSeed()));
  play(nextSeed());
})();
