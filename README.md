# NutriVision Khmer

AI Food Calorie & Protein Tracker for a computer vision assignment demo.

This app focuses on Khmer food and international food. Since many public food image classification models are trained mostly on international datasets such as Food101, the app includes a manual correction feature. If the AI prediction is incorrect, users can select the correct Khmer food manually and still calculate estimated calories and protein.

The app also includes a nutrition label scanner for packaged foods and drinks. Users can upload or take a photo of a nutrition label, extract text with EasyOCR, correct the detected calories and protein, and add the product to the daily tracker.

## Features

- Image upload and camera input
- Hugging Face food image classification
- Khmer food nutrition database
- International food backup database
- Manual correction dropdown for unsupported or incorrect AI predictions
- Small, medium, large, and custom gram portion sizes
- Daily calorie and protein tracker
- Product nutrition label scanner with EasyOCR
- Daily calorie and protein goals with progress bars
- Food history table
- Error handling for missing token, failed API calls, no image, unsupported foods, and low confidence

## Setup

1. Install dependencies:

```bash
pnpm --version
pip install -r requirements.txt
```

EasyOCR may take several minutes to install because it downloads computer vision dependencies.

2. Create a `.env` file in the project folder:

```env
HF_TOKEN=your_hugging_face_token_here
```

3. Run the app:

```bash
streamlit run app.py
```

## App Modes

- **Food Photo Analysis**: upload or take a food photo, get an AI prediction, correct the food manually if needed, choose a portion, and add it to the tracker.
- **Product Nutrition Label Scan**: upload or take a photo of a nutrition label, extract calories and protein with OCR, correct the values, and add the product to the tracker.
- **Daily Tracker**: view total calories, total protein, daily goals, progress bars, and food history.

## Hugging Face Model

The app uses:

```text
eslamxm/vit-base-food101
```

You can change the model in `hf_client.py` to:

```text
Shresthadev403/food-image-classification
```

## Important Note

Nutrition values are estimates only. Actual calories and protein depend on ingredients, cooking method, and portion size.
