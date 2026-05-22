from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from hf_client import DEFAULT_MODEL, classify_food_image
from nutrition_db import FOOD_DATABASE, calculate_nutrition, find_food_match
from ocr_utils import extract_text_from_image, parse_nutrition_text


load_dotenv()

app = FastAPI(title="NutriVision Khmer Mobile API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    """Simple endpoint to confirm the API is running."""
    return {"status": "ok", "app": "NutriVision Khmer Mobile API"}


@app.post("/analyze-food")
async def analyze_food(image: UploadFile = File(...)):
    """Analyze a food photo and return a nutrition estimate when possible."""
    image_bytes = await image.read()
    result = classify_food_image(image_bytes, model_id=DEFAULT_MODEL)

    if not result["success"]:
        return result

    prediction = result["prediction"]
    matched_food = find_food_match(prediction["label"])

    nutrition = None
    food_info = None
    if matched_food:
        nutrition = calculate_nutrition(matched_food, "Medium (1x)")
        food_info = FOOD_DATABASE[matched_food]
    else:
        return {
            "success": True,
            "needs_manual_selection": True,
            "prediction": prediction,
            "matched_food": None,
            "nutrition": None,
            "food_info": None,
            "warning": (
                "AI could not match this image to the local nutrition database. "
                "Please choose the correct food manually in the app."
            ),
            "all_predictions": result.get("all_predictions", []),
        }

    return {
        "success": True,
        "needs_manual_selection": False,
        "prediction": prediction,
        "matched_food": matched_food,
        "nutrition": nutrition,
        "food_info": food_info,
        "warning": result.get("warning"),
        "all_predictions": result.get("all_predictions", []),
    }


@app.post("/scan-label")
async def scan_label(image: UploadFile = File(...)):
    """Extract text and nutrition values from a product nutrition label."""
    image_bytes = await image.read()
    try:
        text = extract_text_from_image(image_bytes)
    except Exception as error:
        return {
            "success": False,
            "error": f"OCR failed: {error}",
        }

    parsed = parse_nutrition_text(text)
    return {
        "success": True,
        "text": text,
        "calories": parsed["calories"],
        "protein": parsed["protein"],
    }
