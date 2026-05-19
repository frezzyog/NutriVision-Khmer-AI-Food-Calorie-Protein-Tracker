import os
import time

import requests


DEFAULT_MODEL = "eslamxm/vit-base-food101"
BACKUP_MODELS = [
    "Shresthadev403/food-image-classification",
    "facebook/deit-base-distilled-patch16-224",
]
HF_API_URL = "https://router.huggingface.co/hf-inference/models/{model_id}"


def classify_food_image(image_bytes, model_id=DEFAULT_MODEL, max_retries=3):
    """
    Send image bytes to the Hugging Face Inference API.
    Handles 'Model is loading' 503 errors by retrying.
    """
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

    model_ids = [model_id]
    for backup_model in BACKUP_MODELS:
        if backup_model not in model_ids:
            model_ids.append(backup_model)

    errors = []

    for current_model_id in model_ids:
        result = _classify_with_model(
            image_bytes=image_bytes,
            model_id=current_model_id,
            headers=headers,
            max_retries=max_retries,
        )

        if result["success"]:
            if current_model_id != model_id:
                result["warning"] = (
                    f"The assignment model was unavailable on Hugging Face, "
                    f"so the app used backup model: {current_model_id}."
                )
            return result

        errors.append(f"{current_model_id}: {result['error']}")

    return {
        "success": False,
        "error": "All Hugging Face model requests failed. " + " | ".join(errors),
    }


def _classify_with_model(image_bytes, model_id, headers, max_retries):
    """Try one Hugging Face model and return a normalized result."""
    url = HF_API_URL.format(model_id=model_id)

    for attempt in range(max_retries):
        try:
            response = requests.post(
                url,
                headers=headers,
                data=image_bytes,
                timeout=60,
            )

            # Handle Model Loading (503)
            if response.status_code == 503:
                error_data = response.json()
                estimated_time = error_data.get("estimated_time", 20)
                time.sleep(estimated_time)
                continue

            response.raise_for_status()
            predictions = response.json()
            break  # Success!

        except requests.exceptions.RequestException as error:
            # If it's the last attempt, return failure
            if attempt == max_retries - 1:
                return {
                    "success": False,
                    "error": f"API request failed: {error}",
                }
            time.sleep(2)
    else:
        # Loop finished without break
        return {
            "success": False,
            "error": f"Model failed to load after {max_retries} attempts.",
        }

    # Clean response parsing
    if isinstance(predictions, dict) and "error" in predictions:
        return {
            "success": False,
            "error": f"Hugging Face error: {predictions['error']}",
        }

    if not isinstance(predictions, list) or not predictions:
        return {
            "success": False,
            "error": "No prediction returned from the model.",
        }

    # Sort by score descending and take the top one
    try:
        sorted_predictions = sorted(predictions, key=lambda x: x.get("score", 0), reverse=True)
        best_prediction = sorted_predictions[0]

        return {
            "success": True,
            "prediction": {
                "label": best_prediction.get("label", "Unknown food"),
                "score": float(best_prediction.get("score", 0)),
            },
            "all_predictions": sorted_predictions,
            "model_used": model_id,
        }
    except (IndexError, KeyError, TypeError) as e:
        return {
            "success": False,
            "error": f"Error parsing API response: {e}",
        }
