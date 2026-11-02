// Liberate bench and fate machine: hands-on versions of the edition's
// own growth code. The bench lets a visitor pick a law and grow a room;
// the fate machine tests any number and tallies a hundred rooms live.
(function () {
  'use strict';
  if (!window.LiberateArt) return;
  const A = window.LiberateArt;
  const SIZE = A.SIZE, INSET = A.INSET;
  const zone = (x, y) => {
    const d = Math.min(x, SIZE - 1 - x, y, SIZE - 1 - y);
    return d >= INSET + 2 ? 2 : d >= INSET ? 1 : 0;
  };

  function makeDraw(cv) {
    const ctx = cv.getContext('2d');
    const W = cv.width, CELL = W / SIZE;
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
    return function draw(g, fin) {
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
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x * CELL + 1.75, y * CELL + 1.75, CELL - 3.5, CELL - 3.5);
      }
      return { outside, band };
    };
  }

  // ---------------- Bench (01 Room) ----------------
  (function bench() {
    const cv = document.getElementById('benchCanvas');
    if (!cv) return;
    const draw = makeDraw(cv);
    const $ = (id) => document.getElementById(id);
    const lawsBox = $('benchLaws'), genEl = $('benchGen'), outEl = $('benchOut'),
      statusEl = $('benchStatus'), playBtn = $('benchPlay'), noteEl = $('benchNote'),
      seedInp = $('benchSeed');
    let sel = -1; // -1 = the seed's own law (simulate), 0..5 = bench law (toyPlay)
    let seed = '277178';
    let frames = [], fin = null, steps = 0, idx = 0, playing = false, timer = null, runId = 0;

    const LAW_NAMES = ["Seed's own law"].concat(A.RULES.map((r) => r[1]));
    LAW_NAMES.forEach((name, i) => {
      const b = document.createElement('button');
      b.className = 'chip' + (i === 0 ? ' on' : '');
      b.type = 'button';
      b.textContent = name;
      b.addEventListener('click', () => {
        sel = i - 1;
        lawsBox.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
        b.classList.add('on');
        noteEl.textContent = sel < 0
          ? "Seed mode: law, palette and cluster all come from the seed, exactly as a minted work grows."
          : 'Bench mode: you picked ' + A.RULES[sel][1] + '. A minted work lets its seed pick the law instead.';
        load(seed, true);
      });
      lawsBox.appendChild(b);
    });

    function compute() {
      const r = sel < 0 ? A.simulate(seed, 0) : A.toyPlay(seed, sel);
      frames = r.frames;
      steps = r.steps;
      fin = { status: r.status, sides: r.sides };
    }
    function paint() {
      const last = idx >= frames.length - 1;
      const counts = draw(frames[idx], last ? fin : null);
      genEl.textContent = 'GEN ' + String(Math.min(idx, steps)).padStart(3, '0') + ' / ' + String(steps).padStart(3, '0');
      outEl.textContent = counts.outside + (counts.outside === 1 ? ' CELL OUT' : ' CELLS OUT');
      if (last) { statusEl.textContent = fin.status.toUpperCase(); statusEl.classList.toggle('out', fin.status === 'Released'); }
      else if (counts.outside > 0) { statusEl.textContent = 'BREACHING'; statusEl.classList.remove('out'); }
      else if (counts.band > 0) { statusEl.textContent = 'AT THE WALL'; statusEl.classList.remove('out'); }
      else { statusEl.textContent = 'INSIDE THE ROOM'; statusEl.classList.remove('out'); }
    }
    function baseDelay() { return Math.max(40, Math.min(220, Math.round(8000 / Math.max(frames.length, 1)))); }
    function factor() { return [0.5, 1, 2, 3.5][(parseInt($('benchSpeed').value, 10) || 2) - 1]; }
    function tick() {
      if (!playing) return;
      if (idx >= frames.length - 1) { stop(); playBtn.textContent = 'Replay'; return; }
      idx++;
      paint();
      timer = setTimeout(tick, baseDelay() / factor());
    }
    function stop() { playing = false; if (timer) clearTimeout(timer); timer = null; }
    function play() {
      if (idx >= frames.length - 1) idx = 0;
      playing = true;
      playBtn.textContent = 'Pause';
      paint();
      timer = setTimeout(tick, baseDelay() / factor());
    }
    function load(newSeed, autoplay) {
      stop();
      runId++;
      seed = String(newSeed);
      seedInp.value = seed;
      compute();
      idx = 0;
      playBtn.textContent = 'Play';
      paint();
      if (autoplay) play();
    }

    playBtn.addEventListener('click', () => { if (playing) { stop(); playBtn.textContent = idx >= frames.length - 1 ? 'Replay' : 'Play'; } else play(); });
    $('benchStepB').addEventListener('click', () => { stop(); playBtn.textContent = 'Play'; idx = Math.max(0, idx - 1); paint(); });
    $('benchStepF').addEventListener('click', () => { stop(); playBtn.textContent = idx >= frames.length - 1 ? 'Replay' : 'Play'; idx = Math.min(frames.length - 1, idx + 1); paint(); });
    cv.addEventListener('click', () => { if (playing) { stop(); playBtn.textContent = 'Play'; } else play(); });
    $('benchGrow').addEventListener('click', () => {
      const v = (seedInp.value || '').replace(/[^0-9]/g, '');
      if (v) load(v, true);
    });
    seedInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('benchGrow').click(); });
    $('benchRand').addEventListener('click', () => load(String(1 + Math.floor(Math.random() * 2000000)), true));

    // Sample works above replay their exact growth here.
    document.querySelectorAll('#formGrid .form').forEach((fig) => {
      fig.addEventListener('click', () => {
        const s = fig.getAttribute('data-seed');
        if (!s) return;
        if (sel !== -1) {
          sel = -1;
          lawsBox.querySelectorAll('.chip').forEach((c, i) => c.classList.toggle('on', i === 0));
          noteEl.textContent = "Seed mode: law, palette and cluster all come from the seed, exactly as a minted work grows.";
        }
        load(s, true);
        document.getElementById('bench').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    load(seed, false);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { play(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(cv);
    }
  })();

  // ---------------- Fate machine (02 Fates) ----------------
  (function fate() {
    const goBtn = document.getElementById('fateGo');
    if (!goBtn) return;
    const $ = (id) => document.getElementById(id);
    const inp = $('fateSeed'), out = $('fateOut'), art = $('fateArt'),
      stamp = $('fateStamp'), traits = $('fateTraits'), line = $('fateLine');

    function test() {
      let v = (inp.value || '').replace(/[^0-9]/g, '');
      if (!v) { v = String(1 + Math.floor(Math.random() * 2000000)); inp.value = v; }
      const r = A.render(v, 0);
      art.innerHTML = r.svg;
      stamp.textContent = r.traits.Status.toUpperCase();
      traits.textContent = r.traits.Rule + ' · ' + r.traits.Palette + ' · ' + r.traits.Density +
        ' · Breach ' + r.traits.Breach + ' · ' + r.stats.steps + ' generations';
      line.textContent = r.traits.Status === 'Released'
        ? 'It gets out. Growth froze at the first generation that put three cells beyond the wall, gap torn where it came through.'
        : 'It never gets out. Growth settled inside the room and stayed there. Roughly one number in ten ends this way.';
      out.hidden = false;
    }
    goBtn.addEventListener('click', test);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') test(); });

    const tallyBox = $('fateTally'), barR = $('fateBarR'), counts = $('fateCounts'), runBtn = $('fate100');
    runBtn.addEventListener('click', () => {
      if (runBtn.disabled) return;
      runBtn.disabled = true;
      tallyBox.hidden = false;
      let done = 0, rel = 0, held = 0;
      (function batch() {
        for (let k = 0; k < 4 && done < 100; k++) {
          const r = A.render(String(1 + Math.floor(Math.random() * 2000000)), 0);
          done++;
          if (r.traits.Status === 'Released') rel++; else held++;
        }
        barR.style.width = (done ? (rel / done * 100) : 0).toFixed(0) + '%';
        counts.textContent = 'Released ' + rel + ' · Held ' + held + ' · Rooms run ' + done + ' / 100';
        if (done < 100) setTimeout(batch, 30);
        else {
          counts.textContent += ' · Expect roughly 90 out and 10 held over any hundred rooms. Seeds decide, nobody else.';
          runBtn.disabled = false;
        }
      })();
    });
  })();
})();
