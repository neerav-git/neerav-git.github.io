#!/usr/bin/env python3
"""Build the combined portfolio work-record PDF."""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
RECORD_DIR = ROOT / "docs" / "work-records"
OUTPUT = ROOT / "output" / "pdf" / "portfolio-work-records-combined.pdf"

RECORDS = [
    ("Research index and copy contract", RECORD_DIR / "README.md"),
    ("Relay", RECORD_DIR / "relay.md"),
    ("Refract", RECORD_DIR / "refract.md"),
    ("Homeward", RECORD_DIR / "homeward.md"),
    ("Birb Hangout", RECORD_DIR / "birb-hangout.md"),
    ("Four-class Alzheimer MRI classification", RECORD_DIR / "alzheimers-mri-classification.md"),
    ("Brain atrophy paper", RECORD_DIR / "brain-atrophy-paper.md"),
]

INK = colors.HexColor("#17211D")
MUTED = colors.HexColor("#5D6862")
ACCENT = colors.HexColor("#B18A45")
GREEN = colors.HexColor("#29483B")
PAPER = colors.HexColor("#F7F4EC")
RULE = colors.HexColor("#D9D4C7")
WHITE = colors.HexColor("#FCFAF4")


def ascii_text(value: str) -> str:
    replacements = {
        "\u2014": " - ",
        "\u2013": "-",
        "\u2011": "-",
        "\u2212": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2192": "->",
        "\u2265": ">=",
        "\u2264": "<=",
        "\u00d7": "x",
        "\u03ba": "kappa",
        "\u03c1": "rho",
        "\u2026": "...",
        "\u00a0": " ",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    return value


def inline_markup(value: str) -> str:
    value = ascii_text(value.strip())
    tokens: list[str] = []

    def stash(payload: str) -> str:
        tokens.append(payload)
        return f"@@TOKEN{len(tokens) - 1}@@"

    def link(match: re.Match[str]) -> str:
        label = html.escape(ascii_text(match.group(1)))
        url = html.escape(match.group(2), quote=True)
        return stash(f'<link href="{url}" color="#29483B"><u>{label}</u></link>')

    value = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, value)
    value = re.sub(
        r"`([^`]+)`",
        lambda m: stash(f'<font name="Courier">{html.escape(ascii_text(m.group(1)))}</font>'),
        value,
    )
    value = html.escape(value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", value)
    for index, token in enumerate(tokens):
        value = value.replace(f"@@TOKEN{index}@@", token)
    return value


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="RecordTitle",
        parent=styles["Title"],
        fontName="Times-Bold",
        fontSize=25,
        leading=29,
        textColor=INK,
        spaceAfter=16,
        keepWithNext=True,
        splitLongWords=True,
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        parent=styles["Heading2"],
        fontName="Times-Bold",
        fontSize=15,
        leading=18,
        textColor=GREEN,
        spaceBefore=15,
        spaceAfter=7,
        keepWithNext=True,
        splitLongWords=True,
    )
)
styles.add(
    ParagraphStyle(
        name="Subsection",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=ACCENT,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True,
        splitLongWords=True,
    )
)
styles.add(
    ParagraphStyle(
        name="RecordBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=13.4,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=7.5,
        splitLongWords=True,
        allowWidows=0,
        allowOrphans=0,
    )
)
styles.add(
    ParagraphStyle(
        name="BulletText",
        parent=styles["RecordBody"],
        leftIndent=0,
        firstLineIndent=0,
        spaceAfter=3,
    )
)
styles.add(
    ParagraphStyle(
        name="CodeBlock",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=8,
        leading=10.5,
        leftIndent=9,
        rightIndent=9,
        borderColor=RULE,
        borderWidth=0.6,
        borderPadding=7,
        backColor=colors.HexColor("#EEEAE0"),
        textColor=INK,
        spaceBefore=4,
        spaceAfter=8,
        splitLongWords=True,
    )
)
styles.add(
    ParagraphStyle(
        name="TOCTitle",
        parent=styles["Title"],
        fontName="Times-Bold",
        fontSize=24,
        leading=28,
        textColor=INK,
        spaceAfter=14,
    )
)
styles.add(
    ParagraphStyle(
        name="Deck",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=11,
        leading=16,
        textColor=MUTED,
        spaceAfter=10,
    )
)


class WorkRecordDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            if style_name in {"RecordTitle", "Section"}:
                level = 0 if style_name == "RecordTitle" else 1
                text = flowable.getPlainText()
                key = f"heading-{self.seq.nextf('heading')}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page, key))


def draw_page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    if doc.page > 1:
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(18 * mm, height - 14 * mm, width - 18 * mm, height - 14 * mm)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(18 * mm, height - 10.5 * mm, "PORTFOLIO WORK RECORDS")
        canvas.drawRightString(width - 18 * mm, height - 10.5 * mm, "EVIDENCE BASE - 13 OCT 2026")
        canvas.line(18 * mm, 13 * mm, width - 18 * mm, 13 * mm)
        canvas.drawString(18 * mm, 8.5 * mm, "Neerav Chaudhary")
        canvas.drawRightString(width - 18 * mm, 8.5 * mm, str(doc.page - 1))
    canvas.restoreState()


def parse_table(lines: list[str]):
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            continue
        rows.append([Paragraph(inline_markup(cell), styles["BulletText"]) for cell in cells])
    if not rows:
        return []
    available = A4[0] - 36 * mm
    count = len(rows[0])
    if count == 4:
        widths = [41 * mm, 43 * mm, 22 * mm, available - 106 * mm]
    else:
        widths = [available / count] * count
    table = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.45, RULE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#F0EDE4")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return [table, Spacer(1, 8)]


