/**
 * CPQ Solutions – Animated Gear Background
 * Einfach per <script src="background.js"></script> einbinden.
 * Keine weiteren Abhängigkeiten nötig.
 */
(function () {

  // ── Canvas erstellen & in den Body hängen ──────────────────────────────────
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position:   'fixed',
    top:        '0',
    left:       '0',
    width:      '100%',
    height:     '100%',
    zIndex:     '-1',          // immer hinter allem anderen
    pointerEvents: 'none',     // Klicks gehen durch
  });
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H;
  let gears = [];

  const BASE_SPEED = 0.0004; // Grundgeschwindigkeit (rad/frame) – klein = langsam

  // ── Hilfsfunktion: Zahnrad-Phasenoffset beim Ineinandergreifen ────────────
  function meshOffset(tB, angle) {
    return angle + Math.PI / tB;
  }

  // ── Zahnräder für aktuelle Bildschirmgröße berechnen ──────────────────────
  function buildGears() {
    const sc = Math.min(W, H) / 900;
    gears = [];

    // ── Cluster 1: Rechts-unten (groß, träge) ────────────────────────────
    const g1 = { x: W*0.78, y: H*0.76, r: 190*sc, teeth: 72, angle: 0,
                 speed: BASE_SPEED, alpha: 0.12, stroke: '#3a8cc4', lineW: 1.5 };
    gears.push(g1);

    const g2 = meshGear(g1, 28, -0.6, 0.15, '#3ab0ff', 1.2);
    gears.push(g2);

    gears.push(meshGear(g2, 16, -1.9, 0.18, '#60c8ff', 1.0));

    // ── Cluster 2: Links-oben ─────────────────────────────────────────────
    const g4 = { x: W*0.18, y: H*0.22, r: 145*sc, teeth: 56, angle: 0.5,
                 speed: -BASE_SPEED * 0.8, alpha: 0.11, stroke: '#2a7ab4', lineW: 1.5 };
    gears.push(g4);

    const g5 = meshGear(g4, 32, 0.9, 0.14, '#3ab0ff', 1.2);
    gears.push(g5);

    gears.push(meshGear(g5, 20, 2.4, 0.17, '#60c8ff', 1.0));

    // ── Cluster 3: Mitte (sehr groß, sehr subtil) ────────────────────────
    const g7 = { x: W*0.48, y: H*0.55, r: 240*sc, teeth: 88, angle: 1.2,
                 speed: BASE_SPEED * 0.45, alpha: 0.06, stroke: '#2060a0', lineW: 1.2 };
    gears.push(g7);

    gears.push(meshGear(g7, 36, -0.4,         0.09, '#2a7ab4', 1.0));
    gears.push(meshGear(g7, 44, Math.PI*0.7,  0.08, '#2070a8', 1.0));

    // ── Akzente in den Ecken ──────────────────────────────────────────────
    gears.push({ x: W*0.05, y: H*0.88, r: 55*sc, teeth: 22, angle: 0,
                 speed: BASE_SPEED*1.5,  alpha: 0.10, stroke: '#2a7ab4', lineW: 1.0 });
    gears.push({ x: W*0.95, y: H*0.10, r: 48*sc, teeth: 18, angle: 0.8,
                 speed: -BASE_SPEED*1.7, alpha: 0.10, stroke: '#2a7ab4', lineW: 1.0 });

    // ── Hilfsfunktion: verzahntes Rad an ein Elternteil andocken ──────────
    function meshGear(parent, teeth, angleDir, alpha, stroke, lineW) {
      const sc2 = Math.min(W, H) / 900;
      const r   = parent.r * teeth / parent.teeth;
      const dist = parent.r + r - sc2;
      return {
        x:      parent.x + Math.cos(angleDir) * dist,
        y:      parent.y + Math.sin(angleDir) * dist,
        r, teeth,
        angle:  meshOffset(teeth, angleDir),
        speed:  -parent.speed * parent.teeth / teeth,
        alpha, stroke, lineW
      };
    }
  }

  // ── Einzelnes Zahnrad zeichnen ────────────────────────────────────────────
  function drawGear(g) {
    const { x, y, r, teeth, angle, alpha, stroke, lineW } = g;
    const toothH    = r * 0.18;
    const innerR    = r * 0.62;
    const hubR      = r * 0.18;
    const spokeCount = Math.max(4, Math.floor(teeth / 10) + 3);
    const step      = (Math.PI * 2) / teeth;
    const tw        = step * 0.38;

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

    ctx.restore();
  }

  // ── Hintergrund & Gitter ──────────────────────────────────────────────────
  function drawBackground() {
    ctx.fillStyle = '#07111f';
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vign = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.85);
    vign.addColorStop(0, 'rgba(10,20,40,0)');
    vign.addColorStop(1, 'rgba(3,7,15,0.7)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle  = '#1a3550';
    ctx.lineWidth    = 0.35;
    ctx.globalAlpha  = 0.35;
    for (let x = 0; x < W; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  // ── Animationsschleife ────────────────────────────────────────────────────
  function render() {
    drawBackground();
    drawGrid();
    for (const g of gears) {
      g.angle += g.speed;
      drawGear(g);
    }
    requestAnimationFrame(render);
  }

  // ── Resize-Handler ────────────────────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGears();
  }

  window.addEventListener('resize', resize);

  // ── Start ─────────────────────────────────────────────────────────────────
  // Warten bis der DOM fertig ist, falls script im <head> eingebunden wird
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { resize(); render(); });
  } else {
    resize();
    render();
  }

})();
