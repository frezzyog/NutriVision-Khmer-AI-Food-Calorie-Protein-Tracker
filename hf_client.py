import os

import requests


DEFAULT_MODEL = "eslamxm/vit-base-food101"
HF_API_URL = "https://api-inference.huggingface.co/models/{model_id}"


def classify_food_image(image_bytes, model_id=DEFAULT_MODEL):
    """Send image bytes to the Hugging Face Inference API."""
    token = os.getenv("HF_TOKEN")
    if not token:
        return {
            "success": False,
            "error": "Missing Hugging Face API token. Add HF_TOKEN to your .env file.",
        }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/octet-stream",
    }

    try:
        response = requests.post(
            HF_API_URL.format(model_id=model_id),
            headers=headers,
            data=image_bytes,
            timeout=60,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as error:
        return {
            "success": False,
            "error": f"API request failed: {error}",
        }

    try:
        predictions = response.json()
    except ValueError:
        return {
            "success": False,
            "error": "API request failed: Hugging Face returned an invalid response.",
        }

    if isinstance(predictions, dict) and "error" in predictions:
        return {
            "success": False,
            "error": f"API request failed: {predictions['error']}",
        }

    if not isinstance(predictions, list) or not predictions:
        return {
            "success": False,
            "error": "API request failed: no prediction was returned.",
        }

    best_prediction = max(predictions, key=lambda item: item.get("score", 0))
    return {
        "success": True,
        "prediction": {
            "label": best_prediction.get("label", "Unknown food"),
            "score": float(best_prediction.get("score", 0)),
        },
        "all_predictions": predictions,
    }
