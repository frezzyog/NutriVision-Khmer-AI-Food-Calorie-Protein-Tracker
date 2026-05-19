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
from ocr_utils import extract_text_from_image, parse_nutrition_text


LOW_CONFIDENCE_THRESHOLD = 0.60


def apply_theme():
    """Apply the neon health-tech visual style."""
    st.markdown(
        """
        <style>
        .stApp {
            background:
                radial-gradient(circle at 50% 0%, rgba(126, 255, 0, 0.18), transparent 28rem),
                radial-gradient(circle at 100% 10%, rgba(0, 255, 128, 0.11), transparent 22rem),
                #020403;
            color: #f8fafc;
        }
        h1, h2, h3, .stMarkdown, label, p {
            color: #f8fafc !important;
        }
        h1 {
            font-size: 4rem !important;
            line-height: 1 !important;
            letter-spacing: 0 !important;
        }
        h2, h3 {
            letter-spacing: 0 !important;
        }
        section[data-testid="stSidebar"], header[data-testid="stHeader"] {
            background: transparent;
        }
        div[data-testid="stMetric"] {
            background: linear-gradient(180deg, rgba(10, 24, 16, 0.95), rgba(4, 10, 8, 0.95));
            border: 1px solid rgba(126, 255, 0, 0.28);
            border-radius: 14px;
            padding: 1rem;
            box-shadow: 0 0 24px rgba(126, 255, 0, 0.08);
        }
        div[data-testid="stMetric"] label, div[data-testid="stMetric"] [data-testid="stMetricValue"] {
            color: #f8fafc !important;
        }
        .stButton > button {
            background: linear-gradient(135deg, #7eff00, #00d47a);
            color: #061006;
            border: 0;
            border-radius: 12px;
            font-weight: 800;
            box-shadow: 0 0 22px rgba(126, 255, 0, 0.28);
        }
        .stButton > button:hover {
            color: #061006;
            border: 0;
            filter: brightness(1.06);
        }
        .stRadio [role="radiogroup"] {
            background: rgba(8, 20, 13, 0.86);
            border: 1px solid rgba(126, 255, 0, 0.28);
            border-radius: 14px;
            padding: 0.55rem;
        }
        div[data-testid="stAlert"] {
            border-radius: 14px;
            border: 1px solid rgba(126, 255, 0, 0.22);
        }
        .stSelectbox, .stTextInput, .stNumberInput, .stFileUploader, .stCameraInput, .stTextArea {
            color: #f8fafc;
        }
        .nv-hero {
            text-align: center;
            padding: 1.5rem 0 1rem;
        }
        .nv-logo {
            width: 94px;
            height: 94px;
            margin: 0 auto 1rem;
            display: grid;
            place-items: center;
            border-radius: 28px;
            background: radial-gradient(circle at 35% 25%, #eaffd5, #7eff00 45%, #10220d 72%);
            border: 1px solid rgba(126, 255, 0, 0.75);
            box-shadow: 0 0 38px rgba(126, 255, 0, 0.48);
            color: #061006;
            font-size: 2.5rem;
            font-weight: 900;
        }
        .nv-title {
            font-size: clamp(3rem, 9vw, 5.5rem);
            line-height: 1;
            font-weight: 900;
            color: #f8fafc;
        }
        .nv-title span, .nv-accent {
            color: #7eff00;
        }
        .nv-subtitle {
            font-size: clamp(1.2rem, 3vw, 1.8rem);
            color: #f8fafc;
            margin-top: 0.75rem;
            font-weight: 700;
        }
        .nv-muted {
            color: #b6c7b5;
            margin-top: 0.75rem;
        }
        .nv-flow {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
            margin: 1.5rem 0;
        }
        .nv-flow-card, .nv-feature, .nv-secure {
            background: linear-gradient(180deg, rgba(9, 23, 14, 0.94), rgba(3, 8, 6, 0.96));
            border: 1px solid rgba(126, 255, 0, 0.32);
            border-radius: 16px;
            padding: 1rem;
            box-shadow: inset 0 0 30px rgba(126, 255, 0, 0.04), 0 0 28px rgba(126, 255, 0, 0.07);
        }
        .nv-flow-card strong {
            color: #7eff00;
        }
        .nv-flow-card div:first-child {
            font-size: 1.45rem;
        }
        .nv-features {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 0.7rem;
            margin: 1.25rem 0;
        }
        .nv-feature {
            text-align: center;
            min-height: 108px;
            display: grid;
            place-items: center;
            color: #f8fafc;
        }
        .nv-feature b {
            color: #7eff00;
            display: block;
            font-size: 1.35rem;
        }
        .nv-secure {
            margin: 1rem auto 1.5rem;
            max-width: 720px;
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        .nv-secure-icon {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            display: grid;
            place-items: center;
            background: #7eff00;
            color: #061006;
            font-weight: 900;
        }
        @media (max-width: 760px) {
            .nv-flow, .nv-features {
                grid-template-columns: 1fr;
            }
            h1 {
                font-size: 3rem !important;
            }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def show_hero():
    """Show the branded top flow inspired by the reference image."""
    st.markdown(
        """
        <div class="nv-hero">
            <div class="nv-logo">NV</div>
            <div class="nv-title">NutriVision <span>Khmer</span></div>
            <div class="nv-subtitle">Everything you eat. Everything <span class="nv-accent">you need.</span></div>
            <div class="nv-muted">Scan meals, read nutrition labels, and track smarter health goals.</div>
        </div>
        <div class="nv-flow">
            <div class="nv-flow-card"><div>1</div><strong>You Scan</strong><br/>Take a food or label photo</div>
            <div class="nv-flow-card"><div>2</div><strong>AI Analyzes</strong><br/>Classify food or read nutrition text</div>
            <div class="nv-flow-card"><div>3</div><strong>Your Day</strong><br/>Track calories, protein, and goals</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def show_feature_strip():
    """Show compact health feature cards."""
    st.markdown(
        """
        <div class="nv-features">
            <div class="nv-feature"><b>Scan</b>Food instantly</div>
            <div class="nv-feature"><b>Track</b>Calories accurately</div>
            <div class="nv-feature"><b>AI</b>Smarter insights</div>
            <div class="nv-feature"><b>Goals</b>Reach targets faster</div>
            <div class="nv-feature"><b>Health</b>Live better daily</div>
        </div>
        <div class="nv-secure">
            <div class="nv-secure-icon">OK</div>
            <div><strong class="nv-accent">Your data stays local.</strong><br/>Daily tracker data is stored only in this app session.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def initialize_tracker():
    """Create default session values the first time the app runs."""
    if "food_history" not in st.session_state:
        st.session_state.food_history = []
    if "calorie_goal" not in st.session_state:
        st.session_state.calorie_goal = 2000
    if "protein_goal" not in st.session_state:
        st.session_state.protein_goal = 60


def get_daily_totals():
    """Calculate current daily calories and protein."""
    total_calories = sum(item["Calories"] for item in st.session_state.food_history)
    total_protein = sum(item["Protein (g)"] for item in st.session_state.food_history)
    return total_calories, total_protein


def add_tracker_entry(food, category, portion, calories, protein, source):
    """Add one food or product entry to the daily tracker."""
    st.session_state.food_history.append(
        {
            "Food": food,
            "Category": category,
            "Portion": portion,
            "Calories": round(calories, 1),
            "Protein (g)": round(protein, 1),
            "Source": source,
        }
    )


def show_health_goals():
    """Show daily goal inputs and progress bars."""
    st.subheader("Health Goals")

    col1, col2 = st.columns(2)
    st.session_state.calorie_goal = col1.number_input(
        "Daily calorie target",
        min_value=500,
        max_value=6000,
        value=int(st.session_state.calorie_goal),
        step=50,
    )
    st.session_state.protein_goal = col2.number_input(
        "Daily protein target (g)",
        min_value=10,
        max_value=300,
        value=int(st.session_state.protein_goal),
        step=5,
    )

    total_calories, total_protein = get_daily_totals()
    calorie_goal = st.session_state.calorie_goal
    protein_goal = st.session_state.protein_goal

    st.progress(min(total_calories / calorie_goal, 1.0), text="Calories progress")
    st.progress(min(total_protein / protein_goal, 1.0), text="Protein progress")

    col3, col4 = st.columns(2)
    col3.metric("Remaining Calories", f"{calorie_goal - total_calories:.0f} kcal")
    col4.metric("Remaining Protein", f"{protein_goal - total_protein:.1f} g")

    if total_calories <= calorie_goal:
        st.success("Within daily calorie goal")
    else:
        st.warning("Over daily calorie goal")

    if total_protein >= protein_goal:
        st.success("Protein goal reached")
    else:
        st.info("More protein needed")


def show_daily_summary():
    """Display total calories, protein, health goals, and food history."""
    st.header("Daily Tracker")

    total_calories, total_protein = get_daily_totals()

    col1, col2 = st.columns(2)
    col1.metric("Total Calories", f"{total_calories:.0f} kcal")
    col2.metric("Total Protein", f"{total_protein:.1f} g")

    show_health_goals()

    st.subheader("Food History")
    if st.session_state.food_history:
        st.dataframe(pd.DataFrame(st.session_state.food_history), width="stretch")
    else:
        st.info("No food added yet.")

    if st.button("Clear Daily Tracker"):
        st.session_state.food_history = []
        st.rerun()


def choose_image_input(label_prefix):
    """Let the user upload an image or take a photo."""
    image_source = st.radio(
        f"{label_prefix} image source",
        ["Upload image", "Take photo"],
        horizontal=True,
    )

    if image_source == "Upload image":
        image_file = st.file_uploader(
            f"Upload {label_prefix.lower()} image",
            type=["jpg", "jpeg", "png", "webp"],
        )
    else:
        image_file = st.camera_input(f"Take {label_prefix.lower()} photo")

    return get_image_bytes(image_file)


def show_food_photo_analysis():
    """Food photo classification and manual correction workflow."""
    st.header("Food Photo Analysis")

    image_bytes = choose_image_input("Food")

    if image_bytes:
        show_image_preview(image_bytes)
    else:
        st.info("Upload a food image or take a photo to start.")

    st.subheader("AI Prediction")
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
            else:
                st.session_state.last_prediction = result["prediction"]
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
            st.warning("Low confidence. Please check the manual correction dropdown.")
            other_suggestions = [
                f"{item['label']} ({item['score']:.1%})"
                for item in st.session_state.get("all_predictions", [])[1:4]
            ]
            if other_suggestions:
                st.write("Alternatives: " + ", ".join(other_suggestions))

    st.subheader("Correct Food and Portion")

    food_names = get_food_names()
    matched_food = find_food_match(predicted_food) if predicted_food else None

    if predicted_food and not matched_food:
        st.warning("Unsupported food prediction. Please choose the closest food manually.")

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

    st.subheader("Estimated Nutrition")
    st.write(f"Serving reference: **{food_info['serving']}**")
    st.write(f"Category: **{food_info['category']}**")

    col1, col2 = st.columns(2)
    col1.metric("Calories", f"{nutrition['calories']:.0f} kcal")
    col2.metric("Protein", f"{nutrition['protein']:.1f} g")

    if st.button("Add Food to Daily Tracker"):
        source = "Manual Correction" if selected_food != matched_food else "Food Image"
        add_tracker_entry(
            selected_food,
            food_info["category"],
            nutrition["portion_label"],
            nutrition["calories"],
            nutrition["protein"],
            source,
        )
        st.success(f"Added {selected_food} to daily tracker.")


def show_label_scanner():
    """Nutrition label OCR workflow for packaged food and drinks."""
    st.header("Product Nutrition Label Scan")

    image_bytes = choose_image_input("Nutrition label")

    if image_bytes:
        show_image_preview(image_bytes)
    else:
        st.info("Upload a nutrition label image or take a photo to start.")

    if st.button("Scan Nutrition Label", type="primary"):
        if not image_bytes:
            st.error("No label image uploaded. Please upload a label or take a photo first.")
        else:
            with st.spinner("Reading nutrition label with EasyOCR..."):
                try:
                    ocr_text = extract_text_from_image(image_bytes)
                except Exception as error:
                    st.error(f"OCR failed: {error}")
                else:
                    st.session_state.ocr_text = ocr_text
                    st.session_state.parsed_nutrition = parse_nutrition_text(ocr_text)

    if "ocr_text" in st.session_state:
        st.subheader("Detected Text")
        st.text_area("OCR result", st.session_state.ocr_text, height=160)

    parsed = st.session_state.get("parsed_nutrition", {})
    detected_calories = parsed.get("calories") if parsed else None
    detected_protein = parsed.get("protein") if parsed else None

    st.subheader("Confirm Product Nutrition")
    product_name = st.text_input("Product name", value="Packaged food")
    serving = st.text_input("Serving amount", value="1 serving")

    calories = st.number_input(
        "Calories from label",
        min_value=0.0,
        max_value=5000.0,
        value=float(detected_calories or 0),
        step=10.0,
    )
    protein = st.number_input(
        "Protein from label (g)",
        min_value=0.0,
        max_value=300.0,
        value=float(detected_protein or 0),
        step=1.0,
    )

    if detected_calories is None or detected_protein is None:
        st.info("OCR may miss values. Please correct calories and protein before adding.")

    if st.button("Add Product to Daily Tracker"):
        if calories == 0 and protein == 0:
            st.error("Please enter calories or protein before adding this product.")
        else:
            add_tracker_entry(
                product_name,
                "Packaged Product",
                serving,
                calories,
                protein,
                "Nutrition Label",
            )
            st.success(f"Added {product_name} to daily tracker.")


def main():
    st.set_page_config(page_title="NutriVision Khmer", layout="centered")
    apply_theme()

    load_dotenv()
    initialize_tracker()

    show_hero()

    st.warning(
        "Nutrition values are estimates only. Actual calories and protein depend on "
        "ingredients, cooking method, and portion size."
    )

    mode = st.radio(
        "Choose app mode",
        ["Food Photo Analysis", "Product Nutrition Label Scan", "Daily Tracker"],
        horizontal=True,
    )

    if mode == "Food Photo Analysis":
        show_food_photo_analysis()
    elif mode == "Product Nutrition Label Scan":
        show_label_scanner()
    else:
        show_daily_summary()

    if mode != "Daily Tracker":
        st.divider()
        show_daily_summary()

    show_feature_strip()


if __name__ == "__main__":
    main()
