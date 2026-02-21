/**
 * CPQ Solutions – Hintergrund: Zahnräder
 * Einbinden: <script src="assets/js/background.js"></script>
 * Auf Mobilgeräten (<768px) werden keine Glühpunkte gezeichnet.
 */
(function () {

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position:      'fixed',
    top:           '0',
    left:          '0',
    width:         '100%',
    height:        '100%',
    zIndex:        '-1',
    pointerEvents: 'none',
  });
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H, gears = [];
  let isMobile = false; // wird in resize() gesetzt

  const BASE_SPEED = 0.001;

  function meshOffset(tB, angle) { return angle + Math.PI / tB; }

  function buildGears() {
    const sc = Math.min(W, H) / 900;
    gears = [];

    function meshGear(parent, teeth, angleDir, alpha, stroke, lineW) {
      const r    = parent.r * teeth / parent.teeth;
      const dist = parent.r + r - Math.min(W, H) / 900;
      return {
        x: parent.x + Math.cos(angleDir) * dist,
        y: parent.y + Math.sin(angleDir) * dist,
        r, teeth,
        angle: meshOffset(teeth, angleDir),
        speed: -parent.speed * parent.teeth / teeth,
        alpha, stroke, lineW
      };
    }

    // Cluster 1: Rechts-unten
    const g1 = { x:W*0.78, y:H*0.76, r:190*sc, teeth:72, angle:0,
                 speed:BASE_SPEED, alpha:0.18, stroke:'#3a8cc4', lineW:1.5 };
    gears.push(g1);
    const g2 = meshGear(g1, 28, -0.6, 0.22, '#3ab0ff', 1.2); gears.push(g2);
    gears.push(meshGear(g2, 16, -1.9, 0.26, '#60c8ff', 1.0));

    // Cluster 2: Links-oben
    const g4 = { x:W*0.18, y:H*0.22, r:145*sc, teeth:56, angle:0.5,
                 speed:-BASE_SPEED*0.8, alpha:0.17, stroke:'#2a7ab4', lineW:1.5 };
    gears.push(g4);
    const g5 = meshGear(g4, 32, 0.9, 0.21, '#3ab0ff', 1.2); gears.push(g5);
    gears.push(meshGear(g5, 20, 2.4, 0.25, '#60c8ff', 1.0));

    // Cluster 3: Mitte (sehr groß, sehr subtil)
    const g7 = { x:W*0.48, y:H*0.55, r:240*sc, teeth:88, angle:1.2,
                 speed:BASE_SPEED*0.45, alpha:0.09, stroke:'#2060a0', lineW:1.2 };
    gears.push(g7);
    gears.push(meshGear(g7, 36, -0.4,        0.13, '#2a7ab4', 1.0));
    gears.push(meshGear(g7, 44, Math.PI*0.7, 0.12, '#2070a8', 1.0));

    // Akzente in den Ecken
    gears.push({ x:W*0.05, y:H*0.88, r:55*sc, teeth:22, angle:0,
                 speed:BASE_SPEED*1.5,  alpha:0.15, stroke:'#2a7ab4', lineW:1.0 });
    gears.push({ x:W*0.95, y:H*0.10, r:48*sc, teeth:18, angle:0.8,
                 speed:-BASE_SPEED*1.7, alpha:0.15, stroke:'#2a7ab4', lineW:1.0 });
  }

  function drawGear(g) {
    const { x, y, r, teeth, angle, alpha, stroke, lineW } = g;
    const toothH     = r * 0.18;
    const innerR     = r * 0.62;
    const hubR       = r * 0.18;
    const spokeCount = Math.max(4, Math.floor(teeth / 10) + 3);
    const step       = (Math.PI * 2) / teeth;
    const tw         = step * 0.38;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = stroke;
    ctx.fillStyle   = '#07111f';
    ctx.lineWidth   = lineW;

    // Außenkontur mit Zähnen
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a   = angle + i * step;
      const v1a = a - step * 0.5 + tw;
      const t1a = a - tw;
      const t2a = a + tw;
      const v2a = a + step * 0.5 - tw;
      i === 0
        ? ctx.moveTo(x + Math.cos(v1a) * r,           y + Math.sin(v1a) * r)
        : ctx.lineTo(x + Math.cos(v1a) * r,           y + Math.sin(v1a) * r);
      ctx.lineTo(x + Math.cos(t1a) * (r + toothH), y + Math.sin(t1a) * (r + toothH));
      ctx.lineTo(x + Math.cos(t2a) * (r + toothH), y + Math.sin(t2a) * (r + toothH));
      ctx.lineTo(x + Math.cos(v2a) * r,            y + Math.sin(v2a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Innenring
    ctx.beginPath();
    ctx.arc(x, y, innerR, 0, Math.PI * 2);
    ctx.stroke();

    // Speichen
    for (let s = 0; s < spokeCount; s++) {
      const sa = angle + (Math.PI * 2 / spokeCount) * s;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(sa) * hubR * 1.5,    y + Math.sin(sa) * hubR * 1.5);
      ctx.lineTo(x + Math.cos(sa) * innerR * 0.92, y + Math.sin(sa) * innerR * 0.92);
      ctx.stroke();
    }

    // Nabe
    ctx.beginPath();
    ctx.arc(x, y, hubR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nabenpunkt
    ctx.beginPath();
    ctx.arc(x, y, hubR * 0.3, 0, Math.PI * 2);
    ctx.fillStyle   = stroke;
    ctx.globalAlpha = alpha * 1.5;
    ctx.fill();

    // ── Glühpunkte: nur auf Desktop (kein Horoskop-Feeling auf Mobile) ────
    if (!isMobile) {
      for (let i = 0; i < teeth; i += 4) {
        const ta = angle + i * (Math.PI * 2 / teeth);
        const tx = x + Math.cos(ta) * (r + toothH * 0.5);
        const ty = y + Math.sin(ta) * (r + toothH * 0.5);
        const grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 7);
        grad.addColorStop(0, 'rgba(80,190,255,0.6)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(tx, ty, 7, 0, Math.PI * 2);
        ctx.fillStyle   = grad;
        ctx.globalAlpha = alpha * 1.4;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
        ctx.fillStyle   = '#b8f0ff';
        ctx.globalAlpha = alpha * 2.5;
        ctx.fill();
      }

      // Glühpunkt Nabenzentrum
      const hg = ctx.createRadialGradient(x, y, 0, x, y, hubR * 1.4);
      hg.addColorStop(0, 'rgba(100,210,255,0.55)');
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(x, y, hubR * 1.4, 0, Math.PI * 2);
      ctx.fillStyle   = hg;
      ctx.globalAlpha = alpha * 2;
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = '#07111f';
    ctx.fillRect(0, 0, W, H);
    const vign = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.85);
    vign.addColorStop(0, 'rgba(10,20,40,0)');
    vign.addColorStop(1, 'rgba(3,7,15,0.7)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = '#1a3550';
    ctx.lineWidth   = 0.35;
    ctx.globalAlpha = 0.35;
    for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.restore();
  }

  function render() {
    drawBackground();
    drawGrid();
    for (const g of gears) { g.angle += g.speed; drawGear(g); }
    requestAnimationFrame(render);
  }

  function resize() {
    W        = canvas.width  = window.innerWidth;
    H        = canvas.height = window.innerHeight;
    isMobile = W < 768; // Breakpoint: unter 768px = kein Glühpunkt-Effekt
    buildGears();
  }

  window.addEventListener('resize', resize);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { resize(); render(); });
  } else {
    resize();
    render();
  }

})();
