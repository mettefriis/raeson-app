"""
PDF Report Generator — ræson material substitution assessment.

Design language:
  - Off-white page background (#f7f7f5)
  - Near-black primary text (#111110), weight 300 feel via generous leading
  - JetBrains Mono for brand wordmark only
  - Helvetica for all body text at 10pt / leading 15 minimum
  - Sharp corners everywhere, no rounded borders
  - Thin 0.5pt rules in #e5e5e3 as the only decoration
  - Verdict colour (green/amber/red) used only on badges and left-accent rules
  - White space carries the hierarchy — not boxes
"""

import os
from io import BytesIO
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, Color
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, Flowable, PageBreak
)
from reportlab.graphics.shapes import Drawing, Rect, Line, Circle
from reportlab.graphics import renderPDF
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from api.models.schemas import SubstitutionAssessment


# ---------------------------------------------------------------------------
# Text sanitiser — convert Unicode symbols Helvetica can't render
# ---------------------------------------------------------------------------

def _pdf_safe(text: str) -> str:
    """
    Replace Unicode characters that Helvetica / standard PDF fonts
    cannot render with ReportLab Paragraph markup or ASCII equivalents.
    """
    if not text:
        return text
    return (text
        # Superscripts
        .replace('m²', 'm<super><font size=6>2</font></super>')
        .replace('m³', 'm<super><font size=6>3</font></super>')
        .replace('CO₂e', 'CO<sub><font size=6>2</font></sub>e')
        .replace('CO₂', 'CO<sub><font size=6>2</font></sub>')
        .replace('²', '<super><font size=6>2</font></super>')
        .replace('³', '<super><font size=6>3</font></super>')
        # Subscripts
        .replace('₂', '<sub><font size=6>2</font></sub>')
        # Units
        .replace('αw', 'aw')
        .replace('α', 'a')
        .replace('τ_v', 'VLT')
        # Arrows and bullets
        .replace('→', '->')
        .replace('←', '<-')
        .replace('·', '·')   # middle dot — usually fine
        .replace('−', '-')
        .replace('≥', '>=')
        .replace('≤', '<=')
        .replace('±', '+/-')
        # Degree / special
        .replace('°', 'deg')
        # Fractions in units
        .replace('⁰·⁵', '^0.5')
        # Danish/special chars — keep as-is if supported, else strip
        .replace('\u00e6', 'ae')   # æ
        .replace('\u00f8', 'o')    # ø
        .replace('\u00e5', 'a')    # å
    )

# ---------------------------------------------------------------------------
# Font registration
# ---------------------------------------------------------------------------
_FONTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'fonts')
_MONO_TTF = os.path.join(_FONTS_DIR, 'JetBrainsMono-Regular.ttf')

if os.path.exists(_MONO_TTF):
    pdfmetrics.registerFont(TTFont('JetBrainsMono', _MONO_TTF))
    MONO = 'JetBrainsMono'
else:
    MONO = 'Courier'

# ---------------------------------------------------------------------------
# Design tokens
# ---------------------------------------------------------------------------
C_INK      = HexColor('#111110')
C_SUBTLE   = HexColor('#6b6b69')
C_MUTED    = HexColor('#9b9b99')
C_LIGHT    = HexColor('#c5c5c3')
C_BG       = HexColor('#f7f7f5')
C_BORDER   = HexColor('#e5e5e3')
C_WHITE    = white

C_GREEN    = HexColor('#15803d')
C_GREEN_BG = HexColor('#f0fdf4')
C_GREEN_BD = HexColor('#bbf7d0')
C_GREEN_DOT= HexColor('#16a34a')
C_AMBER    = HexColor('#a16207')
C_AMBER_BG = HexColor('#fefce8')
C_AMBER_BD = HexColor('#fef08a')
C_AMBER_DOT= HexColor('#ca8a04')
C_RED      = HexColor('#b91c1c')
C_RED_BG   = HexColor('#fef2f2')
C_RED_BD   = HexColor('#fecaca')
C_RED_DOT  = HexColor('#dc2626')

PAGE_W, PAGE_H = A4
MARGIN_L = 22 * mm
MARGIN_R = 22 * mm
MARGIN_T = 20 * mm
MARGIN_B = 20 * mm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R


