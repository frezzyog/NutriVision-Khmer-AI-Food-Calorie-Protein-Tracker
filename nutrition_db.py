import difflib

FOOD_DATABASE = {
    "Bai Sach Chrouk": {
        "calories": 550,
        "protein": 22,
        "serving": "1 plate",
        "category": "Khmer Food",
    },
    "Kuy Teav": {
        "calories": 430,
        "protein": 20,
        "serving": "1 bowl",
        "category": "Khmer Food",
    },
    "Num Banh Chok": {
        "calories": 380,
        "protein": 14,
        "serving": "1 bowl",
        "category": "Khmer Food",
    },
    "Fish Amok": {
        "calories": 480,
        "protein": 28,
        "serving": "1 bowl with rice",
        "category": "Khmer Food",
    },
    "Lok Lak": {
        "calories": 620,
        "protein": 35,
        "serving": "1 plate",
        "category": "Khmer Food",
    },
    "Bai Cha": {
        "calories": 560,
        "protein": 18,
        "serving": "1 plate",
        "category": "Khmer Food",
    },
    "Mee Cha": {
        "calories": 590,
        "protein": 19,
        "serving": "1 plate",
        "category": "Khmer Food",
    },
    "Cha Kroeung": {
        "calories": 520,
        "protein": 30,
        "serving": "1 plate with rice",
        "category": "Khmer Food",
    },
    "Samlor Korko": {
        "calories": 360,
        "protein": 18,
        "serving": "1 bowl",
        "category": "Khmer Food",
    },
    "Samlor Machu": {
        "calories": 300,
        "protein": 20,
        "serving": "1 bowl",
        "category": "Khmer Food",
    },
    "Prahok Ktis": {
        "calories": 450,
        "protein": 24,
        "serving": "1 serving with vegetables",
        "category": "Khmer Food",
    },
    "Nom Pang": {
        "calories": 500,
        "protein": 20,
        "serving": "1 sandwich",
        "category": "Khmer Food",
    },
    "Khmer Red Curry": {
        "calories": 540,
        "protein": 24,
        "serving": "1 bowl with rice",
        "category": "Khmer Food",
    },
    "Grilled Chicken with Rice": {
        "calories": 620,
        "protein": 38,
        "serving": "1 plate",
        "category": "Khmer Food",
    },
    "Pork Rice": {
        "calories": 560,
        "protein": 24,
        "serving": "1 plate",
        "category": "Khmer Food",
    },
    "Beef Skewers": {
        "calories": 430,
        "protein": 32,
        "serving": "4 skewers",
        "category": "Khmer Food",
    },
    "Fried Egg with Rice": {
        "calories": 420,
        "protein": 14,
        "serving": "1 plate",
        "category": "Khmer Food",
    },
    "Rice with Soup": {
        "calories": 390,
        "protein": 16,
        "serving": "1 plate and 1 bowl",
        "category": "Khmer Food",
    },
    "pizza": {
        "calories": 285,
        "protein": 12,
        "serving": "1 slice",
        "category": "International Food",
    },
    "hamburger": {
        "calories": 540,
        "protein": 25,
        "serving": "1 burger",
        "category": "International Food",
    },
    "fried rice": {
        "calories": 520,
        "protein": 16,
        "serving": "1 plate",
        "category": "International Food",
    },
    "sushi": {
        "calories": 350,
        "protein": 18,
        "serving": "8 pieces",
        "category": "International Food",
    },
    "fried chicken": {
        "calories": 480,
        "protein": 30,
        "serving": "2 pieces",
        "category": "International Food",
    },
    "sandwich": {
        "calories": 420,
        "protein": 20,
        "serving": "1 sandwich",
        "category": "International Food",
    },
    "spaghetti": {
        "calories": 480,
        "protein": 18,
        "serving": "1 plate",
        "category": "International Food",
    },
    "salad": {
        "calories": 220,
        "protein": 8,
        "serving": "1 bowl",
        "category": "International Food",
    },
    "ice cream": {
        "calories": 270,
        "protein": 5,
        "serving": "1 cup",
        "category": "International Food",
    },
    "cake": {
        "calories": 350,
        "protein": 5,
        "serving": "1 slice",
        "category": "International Food",
    },
    "steak": {
        "calories": 650,
        "protein": 50,
        "serving": "1 steak",
        "category": "International Food",
    },
    "omelette": {
        "calories": 300,
        "protein": 18,
        "serving": "1 omelette",
        "category": "International Food",
    },
    "apple": {
        "calories": 95,
        "protein": 0.5,
        "serving": "1 medium apple",
        "category": "International Food",
    },
    "banana": {
        "calories": 105,
        "protein": 1.3,
        "serving": "1 medium banana",
        "category": "International Food",
    },
    "rice": {
        "calories": 205,
        "protein": 4.3,
        "serving": "1 cup cooked",
        "category": "International Food",
    },
    "chicken": {
        "calories": 335,
        "protein": 38,
        "serving": "1 cooked chicken breast",
        "category": "International Food",
    },
    "fish": {
        "calories": 240,
        "protein": 36,
        "serving": "1 fillet",
        "category": "International Food",
    },
    "egg": {
        "calories": 78,
        "protein": 6,
        "serving": "1 large egg",
        "category": "International Food",
    },
}


PORTION_MULTIPLIERS = {
    "Small (0.75x)": 0.75,
    "Medium (1x)": 1.0,
    "Large (1.5x)": 1.5,
}


def get_food_names():
    """Return sorted food names for the correction dropdown."""
    khmer_foods = [
        food for food, info in FOOD_DATABASE.items() if info["category"] == "Khmer Food"
    ]
    international_foods = [
        food
        for food, info in FOOD_DATABASE.items()
        if info["category"] == "International Food"
    ]
    return sorted(khmer_foods) + sorted(international_foods)


def find_food_match(predicted_label):
    """
    Match an AI label to a database item using fuzzy matching.
    Returns the best match from FOOD_DATABASE keys.
    """
    if not predicted_label:
        return None

    # 1. Clean the label
    label = predicted_label.lower().replace("_", " ").strip()

    # 2. Try exact match or substring match first (fast)
    food_names = list(FOOD_DATABASE.keys())
    for food in food_names:
        if food.lower() == label or food.lower() in label or label in food.lower():
            return food

    # 3. Use fuzzy matching for more complex differences
    matches = difflib.get_close_matches(label, food_names, n=1, cutoff=0.4)
    return matches[0] if matches else None


def calculate_nutrition(food_name, portion_option, custom_grams=None):
    """Calculate calories and protein for the selected portion."""
    food = FOOD_DATABASE[food_name]

    if portion_option == "Custom grams":
        # Approximation: 1 normal serving is treated as 250 grams for demo purposes.
        multiplier = custom_grams / 250
        portion_label = f"{custom_grams} grams"
    else:
        multiplier = PORTION_MULTIPLIERS[portion_option]
        portion_label = portion_option

    return {
        "calories": food["calories"] * multiplier,
        "protein": food["protein"] * multiplier,
        "portion_label": portion_label,
    }
