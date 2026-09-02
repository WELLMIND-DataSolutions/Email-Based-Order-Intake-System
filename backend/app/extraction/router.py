from pathlib import Path

from app.ai.doc_vision_extractor import extract_from_scanned_invoice
from app.ai.structured_extractor import extract_order_fields
from app.extraction.ocr_extractor import extract_text_from_image
from app.extraction.pdf_extractor import extract_text_from_pdf

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def process_attachment(path: Path) -> dict:
    """Dispatch an attachment to the right extractor by file extension:
    digital PDF -> pdfplumber text -> structured_extractor (same
    ExtractedOrder schema as email text); scanned receipt image -> Donut CORD
    (its own structured schema, not ExtractedOrder), falling back to raw OCR
    text if Donut fails."""
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        text = extract_text_from_pdf(str(path))
        return {"source_type": "pdf", "extracted_text": text, "extraction": extract_order_fields(text)}

    if suffix in IMAGE_EXTENSIONS:
        try:
            return {"source_type": "scanned_receipt", "extraction": extract_from_scanned_invoice(str(path))}
        except Exception as exc:
            return {"source_type": "scanned_fallback_ocr", "ocr_error": str(exc), "extracted_text": extract_text_from_image(str(path))}

    raise ValueError(f"Unsupported attachment type: {suffix}")
