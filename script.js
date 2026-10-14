(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  document.documentElement.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- nav ---------------- */
  const nav = $('#nav');
  const burger = $('#burger'), mm = $('#mmenu');
  burger.addEventListener('click', () => {
    const open = mm.hidden;
    mm.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', mm).forEach(a => a.addEventListener('click', () => { mm.hidden = true; burger.setAttribute('aria-expanded', 'false'); }));

  const navLinks = $$('.nav-links a');
  const secs = ['platform', 'network', 'dashboard', 'proof', 'pilot'].map(id => document.getElementById(id));

  /* ---------------- hero: mycelium ---------------- */
  const hero = $('.hero'), cv = $('#myc'), fx = $('#fx');
  const ctx = cv.getContext('2d'), fctx = fx.getContext('2d');
  const groundEl = $('#ground');
  let W = 0, H = 0, G = 0, DPR = 1, lastW = 0;
  let agents = [], nodes = [], spores = [];
  const mouse = { x: -999, y: -999, on: false };
  const MAX = 240;
  const HALF = Math.PI / 2;

  function spawn(x, y, a, w, life) {
    if (agents.length >= MAX) return;
    agents.push({ x, y, a, w, life, g: 0 });
  }
  function spawnRoot() {
    spawn(Math.random() * W, G + 1, HALF + (Math.random() - .5) * 1.3, 1.4 + Math.random() * 1.4, 240 + Math.random() * 340);
  }
  function step() {
    for (let i = agents.length - 1; i >= 0; i--) {
      const p = agents[i], px = p.x, py = p.y;
      p.a += (Math.random() - .5) * .38;
      p.a += (HALF - p.a) * .012;
      if (mouse.on) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
        if (d < 230 && d > 6) {
          let t = Math.atan2(dy, dx) - p.a;
          t = Math.atan2(Math.sin(t), Math.cos(t));
          p.a += t * .06;
        }
      }
      const sp = .8 + p.w * .3;
      p.x += Math.cos(p.a) * sp; p.y += Math.sin(p.a) * sp; p.life--;
      if (p.y < G + 3) { p.y = G + 3; p.a = HALF - (p.a - HALF) * .3 + .4; }
      ctx.strokeStyle = `rgba(201,242,107,${(.12 + p.w * .2).toFixed(3)})`;
      ctx.lineWidth = p.w;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
      if (Math.random() < .013 && p.w > .4 && agents.length < MAX) {
        agents.push({ x: p.x, y: p.y, a: p.a + (Math.random() < .5 ? -1 : 1) * (.45 + Math.random() * .55), w: p.w * .7, life: p.life * .75, g: p.g + 1 });
        p.w *= .92;
        if (nodes.length < 160) nodes.push({ x: p.x, y: p.y, t: 1, r: 1.6 + p.w * 1.8 });
      }
      if (p.life <= 0 || p.y > H + 4 || p.x < -4 || p.x > W + 4 || p.w < .28) {
        if (p.life <= 0 && nodes.length < 160) nodes.push({ x: p.x, y: p.y, t: 1, r: 1.4 });
        agents.splice(i, 1);
      }
    }
  }
  function fade() {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,.06)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }
  function makeSpores() {
    spores = Array.from({ length: Math.round(W / 28) }, () => ({
      x: Math.random() * W, y: Math.random() * G, v: .15 + Math.random() * .45, r: .6 + Math.random() * 1.6, ph: Math.random() * 6.28
    }));
  }
  function drawFx(t) {
    fctx.clearRect(0, 0, W, H);
    for (const s of spores) {
      s.y -= s.v; s.x += Math.sin(t / 1600 + s.ph) * .25;
      if (s.y < -6) { s.y = G - 2; s.x = Math.random() * W; }
      const a = .25 + .35 * Math.sin(t / 700 + s.ph) ** 2;
      fctx.fillStyle = `rgba(201,242,107,${a.toFixed(3)})`;
      fctx.beginPath(); fctx.arc(s.x, s.y, s.r, 0, 6.283); fctx.fill();
    }
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]; n.t -= .006;
      if (n.t <= 0) { nodes.splice(i, 1); continue; }
      const g = fctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
      g.addColorStop(0, `rgba(220,250,140,${(n.t * .9).toFixed(3)})`);
      g.addColorStop(1, 'rgba(201,242,107,0)');
      fctx.fillStyle = g;
      fctx.beginPath(); fctx.arc(n.x, n.y, n.r * 6, 0, 6.283); fctx.fill();
    }
    if (mouse.on) {
      const g = fctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
      g.addColorStop(0, 'rgba(201,242,107,.10)'); g.addColorStop(1, 'rgba(201,242,107,0)');
      fctx.fillStyle = g; fctx.fillRect(mouse.x - 160, mouse.y - 160, 320, 320);
    }
  }
  function size() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height; G = groundEl.offsetTop;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [cv, fx]) {
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      c.style.width = W + 'px'; c.style.height = H + 'px';
      c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    ctx.lineCap = 'round';
    agents = []; nodes = [];
    makeSpores();
    const roots = Math.max(6, Math.round(W / 110));
    for (let i = 0; i < roots; i++) spawnRoot();
    for (let k = 0; k < 260; k++) { step(); if (k % 6 === 0) fade(); if (agents.length < roots) spawnRoot(); }
    lastW = W;
  }
  size();
  let running = true, frame = 0;
  function loop(t) {
    if (running) {
      step();
      if (++frame % 6 === 0) fade();
      if (agents.length < Math.max(8, W / 90) && Math.random() < .1) spawnRoot();
      drawFx(t);
    }
    requestAnimationFrame(loop);
  }
  if (!RM) {
    requestAnimationFrame(loop);
    new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(hero);
  } else {
    drawFx(0);
  }
  let rT;
  addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => { if (Math.abs(hero.getBoundingClientRect().width - lastW) > 2) size(); else G = groundEl.offsetTop; }, 180);
  });
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = mouse.y > G;
  });
  hero.addEventListener('pointerleave', () => { mouse.on = false; });
  hero.addEventListener('pointerdown', e => {
    const r = hero.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (y <= G || RM) return;
    for (let k = 0; k < 8; k++) spawn(x, y, k / 8 * 6.283, 1.5, 120 + Math.random() * 120);
    nodes.push({ x, y, t: 1, r: 5 });
  });

  /* ruler */
  const ruler = $('#ruler');
  const depthPx = 460 / 125; // px per cm in the under-ground band
  for (let cm = 0; cm <= 120; cm += 10) {
    const i = document.createElement('i');
    if (cm % 30 === 0) i.className = 'maj';
    i.style.top = (cm * depthPx) + 'px';
    ruler.appendChild(i);
    if (cm % 30 === 0 && cm > 0) {
      const s = document.createElement('span');
      s.textContent = cm + ' cm'; s.style.top = (cm * depthPx) + 'px';
      ruler.appendChild(s);
    }
  }

  /* live probe values */
  const live = $$('[data-live]');
  function tickLive() {
    live.forEach(el => {
      const base = +el.dataset.live, amp = +el.dataset.amp, dec = +el.dataset.dec;
      const v = base + (Math.random() - .5) * 2 * amp;
      const s = v.toFixed(dec);
      if (s !== el.textContent) {
        el.textContent = s;
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 500);
      }
    });
  }
  if (!RM) setInterval(tickLive, 1800);
  let ago = 12; const agoEl = $('#ago');
  setInterval(() => { ago = ago >= 59 ? 2 : ago + 1; agoEl.textContent = ago + ' s'; }, 1000);

  /* hero field card graph */
  (function fieldGraph() {
    const pts = [], n = 40;
    for (let i = 0; i <= n; i++) {
      const x = i / n * 300;
      const y = 14 + i * 1.05 + Math.sin(i * .9) * 2.6 + Math.sin(i * .31) * 3;
      pts.push([x, Math.min(y, 58)]);
    }
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    $('#fcLine').setAttribute('d', d);
    $('#fcArea').setAttribute('d', d + ' L300 86 L0 86 Z');
    const last = pts[pts.length - 1];
    const dot = $('#fcDot'); dot.setAttribute('cx', last[0]); dot.setAttribute('cy', last[1]);
  })();

  /* ---------------- magnetic buttons ---------------- */
  if (fine && !RM) {
    $$('.mag').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${x * .18}px, ${y * .28}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------------- spotlight + tilt cards ---------------- */
  $$('.spot').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
      if (fine && !RM) {
        const rx = (y / r.height - .5) * -4, ry = (x / r.width - .5) * 5;
        c.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });

  /* ---------------- layers animation ---------------- */
  const layerVals = [[24.8, 58], [31.4, 74], [36.9, 86], [34.6, 81]];
  const layerEls = $$('#layers .layer');
  let wet = false;
  function cycleLayers() {
    wet = !wet;
    layerEls.forEach((el, i) => {
      const [v, w] = layerVals[i];
      const bump = wet ? [5.2, 3.1, 1.2, 0][i] : 0;
      setTimeout(() => {
        el.querySelector('.bar span').style.width = Math.min(98, w + bump * 2.6) + '%';
        el.querySelector('.v b').textContent = (v + bump).toFixed(1);
      }, i * 380);
    });
  }
  if (!RM) setInterval(cycleLayers, 3000);

  /* ---------------- forecast chart ---------------- */
  (function chart() {
    const svg = $('#chartSvg'), wrap = $('#chart'), tip = $('#tip');
    const data = [31.4, 30.2, 28.9, 27.5, 26.0, 24.6, 23.2, 34.1, 33.0, 31.6, 30.1, 28.7, 27.2, 25.8, 24.5];
    const L = 30, R = 312, T = 14, B = 154;
    const ymin = 15, ymax = 40;
    const X = i => L + i * (R - L) / 14;
    const Y = v => B - (v - ymin) / (ymax - ymin) * (B - T);
    let h = '';
    [20, 30, 40].forEach(v => { h += `<line class="gridl" x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 6}" y="${Y(v) + 3}" text-anchor="end">${v}%</text>`; });
    h += `<line class="fc" x1="${L}" x2="${R}" y1="${Y(36)}" y2="${Y(36)}"/><text class="lbl-fc" x="${R}" y="${Y(36) - 5}" text-anchor="end">Field capacity 36%</text>`;
    h += `<line class="rp" x1="${L}" x2="${R}" y1="${Y(22)}" y2="${Y(22)}"/><text class="lbl-rp" x="${R}" y="${Y(22) + 13}" text-anchor="end">Refill point 22%</text>`;
    const up = data.map((v, i) => [X(i), Y(v + 0.5 + i * .14)]);
    const dn = data.map((v, i) => [X(i), Y(v - 0.5 - i * .14)]).reverse();
    h += `<path class="band" d="M${up.map(p => p.join(' ')).join(' L')} L${dn.map(p => p.join(' ')).join(' L')} Z"/>`;
    const line = 'M' + data.map((v, i) => X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' L');
    h += `<path class="ln draw" id="fline" d="${line}"/>`;
    h += `<circle cx="${X(7)}" cy="${Y(34.1)}" r="4" fill="#C9F26B"/><text class="lbl-fc" x="${X(7) + 8}" y="${Y(34.1) - 8}">+11 mm</text>`;
    [['Today', 0], ['+7d', 7], ['+14d', 14]].forEach(([t, i]) => { h += `<text class="ax" x="${X(i)}" y="${B + 18}" text-anchor="${i === 0 ? 'start' : i === 14 ? 'end' : 'middle'}">${t}</text>`; });
    h += `<line class="cross" id="cx" y1="${T}" y2="${B}"/><circle class="cdot" id="cdot" r="5"/>`;
    h += `<rect x="${L}" y="${T}" width="${R - L}" height="${B - T}" fill="transparent" id="hit"/>`;
    svg.innerHTML = h;
    const fl = $('#fline'), len = fl.getTotalLength();
    fl.style.setProperty('--len', len);
    if (RM) fl.classList.add('done');
    const cx = $('#cx'), cd = $('#cdot');
    $('#hit').addEventListener('pointermove', e => {
      const r = svg.getBoundingClientRect();
      const sx = (e.clientX - r.left) / r.width * 320;
      const i = clamp(Math.round((sx - L) / ((R - L) / 14)), 0, 14);
      const x = X(i), y = Y(data[i]);
      cx.setAttribute('x1', x); cx.setAttribute('x2', x);
      cd.setAttribute('cx', x); cd.setAttribute('cy', y);
      tip.innerHTML = `${i === 0 ? 'Today' : 'Day +' + i} · <b>${data[i].toFixed(1)}%</b>${i === 7 ? ' · irrigate' : data[i] < 24 ? ' · near refill' : ''}`;
      tip.style.left = (x / 320 * r.width) + 'px';
      tip.style.top = (y / 180 * r.height) + 'px';
      wrap.classList.add('hov');
    });
    $('#hit').addEventListener('pointerleave', () => wrap.classList.remove('hov'));
  })();

  /* dial + countdown */
  const arc = $('#arc');
  let remain = 2 * 86400 + 6 * 3600 + 41 * 60 + 12;
  const cd = $('#countdown');
  setInterval(() => {
    remain = Math.max(0, remain - 1);
    const d = Math.floor(remain / 86400), hh = Math.floor(remain % 86400 / 3600), mm2 = Math.floor(remain % 3600 / 60), ss = remain % 60;
    cd.textContent = `in ${d}d ${String(hh).padStart(2, '0')}:${String(mm2).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }, 1000);

  /* mesh */
  (function mesh() {
    const N = [[24, 40], [92, 22], [150, 58], [214, 28], [276, 62], [54, 112], [128, 124], [198, 106], [256, 128]];
    const Lk = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 2], [6, 7], [7, 3], [7, 8], [8, 4], [2, 7], [1, 3]];
    let h = '';
    Lk.forEach(([a, b]) => { h += `<line class="lk" x1="${N[a][0]}" y1="${N[a][1]}" x2="${N[b][0]}" y2="${N[b][1]}"/>`; });
    if (!RM) Lk.forEach(([a, b], i) => {
      if (i % 2) return;
      const dur = (1.6 + (i % 5) * .45).toFixed(2);
      h += `<circle class="pk" r="2.4"><animateMotion dur="${dur}s" repeatCount="indefinite" path="M${N[a][0]} ${N[a][1]} L${N[b][0]} ${N[b][1]}"/></circle>`;
      h += `<circle class="pk" r="1.8" opacity=".6"><animateMotion dur="${(+dur + .7).toFixed(2)}s" begin="${(i * .3).toFixed(1)}s" repeatCount="indefinite" path="M${N[b][0]} ${N[b][1]} L${N[a][0]} ${N[a][1]}"/></circle>`;
    });
    N.forEach((p, i) => { h += `<circle class="nd${i === 2 ? ' gw' : ''}${i === 8 ? ' low' : ''}" cx="${p[0]}" cy="${p[1]}" r="${i === 2 ? 7 : 5}"/>`; });
    $('#mesh').innerHTML = h;
  })();

  /* ---------------- stage (how it works) ---------------- */
  (function stage() {
    const cg = $('#contours');
    let h = '';
    for (let k = 1; k <= 9; k++) {
      const r0 = 22 + k * 30; let d = '';
      for (let j = 0; j <= 64; j++) {
        const th = j / 64 * 6.283;
        const r = r0 * (1 + .09 * Math.sin(3 * th + k * .7) + .05 * Math.cos(5 * th - k));
        const x = 230 + Math.cos(th) * r, y = 220 + Math.sin(th) * r * .85;
        d += (j ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      h += `<path class="contour" d="${d}Z"/>`;
    }
    cg.innerHTML = h;
    const P = [[92, 120], [160, 170], [100, 180], [262, 110], [330, 160], [270, 180], [98, 268], [160, 330], [300, 300]];
    const GW = [210, 40];
    let nl = '', ll = '';
    P.forEach(p => { nl += `<circle class="pring" cx="${p[0]}" cy="${p[1]}" r="7"/><circle class="pnode" cx="${p[0]}" cy="${p[1]}" r="4.5"/>`; });
    nl += `<rect class="gw" x="${GW[0] - 7}" y="${GW[1] - 7}" width="14" height="14" rx="3"/><text class="blk-l" x="${GW[0] + 12}" y="${GW[1] + 4}">Gateway</text>`;
    const pairs = [[0, 1], [0, 2], [1, 2], [1, 5], [3, 5], [3, 4], [4, 5], [2, 6], [6, 7], [7, 8], [5, 8], [1, 7]];
    pairs.forEach(([a, b]) => { ll += `<line class="link" x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}"/>`; });
    ll += `<line class="link" x1="${GW[0]}" y1="${GW[1]}" x2="${P[0][0]}" y2="${P[0][1]}"/><line class="link" x1="${GW[0]}" y1="${GW[1]}" x2="${P[3][0]}" y2="${P[3][1]}"/>`;
    $('#snodes').innerHTML = nl; $('#slinks').innerHTML = ll;

    const st = $('#stage'), steps = $$('#steps .step');
    const wide = matchMedia('(min-width: 901px)');
    function setStep(n) {
      for (let i = 1; i <= 4; i++) st.classList.toggle('s' + i, i <= n);
      steps.forEach(s => s.classList.toggle('on', +s.dataset.s === n));
    }
    if (wide.matches) setStep(1);
    const io = new IntersectionObserver(es => {
      if (!wide.matches) return;
      es.forEach(e => { if (e.isIntersecting) setStep(+e.target.dataset.s); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
    wide.addEventListener('change', () => { if (!wide.matches) setStep(4); else setStep(1); });
  })();

  /* ---------------- dashboard map ---------------- */
  (function map() {
    const box = $('#mapbox'), c = $('#map'), m = c.getContext('2d'), tip = $('#maptip');
    let mw = 0, mh = 0, layer = 'm';
    const blocks = [];
    const names = ['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'B-3', 'C-1', 'C-2', 'C-3', 'C-4', 'D-1', 'D-2', 'D-3'];
    const layout = [[0, 0, .24, .33], [.25, 0, .24, .33], [.5, 0, .22, .33], [.73, 0, .27, .33],
      [0, .34, .32, .32], [.33, .34, .32, .32], [.66, .34, .34, .32],
      [0, .67, .19, .33], [.2, .67, .19, .33], [.4, .67, .19, .33], [.6, .67, .2, .33], [.81, .67, .19, .33]];
    // 12 rects, use first 12 names but rename to keep C-4 and D-1 present
    const labels = ['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'B-3', 'C-1', 'C-2', 'C-3', 'C-4', 'D-1'];
    layout.forEach((r, i) => blocks.push({ n: labels[i], x: r[0], y: r[1], w: r[2], h: r[3] }));
    const stops = [[0, [74, 52, 23]], [.3, [122, 90, 34]], [.5, [79, 111, 42]], [.78, [156, 204, 79]], [1, [216, 247, 127]]];
    function col(v) {
      for (let i = 1; i < stops.length; i++) {
        if (v <= stops[i][0]) {
          const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (v - a) / (b - a);
          return ca.map((x, k) => Math.round(x + (cb[k] - x) * t));
        }
      }
      return stops[stops.length - 1][1];
    }
    function val(x, y) {
      let v = .58 + .2 * Math.sin(x * 6.1 + 1.3) * Math.cos(y * 4.7) + .12 * Math.sin((x + y) * 9.3) + .07 * Math.cos(x * 13 - y * 7);
      // dry pockets in C-4 and D-1
      v -= .42 * Math.exp(-((x - .7) ** 2 / .012 + (y - .83) ** 2 / .02));
      v -= .32 * Math.exp(-((x - .9) ** 2 / .01 + (y - .85) ** 2 / .02));
      if (layer === 't') v = .35 + .4 * x + .1 * Math.sin(y * 8);
      if (layer === 'n') v = .5 + .3 * Math.cos(x * 5 + y * 3) - .2 * y;
      return clamp(v, 0, 1);
    }
    function draw() {
      const r = box.getBoundingClientRect();
      mw = r.width; mh = Math.max(220, r.height);
      const dpr = Math.min(2, devicePixelRatio || 1);
      c.width = mw * dpr; c.height = mh * dpr; c.style.height = mh + 'px';
      m.setTransform(dpr, 0, 0, dpr, 0, 0);
      m.fillStyle = '#0B110B'; m.fillRect(0, 0, mw, mh);
      const pad = 10, cs = 6;
      blocks.forEach(b => {
        const bx = pad + b.x * (mw - pad * 2) + 2, by = pad + b.y * (mh - pad * 2) + 2;
        const bw = b.w * (mw - pad * 2) - 4, bh = b.h * (mh - pad * 2) - 4;
        b.px = [bx, by, bw, bh];
        m.save(); m.beginPath(); m.roundRect ? m.roundRect(bx, by, bw, bh, 6) : m.rect(bx, by, bw, bh); m.clip();
        for (let yy = by; yy < by + bh; yy += cs) for (let xx = bx; xx < bx + bw; xx += cs) {
          const [R, G2, B2] = col(val(xx / mw, yy / mh));
          m.fillStyle = `rgb(${R},${G2},${B2})`; m.fillRect(xx, yy, cs - 1, cs - 1);
        }
        m.restore();
        m.strokeStyle = 'rgba(231,238,221,.18)'; m.lineWidth = 1;
        m.beginPath(); m.roundRect ? m.roundRect(bx + .5, by + .5, bw - 1, bh - 1, 6) : m.rect(bx, by, bw, bh); m.stroke();
        m.fillStyle = 'rgba(5,8,5,.75)'; m.fillRect(bx + 6, by + 6, 30, 15);
        m.fillStyle = '#E7EEDD'; m.font = '10px "Geist Mono", ui-monospace, monospace'; m.fillText(b.n, bx + 10, by + 17);
        const px = bx + bw * .62, py = by + bh * .6;
        m.fillStyle = '#050805'; m.beginPath(); m.arc(px, py, 4.5, 0, 6.283); m.fill();
        m.strokeStyle = '#E7EEDD'; m.lineWidth = 1.5; m.stroke();
      });
    }
    function readout(b, x, y) {
      const v = val(x / mw, y / mh);
      if (layer === 'm') return `${b.n} · <b>${(15 + v * 25).toFixed(1)}%</b> VWC`;
      if (layer === 't') return `${b.n} · <b>${(19 + v * 9).toFixed(1)}°C</b> at 10 cm`;
      return `${b.n} · <b>${Math.round(4 + v * 26)} ppm</b> nitrate`;
    }
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const b = blocks.find(b => b.px && x >= b.px[0] && x <= b.px[0] + b.px[2] && y >= b.px[1] && y <= b.px[1] + b.px[3]);
      if (!b) { tip.style.opacity = 0; return; }
      tip.innerHTML = readout(b, x, y); tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.style.opacity = 1;
    });
    c.addEventListener('pointerleave', () => { tip.style.opacity = 0; });
    $$('.seg button').forEach(btn => btn.addEventListener('click', () => {
      $$('.seg button').forEach(x => x.classList.toggle('on', x === btn));
      layer = btn.dataset.layer; draw();
    }));
    draw();
    let t2; addEventListener('resize', () => { clearTimeout(t2); t2 = setTimeout(draw, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  })();

  /* dashboard tilt on scroll + nav state */
  const dash = $('#dash');
  function onScroll() {
    nav.classList.toggle('scrolled', scrollY > 30);
    if (!RM) {
      const r = dash.getBoundingClientRect(), vh = innerHeight;
      const p = clamp((vh - r.top) / (vh * .75), 0, 1);
      dash.style.setProperty('--tilt', (18 * (1 - p)).toFixed(2) + 'deg');
      dash.style.setProperty('--sc', (.93 + .07 * p).toFixed(3));
    }
    let cur = null;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('active', i === cur || (cur === null && i === 0)));
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- reveals + counters ---------------- */
  function countUp(el) {
    const to = +el.dataset.count, dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1600;
    const f = now => {
      const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = (to * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }
  const rio = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.id === 'bento') {
        arc.style.strokeDashoffset = 439.8 * (1 - .72);
        const fl = $('#fline'); fl && fl.classList.add('done');
      }
      if (!RM) $$('[data-count]', e.target).forEach(countUp);
      rio.unobserve(e.target);
    });
  }, { threshold: .12 });
  $$('.rv').forEach(el => rio.observe(el));
  if (RM) arc.style.strokeDashoffset = 439.8 * (1 - .72);

  /* ---------------- form ---------------- */
  const form = $('#signup'), msg = $('#formMsg'), email = $('#email');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      msg.className = 'form-msg err';
      msg.textContent = 'Enter a work email like you@yourfarm.com so an agronomist can reach you.';
      email.focus(); return;
    }
    msg.className = 'form-msg ok';
    msg.textContent = `Pilot request received for ${v}. A field agronomist will reply within one working day.`;
    form.reset();
  });
})();