def _verdict_colors(verdict: str):
    v = verdict.lower() if verdict else 'conditional'
    if v == 'pass':
        return C_GREEN, C_GREEN_BG, C_GREEN_BD, C_GREEN_DOT
    elif v == 'fail':
        return C_RED, C_RED_BG, C_RED_BD, C_RED_DOT
    else:
        return C_AMBER, C_AMBER_BG, C_AMBER_BD, C_AMBER_DOT


# ---------------------------------------------------------------------------
# Geometric R mark
# ---------------------------------------------------------------------------

def _make_r_mark(scale: float = 1.0) -> Drawing:
    s = 3 * scale
    size = 23 * scale
    d = Drawing(size, size)

    def rect(x, y, w, h):
        d.add(Rect(x * scale, (23 - y - h) * scale, w * scale, h * scale,
                   fillColor=C_INK, strokeColor=None))

    rect(0, 0, 3, 20)
    rect(0, 0, 12, 3)
    rect(9, 0, 3, 12)
    rect(0, 9, 12, 3)
    d.add(Line(
        12 * scale, (23 - 12) * scale,
        21 * scale, (23 - 21) * scale,
        strokeColor=C_INK, strokeWidth=3 * scale, strokeLineCap=2,
    ))
    return d


class RMarkFlowable(Flowable):
    def __init__(self, scale=1.0):
        super().__init__()
        self._scale = scale
        self.width = 23 * scale
        self.height = 23 * scale

    def draw(self):
        renderPDF.draw(_make_r_mark(self._scale), self.canv, 0, 0)


# ---------------------------------------------------------------------------
# Dot flowable — pass/fail status indicator
# ---------------------------------------------------------------------------

class DotFlowable(Flowable):
    def __init__(self, verdict: str, size: float = 5):
        super().__init__()
        self._color = _verdict_colors(verdict)[3]
        self.width = size
        self.height = size
        self._size = size

    def draw(self):
        r = self._size / 2
        self.canv.setFillColor(self._color)
        self.canv.circle(r, r, r, fill=1, stroke=0)


# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------

def _make_styles():
    base = getSampleStyleSheet()

    def s(name, **kw):
        return ParagraphStyle(name, parent=base['Normal'], **kw)

    return {
        # Brand
        'brand': s('brand',
            fontName=MONO, fontSize=12,
            textColor=C_INK, leading=15,
        ),
        # Section labels — small caps feel
        'section_label': s('section_label',
            fontName='Helvetica', fontSize=7,
            textColor=C_MUTED, leading=9,
            spaceBefore=6*mm, spaceAfter=2*mm,
        ),
        # Main heading (product names)
        'product_name': s('product_name',
            fontName='Helvetica-Bold', fontSize=13,
            textColor=C_INK, leading=17,
        ),
        'product_arrow': s('product_arrow',
            fontName='Helvetica', fontSize=13,
            textColor=C_MUTED, leading=17,
        ),
        # Context metadata
        'meta': s('meta',
            fontName='Helvetica', fontSize=8,
            textColor=C_MUTED, leading=12,
        ),
        'meta_value': s('meta_value',
            fontName='Helvetica', fontSize=8,
            textColor=C_SUBTLE, leading=12,
        ),
        # Body — the main readable text
        'body': s('body',
            fontName='Helvetica', fontSize=10,
            textColor=C_INK, leading=16,
            spaceAfter=3*mm,
        ),
        'body_muted': s('body_muted',
            fontName='Helvetica', fontSize=10,
            textColor=C_SUBTLE, leading=16,
        ),
        # Dimension heading
        'dim_label': s('dim_label',
            fontName='Helvetica-Bold', fontSize=10,
            textColor=C_INK, leading=13,
        ),
        'dim_verdict': s('dim_verdict',
            fontName='Helvetica-Bold', fontSize=8,
            textColor=C_INK, leading=11,
        ),
        # Dimension values (specified / proposed)
        'dim_field_label': s('dim_field_label',
            fontName='Helvetica', fontSize=7,
            textColor=C_MUTED, leading=9,
        ),
        'dim_value': s('dim_value',
            fontName='Helvetica', fontSize=9,
            textColor=C_INK, leading=13,
        ),
        # Delta text — the key insight
        'delta': s('delta',
            fontName='Helvetica', fontSize=9,
            textColor=C_INK, leading=14,
        ),
        # Code reference
        'code_ref': s('code_ref',
            fontName='Helvetica', fontSize=7,
            textColor=C_LIGHT, leading=10,
        ),
        # Recommendation items
        'rec': s('rec',
            fontName='Helvetica', fontSize=10,
            textColor=C_INK, leading=15,
            spaceAfter=2*mm,
        ),
        # Footer
        'footer': s('footer',
            fontName='Helvetica', fontSize=7,
            textColor=C_MUTED, leading=11,
        ),
        # Scorecard cells
        'sc_label': s('sc_label',
            fontName='Helvetica', fontSize=8,
            textColor=C_INK, leading=11,
        ),
        'sc_value': s('sc_value',
            fontName='Helvetica', fontSize=8,
            textColor=C_SUBTLE, leading=11,
        ),
        'sc_verdict': s('sc_verdict',
            fontName='Helvetica-Bold', fontSize=7,
            textColor=C_INK, leading=10,
        ),
    }


