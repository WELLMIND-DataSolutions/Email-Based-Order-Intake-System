FROM python:3.12-slim

# Tesseract system binary - pytesseract needs this on the container, not
# just the pip package (app/config.py discovers it via `which tesseract`).
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# CPU-only torch wheel must land before the main install, or pip pulls the
# much larger CUDA build in transitively via transformers/accelerate.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway injects $PORT at runtime; must bind 0.0.0.0, not 127.0.0.1.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
