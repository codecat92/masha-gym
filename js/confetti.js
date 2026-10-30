/* Tiny pink confetti: hearts, stars and dots. */
(function (global) {
  function burst(opts) {
    const reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const big = opts && opts.big;
    const cv = document.createElement('canvas');
    cv.className = 'confetti';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const colors = ['#ff4f98', '#ff8fc0', '#ffc2dc', '#a98bff', '#ffd36e', '#ffffff'];
    const n = big ? 170 : 110;
    const ps = [];
    for (let i = 0; i < n; i++) {
      const fromLeft = i % 2 === 0;
      ps.push({
        x: (fromLeft ? 0.1 : 0.9) * W,
        y: H * 0.72,
        vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 7) * dpr,
        vy: -(9 + Math.random() * 12) * dpr,
        g: 0.32 * dpr,
        s: (6 + Math.random() * 9) * dpr,
        r: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.3,
        c: colors[(Math.random() * colors.length) | 0],
        k: ['heart', 'star', 'dot'][(Math.random() * 3) | 0],
      });
    }
    function heart(s) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.5, -s, 0, -s * 0.45);
      ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.3, 0, s * 0.35);
      ctx.fill();
    }
    function star(s) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5, r = i % 2 ? s * 0.4 : s;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
    let t0 = performance.now();
    function frame(now) {
      const dt = now - t0;
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p) => {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.k === 'heart') heart(p.s); else if (p.k === 'star') star(p.s);
        else { ctx.beginPath(); ctx.arc(0, 0, p.s * 0.4, 0, 6.28); ctx.fill(); }
        ctx.restore();
      });
      if (dt < (big ? 4200 : 3000)) requestAnimationFrame(frame);
      else cv.remove();
    }
    requestAnimationFrame(frame);
  }
  global.Confetti = { burst };
})(window);
