/**
 * cpq-solutions.de – statischer Zahnrad-Renderer für Druck- und Bildvorlagen.
 * Zeichnet im gleichen Stil wie assets/js/background.js (Webseite),
 * aber deterministisch und in beliebiger Auflösung.
 */
window.CPQ = (function () {
  const C = {
    bg: '#07111f', bgDeep: '#03070f', navy: '#0f172a', grid: '#1a3550',
    accent: '#38bdf8', g1: '#2060a0', g2: '#2a7ab4', g3: '#3a8cc4', g4: '#3ab0ff', g5: '#60c8ff',
    glow: '#b8f0ff', fg: '#e2e8f0', muted: '#94a3b8',
  };

  function setup(canvas, W, H) {
    canvas.width = W; canvas.height = H;
    return canvas.getContext('2d');
  }

  function background(ctx, W, H, opts = {}) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const cx = opts.cx ?? W / 2, cy = opts.cy ?? H / 2;
    const v = ctx.createRadialGradient(cx, cy, H * 0.1, cx, cy, Math.max(W, H) * 0.7);
    v.addColorStop(0, 'rgba(10,20,40,0)');
    v.addColorStop(1, 'rgba(3,7,15,0.75)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  function grid(ctx, W, H, step, alpha = 0.35, lw = 0.6) {
    ctx.save();
    ctx.strokeStyle = C.grid; ctx.lineWidth = lw; ctx.globalAlpha = alpha;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  /** Erzeugt ein Zahnrad, das in `parent` eingreift. */
  function mesh(parent, teeth, dir, extra = {}) {
    const r = parent.r * teeth / parent.teeth;
    const dist = (parent.r + r) * 1.0 + parent.r * 0.02;
    return Object.assign({
      x: parent.x + Math.cos(dir) * dist,
      y: parent.y + Math.sin(dir) * dist,
      r, teeth, angle: dir + Math.PI / teeth,
      alpha: parent.alpha, stroke: parent.stroke, lineW: parent.lineW,
    }, extra);
  }

  function gear(ctx, g, unit = 1) {
    const { x, y, r, teeth, angle = 0, alpha = 0.2, stroke = C.g3 } = g;
    const lineW = (g.lineW ?? 1.5) * unit;
    const toothH = r * 0.18, innerR = r * 0.62, hubR = r * 0.18;
    const spokes = Math.max(4, Math.floor(teeth / 10) + 3);
    const step = Math.PI * 2 / teeth, tw = step * 0.38;
    ctx.save();
    ctx.globalAlpha = alpha; ctx.strokeStyle = stroke; ctx.fillStyle = g.fill ?? C.bg; ctx.lineWidth = lineW;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = angle + i * step;
      const pts = [[a - step / 2 + tw, r], [a - tw, r + toothH], [a + tw, r + toothH], [a + step / 2 - tw, r]];
      pts.forEach(([pa, pr], k) => {
        const px = x + Math.cos(pa) * pr, py = y + Math.sin(pa) * pr;
        (i === 0 && k === 0) ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
    }
    ctx.closePath();
    if (g.fill !== null) { ctx.globalAlpha = 1; ctx.fill(); ctx.globalAlpha = alpha; }
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, innerR, 0, Math.PI * 2); ctx.stroke();
    for (let s = 0; s < spokes; s++) {
      const sa = angle + Math.PI * 2 / spokes * s;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(sa) * hubR * 1.5, y + Math.sin(sa) * hubR * 1.5);
      ctx.lineTo(x + Math.cos(sa) * innerR * 0.92, y + Math.sin(sa) * innerR * 0.92);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, y, hubR, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, hubR * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = stroke; ctx.globalAlpha = Math.min(1, alpha * 1.5); ctx.fill();

    if (g.glow !== false) {
      const every = g.glowEvery ?? 4;
      for (let i = 0; i < teeth; i += every) {
        const ta = angle + i * step;
        const tx = x + Math.cos(ta) * (r + toothH * 0.5), ty = y + Math.sin(ta) * (r + toothH * 0.5);
        dot(ctx, tx, ty, 7 * unit, 1.5 * unit, alpha * 1.4, alpha * 2.5, g.glowColor);
      }
      const hg = ctx.createRadialGradient(x, y, 0, x, y, hubR * 1.4);
      hg.addColorStop(0, 'rgba(100,210,255,0.55)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(x, y, hubR * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = hg; ctx.globalAlpha = Math.min(1, alpha * 2); ctx.fill();
    }
    ctx.restore();
  }

  /** Leuchtpunkt (Halo + Kern). */
  function dot(ctx, x, y, halo, core, aHalo = 0.5, aCore = 1, color) {
    ctx.save();
    const rgb = color || '80,190,255';
    const gr = ctx.createRadialGradient(x, y, 0, x, y, halo);
    gr.addColorStop(0, `rgba(${rgb},0.6)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = Math.min(1, aHalo); ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(x, y, halo, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = Math.min(1, aCore); ctx.fillStyle = C.glow;
    ctx.beginPath(); ctx.arc(x, y, core, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /** Deterministischer Zufall (gleiches Bild bei jedem Rendern). */
  function rng(seed = 42) {
    return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  return { C, setup, background, grid, gear, mesh, dot, rng, loadImage };
})();
