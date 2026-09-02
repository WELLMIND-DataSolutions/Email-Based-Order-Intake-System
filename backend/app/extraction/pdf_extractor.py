import pdfplumber

from app.ai.table_field_ner import identify_table_fields


def _format_table(rows: list[list[str]]) -> str:
    """Render a pdfplumber table with canonical field names (item/quantity/
    unit_price/...) resolved via the hybrid NER in table_field_ner.py, so
    the LLM sees unambiguous structure regardless of the source header's
    language, instead of a flattened, order-scrambled line of cells."""
    if len(rows) < 2:
        return ""
    field_by_col = identify_table_fields(rows)
    lines = []
    for row in rows[1:]:
        cells = [(cell or "").strip() for cell in row]
        if not any(cells):
            continue
        labeled = [f"{field_by_col.get(i, f'column_{i}')}: {cell}" for i, cell in enumerate(cells) if cell]
        lines.append(" | ".join(labeled))
    return "\n".join(lines)


def extract_text_from_pdf(path: str) -> str:
    """Extract text from a digitally-generated (non-scanned) PDF.

    Narrative text uses plain extract_text(); tables use pdfplumber's
    coordinate-based extract_tables() so line-item rows/columns aren't
    flattened into a single unstructured line (Technical Architecture doc's
    Table-Preservation Grid roadmap item).
    """
    blocks = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                blocks.append(text.strip())
            for table in page.extract_tables():
                formatted = _format_table(table)
                if formatted:
                    blocks.append(f"[TABLE]\n{formatted}")
    return "\n\n".join(blocks).strip()
