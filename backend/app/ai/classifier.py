from transformers import pipeline

from app.config import CLASSIFICATION_LABEL_DESCRIPTIONS, CLASSIFIER_MODEL

# transformers auto-downloads + caches this on first run - no manual steps
_classifier = pipeline(
    "zero-shot-classification",
    model=CLASSIFIER_MODEL,
    device=-1,  # -1 = CPU; set to 0 if you have a CUDA GPU
)

_DESCRIPTIONS = list(CLASSIFICATION_LABEL_DESCRIPTIONS.values())
_LABEL_BY_DESCRIPTION = {v: k for k, v in CLASSIFICATION_LABEL_DESCRIPTIONS.items()}


def classify_email(email_text: str) -> dict:
    result = _classifier(
        email_text,
        candidate_labels=_DESCRIPTIONS,
        hypothesis_template="This email is {}.",
        multi_label=False,
    )
    labels = [_LABEL_BY_DESCRIPTION[d] for d in result["labels"]]
    return {
        "predicted_label": labels[0],
        "confidence": round(result["scores"][0], 4),
        "all_scores": dict(zip(labels, result["scores"])),
    }
