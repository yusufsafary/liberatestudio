// Liberate — every work begins as a small cluster at the centre of a walled
// room. A cellular rule grows it from a seed. Most works break through the
// wall and are Released; a few never get out and stay Held. The picture is
// the moment of first breach, or the final state of a work that stayed in.
// Deterministic from a uint256 seed. Same code runs in Node (generator) and
// in the browser (market page). Held share measured ~11% over 1,500 seeds.
(function (root) {
  'use strict';

  function sfc32(a, b, c, d) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      let t = (a + b) | 0;
      a = b ^ (b >>> 9); b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11); d = (d + 1) | 0;
      t = (t + d) | 0; c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }
  function rngFrom(seedHex, attempt) {
    const h = String(seedHex).replace(/^0x/, '').padStart(64, '0').slice(-64);
    const p = [0, 1, 2, 3].map((i) => parseInt(h.slice(i * 8, i * 8 + 8), 16) ^ parseInt(h.slice(32 + i * 8, 40 + i * 8), 16));
    p[0] ^= (attempt || 0) * 0x9e3779b9;
    const r = sfc32(p[0], p[1], p[2], p[3]);
    for (let i = 0; i < 32; i++) r();
    return r;
  }
  const pickW = (rand, items) => { let t = 0; items.forEach((x) => (t += x[1])); let v = rand() * t; for (const x of items) { v -= x[1]; if (v <= 0) return x[0]; } return items[items.length - 1][0]; };
  const f = (n) => Math.round(n * 100) / 100;

  // ---------- palettes ----------
  const PALETTES = [
    { name: 'Daylight', bg: '#F2EDE2', ink: '#1B1A17', acc: '#D8432A', sub: '#9A927F', w: 14 },
    { name: 'Open Air', bg: '#E9EFEA', ink: '#1E3327', acc: '#E07B1F', sub: '#8FA294', w: 11 },
    { name: 'Harbour', bg: '#E6E9EC', ink: '#16283C', acc: '#D9A514', sub: '#8B99A6', w: 10 },
    { name: 'Orchard', bg: '#EDEBD9', ink: '#2C331C', acc: '#C14A21', sub: '#979B7E', w: 9 },
    { name: 'Kiln', bg: '#F0E3D3', ink: '#33190E', acc: '#256D5A', sub: '#B08E74', w: 8 },
    { name: 'Signal', bg: '#F4F0E6', ink: '#232028', acc: '#2B50C8', sub: '#A8A29A', w: 8 },
    { name: 'Night Yard', bg: '#101013', ink: '#EDE6D6', acc: '#FF5A26', sub: '#4C4A45', w: 10 },
    { name: 'Deep Water', bg: '#0A1626', ink: '#A8C8E8', acc: '#FFC93C', sub: '#2A4460', w: 8 },
    { name: 'Ultraviolet', bg: '#1D1030', ink: '#DCCFF5', acc: '#7DFFA0', sub: '#4A3670', w: 5 },
    { name: 'Verdigris', bg: '#DCE8E0', ink: '#17352B', acc: '#D8432A', sub: '#84A08E', w: 6 },
    { name: 'Bone', bg: '#F5F2EB', ink: '#2E2A25', acc: '#2E2A25', sub: '#BDB5A6', w: 4 },
    { name: 'Ember', bg: '#180D08', ink: '#F2B880', acc: '#3EC6A7', sub: '#59331F', w: 4 },
  ];
  // [code, label, birth set, survival set, weight]
  const RULES = [
    ['B3/S23', 'Life', [3], [2, 3], 4],
    ['B36/S23', 'HighLife', [3, 6], [2, 3], 3],
    ['B3678/S34678', 'Day & Night', [3, 6, 7, 8], [3, 4, 6, 7, 8], 3],
    ['B3/S45678', 'Coral', [3], [4, 5, 6, 7, 8], 3],
    ['B3/S12345', 'Maze', [3], [1, 2, 3, 4, 5], 2],
    ['B3/S1234', 'Mazectric', [3], [1, 2, 3, 4], 2],
  ];

  const SIZE = 44;        // grid cells per side
  const INSET = 11;       // wall band starts this many cells from the edge
  const MAXSTEPS = 240;   // generations before a work counts as Held
  const MINCELLS = 24;    // a world thinner than this is re-rolled
  const ATTEMPTS = 12;

  // zone of a cell: 2 inside the room, 1 in the wall band, 0 outside
  function zone(x, y) {
    const d = Math.min(x, SIZE - 1 - x, y, SIZE - 1 - y);
    return d >= INSET + 2 ? 2 : d >= INSET ? 1 : 0;
  }

  function grow(seedHex, rule, density, radius, attempt) {
    const rand = rngFrom(seedHex, attempt);
    const B = new Set(rule[2]), S = new Set(rule[3]);
    const C = SIZE / 2;
    let g = new Uint8Array(SIZE * SIZE);
    for (let y = C - radius; y < C + radius; y++)
      for (let x = C - radius; x < C + radius; x++) {
        const dx = x - C + 0.5, dy = y - C + 0.5;
        if (dx * dx + dy * dy <= radius * radius && rand() < density) g[y * SIZE + x] = 1;
      }
    let prev = null;
    for (let t = 0; t <= MAXSTEPS; t++) {
      let inside = 0, band = 0, outside = 0;
      const sides = { North: 0, East: 0, South: 0, West: 0 };
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (!g[y * SIZE + x]) continue;
        const z = zone(x, y);
        if (z === 2) inside++;
        else if (z === 1) band++;
        else {
          outside++;
          if (y < INSET) sides.North++;
          if (y >= SIZE - INSET) sides.South++;
          if (x < INSET) sides.West++;
          if (x >= SIZE - INSET) sides.East++;
        }
      }
      // Released hanya saat tembusan nyata (>=3 sel di luar), bukan satu sel
      // nyasar; potret diambil tepat pada momen itu, sebelum pola menyebar.
      if (outside >= 3) return { g, status: 'Released', inside, band, outside, sides, steps: t };
      if (t === MAXSTEPS) return { g, status: 'Held', inside, band, outside, sides, steps: t };
      if (prev !== null) {
        let same = true;
        for (let i = 0; i < g.length; i++) if (g[i] !== prev[i]) { same = false; break; }
        if (same) return { g, status: 'Held', inside, band, outside, sides, steps: t };
      }
      prev = Uint8Array.from(g);
      if (inside + band === 0) return null; // died: re-roll
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
      g = n;
    }
    return null;
  }

  // Full deterministic render record for one work.
  function render(seed, id) {
    const seedHex = '0x' + BigInt(seed).toString(16).padStart(64, '0');
    const base = rngFrom(seedHex, 0);
    const pal = pickW(base, PALETTES.map((p) => [p, p.w]));
    const rule = pickW(base, RULES.map((r) => [r, r[4]]));
    const wide = rule[1] === 'Day & Night';
    const density = wide
      ? pickW(base, [[0.45, 3], [0.52, 4], [0.6, 3]])
      : pickW(base, [[0.35, 3], [0.45, 4], [0.55, 3]]);
    const radius = wide
      ? pickW(base, [[6, 4], [7, 3]])
      : pickW(base, [[5, 3], [6, 4], [7, 3]]);
    const densityName = density <= 0.4 ? 'Sparse' : density <= 0.5 ? 'Even' : density <= 0.57 ? 'Full' : 'Dense';

    let world = null, bestThin = null;
    for (let att = 0; att < ATTEMPTS; att++) {
      const w = grow(seedHex, rule, density, radius, att);
      if (!w) continue;
      if (w.inside + w.band + w.outside >= MINCELLS) { world = w; break; }
      if (!bestThin || w.inside + w.band + w.outside > bestThin.inside + bestThin.band + bestThin.outside) bestThin = w; // fallback: dunia paling berisi
    }
    if (!world) world = bestThin;
    if (!world) world = { g: new Uint8Array(SIZE * SIZE), status: 'Held', inside: 0, band: 0, outside: 0, sides: { North: 0, East: 0, South: 0, West: 0 }, steps: 0 };

    const breached = Object.keys(world.sides).filter((s) => world.sides[s] > 0);
    const traits = {
      Status: world.status,
      Breach: world.status === 'Held' ? 'None' : breached.join(' + '),
      Rule: rule[1],
      Palette: pal.name,
      Density: densityName,
      Seed: String(BigInt(seed) % 100000n),
    };

    // ---------- SVG ----------
    const W = 1000, cell = W / SIZE;
    let inner = '', escape = '';
    // pusat tembusan per sisi (rata-rata posisi sel luar pada sisi itu)
    const breachPos = {};
    for (const s of ['North', 'East', 'South', 'West']) {
      if (!world.sides[s]) continue;
      let sum = 0, n = 0;
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (!world.g[y * SIZE + x] || zone(x, y) !== 0) continue;
        if (s === 'North' && y < INSET) { sum += x; n++; }
        if (s === 'South' && y >= SIZE - INSET) { sum += x; n++; }
        if (s === 'West' && x < INSET) { sum += y; n++; }
        if (s === 'East' && x >= SIZE - INSET) { sum += y; n++; }
      }
      breachPos[s] = n ? (sum / n + 0.5) * cell : W / 2;
    }
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (!world.g[y * SIZE + x]) continue;
      const rect = `<rect x="${f(x * cell + 0.5)}" y="${f(y * cell + 0.5)}" width="${f(cell - 1)}" height="${f(cell - 1)}"`;
      if (zone(x, y) === 2) inner += rect + ` fill="${pal.ink}"/>`;
      else escape += rect + ` fill="${pal.acc}"/>`; // sel di dinding / di luar: aksen
    }
    // Dinding: 4 balok penuh setebal pita dinding. Sisi yang tembus mendapat
    // celah selebar ~14% tepat di titik tembusnya.
    const wt = 2 * cell;                    // tebal dinding
    const wIn = INSET * cell;               // tepi dalam dinding
    const wOut = wIn + wt;                  // tepi luar dinding (koordinat dari 0)
    const far = W - wIn, farIn = W - wOut;  // sisi seberang
    const gapHalf = W * 0.07;
    const bar = (x, y, w, h) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${pal.ink}"/>`;
    let wallBars = '';
    // Utara (balok horizontal atas, y: wIn..wOut dalam koordinat tepi? dinding menempati [INSET*cell, (INSET+2)*cell])
    if (world.sides.North > 0) {
      const gx = Math.max(wIn + gapHalf, Math.min(far - gapHalf, breachPos.North));
      wallBars += bar(wIn, wIn, gx - gapHalf - wIn, wt) + bar(gx + gapHalf, wIn, far - gx - gapHalf, wt);
    } else wallBars += bar(wIn, wIn, far - wIn, wt);
    // Selatan
    if (world.sides.South > 0) {
      const gx = Math.max(wIn + gapHalf, Math.min(far - gapHalf, breachPos.South));
      wallBars += bar(wIn, farIn, gx - gapHalf - wIn, wt) + bar(gx + gapHalf, farIn, far - gx - gapHalf, wt);
    } else wallBars += bar(wIn, farIn, far - wIn, wt);
    // Barat
    if (world.sides.West > 0) {
      const gy = Math.max(wIn + gapHalf, Math.min(far - gapHalf, breachPos.West));
      wallBars += bar(wIn, wIn, wt, gy - gapHalf - wIn) + bar(wIn, gy + gapHalf, wt, far - gy - gapHalf);
    } else wallBars += bar(wIn, wIn, wt, far - wIn);
    // Timur
    if (world.sides.East > 0) {
      const gy = Math.max(wIn + gapHalf, Math.min(far - gapHalf, breachPos.East));
      wallBars += bar(farIn, wIn, wt, gy - gapHalf - wIn) + bar(farIn, gy + gapHalf, wt, far - gy - gapHalf);
    } else wallBars += bar(farIn, wIn, wt, far - wIn);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="${pal.bg}"/>${inner}${wallBars}${escape}</svg>`;

    return { id, seed: seedHex, traits, svg, stats: { inside: world.inside, band: world.band, outside: world.outside, steps: world.steps } };
  }

  root.LiberateArt = { render, PALETTES, RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = { render, PALETTES, RULES };
})(typeof window !== 'undefined' ? window : globalThis);
