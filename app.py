import pandas as pd
import streamlit as st
from dotenv import load_dotenv

from hf_client import DEFAULT_MODEL, classify_food_image
from image_utils import get_image_bytes, show_image_preview
from nutrition_db import (
    FOOD_DATABASE,
    calculate_nutrition,
    find_food_match,
    get_food_names,
)


LOW_CONFIDENCE_THRESHOLD = 0.60


def initialize_tracker():
    """Create an empty food history list the first time the app runs."""
    if "food_history" not in st.session_state:
        st.session_state.food_history = []


def show_daily_summary():
    """Display total calories, protein, and food history."""
    st.subheader("Daily Summary")

    total_calories = sum(item["Calories"] for item in st.session_state.food_history)
    total_protein = sum(item["Protein (g)"] for item in st.session_state.food_history)

    col1, col2 = st.columns(2)
    col1.metric("Total Calories", f"{total_calories:.0f} kcal")
    col2.metric("Total Protein", f"{total_protein:.1f} g")

    st.subheader("Food History")
    if st.session_state.food_history:
        st.dataframe(pd.DataFrame(st.session_state.food_history), use_container_width=True)
    else:
        st.info("No food added yet.")


def main():
    st.set_page_config(page_title="NutriVision Khmer", layout="centered")

    load_dotenv()
    initialize_tracker()

    st.title("NutriVision Khmer")
    st.caption("AI Food Calorie & Protein Tracker")

    st.warning(
        "Nutrition values are estimates only. Actual calories and protein depend on "
        "ingredients, cooking method, and portion size."
    )

    st.header("1. Add a Food Image")
    image_source = st.radio(
        "Choose image source",
        ["Upload image", "Take photo"],
        horizontal=True,
    )

    image_file = None
    if image_source == "Upload image":
        image_file = st.file_uploader("Upload a food image", type=["jpg", "jpeg", "png", "webp"])
    else:
        image_file = st.camera_input("Take a food photo")

    image_bytes = get_image_bytes(image_file)

    if image_bytes:
        show_image_preview(image_bytes)
    else:
        st.info("Upload an image or take a photo to start.")

    st.header("2. AI Prediction")
    prediction = None
    predicted_food = None
    confidence = 0.0

    if st.button("Analyze Food Image", type="primary"):
        if not image_bytes:
            st.error("No image uploaded. Please upload an image or take a photo first.")
        else:
            with st.spinner("Sending image to Hugging Face..."):
                result = classify_food_image(image_bytes, model_id=DEFAULT_MODEL)

            if not result["success"]:
                st.error(result["error"])
                if "Model is loading" in result["error"]:
                    st.info("The AI model is waking up. Please try again in a few seconds.")
            else:
                prediction = result["prediction"]
                st.session_state.last_prediction = prediction
                st.session_state.all_predictions = result["all_predictions"]
                st.session_state.model_warning = result.get("warning")

    if "last_prediction" in st.session_state:
        prediction = st.session_state.last_prediction
        predicted_food = prediction["label"]
        confidence = prediction["score"]

        st.success(f"Top Prediction: **{predicted_food}** ({confidence:.2%})")

        if st.session_state.get("model_warning"):
            st.warning(st.session_state.model_warning)

        if confidence < LOW_CONFIDENCE_THRESHOLD:
            st.warning("Low confidence. See other suggestions below:")
            other_suggestions = [
                f"{p['label']} ({p['score']:.1%})"
                for p in st.session_state.get("all_predictions", [])[1:4]
            ]
            if other_suggestions:
                st.write("Alternatives: " + ", ".join(other_suggestions))

    st.header("3. Correct Food and Portion")

    food_names = get_food_names()
    matched_food = find_food_match(predicted_food) if predicted_food else None

    if predicted_food and not matched_food:
        st.warning(
            "Unsupported food prediction. Please choose the closest food manually."
        )

    default_index = food_names.index(matched_food) if matched_food in food_names else 0
    selected_food = st.selectbox(
        "Manual correction / confirmed food",
        food_names,
        index=default_index,
    )

    portion_option = st.selectbox(
        "Portion size",
        ["Small (0.75x)", "Medium (1x)", "Large (1.5x)", "Custom grams"],
    )

    custom_grams = None
    if portion_option == "Custom grams":
        custom_grams = st.number_input(
            "Enter estimated grams",
            min_value=1,
            max_value=2000,
            value=250,
            step=10,
        )

    nutrition = calculate_nutrition(selected_food, portion_option, custom_grams)
    food_info = FOOD_DATABASE[selected_food]

    st.header("4. Estimated Nutrition")
    st.write(f"Serving reference: **{food_info['serving']}**")
    st.write(f"Category: **{food_info['category']}**")

    col1, col2 = st.columns(2)
    col1.metric("Calories", f"{nutrition['calories']:.0f} kcal")
    col2.metric("Protein", f"{nutrition['protein']:.1f} g")

    if st.button("Add to Daily Tracker"):
        st.session_state.food_history.append(
            {
                "Food": selected_food,
                "Category": food_info["category"],
                "Portion": nutrition["portion_label"],
                "Calories": round(nutrition["calories"], 1),
                "Protein (g)": round(nutrition["protein"], 1),
            }
        )
        st.success(f"Added {selected_food} to daily tracker.")

    show_daily_summary()

    if st.button("Clear Daily Tracker"):
        st.session_state.food_history = []
        st.rerun()


if __name__ == "__main__":
    main()
