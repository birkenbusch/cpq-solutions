<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<title>Preview – Hexagon</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#07111f; overflow:hidden; width:100vw; height:100vh; }
canvas { display:block; position:fixed; top:0; left:0; width:100%; height:100%; }
.label { position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  color:rgba(100,180,255,0.4); font:12px/1 monospace; letter-spacing:4px; text-transform:uppercase; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<div class="label">Variante 3 – Hexagon-Grid mit Wellen-Effekt</div>
<script>
const c = document.getElementById('c');
const ctx = c.getContext('2d');
let W, H;
let hexes = [];
let waves = [];
const SIZE = 42; // hex radius

function resize() {
  W = c.width = window.innerWidth;
  H = c.height = window.innerHeight;
  buildGrid();
}

function buildGrid() {
  hexes = [];
  const w = SIZE * 2;
  const h = Math.sqrt(3) * SIZE;
  const cols = Math.ceil(W / (w * 0.75)) + 2;
  const rows = Math.ceil(H / h) + 2;

  for (let col = -1; col < cols; col++) {
    for (let row = -1; row < rows; row++) {
      const x = col * w * 0.75;
      const y = row * h + (col % 2 === 0 ? 0 : h / 2);
      hexes.push({ x, y, brightness: 0 });
    }
  }

  // Spawn occasional waves
  waves = [];
  spawnWave();
}

function spawnWave() {
  waves.push({
    x: Math.random() * W,
    y: Math.random() * H,
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
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawBackground() {
  ctx.fillStyle = '#07111f';
  ctx.fillRect(0, 0, W, H);
}

let tick = 0;
function render() {
  tick++;
  drawBackground();

  // Advance waves
  waves.forEach(w => w.r += w.speed);
  waves = waves.filter(w => w.r < w.maxR);
  if (waves.length < 3 && tick % 180 === 0) spawnWave();

  // Draw hexes
  hexes.forEach(h => {
    // Compute brightness from all waves
    let bright = 0;
    waves.forEach(w => {
      const dx = h.x - w.x, dy = h.y - w.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const waveFront = Math.abs(dist - w.r);
      const waveWidth = 80;
      if (waveFront < waveWidth) {
        const falloff = (1 - waveFront / waveWidth);
        bright += falloff * falloff * w.strength;
      }
    });
    bright = Math.min(bright, 1);

    // Fill (very subtle)
    const fillAlpha = bright * 0.07;
    hexPath(h.x, h.y, SIZE - 2);
    ctx.fillStyle = `rgba(20,100,180,${fillAlpha})`;
    ctx.fill();

    // Stroke
    const strokeAlpha = 0.06 + bright * 0.35;
    ctx.strokeStyle = `rgba(30,140,220,${strokeAlpha})`;
    ctx.lineWidth = bright > 0.1 ? 1.2 : 0.6;
    ctx.stroke();

    // Vertex glow dots on active hexes
    if (bright > 0.35) {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = h.x + (SIZE - 2) * Math.cos(angle);
        const py = h.y + (SIZE - 2) * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI*2);
        ctx.fillStyle = `rgba(80,200,255,${bright * 0.7})`;
        ctx.fill();
      }
    }
  });

  // Vignette
  const vign = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.85);
  vign.addColorStop(0, 'rgba(7,17,31,0)');
  vign.addColorStop(1, 'rgba(3,7,15,0.75)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, W, H);

  requestAnimationFrame(render);
}

window.addEventListener('resize', resize);
resize();
render();
</script>
</body>
</html>
