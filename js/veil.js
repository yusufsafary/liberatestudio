// Liberate coming-soon veil: a small live room behind the countdown.
// The veil element itself is hidden by launch.js at LAUNCH_AT
// (data-launch-hide) or by the inline script for late arrivals and
// ?preview=1. This driver only animates the teaser while it is shown.
(function () {
  'use strict';
  const veil = document.getElementById('veil');
  const cv = document.getElementById('veilCanvas');
  if (!veil || !cv || !window.LiberateArt) return;
  if (Date.now() >= Date.UTC(2026, 10, 2, 9, 0, 0) || /[?&]preview=1/.test(location.search)) return;
  const ctx = cv.getContext('2d');
  const A = window.LiberateArt;
  const SIZE = A.SIZE, INSET = A.INSET;
  const W = cv.width, CELL = W / SIZE;
  const seedEl = document.getElementById('veilSeed');
  const statusEl = document.getElementById('veilStatus');
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
    ctx.fillStyle = '#0A0A0A';
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (!g[y * SIZE + x]) continue;
      const z = zone(x, y);
      if (z === 2) ctx.fillRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
      else if (z === 1) band++;
      else outside++;
    }
    drawWall(g, fin);
    ctx.fillStyle = '#8F8F8F';
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (g[y * SIZE + x] && zone(x, y) === 1) ctx.fillRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
    }
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (!g[y * SIZE + x] || zone(x, y) !== 0) continue;
      ctx.fillStyle = '#FFF';
      ctx.fillRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * CELL + 1.5, y * CELL + 1.5, CELL - 3, CELL - 3);
    }
    return { outside, band };
  }

  const CURATED = ['277178', '316773', '823589', '7932'];
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
    if (seedEl) seedEl.textContent = 'SEED ' + sim.traits.Seed + ' · ' + sim.traits.Rule;
    let i = 0;
    const delay = Math.max(40, Math.min(220, Math.round(8000 / Math.max(frames.length, 1))));
    function step() {
      if (my !== runId) return;
      if (document.hidden) { setTimeout(step, 400); return; }
      const last = i >= frames.length - 1;
      const counts = draw(frames[i], last ? fin : null);
      if (statusEl) {
        if (last) statusEl.textContent = sim.status.toUpperCase();
        else if (counts.outside > 0) statusEl.textContent = 'BREACHING';
        else if (counts.band > 0) statusEl.textContent = 'AT THE WALL';
        else statusEl.textContent = 'INSIDE THE ROOM';
      }
      if (last) { setTimeout(() => { if (my === runId) play(nextSeed()); }, 3000); return; }
      i++;
      setTimeout(step, delay);
    }
    if (reduced) {
      draw(frames[frames.length - 1], fin);
      if (statusEl) statusEl.textContent = sim.status.toUpperCase();
      return;
    }
    step();
  }

  cv.addEventListener('click', () => play(nextSeed()));
  play(nextSeed());
})();
