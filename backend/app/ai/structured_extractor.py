"""Structured order extraction (blueprint Point 4 + Point 5).

Point 5 strategy — proactive, not reactive:
  1. PRIMARY: `outlines` constrained decoding. Token generation is masked so
     the model is structurally incapable of emitting JSON that doesn't match
     the ExtractedOrder schema. No retries needed for malformed output.
  2. BACKUP: if outlines itself errors, fall back to plain generation and
     let `json_repair` fix whatever came out, then validate with Pydantic.

Roman Urdu emails (Unique Feature 1) get few-shot examples injected into the
prompt before either path runs.
"""

import json
import os

# outlines' token-masking kernel is @torch.compile-decorated; without MSVC on
# this machine the compile attempt fails noisily and falls back anyway — skip it.
os.environ.setdefault("TORCHDYNAMO_DISABLE", "1")

import outlines
import torch
from json_repair import repair_json
from pydantic import ValidationError
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

from app.ai.general_examples import GENERAL_FEW_SHOT_EXAMPLES
from app.ai.language import is_roman_urdu
from app.ai.roman_urdu_examples import FEW_SHOT_EXAMPLES
from app.ai.schemas import ExtractedOrder
from app.config import EXTRACTOR_MODEL

tokenizer = AutoTokenizer.from_pretrained(EXTRACTOR_MODEL)  # auto-downloads
# device_map="cpu" (not "auto") avoids accelerate's disk-offload path, which is
# unusably slow on low-RAM machines - we'd rather run fully in RAM.
# bfloat16 halves RAM vs float32 (~3.1GB instead of ~6.2GB for the 1.5B model),
# which is what keeps classifier + extractor together inside the 8GB budget.
model = AutoModelForCausalLM.from_pretrained(EXTRACTOR_MODEL, device_map="cpu", torch_dtype=torch.bfloat16)

# Constrained-decoding wrapper around the SAME model instance — no extra RAM.
_outlines_model = outlines.from_transformers(model, tokenizer)
_constrained_generator = outlines.Generator(_outlines_model, ExtractedOrder)

# Plain pipeline kept for the json_repair fallback path.
_generator = pipeline("text-generation", model=model, tokenizer=tokenizer)

# NOTE: prompts are assembled with an f-string in _build_prompt(), not
# str.format() on a stored template — the example JSON blocks below contain
# literal, nested "{"/"}" characters (real JSON), and .format() would try to
# parse every one of those as a replacement field and crash. An f-string only
# substitutes the {examples}/{schema}/{email_text} placeholders written
# directly in its own source, so the substituted JSON text passes through
# untouched.
SCHEMA_BLOCK = """{
  "customer_name": string or null,
  "customer_email": string or null,
  "order_items": [{"description": string, "quantity": number, "unit_price": number or null}],
  "total_amount": number or null,
  "shipping_address": string or null
}"""

# Default (non-Roman-Urdu) few-shot examples — without these the 1.5B model
# reliably dropped customer_name/email/shipping_address and truncated
# multi-item lists on formally structured text (e.g. PDF invoices).
GENERAL_EXAMPLES_BLOCK = "\n\n".join(
    f'Example email:\n"""{email}"""\nExample JSON:\n{output}'
    for email, output in GENERAL_FEW_SHOT_EXAMPLES
)

# Unique Feature 1: for Roman Urdu emails, verified example pairs are injected
# so the model learns the mapping in-context — no translation, no fine-tune.
RU_EXAMPLES_BLOCK = "\n\n".join(
    f'Example email:\n"""{email}"""\nExample JSON:\n{output}'
    for email, output in FEW_SHOT_EXAMPLES
)


def _build_prompt(email_text: str, roman_urdu: bool) -> str:
    examples = RU_EXAMPLES_BLOCK if roman_urdu else GENERAL_EXAMPLES_BLOCK
    intro = (
        "The email is written in Roman Urdu (Urdu in Latin script). Study these\n"
        "verified examples of Roman Urdu emails and their correct JSON first:"
        if roman_urdu
        else "Study these verified examples first:"
    )
    return f"""You are an order-extraction engine. Extract the following JSON
schema ONLY from the email text below. Return valid JSON, nothing else.

{intro}

{examples}

Schema:
{SCHEMA_BLOCK}

Email text:
\"\"\"{email_text}\"\"\"

JSON:"""


def _chat_format(prompt: str) -> str:
    messages = [{"role": "user", "content": prompt}]
    return tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)


def _extract_constrained(formatted_prompt: str) -> ExtractedOrder:
    """Primary path: outlines masks logits so output always matches the schema."""
    raw = _constrained_generator(formatted_prompt, max_new_tokens=512)
    return ExtractedOrder.model_validate_json(raw)


def _extract_with_repair(formatted_prompt: str) -> ExtractedOrder:
    """Backup path: plain generation, then json_repair fixes any damage."""
    output = _generator(formatted_prompt, max_new_tokens=512, do_sample=False)[0]["generated_text"]
    raw = output[len(formatted_prompt):].strip()
    repaired = repair_json(raw)
    return ExtractedOrder(**json.loads(repaired))


def extract_order_fields(email_text: str) -> dict:
    """Extract order fields; guaranteed-structure decoding with a repair fallback.

    Roman Urdu emails get the few-shot prompt (Unique Feature 1); the
    was_roman_urdu flag rides along in the result for AuditLog tracking."""
    roman_urdu = is_roman_urdu(email_text)
    formatted = _chat_format(_build_prompt(email_text[:4000], roman_urdu))

    try:
        validated = _extract_constrained(formatted)
    except Exception as primary_exc:  # outlines failure → repair fallback
        try:
            validated = _extract_with_repair(formatted)
        except (json.JSONDecodeError, ValidationError, KeyError) as backup_exc:
            return {
                "error": f"Extraction failed. Constrained: {primary_exc}; repair fallback: {backup_exc}",
            }

    return {**validated.model_dump(), "was_roman_urdu": roman_urdu}
