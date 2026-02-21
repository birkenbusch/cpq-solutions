/**
 * CPQ Solutions – Hintergrund: Hexagon-Grid mit Wellen-Effekt
 * Einbinden: <script src="assets/js/background-hexagon.js"></script>
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
  let W, H, hexes = [], waves = [];
  const SIZE = 42;

  function buildGrid() {
    hexes = []; waves = [];
    const w = SIZE * 2, h = Math.sqrt(3) * SIZE;
    const cols = Math.ceil(W / (w * 0.75)) + 2;
    const rows = Math.ceil(H / h) + 2;
    for (let col = -1; col < cols; col++) {
      for (let row = -1; row < rows; row++) {
        hexes.push({
          x: col * w * 0.75,
          y: row * h + (col % 2 === 0 ? 0 : h / 2)
        });
      }
    }
    spawnWave();
  }

  function spawnWave() {
    waves.push({
      x: Math.random() * W, y: Math.random() * H,
      r: 0,
      speed: 0.8 + Math.random() * 0.6,
      maxR: Math.max(W, H) * 0.85,
      strength: 0.6 + Math.random() * 0.4
    });
  }

  function hexPath(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      i === 0
        ? ctx.moveTo(x + r * Math.cos(angle), y + r * Math.sin(angle))
        : ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
    }
    ctx.closePath();
  }

  let tick = 0;
  function render() {
    tick++;
    ctx.fillStyle = '#07111f'; ctx.fillRect(0, 0, W, H);

    waves.forEach(w => w.r += w.speed);
    waves = waves.filter(w => w.r < w.maxR);
    if (waves.length < 3 && tick % 180 === 0) spawnWave();

    hexes.forEach(h => {
      let bright = 0;
      waves.forEach(w => {
        const dx = h.x - w.x, dy = h.y - w.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const waveFront = Math.abs(dist - w.r);
        if (waveFront < 80) {
          const f = 1 - waveFront / 80;
          bright += f * f * w.strength;
        }
      });
      bright = Math.min(bright, 1);

      hexPath(h.x, h.y, SIZE - 2);
      ctx.fillStyle = `rgba(20,100,180,${bright * 0.07})`; ctx.fill();
      ctx.strokeStyle = `rgba(30,140,220,${0.06 + bright * 0.35})`;
      ctx.lineWidth = bright > 0.1 ? 1.2 : 0.6; ctx.stroke();

      if (bright > 0.35) {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = h.x + (SIZE - 2) * Math.cos(angle);
          const py = h.y + (SIZE - 2) * Math.sin(angle);
          ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI*2);
          ctx.fillStyle = `rgba(80,200,255,${bright * 0.7})`; ctx.fill();
        }
      }
    });

    // Vignette
    const vign = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.85);
    vign.addColorStop(0, 'rgba(7,17,31,0)'); vign.addColorStop(1, 'rgba(3,7,15,0.75)');
    ctx.fillStyle = vign; ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(render);
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGrid();
  }

  window.addEventListener('resize', resize);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { resize(); render(); });
  } else { resize(); render(); }
})();
