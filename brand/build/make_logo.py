"""Erzeugt die Logo-SVGs (Text in Pfade umgewandelt, keine Schrift-Abhängigkeit).

Aufruf:  python3 brand/build/make_logo.py
Benötigt: pip install fonttools
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
FONT = TTFont(ROOT / "fonts" / "Syne-Bold.ttf")

FS = 100                    # Schriftgröße in SVG-Einheiten
UPM = FONT["head"].unitsPerEm
S = FS / UPM
TRACK = -0.02 * FS          # letter-spacing -0.02em (wie Webseite)
CMAP = FONT.getBestCmap()
GLYPHS = FONT.getGlyphSet()
HMTX = FONT["hmtx"]
XH = FONT["OS/2"].sxHeight * S
CAP = FONT["OS/2"].sCapHeight * S

COLORS = {
    # name: (Text, Klammern, Punkt)
    "dunkel": ("#e2e8f0", "#38bdf8", "#ffffff"),   # für dunkle Hintergründe
    "hell":   ("#0f172a", "#0ea5e9", "#0ea5e9"),   # für weiße Hintergründe / Druck
    "weiss":  ("#ffffff", "#ffffff", "#ffffff"),   # einfarbig negativ
    "schwarz":("#000000", "#000000", "#000000"),   # einfarbig positiv (Stempel, Fax)
}


def text_path(text, x0, baseline):
    pen = SVGPathPen(GLYPHS)
    x = x0
    for ch in text:
        gname = CMAP[ord(ch)]
        tp = TransformPen(pen, (S, 0, 0, -S, x, baseline))
        GLYPHS[gname].draw(tp)
        x += HMTX[gname][0] * S + TRACK
    return pen.getCommands(), x - TRACK


def build(variant):
    fg, br, dot = COLORS[variant]
    sw = 14                       # Strichstärke Klammer
    bh = 150                      # Klammerhöhe
    bw = 40                       # Klammerbreite (innen)
    gap = 34                      # Abstand Klammer ↔ Text
    baseline = 0
    mid = baseline - XH * 0.5     # optische Mitte = halbe x-Höhe
    top, bot = mid - bh / 2, mid + bh / 2

    x = sw / 2 + bw
    lb = f"M{x:.1f} {top:.1f}H{sw/2:.1f}V{bot:.1f}H{x:.1f}"
    tx = x + gap
    d1, x = text_path("cpq-solutions", tx, baseline)
    r = 11
    cx = x + 9 + r
    cy = mid + 2
    d2, x = text_path("de", cx + r + 9, baseline)
    x += gap - 8                  # 'e' hat rechts mehr Vorbreite
    rb = f"M{x:.1f} {top:.1f}H{x+bw:.1f}V{bot:.1f}H{x:.1f}"
    width = x + bw + sw / 2

    pad = 4
    vb = f"{-pad} {top - sw/2 - pad:.1f} {width + 2*pad:.1f} {bh + sw + 2*pad:.1f}"
    stroke = f'stroke="{br}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="cpq-solutions.de">
  <title>cpq-solutions.de</title>
  <path d="{lb}" {stroke}/>
  <path d="{rb}" {stroke}/>
  <path d="{d1}" fill="{fg}"/>
  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" fill="{dot}"/>
  <path d="{d2}" fill="{fg}"/>
</svg>
'''


def signet(variant):
    _, br, dot = COLORS[variant]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="cpq-solutions.de Signet">
  <path d="M10 8H6V24H10" stroke="{br}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M22 8H26V24H22" stroke="{br}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="16" cy="16" r="3" fill="{dot}"/>
</svg>
'''


if __name__ == "__main__":
    out = ROOT / "logo"
    out.mkdir(exist_ok=True)
    for v in COLORS:
        (out / f"logo-{v}.svg").write_text(build(v))
        (out / f"signet-{v}.svg").write_text(signet(v))
    print("Logos geschrieben nach", out)
