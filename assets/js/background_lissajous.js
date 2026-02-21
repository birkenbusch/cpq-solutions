/**
 * CPQ Solutions – Hintergrund: Lissajous / Oszilloskop
 * Einbinden: <script src="assets/js/background-lissajous.js"></script>
 */
(function () {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%',
    zIndex: '-1', pointerEvents: 'none',
  });
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');
  let W, H;

  const curves = [
    { a:3, b:2, delta:0,             adrift:0.00007,  bdrift:0.00005, ddrift:0.00035, alpha:0.18, color:'30,150,220',  scale:0.38 },
    { a:5, b:4, delta:Math.PI/4,     adrift:0.00004,  bdrift:0.00006, ddrift:0.00028, alpha:0.10, color:'20,100,180',  scale:0.44 },
    { a:2, b:3, delta:Math.PI/2,     adrift:0.00009,  bdrift:0.00003, ddrift:0.00020, alpha:0.08, color:'10,80,160',   scale:0.50 },
    { a:1, b:2, delta:0,             adrift:0.000025, bdrift:0.00008, ddrift:0.00040, alpha:0.14, color:'50,180,240',  scale:0.32 },
  ];
  const dot = { curve: curves[0], phase: 0, speed: 0.012 };
  const POINTS = 1200;

  function lissajous(cv, t) {
    const scale = Math.min(W, H) * cv.scale;
    return { x: W/2 + Math.sin(cv.a * t + cv.delta) * scale, y: H/2 + Math.sin(cv.b * t) * scale };
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(20,60,100,0.25)'; ctx.lineWidth = 0.5;
    for (let x=0; x<W; x+=60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<H; y+=60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(30,100,160,0.3)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
    ctx.restore();
  }

  function render() {
    // Phosphor-Nachleuchten statt hartem Clear
    ctx.fillStyle = 'rgba(7,17,31,0.18)'; ctx.fillRect(0, 0, W, H);
    drawGrid();

    curves.forEach(cv => { cv.a += cv.adrift; cv.b += cv.bdrift; cv.delta += cv.ddrift; });

    curves.forEach(cv => {
      ctx.beginPath();
      for (let i=0; i<=POINTS; i++) {
        const pt = lissajous(cv, (i/POINTS)*Math.PI*2);
        i===0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = `rgba(${cv.color},${cv.alpha})`; ctx.lineWidth = 1.2; ctx.stroke();
    });

    // Leuchtpunkt (Phosphorstrahl)
    dot.phase += dot.speed;
    const pt = lissajous(dot.curve, dot.phase);
    const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 20);
    grad.addColorStop(0, 'rgba(100,220,255,0.8)');
    grad.addColorStop(0.4, 'rgba(30,150,220,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 20, 0, Math.PI*2); ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI*2); ctx.fillStyle='rgba(180,240,255,0.95)'; ctx.fill();

    // Vignette
    const vign = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.9);
    vign.addColorStop(0, 'rgba(7,17,31,0)'); vign.addColorStop(1, 'rgba(2,6,14,0.8)');
    ctx.fillStyle=vign; ctx.fillRect(0,0,W,H);

    requestAnimationFrame(render);
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { resize(); render(); });
  } else { resize(); render(); }
})();
