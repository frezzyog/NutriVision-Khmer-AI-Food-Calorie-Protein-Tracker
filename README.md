# NutriVision Khmer

AI Food Calorie & Protein Tracker for a computer vision assignment demo.

This app focuses on Khmer food and international food. Since many public food image classification models are trained mostly on international datasets such as Food101, the app includes a manual correction feature. If the AI prediction is incorrect, users can select the correct Khmer food manually and still calculate estimated calories and protein.

## Features

- Image upload and camera input
- Hugging Face food image classification
- Khmer food nutrition database
- International food backup database
- Manual correction dropdown for unsupported or incorrect AI predictions
- Small, medium, large, and custom gram portion sizes
- Daily calorie and protein tracker
- Food history table
- Error handling for missing token, failed API calls, no image, unsupported foods, and low confidence

## Setup

1. Install dependencies:

```bash
pnpm --version
pip install -r requirements.txt
```

2. Create a `.env` file in the project folder:

```env
HF_TOKEN=your_hugging_face_token_here
```

3. Run the app:

```bash
streamlit run app.py
```

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
