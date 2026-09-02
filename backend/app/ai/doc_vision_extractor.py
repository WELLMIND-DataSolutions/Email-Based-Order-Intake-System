import gc
import re

import torch
from PIL import Image
from transformers import DonutProcessor, VisionEncoderDecoderModel

MODEL_NAME = "naver-clova-ix/donut-base-finetuned-cord-v2"

# Unlike classifier.py / structured_extractor.py, nothing loads at import
# time here. On an 8GB-RAM machine already running the classifier + extractor,
# holding an extra ~800MB resident for a model only needed on scanned-image
# uploads isn't worth it - load on demand, release immediately after.


def extract_from_scanned_invoice(image_path: str) -> dict:
    processor = DonutProcessor.from_pretrained(MODEL_NAME)
    model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME)

    try:
        image = Image.open(image_path).convert("RGB")
        pixel_values = processor(image, return_tensors="pt").pixel_values

        task_prompt = "<s_cord-v2>"
        decoder_input_ids = processor.tokenizer(
            task_prompt, add_special_tokens=False, return_tensors="pt"
        ).input_ids

        outputs = model.generate(
            pixel_values,
            decoder_input_ids=decoder_input_ids,
            max_length=model.decoder.config.max_position_embeddings,
            pad_token_id=processor.tokenizer.pad_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
        )

        sequence = processor.batch_decode(outputs)[0]
        sequence = re.sub(r"</s_cord-v2>|<s_cord-v2>|<s>|</s>", "", sequence)
        return processor.token2json(sequence)
    finally:
        del model, processor
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