# ---------------------------------------------------------------------------
# Page template with running header + page numbers
# ---------------------------------------------------------------------------

class _PageTemplate:
    """Callback for SimpleDocTemplate to draw header/footer on every page."""

    def __init__(self, assessment: SubstitutionAssessment):
        self._spec = assessment.specified_product[:28]
        self._prop = assessment.proposed_product[:28]
        self._date = datetime.now(timezone.utc).strftime('%d %b %Y')

    def __call__(self, canvas, doc):
        canvas.saveState()
        page = doc.page

        if page > 1:
            # Running header on continuation pages
            canvas.setFont('Helvetica', 7)
            canvas.setFillColor(C_MUTED)
            canvas.drawString(MARGIN_L, PAGE_H - 13*mm,
                              f"{self._spec} → {self._prop}")
            canvas.setFillColor(C_LIGHT)
            canvas.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 13*mm, 'ræson')
            canvas.setStrokeColor(C_BORDER)
            canvas.setLineWidth(0.5)
            canvas.line(MARGIN_L, PAGE_H - 14.5*mm,
                        PAGE_W - MARGIN_R, PAGE_H - 14.5*mm)

        # Page number
        canvas.setFont('Helvetica', 7)
        canvas.setFillColor(C_MUTED)
        canvas.drawRightString(PAGE_W - MARGIN_R, 13*mm, str(page))

        canvas.restoreState()


# ---------------------------------------------------------------------------
# Scorecard — compact overview of all dimensions
# ---------------------------------------------------------------------------

