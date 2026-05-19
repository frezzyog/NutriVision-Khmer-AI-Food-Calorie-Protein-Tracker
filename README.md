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

## Expo Go Mobile Companion

The `mobile/` folder contains an Expo Go companion app for phone camera testing. The mobile app sends photos to a small FastAPI backend, which reuses the same Hugging Face, OCR, and nutrition logic as Streamlit.

1. Start the Python API from the project folder:

```bash
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

2. Start the Expo app:

```bash
cd mobile
pnpm install
pnpm start
```

3. Open Expo Go on your phone and scan the QR code. Your phone must be on the same Wi-Fi as your laptop.

4. In the Expo app, set the Python API URL to your laptop network address, for example:

```text
http://192.168.0.129:8000
```

Use the Streamlit app for the full tracker experience. Use the Expo app when you need reliable phone camera capture.

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
