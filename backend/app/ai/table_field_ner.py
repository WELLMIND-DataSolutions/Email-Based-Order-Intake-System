"""Stanza + spaCy hybrid NER for identifying table-column fields across
languages (Technical Architecture doc's Table-Preservation Grid roadmap item,
extended per user request to work across languages, not just English).

Two-layer, cheapest-first design - same philosophy as the Roman Urdu
few-shot feature (roman_urdu_examples.py): curated data beats a heavy model
wherever the vocabulary is small and closed.

  Layer 1 (primary, ~0 extra RAM, every language): spaCy's blank multi-
  language pipeline + PhraseMatcher against FIELD_SYNONYMS below. Table
  headers are a small closed vocabulary ("Qty", "Rate", "Naam", "پتہ"...) so
  a maintained synonym list resolves almost every real-world header without
  any statistical model or download.

  Layer 2 (fallback, lazy-loaded like Donut - see doc_vision_extractor.py):
  Stanza's English NER pipeline, run on a column's *values* (not its header)
  only when Layer 1's header match misses. Stanza doesn't ship NER models
  for Urdu or Roman Urdu, so this layer is a best-effort fallback for
  English/numeric columns, not full multilingual coverage - an unresolved
  column is left unlabeled (formatted as "column_N") rather than guessed
  wrong.
"""

import re

import spacy
from spacy.matcher import PhraseMatcher

CANONICAL_FIELDS = ["item", "quantity", "unit_price", "total", "customer_name", "address"]

# English + Roman Urdu + Urdu-script synonyms per canonical field. Grow this
# from real AuditLog corrections over time, same as roman_urdu_examples.py.
FIELD_SYNONYMS: dict[str, list[str]] = {
    "item": ["item", "product", "description", "particulars", "cheez", "saman", "چیز", "تفصیل", "پروڈکٹ"],
    "quantity": ["qty", "quantity", "count", "units", "miqdar", "meqdar", "تعداد", "مقدار"],
    "unit_price": ["price", "rate", "unit price", "unit rate", "qeemat", "keemat", "قیمت", "ریٹ"],
    "total": ["total", "amount", "grand total", "sub total", "jama", "kul", "جمع", "کل", "ٹوٹل"],
    "customer_name": ["name", "customer", "customer name", "naam", "نام"],
    "address": ["address", "shipping address", "pata", "location", "پتہ"],
}

# Blank multi-language ("xx") pipeline: tokenizer + matcher only, no model
# weights to download - deliberately not spacy.load(), which would need a
# per-language trained package.
_nlp = spacy.blank("xx")
_matcher = PhraseMatcher(_nlp.vocab, attr="LOWER")
for _field, _synonyms in FIELD_SYNONYMS.items():
    _matcher.add(_field, [_nlp.make_doc(s) for s in _synonyms])

_stanza_pipeline = None  # lazy-loaded on first Layer-2 use, see _get_stanza_pipeline
_MONEY_RE = re.compile(r"^[\d,]+(\.\d+)?$")


def _get_stanza_pipeline():
    """Load Stanza's English NER pipeline on first use only. Tables whose
    headers all resolve via Layer 1 never touch this - matches the
    load-on-demand pattern doc_vision_extractor.py uses for Donut."""
    global _stanza_pipeline
    if _stanza_pipeline is None:
        import stanza

        try:
            _stanza_pipeline = stanza.Pipeline(lang="en", processors="tokenize,ner", verbose=False)
        except Exception:
            stanza.download("en", verbose=False)
            _stanza_pipeline = stanza.Pipeline(lang="en", processors="tokenize,ner", verbose=False)
    return _stanza_pipeline


def _match_header(header: str) -> str | None:
    doc = _nlp.make_doc(header.strip())
    matches = _matcher(doc)
    if not matches:
        return None
    match_id, _, _ = matches[0]
    return _nlp.vocab.strings[match_id]


def _guess_from_values(values: list[str]) -> str | None:
    """Layer 2: regex first (free), Stanza NER second. Best-effort only -
    see module docstring for the Urdu/Roman Urdu limitation."""
    sample = [v.strip() for v in values if v and v.strip()][:5]
    if not sample:
        return None

    if all(_MONEY_RE.match(v) for v in sample):
        return "unit_price"

    try:
        pipeline = _get_stanza_pipeline()
        doc = pipeline(" ".join(sample))
        ent_types = [ent.type for ent in doc.ents]
        if not ent_types:
            return None
        if ent_types.count("MONEY") > len(ent_types) / 2:
            return "unit_price"
        if "PERSON" in ent_types:
            return "customer_name"
        if any(t in ent_types for t in ("GPE", "LOC", "FAC")):
            return "address"
    except Exception:
        pass  # Stanza unavailable, or content it has no model for - stay unresolved

    return None


def identify_table_fields(rows: list[list[str]]) -> dict[int, str]:
    """Map column index -> canonical field name for a pdfplumber table.

    rows[0] is treated as the header row. Any header Layer 1 doesn't
    recognize falls back to inspecting that column's values (Layer 2).
    Columns that resolve in neither layer are simply absent from the
    returned mapping - callers should fall back to a raw column label.
    """
    if not rows:
        return {}
    header = [cell or "" for cell in rows[0]]
    body = rows[1:]

    field_by_col: dict[int, str] = {}
    for col_idx, cell in enumerate(header):
        field = _match_header(cell)
        if field is None:
            column_values = [row[col_idx] for row in body if col_idx < len(row)]
            field = _guess_from_values(column_values)
        if field:
            field_by_col[col_idx] = field
    return field_by_col
