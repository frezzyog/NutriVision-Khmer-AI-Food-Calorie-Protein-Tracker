import re
from io import BytesIO
from functools import lru_cache

import easyocr
import numpy as np
from PIL import Image


def extract_text_from_image(image_bytes):
    """Read text from a nutrition label image using EasyOCR."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    reader = get_ocr_reader()
    text_lines = reader.readtext(np.array(image), detail=0, paragraph=True)
    return "\n".join(text_lines)


@lru_cache(maxsize=1)
def get_ocr_reader():
    """Load EasyOCR once so repeated scans are faster."""
    return easyocr.Reader(["en"], gpu=False)


def parse_nutrition_text(text):
    """Find calories and protein from common nutrition label text patterns."""
    cleaned_text = " ".join(text.split())

    calories = _find_number_after_keywords(
        cleaned_text,
        keywords=["calories", "energy"],
        suffixes=["kcal", "cal"],
    )
    protein = _find_number_after_keywords(
        cleaned_text,
        keywords=["protein"],
        suffixes=["g", "gram", "grams"],
    )

    return {
        "calories": calories,
        "protein": protein,
    }


def _find_number_after_keywords(text, keywords, suffixes):
    """Return the first number near a keyword such as Calories or Protein."""
    keyword_pattern = "|".join(re.escape(keyword) for keyword in keywords)
    suffix_pattern = "|".join(re.escape(suffix) for suffix in suffixes)

    patterns = [
        rf"(?:{keyword_pattern})\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:{suffix_pattern})?",
        rf"(\d+(?:\.\d+)?)\s*(?:{suffix_pattern})\s*(?:{keyword_pattern})",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return float(match.group(1))

    return None