def markdown_flowables(path: Path, first_record: bool):
    lines = path.read_text(encoding="utf-8").splitlines()
    flowables = []
    paragraph: list[str] = []
    bullets: list[tuple[int, str]] = []
    table_lines: list[str] = []
    in_code = False
    code_lines: list[str] = []
    seen_h1 = False

    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            text = " ".join(item.strip() for item in paragraph)
            flowables.append(Paragraph(inline_markup(text), styles["RecordBody"]))
            paragraph = []

    def flush_bullets():
        nonlocal bullets
        if bullets:
            items = []
            ordered = all(kind == 1 for kind, _ in bullets)
            for _, item in bullets:
                items.append(ListItem(Paragraph(inline_markup(item), styles["BulletText"]), leftIndent=10))
            flowables.append(
                ListFlowable(
                    items,
                    bulletType="1" if ordered else "bullet",
                    start="1",
                    leftIndent=18,
                    bulletFontName="Helvetica",
                    bulletFontSize=8,
                    bulletColor=ACCENT,
                    spaceAfter=6,
                )
            )
            bullets = []

    def flush_table():
        nonlocal table_lines
        if table_lines:
            flowables.extend(parse_table(table_lines))
            table_lines = []

    for line in lines + [""]:
        if line.strip().startswith("```"):
            flush_paragraph()
            flush_bullets()
            flush_table()
            if in_code:
                content = "<br/>".join(html.escape(ascii_text(item)) or " " for item in code_lines)
                flowables.append(Paragraph(content, styles["CodeBlock"]))
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
            continue
        if line.startswith("|") and line.rstrip().endswith("|"):
            flush_paragraph()
            flush_bullets()
            table_lines.append(line)
            continue
        flush_table()
        heading = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading:
            flush_paragraph()
            flush_bullets()
            level = len(heading.group(1))
            title = inline_markup(heading.group(2))
            if level == 1:
                if seen_h1 or not first_record:
                    flowables.append(PageBreak())
                flowables.append(Paragraph(title, styles["RecordTitle"]))
                flowables.append(HRFlowable(width="100%", thickness=1.1, color=ACCENT, spaceAfter=12))
                seen_h1 = True
            elif level == 2:
                flowables.append(Paragraph(title, styles["Section"]))
            else:
                flowables.append(Paragraph(title, styles["Subsection"]))
            continue
        bullet = re.match(r"^\s*-\s+(.+)$", line)
        ordered = re.match(r"^\s*\d+[.)]\s+(.+)$", line)
        if bullet or ordered:
            flush_paragraph()
            bullets.append((1 if ordered else 0, (ordered or bullet).group(1)))
            continue
        if not line.strip():
            flush_paragraph()
            flush_bullets()
        else:
            paragraph.append(line)
    return flowables


def cover_story():
    cover_title = Paragraph(
        "Portfolio<br/>Work Records",
        ParagraphStyle(
            name="CoverTitle",
            fontName="Times-Bold",
            fontSize=38,
            leading=40,
            textColor=WHITE,
            alignment=TA_LEFT,
            spaceAfter=18,
        ),
    )
    cover_subtitle = Paragraph(
        "A source-grounded record of six products and research projects",
        ParagraphStyle(
            name="CoverSubtitle",
            fontName="Helvetica",
            fontSize=14,
            leading=20,
            textColor=colors.HexColor("#DAD4C4"),
            spaceAfter=18,
        ),
    )
    cover_meta = Paragraph(
        "Repository research, product methodology, measured results, attribution, claim ledgers, and exact source maps<br/><br/>Prepared 13 October 2026",
        ParagraphStyle(
            name="CoverMeta",
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#C4BDAE"),
        ),
    )
    panel = Table(
        [[cover_title], [cover_subtitle], [HRFlowable(width="100%", thickness=1.2, color=ACCENT)], [Spacer(1, 80 * mm)], [cover_meta]],
        colWidths=[155 * mm],
        rowHeights=[None, None, None, None, None],
    )
    panel.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), INK),
                ("BOX", (0, 0), (-1, -1), 0, INK),
                ("LEFTPADDING", (0, 0), (-1, -1), 16 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16 * mm),
                ("TOPPADDING", (0, 0), (-1, 0), 18 * mm),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 16 * mm),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return [Spacer(1, 4 * mm), panel, PageBreak()]


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    frame = Frame(18 * mm, 17 * mm, width - 36 * mm, height - 34 * mm, id="content")
    template = PageTemplate(id="body", frames=[frame], onPage=draw_page)
    doc = WorkRecordDoc(
        str(OUTPUT),
        pagesize=A4,
        pageTemplates=[template],
        title="Portfolio Work Records",
        author="Neerav Chaudhary",
        subject="Evidence base for portfolio copy",
        creator="Codex",
    )

    story = cover_story()
    story.append(Paragraph("Contents", styles["TOCTitle"]))
    story.append(
        Paragraph(
            "Seven source-grounded records, followed by claim ledgers and exact source maps. Page numbers exclude the cover.",
            styles["Deck"],
        )
    )
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            name="TOCRecord",
            fontName="Times-Bold",
            fontSize=11.5,
            leading=15,
            leftIndent=0,
            firstLineIndent=0,
            textColor=INK,
            spaceBefore=7,
        ),
        ParagraphStyle(
            name="TOCSection",
            fontName="Helvetica",
            fontSize=8.2,
            leading=11,
            leftIndent=10 * mm,
            firstLineIndent=0,
            textColor=MUTED,
        ),
    ]
    story.extend([toc, PageBreak()])

    for index, (_, path) in enumerate(RECORDS):
        if not path.exists():
            raise FileNotFoundError(path)
        story.extend(markdown_flowables(path, first_record=index == 0))

    doc.multiBuild(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()