def _scorecard(dimensions, styles, W) -> Table:
    """
    One row per dimension: • label | specified | → | proposed | VERDICT
    Groups: compliance first, then wellbeing.
    """
    WELLBEING = {'biophilic_quality', 'acoustic_quality', 'thermal_comfort', 'daylight_quality'}
    DIM_LABELS = {
        'fire_reaction':    'Fire reaction',
        'fire_resistance':  'Fire resistance',
        'thermal':          'Thermal performance',
        'durability':       'Durability',
        'carbon':           'Embodied carbon',
        'compatibility':    'Material compatibility',
        'acoustic':         'Acoustic',
        'moisture':         'Moisture',
        'structural':       'Structural',
        'biophilic_quality':'Biophilic quality',
        'acoustic_quality': 'Acoustic quality',
        'thermal_comfort':  'Thermal comfort',
        'daylight_quality': 'Daylight quality',
    }
    VERDICT_ORDER = {'fail': 0, 'conditional': 1, 'pass': 2}

    compliance = sorted(
        [d for d in dimensions if d.dimension not in WELLBEING],
        key=lambda d: VERDICT_ORDER.get(d.verdict.value, 3)
    )
    wellbeing = sorted(
        [d for d in dimensions if d.dimension in WELLBEING],
        key=lambda d: VERDICT_ORDER.get(d.verdict.value, 3)
    )

    rows = []
    style_cmds = [
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX',           (0, 0), (-1, -1), 0.5, C_BORDER),
        ('LINEBELOW',     (0, 0), (-1, -2), 0.25, C_BORDER),
    ]

    def add_group_header(label):
        rows.append([
            Paragraph(label, ParagraphStyle('gh',
                fontName='Helvetica', fontSize=6,
                textColor=C_MUTED, leading=8,
            )),
            '', '', '', '',
        ])
        i = len(rows) - 1
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), C_BG))
        style_cmds.append(('SPAN', (0, i), (-1, i)))
        style_cmds.append(('TOPPADDING', (0, i), (-1, i), 3))
        style_cmds.append(('BOTTOMPADDING', (0, i), (-1, i), 3))

    def add_dim_row(dim):
        fg, bg, bd, dot = _verdict_colors(dim.verdict.value)
        label = DIM_LABELS.get(dim.dimension, dim.dimension.replace('_', ' ').title())
        verdict_text = dim.verdict.value.upper()

        # Truncate specified/proposed values for scorecard
        spec_brief = _pdf_safe((dim.specified_value or '')[:40])
        prop_brief = _pdf_safe((dim.proposed_value or '')[:40])

        rows.append([
            DotFlowable(dim.verdict.value, size=5),
            Paragraph(label, styles['sc_label']),
            Paragraph(spec_brief, styles['sc_value']),
            Paragraph('→', ParagraphStyle('arr', fontName='Helvetica',
                fontSize=8, textColor=C_LIGHT, leading=11)),
            Paragraph(prop_brief, styles['sc_value']),
            Paragraph(verdict_text, ParagraphStyle('sv',
                fontName='Helvetica-Bold', fontSize=7,
                textColor=fg, leading=10)),
        ])
        i = len(rows) - 1
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    if compliance:
        add_group_header('COMPLIANCE')
        for d in compliance:
            add_dim_row(d)
    if wellbeing:
        add_group_header('WELLBEING')
        for d in wellbeing:
            add_dim_row(d)

    # Column widths: dot | label | specified | → | proposed | verdict
    col_w = [6*mm, W*0.20, W*0.27, 5*mm, W*0.27, W*0.14]

    t = Table(rows, colWidths=col_w)
    t.setStyle(TableStyle(style_cmds))
    return t


# ---------------------------------------------------------------------------
# Dimension detail section
# ---------------------------------------------------------------------------

