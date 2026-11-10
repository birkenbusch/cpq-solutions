"""Erzeugt die Word-Briefvorlage brand/export/briefvorlage.docx (DIN 5008, Form B).

Aufruf:  python3 brand/build/make_docx.py   (benötigt python-docx; vorher render.js für die Logo-PNGs)
Hinweis: Schrift „Jost“ aus brand/fonts/ auf dem PC installieren, sonst ersetzt Word sie.
"""
from pathlib import Path
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
EXP = ROOT / "export"
NAVY, TEXT, MUTED, ACCENT = RGBColor(0x0F, 0x17, 0x2A), RGBColor(0x1E, 0x29, 0x3B), RGBColor(0x64, 0x74, 0x8B), RGBColor(0x0E, 0xA5, 0xE9)


def run(p, text, size=10.5, color=TEXT, bold=False, font="Jost"):
    r = p.add_run(text)
    r.font.size, r.font.color.rgb, r.font.bold, r.font.name = Pt(size), color, bold, font
    r._element.rPr.rFonts.set(qn("w:eastAsia"), font)
    return r


def para(container, text="", size=10.5, color=TEXT, bold=False, after=0, align=None):
    p = container.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.space_before = Pt(0)
    if align is not None:
        p.alignment = align
    if text:
        run(p, text, size, color, bold)
    return p


def no_borders(table):
    tblPr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "nil")
        borders.append(el)
    tblPr.append(borders)


def top_border(paragraph, color="CBD5E1"):
    pPr = paragraph._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    top = OxmlElement("w:top")
    for k, v in (("val", "single"), ("sz", "4"), ("space", "4"), ("color", color)):
        top.set(qn(f"w:{k}"), v)
    bdr.append(top)
    pPr.append(bdr)


doc = Document()
st = doc.styles["Normal"]
st.font.name, st.font.size, st.font.color.rgb = "Jost", Pt(10.5), TEXT
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Jost")
st.paragraph_format.line_spacing = 1.2

sec = doc.sections[0]
sec.page_width, sec.page_height = Mm(210), Mm(297)
sec.left_margin, sec.right_margin = Mm(25), Mm(20)
sec.top_margin, sec.bottom_margin = Mm(45), Mm(32)
sec.header_distance, sec.footer_distance = Mm(14), Mm(8)
sec.different_first_page_header_footer = False

# Kopf: Logo rechts + Claim
h = sec.header
hp = h.paragraphs[0]
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
hp.add_run().add_picture(str(EXP / "logo-hell-2000px.png"), width=Mm(68))
cp = para(h, "SENIOR CPQ-BERATER · CAMOS® CPQ SPEZIALIST", 7, ACCENT, align=WD_ALIGN_PARAGRAPH.RIGHT)
cp.runs[0].font.spacing = Pt(1)

# Fuß: drei Spalten
f = sec.footer
fp = f.paragraphs[0]
top_border(fp)
t = f.add_table(rows=1, cols=3, width=Mm(165))
no_borders(t)
t.alignment = WD_TABLE_ALIGNMENT.CENTER
cols = [
    ("cpq-solutions.de", ["Kai Birkenbusch (Einzelunternehmen)", "c/o Online-Impressum.de #4879", "Europaring 60 · 53757 Sankt Augustin"]),
    ("Kontakt", ["kai-birkenbusch@cpq-solutions.de", "www.cpq-solutions.de"]),
    ("Steuern & Bank", ["Steuer-Nr. / USt-IdNr.: ergänzen", "IBAN: ergänzen", "BIC: ergänzen"]),
]
for cell, (head, lines) in zip(t.rows[0].cells, cols):
    p = cell.paragraphs[0]
    run(p, head, 7, NAVY, True)
    for l in lines:
        para(cell, l, 7, MUTED)

# Anschriftfeld + Infoblock als Tabelle
body = doc.add_table(rows=1, cols=2)
no_borders(body)
body.autofit = False
left, right = body.rows[0].cells
for col, w in zip(body.columns, (86, 79)):
    col.width = Mm(w)
    for c in col.cells:
        c.width = Mm(w)
p = left.paragraphs[0]
run(p, "cpq-solutions.de · K. Birkenbusch · Europaring 60 · 53757 Sankt Augustin", 6.5, MUTED)
p.paragraph_format.space_after = Pt(6)
for l in ["Musterfirma GmbH", "Frau Erika Mustermann", "Musterstraße 1", "12345 Musterstadt"]:
    para(left, l)
info = [("Ihr Zeichen", "EM/2026"), ("Unser Zeichen", "KB"), ("", ""), ("Ansprechpartner", "Kai Birkenbusch"),
        ("E-Mail", "kai-birkenbusch@cpq-solutions.de"), ("", ""), ("Datum", "10. November 2026")]
rp = right.paragraphs[0]
for i, (k, v) in enumerate(info):
    p = rp if i == 0 else para(right)
    p.paragraph_format.tab_stops.add_tab_stop(Mm(25))
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    if k:
        run(p, k + "\t", 8, MUTED)
        run(p, v, 8)
    else:
        p.paragraph_format.space_after = Pt(0)
        run(p, " ", 4)

for _ in range(3):
    para(doc)
para(doc, "Betreff", 11, NAVY, True, after=14)
para(doc, "Sehr geehrte Frau Mustermann,", after=8)
para(doc, "hier steht Ihr Brieftext.", after=8)
para(doc, "Mit freundlichen Grüßen", after=30)
para(doc, "Kai Birkenbusch", color=NAVY)

out = EXP / "briefvorlage.docx"
doc.save(out)
print("geschrieben:", out)
