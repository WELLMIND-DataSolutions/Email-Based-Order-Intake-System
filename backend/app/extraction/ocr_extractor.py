import pytesseract
from PIL import Image

from app.config import TESSERACT_CMD

pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


def extract_text_from_image(path: str) -> str:
    """Fallback OCR for scanned documents that aren't receipt-shaped (i.e.
    not a good fit for the Donut CORD model)."""
    image = Image.open(path)
    return pytesseract.image_to_string(image).strip()