def _dimension_section(dim, styles, W) -> list:
    """
    Returns a list of flowables for one dimension:
      ┌─ [verdict dot] DIMENSION LABEL ─────────── PASS / FAIL / CONDITIONAL
      │  Requirement text
      │  Specified: value   Proposed: value
      │  ┌────────────────────────────────────────┐
      │  │  Delta text (the key insight)           │
      │  └────────────────────────────────────────┘
      │  Code reference
    """
    fg, bg, bd, dot = _verdict_colors(dim.verdict.value)
    DIM_LABELS = {
        'fire_reaction':    'Fire reaction',
        'fire_resistance':  'Fire resistance',
        'thermal':          'Thermal performance',
        'durability':       'Durability',
        'carbon':           'Embodied carbon',
        'compatibility':    'Material compatibility',
        'acoustic':         'Acoustic',
        'moisture':         'Moisture',
        'structural':       'Structural',
        'biophilic_quality':'Biophilic quality',
        'acoustic_quality': 'Acoustic quality',
        'thermal_comfort':  'Thermal comfort',
        'daylight_quality': 'Daylight quality',
    }
    label = DIM_LABELS.get(dim.dimension, dim.dimension.replace('_', ' ').title())
    verdict_text = dim.verdict.value.upper()

    # Header row: label + verdict
    header = Table(
        [[
            Paragraph(label, styles['dim_label']),
            Paragraph(verdict_text, ParagraphStyle('dv',
                fontName='Helvetica-Bold', fontSize=8,
                textColor=fg, leading=11, alignment=TA_RIGHT)),
        ]],
        colWidths=[W * 0.75, W * 0.25],
    )
    header.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), C_BG),
        ('LEFTBORDER',    (0, 0), (0, -1), 2, fg),
        ('BOX',           (0, 0), (-1, -1), 0.5, C_BORDER),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
        ('TOPPADDING',    (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN',         (1, 0), (1, 0), 'RIGHT'),
    ]))

    # Specified / proposed values row
    spec_prop = Table(
        [[
            Paragraph(
                f"<font color='#9b9b99'>Specified</font><br/>{_pdf_safe(dim.specified_value or '—')}",
                ParagraphStyle('spv', fontName='Helvetica', fontSize=9,
                               textColor=C_INK, leading=13)
            ),
            Paragraph(
                f"<font color='#9b9b99'>Proposed</font><br/>{_pdf_safe(dim.proposed_value or '—')}",
                ParagraphStyle('ppv', fontName='Helvetica', fontSize=9,
                               textColor=C_INK, leading=13)
            ),
        ]],
        colWidths=[W * 0.5, W * 0.5],
    )
    spec_prop.setStyle(TableStyle([
        ('BOX',           (0, 0), (-1, -1), 0.5, C_BORDER),
        ('LINEAFTER',     (0, 0), (0, -1), 0.25, C_BORDER),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
    ]))

    items = [header, spec_prop]

    # Delta — the key insight, given full width and room to breathe
    if dim.delta:
        delta_table = Table(
            [[Paragraph(_pdf_safe(dim.delta), ParagraphStyle('dt',
                fontName='Helvetica', fontSize=9,
                textColor=fg, leading=14))]],
            colWidths=[W],
        )
        delta_table.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, -1), bg),
            ('BOX',           (0, 0), (-1, -1), 0.5, bd),
            ('LEFTPADDING',   (0, 0), (-1, -1), 10),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
            ('TOPPADDING',    (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ]))
        items.append(delta_table)

    # Requirement + code ref
    footnote = Table(
        [[Paragraph(
            f"{_pdf_safe(dim.requirement)}  <font color='#c5c5c3'>·  {_pdf_safe(dim.code_reference)}</font>",
            ParagraphStyle('fn', fontName='Helvetica', fontSize=7,
                           textColor=C_MUTED, leading=10)
        )]],
        colWidths=[W],
    )
    footnote.setStyle(TableStyle([
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    items.append(footnote)

    return [KeepTogether(items), Spacer(1, 4*mm)]


# ---------------------------------------------------------------------------
# Main PDF builder
# ---------------------------------------------------------------------------

def generate_pdf(assessment: SubstitutionAssessment) -> bytes:
    buffer = BytesIO()
    page_cb = _PageTemplate(assessment)

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B + 4*mm,
        onFirstPage=page_cb, onLaterPages=page_cb,
    )
    styles = _make_styles()
    story = []
    W = CONTENT_W

    # ── Header ─────────────────────────────────────────────────────────────────
    mark_scale = 0.65
    mark_w = 23 * mark_scale

    header = Table(
        [[
            RMarkFlowable(scale=mark_scale),
            Paragraph('ræson', styles['brand']),
            Paragraph(
                datetime.now(timezone.utc).strftime('%d %B %Y'),
                ParagraphStyle('hdate', fontName='Helvetica', fontSize=8,
                               textColor=C_MUTED, leading=12, alignment=TA_RIGHT)
            ),
        ]],
        colWidths=[mark_w + 3, W * 0.55, W * 0.45 - mark_w - 3],
    )
    header.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header)
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 6*mm))

    # ── Product substitution title ──────────────────────────────────────────────
    fg, bg, bd, _ = _verdict_colors(assessment.overall_risk.value)

    title_table = Table(
        [[
            Table(
                [[
                    Paragraph(_pdf_safe(assessment.specified_product), styles['product_name']),
                    Paragraph('->', ParagraphStyle('ar', fontName='Helvetica',
                        fontSize=13, textColor=C_MUTED, leading=17)),
                    Paragraph(_pdf_safe(assessment.proposed_product), styles['product_name']),
                ]],
                colWidths=[W * 0.40, 8*mm, W * 0.40],
                rowHeights=[None],
            ),
            Paragraph(assessment.overall_risk.value.upper(),
                ParagraphStyle('ov', fontName='Helvetica-Bold', fontSize=11,
                    textColor=fg, leading=14, alignment=TA_RIGHT)),
        ]],
        colWidths=[W * 0.82, W * 0.18],
    )
    title_table.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 3*mm))

    # ── Context metadata ────────────────────────────────────────────────────────
    ctx_items = [
        ('Function', assessment.building_function),
        ('Class',    assessment.building_class),
        ('Element',  assessment.building_element.replace('_', ' ')),
        ('Climate',  assessment.climate_zone),
        ('Data',     assessment.data_completeness),
    ]
    ctx_parts = '   ·   '.join(
        f"<font color='#c5c5c3'>{k}</font>  {v}"
        for k, v in ctx_items if v
    )
    story.append(Paragraph(ctx_parts,
        ParagraphStyle('ctx', fontName='Helvetica', fontSize=8,
                       textColor=C_SUBTLE, leading=12)))
    story.append(Spacer(1, 5*mm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 5*mm))

    # ── Scorecard ───────────────────────────────────────────────────────────────
    story.append(Paragraph('ASSESSMENT SCORECARD', styles['section_label']))
    story.append(Spacer(1, 1*mm))
    story.append(_scorecard(assessment.dimensions, styles, W))
    story.append(Spacer(1, 6*mm))

    # ── Narrative ───────────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 5*mm))
    story.append(Paragraph('SUMMARY', styles['section_label']))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(_pdf_safe(assessment.risk_summary), styles['body']))

    # ── Recommendations ─────────────────────────────────────────────────────────
    if assessment.recommendations:
        story.append(Spacer(1, 2*mm))
        story.append(Paragraph('RECOMMENDATIONS', styles['section_label']))
        story.append(Spacer(1, 1*mm))
        for i, rec in enumerate(assessment.recommendations, 1):
            story.append(Paragraph(
                f"<font color='#9b9b99'>{i}.</font>  {_pdf_safe(rec)}",
                styles['rec']
            ))

    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 5*mm))

    # ── Dimension detail ─────────────────────────────────────────────────────────
    WELLBEING = {'biophilic_quality', 'acoustic_quality', 'thermal_comfort', 'daylight_quality'}
    VERDICT_ORDER = {'fail': 0, 'conditional': 1, 'pass': 2}

    compliance_dims = sorted(
        [d for d in assessment.dimensions if d.dimension not in WELLBEING],
        key=lambda d: VERDICT_ORDER.get(d.verdict.value, 3)
    )
    wellbeing_dims = sorted(
        [d for d in assessment.dimensions if d.dimension in WELLBEING],
        key=lambda d: VERDICT_ORDER.get(d.verdict.value, 3)
    )

    if compliance_dims:
        story.append(Paragraph('COMPLIANCE — DETAIL', styles['section_label']))
        story.append(Spacer(1, 1*mm))
        for dim in compliance_dims:
            story.extend(_dimension_section(dim, styles, W))

    if wellbeing_dims:
        story.append(Spacer(1, 2*mm))
        story.append(Paragraph('WELLBEING — DETAIL', styles['section_label']))
        story.append(Spacer(1, 1*mm))
        for dim in wellbeing_dims:
            story.extend(_dimension_section(dim, styles, W))

    # ── Data gaps ────────────────────────────────────────────────────────────────
    if assessment.missing_data:
        story.append(Spacer(1, 2*mm))
        story.append(Paragraph('DATA GAPS', styles['section_label']))
        for gap in assessment.missing_data:
            story.append(Paragraph(f"· {gap}", ParagraphStyle('dg',
                fontName='Helvetica', fontSize=9,
                textColor=C_AMBER, leading=13)))

    # ── Footer ────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_BORDER, spaceAfter=3*mm))
    story.append(Paragraph(
        "Generated by ræson — material substitution risk intelligence. "
        "This assessment is advisory and does not constitute legal compliance certification. "
        "The architect of record remains responsible for verifying all applicable building codes and standards.",
        styles['footer']
    ))
    if assessment.code_documents_referenced:
        story.append(Spacer(1, 1*mm))
        story.append(Paragraph(
            "Referenced: " + ', '.join(assessment.code_documents_referenced),
            styles['footer']
        ))

    doc.build(story)
    return buffer.getvalue()
