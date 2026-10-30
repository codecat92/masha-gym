/* Cute stick-figure exercise animations (SVG, no assets needed).
   Each animation is two poses (a -> b -> a). Poses use hip position, torso angle and
   per-limb specs. Angles: 0 = right, 90 = down, -90 = up (screen coordinates). */
(function (global) {
  const NS = 'http://www.w3.org/2000/svg';
  const L = { torso: 58, ua: 34, fa: 32, th: 46, sh: 46, ft: 16, head: 21 };
  const FLOOR = 197;
  const rad = (d) => (d * Math.PI) / 180;
  const vec = (a, l) => [Math.cos(rad(a)) * l, Math.sin(rad(a)) * l];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];

  function ik(p0, target, l1, l2, s) {
    let dx = target[0] - p0[0], dy = target[1] - p0[1];
    let d = Math.hypot(dx, dy) || 0.001;
    const maxD = l1 + l2 - 0.01, minD = Math.abs(l1 - l2) + 0.5;
    const dd = Math.min(Math.max(d, minD), maxD);
    const ux = dx / d, uy = dy / d;
    const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
    const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    const bx = p0[0] + ux * a, by = p0[1] + uy * a;
    const joint = [bx + s * h * -uy, by + s * h * ux];
    const end = [p0[0] + ux * dd, p0[1] + uy * dd];
    return [joint, end];
  }

  function solveArm(shoulder, spec) {
    if (spec.a) {
      const e = add(shoulder, vec(spec.a[0], L.ua));
      return [shoulder, e, add(e, vec(spec.a[1], L.fa))];
    }
    const target = spec.rel ? [shoulder[0] + spec.rel[0], shoulder[1] + spec.rel[1]] : spec.hand;
    const [j, e] = ik(shoulder, target, L.ua, L.fa, spec.s || 1);
    return [shoulder, j, e];
  }
  function solveLeg(hip, spec) {
    let knee, ankle;
    if (spec.a) {
      knee = add(hip, vec(spec.a[0], L.th));
      ankle = add(knee, vec(spec.a[1], L.sh));
    } else {
      [knee, ankle] = ik(hip, spec.foot, L.th, L.sh, spec.s || -1);
    }
    const toe = add(ankle, vec(spec.ft || 0, L.ft));
    return [hip, knee, ankle, toe];
  }

  function lerp(a, b, k) {
    if (typeof a === 'number') return a + (b - a) * k;
    if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], k));
    if (a && typeof a === 'object') {
      const o = {};
      for (const key in a) o[key] = key in b ? lerp(a[key], b[key], k) : a[key];
      return o;
    }
    return a;
  }

  /* ---------- props (static scenery) ---------- */
  const P = (inner) => `<g class="pr">${inner}</g>`;
  const rect = (x, y, w, h, r = 4, c = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" class="${c}"/>`;
  const line = (x1, y1, x2, y2, w = 8, c = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}" class="pl ${c}"/>`;

  const seatProps = (bx) =>
    P(
      line(bx, 56, bx, 150, 12) + // backrest
        line(bx, 160, 160, 160, 12) + // seat
        line(bx + 4, 168, bx + 4, 190, 8) +
        rect(0, FLOOR - 2, 320, 6, 3, 'fl')
    );

  /* ---------- animation definitions ---------- */
  const ANIMS = {};

  ANIMS.walk = {
    dur: 1.6, hold: 0,
    props: P(rect(46, 190, 200, 9, 4, 'bd') + rect(250, 70, 8, 128, 3) + rect(236, 56, 44, 20, 8) + line(190, 128, 254, 128, 6)),
    a: { hip: [150, 98], t: -88,
      arms: [{ a: [105, 80] }, { a: [70, 40] }],
      legs: [{ a: [72, 80] }, { a: [108, 130] }] },
    b: { hip: [150, 98], t: -88,
      arms: [{ a: [70, 40] }, { a: [105, 80] }],
      legs: [{ a: [108, 130] }, { a: [72, 80] }] },
  };

  ANIMS.squat = {
    dur: 3.2,
    holds: [{ type: 'db', arm: 0 }],
    props: P(rect(0, FLOOR - 2, 320, 6, 3, 'fl')),
    a: { hip: [150, 98], t: -90, arms: [{ rel: [26, 24], s: 1 }], legs: [{ foot: [150, 190], s: -1 }] },
    b: { hip: [106, 128], t: -58, arms: [{ rel: [26, 24], s: 1 }], legs: [{ foot: [150, 190], s: -1 }] },
  };

  ANIMS.legpress = {
    dur: 3.6,
    holds: [{ type: 'plate', leg: 0 }],
    props: P(
      rect(0, FLOOR - 2, 320, 6, 3, 'fl') +
        line(96, 161, 52, 123, 12) + // backrest
        line(92, 170, 132, 170, 10) + // seat
        line(120, 182, 235, 70, 6, 'rail')
    ),
    a: { hip: [105, 150], t: -140, arms: [{ rel: [44, 28], s: 1 }], legs: [{ a: [-52, 36], ft: -54 }] },
    b: { hip: [105, 150], t: -140, arms: [{ rel: [44, 28], s: 1 }], legs: [{ a: [-30, -22], ft: -112 }] },
  };

  ANIMS.chestpress = {
    dur: 3,
    holds: [{ type: 'grip', arm: 0, pivot: [98, 100] }],
    props: seatProps(104),
    a: { hip: [120, 144], t: -92, arms: [{ rel: [22, 10], s: 1 }], legs: [{ foot: [166, 190], s: -1 }] },
    b: { hip: [120, 144], t: -92, arms: [{ rel: [66, 4], s: 1 }], legs: [{ foot: [166, 190], s: -1 }] },
  };

  ANIMS.pushup = {
    dur: 3,
    props: P(rect(0, FLOOR - 2, 320, 6, 3, 'fl') + rect(176, 152, 120, 12, 5, 'bd') + rect(190, 164, 8, 34, 3) + rect(276, 164, 8, 34, 3)),
    a: { hip: [130.5, 122.9], t: -40, arms: [{ hand: [203, 146], s: 1 }], legs: [{ foot: [60, 182], s: -1, ft: 62 }] },
    b: { hip: [139.7, 136], t: -30, arms: [{ hand: [203, 146], s: 1 }], legs: [{ foot: [60, 182], s: -1, ft: 62 }] },
  };

  ANIMS.pulldown = {
    dur: 3.2,
    holds: [{ type: 'bar', arm: 0, cable: [200, -26] }],
    props: P(
      rect(0, FLOOR - 2, 320, 6, 3, 'fl') +
        line(150, -26, 236, -26, 8) + line(236, -26, 236, 192, 10) +
        line(106, 156, 150, 156, 12) + rect(146, 124, 40, 12, 5, 'bd') + line(108, 163, 108, 192, 8)
    ),
    a: { hip: [128, 144], t: -88, arms: [{ rel: [40, -52], s: 1 }], legs: [{ foot: [176, 190], s: -1 }] },
    b: { hip: [128, 144], t: -96, arms: [{ rel: [24, -2], s: 1 }], legs: [{ foot: [176, 190], s: -1 }] },
  };

  ANIMS.row = {
    dur: 3.2,
    holds: [{ type: 'bar', arm: 0, cable: [258, 118] }],
    props: P(
      rect(0, FLOOR - 2, 320, 6, 3, 'fl') +
        line(262, 60, 262, 192, 10) + rect(194, 150, 8, 48, 3, 'bd') + line(86, 162, 134, 162, 12) + line(96, 168, 96, 192, 8)
    ),
    a: { hip: [105, 150], t: -72, arms: [{ rel: [62, 23], s: 1 }], legs: [{ foot: [190, 172], s: -1 }] },
    b: { hip: [105, 150], t: -96, arms: [{ rel: [21, 33], s: 1 }], legs: [{ foot: [190, 172], s: -1 }] },
  };

  ANIMS.dbrow = {
    dur: 3,
    holds: [{ type: 'db', arm: 0 }],
    props: P(rect(0, FLOOR - 2, 320, 6, 3, 'fl') + rect(70, 150, 150, 12, 5, 'bd') + rect(84, 162, 8, 36, 3) + rect(198, 162, 8, 36, 3)),
    a: { hip: [98, 100], t: -20,
      arms: [{ a: [92, 88] }, { hand: [180, 146], s: 1 }],
      legs: [{ foot: [112, 190], s: -1 }, { a: [62, 175] }] },
    b: { hip: [98, 100], t: -20,
      arms: [{ a: [160, 92] }, { hand: [180, 146], s: 1 }],
      legs: [{ foot: [112, 190], s: -1 }, { a: [62, 175] }] },
  };

  ANIMS.shoulderpress = {
    dur: 3.2,
    holds: [{ type: 'db', arm: 0 }],
    props: seatProps(104),
    a: { hip: [120, 144], t: -90, arms: [{ a: [95, -85] }], legs: [{ foot: [166, 190], s: -1 }] },
    b: { hip: [120, 144], t: -90, arms: [{ a: [-88, -92] }], legs: [{ foot: [166, 190], s: -1 }] },
  };
  ANIMS['shoulderpress-m'] = Object.assign({}, ANIMS.shoulderpress, {
    holds: [{ type: 'grip', arm: 0 }],
  });

  ANIMS.rdl = {
    dur: 3.4,
    holds: [{ type: 'db', arm: 0 }],
    props: P(rect(0, FLOOR - 2, 320, 6, 3, 'fl')),
    a: { hip: [150, 98], t: -90, arms: [{ a: [90, 90] }], legs: [{ foot: [150, 190], s: -1 }] },
    b: { hip: [112, 108], t: -30, arms: [{ a: [90, 90] }], legs: [{ foot: [150, 190], s: -1 }] },
  };

  ANIMS.bridge = {
    dur: 3,
    props: P(rect(0, FLOOR - 2, 320, 6, 3, 'fl') + rect(8, 183, 304, 8, 4, 'bd')),
    a: { hip: [135, 177], t: 178, arms: [{ a: [2, 2] }], legs: [{ foot: [200, 183], s: -1 }] },
    b: { hip: [130, 151], t: 150, arms: [{ a: [2, 2] }], legs: [{ foot: [200, 183], s: -1 }] },
  };

  ANIMS.plank = {
    dur: 2.4,
    props: P(rect(0, FLOOR - 2, 320, 6, 3, 'fl') + rect(150, 188, 130, 8, 4, 'bd')),
    a: { hip: [150, 163], t: -12, arms: [{ a: [90, 0] }], legs: [{ foot: [60, 183], s: -1, ft: 70 }] },
    b: { hip: [150.5, 160.5], t: -10, arms: [{ a: [90, 0] }], legs: [{ foot: [60, 183], s: -1, ft: 70 }] },
  };

  ANIMS.deadbug = {
    dur: 3.6,
    props: P(rect(0, FLOOR - 2, 320, 6, 3, 'fl') + rect(8, 183, 304, 8, 4, 'bd')),
    a: { hip: [150, 175], t: 178,
      arms: [{ a: [-90, -90] }, { a: [-90, -90] }],
      legs: [{ a: [-90, 0] }, { a: [-90, 0] }] },
    b: { hip: [150, 175], t: 178,
      arms: [{ a: [-90, -90] }, { a: [178, 178] }],
      legs: [{ a: [-8, -8] }, { a: [-90, 0] }] },
  };

  ANIMS.stretch = {
    dur: 4,
    props: P(rect(0, FLOOR - 2, 320, 6, 3, 'fl')),
    a: { hip: [150, 98], t: -90, arms: [{ a: [-90, -90] }], legs: [{ foot: [150, 190], s: -1 }] },
    b: { hip: [128, 102], t: 30, arms: [{ a: [90, 90] }], legs: [{ foot: [150, 190], s: -1 }] },
  };

  /* ---------- rendering ---------- */
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const pts = (arr) => arr.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  function build(def) {
    const svg = el('svg', { viewBox: '0 -40 320 244', class: 'figure', role: 'img', 'aria-hidden': 'true' });
    const defs = el('defs', {}, svg);
    const bg = el('g', { class: 'bgdeco' }, svg);
    el('circle', { cx: 60, cy: 20, r: 3, class: 'spark' }, bg);
    el('circle', { cx: 280, cy: 0, r: 4, class: 'spark' }, bg);
    el('circle', { cx: 24, cy: 120, r: 2.5, class: 'spark' }, bg);
    const props = el('g', {}, svg);
    props.innerHTML = def.props || '';
    const parts = {
      cable: el('line', { class: 'cable' }, svg),
      far: [], near: [],
    };
    parts.legFar = el('g', { class: 'far' }, svg);
    parts.armFar = el('g', { class: 'far' }, svg);
    parts.torso = el('line', { class: 'torso' }, svg);
    parts.legNear = el('g', {}, svg);
    parts.head = el('g', {}, svg);
    parts.armNear = el('g', {}, svg);
    parts.held = el('g', {}, svg);
    // head details
    const h = parts.head;
    el('path', { d: 'M-10,-6 C-26,-4 -26,12 -17,18', class: 'hair', fill: 'none', 'stroke-width': 6, 'stroke-linecap': 'round' }, h);
    el('circle', { r: 12, class: 'skin' }, h);
    el('path', { d: 'M-12.5,1 C-15,-15 13,-17 12.5,-3 C6,-9 -6,-9 -12.5,1 Z', class: 'hair-fill' }, h);
    el('path', { d: 'M-11,-9 l-7,-5 l1,10 z M-11,-9 l-1,-10 l8,5 z', class: 'bow' }, h);
    el('circle', { cx: 5.5, cy: 1, r: 1.8, class: 'eye' }, h);
    el('circle', { cx: 8.5, cy: 6, r: 3.2, class: 'blush' }, h);
    el('path', { d: 'M3.5,6.5 q2.2,2.6 4.2,0', class: 'smile', fill: 'none' }, h);
    return { svg, parts };
  }

  function limbPath(group, points, cls) {
    group.innerHTML = '';
    if (points.length === 4) {
      // leg: hip, knee, ankle, toe
      el('polyline', { points: pts(points.slice(0, 3)), class: 'limb ' + (cls || '') }, group);
      el('line', { x1: points[2][0], y1: points[2][1], x2: points[3][0], y2: points[3][1], class: 'shoe' }, group);
    } else {
      el('polyline', { points: pts(points), class: 'limb ' + (cls || '') }, group);
    }
  }

  function draw(fig, def, pose) {
    const { parts } = fig;
    const hip = pose.hip;
    const t = pose.t;
    const shoulder = add(hip, vec(t, L.torso));
    parts.torso.setAttribute('x1', hip[0]); parts.torso.setAttribute('y1', hip[1]);
    parts.torso.setAttribute('x2', shoulder[0]); parts.torso.setAttribute('y2', shoulder[1]);
    const headPos = add(shoulder, vec(t, L.head));
    parts.head.setAttribute('transform', `translate(${headPos[0].toFixed(1)},${headPos[1].toFixed(1)}) rotate(${(t + 90).toFixed(1)})`);

    const legs = pose.legs.map((s) => solveLeg(hip, s));
    const arms = pose.arms.map((s) => solveArm(shoulder, s));
    // far = index 1, near = index 0
    limbPath(parts.legNear, legs[0]);
    if (legs[1]) limbPath(parts.legFar, legs[1]); else parts.legFar.innerHTML = '';
    limbPath(parts.armNear, arms[0]);
    if (arms[1]) limbPath(parts.armFar, arms[1]); else parts.armFar.innerHTML = '';

    // held items
    parts.held.innerHTML = '';
    parts.cable.setAttribute('visibility', 'hidden');
    (def.holds || []).forEach((h) => {
      const hand = arms[h.arm || 0][2];
      if (h.type === 'db') {
        el('circle', { cx: hand[0], cy: hand[1], r: 10, class: 'plate' }, parts.held);
        el('circle', { cx: hand[0], cy: hand[1], r: 3.5, class: 'plate-in' }, parts.held);
      } else if (h.type === 'bar' || h.type === 'grip') {
        el('circle', { cx: hand[0], cy: hand[1], r: 6, class: 'grip' }, parts.held);
        if (h.cable) {
          parts.cable.setAttribute('visibility', 'visible');
          parts.cable.setAttribute('x1', hand[0]); parts.cable.setAttribute('y1', hand[1]);
          parts.cable.setAttribute('x2', h.cable[0]); parts.cable.setAttribute('y2', h.cable[1]);
        }
        if (h.pivot) {
          el('line', { x1: h.pivot[0], y1: h.pivot[1], x2: hand[0], y2: hand[1], class: 'lever', 'stroke-width': 6 }, parts.held).setAttribute('stroke-linecap', 'round');
          parts.held.appendChild(parts.held.lastChild);
        }
      } else if (h.type === 'plate') {
        const ankle = legs[h.leg || 0][2];
        const ang = pose.legs[h.leg || 0].a ? pose.legs[h.leg || 0].a[1] : 0;
        const d = vec(ang + 90, 24);
        el('line', { x1: ankle[0] + d[0] + 6 * Math.cos(rad(ang)), y1: ankle[1] + d[1] + 6 * Math.sin(rad(ang)),
          x2: ankle[0] - d[0] + 6 * Math.cos(rad(ang)), y2: ankle[1] - d[1] + 6 * Math.sin(rad(ang)),
          class: 'sled', 'stroke-width': 9, 'stroke-linecap': 'round' }, parts.held);
      }
    });
  }

  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
  function phase(def, time) {
    const dur = def.dur || 3;
    const p = (time % dur) / dur; // 0..1
    // hold a 12%, a->b 38%, hold b 12%, b->a 38%
    if (p < 0.12) return 0;
    if (p < 0.5) return ease((p - 0.12) / 0.38);
    if (p < 0.62) return 1;
    return 1 - ease((p - 0.62) / 0.38);
  }

  const live = new Set();
  let raf = 0;
  function loop(ts) {
    const reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    live.forEach((m) => {
      if (!m.svg.isConnected) { live.delete(m); return; }
      if (m.svg.getBoundingClientRect().height === 0 || m.paused) return;
      const k = reduce ? 0 : phase(m.def, ts / 1000);
      draw(m.fig, m.def, lerp(m.def.a, m.def.b, k));
    });
    raf = live.size ? requestAnimationFrame(loop) : 0;
  }

  function mount(container, animId) {
    const def = ANIMS[animId] || ANIMS.squat;
    const fig = build(def);
    container.innerHTML = '';
    container.appendChild(fig.svg);
    const m = { svg: fig.svg, fig, def, paused: false };
    draw(fig, def, def.a);
    live.add(m);
    if (!raf) raf = requestAnimationFrame(loop);
    return {
      pause() { m.paused = true; },
      play() { m.paused = false; },
      showEnd() { draw(fig, def, def.b); },
      showStart() { draw(fig, def, def.a); },
    };
  }

  function still(container, animId, which) {
    const def = ANIMS[animId] || ANIMS.squat;
    const fig = build(def);
    container.innerHTML = '';
    container.appendChild(fig.svg);
    draw(fig, def, which === 'b' ? def.b : def.a);
  }

  global.Anim = { mount, still, ids: () => Object.keys(ANIMS) };
})(window);
