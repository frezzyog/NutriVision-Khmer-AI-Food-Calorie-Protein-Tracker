import difflib


def food(calories, protein, serving, category):
    """Small helper to keep the food database easy to read."""
    return {
        "calories": calories,
        "protein": protein,
        "serving": serving,
        "category": category,
    }


FOOD_DATABASE = {
    # Khmer / Cambodian foods
    "Bai Sach Chrouk": food(550, 22, "1 plate", "Khmer Food"),
    "Kuy Teav": food(430, 20, "1 bowl", "Khmer Food"),
    "Num Banh Chok": food(380, 14, "1 bowl", "Khmer Food"),
    "Fish Amok": food(480, 28, "1 bowl with rice", "Khmer Food"),
    "Lok Lak": food(620, 35, "1 plate", "Khmer Food"),
    "Bai Cha": food(560, 18, "1 plate", "Khmer Food"),
    "Mee Cha": food(590, 19, "1 plate", "Khmer Food"),
    "Cha Kroeung": food(520, 30, "1 plate with rice", "Khmer Food"),
    "Samlor Korko": food(360, 18, "1 bowl", "Khmer Food"),
    "Samlor Machu": food(300, 20, "1 bowl", "Khmer Food"),
    "Prahok Ktis": food(450, 24, "1 serving with vegetables", "Khmer Food"),
    "Nom Pang": food(500, 20, "1 sandwich", "Khmer Food"),
    "Khmer Red Curry": food(540, 24, "1 bowl with rice", "Khmer Food"),
    "Grilled Chicken with Rice": food(620, 38, "1 plate", "Khmer Food"),
    "Pork Rice": food(560, 24, "1 plate", "Khmer Food"),
    "Beef Skewers": food(430, 32, "4 skewers", "Khmer Food"),
    "Fried Egg with Rice": food(420, 14, "1 plate", "Khmer Food"),
    "Rice with Soup": food(390, 16, "1 plate and 1 bowl", "Khmer Food"),
    "Khmer Beef Noodle Soup": food(470, 25, "1 bowl", "Khmer Food"),
    "Chicken Rice Porridge": food(360, 21, "1 bowl", "Khmer Food"),
    "Borbor Sach Moan": food(360, 21, "1 bowl", "Khmer Food"),
    "Borbor Sach Chrouk": food(390, 19, "1 bowl", "Khmer Food"),
    "Lort Cha": food(610, 18, "1 plate", "Khmer Food"),
    "Nom Krok": food(310, 5, "6 pieces", "Khmer Food"),
    "Num Pang Pate": food(520, 22, "1 sandwich", "Khmer Food"),
    "Grilled Fish with Rice": food(560, 36, "1 plate", "Khmer Food"),
    "Grilled Pork Skewers with Rice": food(650, 30, "1 plate", "Khmer Food"),
    "Fried Fish with Rice": food(620, 34, "1 plate", "Khmer Food"),
    "Sour Soup with Fish": food(320, 24, "1 bowl", "Khmer Food"),
    "Khmer Chicken Curry": food(560, 28, "1 bowl with rice", "Khmer Food"),
    "Stir Fried Morning Glory": food(180, 6, "1 plate", "Khmer Food"),
    "Stir Fried Beef with Ginger": food(500, 32, "1 plate with rice", "Khmer Food"),
    "Stir Fried Pork with Basil": food(530, 26, "1 plate with rice", "Khmer Food"),
    "Cambodian Mango Salad": food(220, 8, "1 plate", "Khmer Food"),
    "Green Papaya Salad": food(180, 6, "1 plate", "Khmer Food"),
    "Prahok Fried Rice": food(590, 22, "1 plate", "Khmer Food"),
    "Trey Ngeat": food(420, 34, "1 serving with rice", "Khmer Food"),
    "Kralan": food(330, 7, "1 bamboo tube serving", "Khmer Food"),
    "Num Ansom": food(420, 12, "1 piece", "Khmer Food"),
    "Palm Sugar Dessert": food(260, 4, "1 bowl", "Khmer Food"),

    # Southeast / East Asian foods
    "Pho": food(450, 24, "1 bowl", "Asian Food"),
    "Beef Pho": food(480, 28, "1 bowl", "Asian Food"),
    "Chicken Pho": food(420, 26, "1 bowl", "Asian Food"),
    "Beef Noodle Soup": food(500, 27, "1 bowl", "Asian Food"),
    "Chicken Noodle Soup": food(390, 24, "1 bowl", "Asian Food"),
    "Ramen": food(520, 22, "1 bowl", "Asian Food"),
    "Udon": food(430, 16, "1 bowl", "Asian Food"),
    "Pad Thai": food(650, 24, "1 plate", "Asian Food"),
    "Tom Yum Soup": food(280, 22, "1 bowl", "Asian Food"),
    "Thai Green Curry": food(560, 26, "1 bowl with rice", "Asian Food"),
    "Thai Basil Chicken Rice": food(620, 34, "1 plate", "Asian Food"),
    "Hainanese Chicken Rice": food(620, 32, "1 plate", "Asian Food"),
    "Chicken Teriyaki Rice": food(610, 35, "1 bowl", "Asian Food"),
    "Bibimbap": food(560, 24, "1 bowl", "Asian Food"),
    "Kimchi Fried Rice": food(520, 17, "1 plate", "Asian Food"),
    "Korean BBQ Beef": food(700, 45, "1 serving", "Asian Food"),
    "Dumplings": food(360, 16, "8 pieces", "Asian Food"),
    "Spring Rolls": food(260, 8, "3 rolls", "Asian Food"),
    "Egg Rolls": food(300, 9, "3 rolls", "Asian Food"),
    "Sushi": food(350, 18, "8 pieces", "Asian Food"),
    "Salmon Sashimi": food(240, 34, "1 plate", "Asian Food"),
    "Japanese Curry Rice": food(650, 22, "1 plate", "Asian Food"),
    "Katsu Curry": food(780, 34, "1 plate", "Asian Food"),
    "Chicken Biryani": food(720, 32, "1 plate", "Asian Food"),
    "Butter Chicken with Rice": food(760, 35, "1 plate", "Asian Food"),
    "Nasi Goreng": food(650, 24, "1 plate", "Asian Food"),
    "Satay Chicken": food(420, 32, "5 skewers", "Asian Food"),

    # Western / international meals
    "Pizza": food(285, 12, "1 slice", "International Food"),
    "Pepperoni Pizza": food(320, 14, "1 slice", "International Food"),
    "Cheese Pizza": food(280, 12, "1 slice", "International Food"),
    "Hamburger": food(540, 25, "1 burger", "International Food"),
    "Cheeseburger": food(620, 31, "1 burger", "International Food"),
    "Hot Dog": food(330, 12, "1 hot dog", "International Food"),
    "French Fries": food(365, 4, "1 medium serving", "International Food"),
    "Fried Chicken": food(480, 30, "2 pieces", "International Food"),
    "Chicken Nuggets": food(300, 15, "6 pieces", "International Food"),
    "Sandwich": food(420, 20, "1 sandwich", "International Food"),
    "Club Sandwich": food(650, 32, "1 sandwich", "International Food"),
    "Tuna Sandwich": food(430, 28, "1 sandwich", "International Food"),
    "Spaghetti": food(480, 18, "1 plate", "International Food"),
    "Spaghetti Bolognese": food(650, 28, "1 plate", "International Food"),
    "Carbonara": food(740, 26, "1 plate", "International Food"),
    "Lasagna": food(620, 32, "1 serving", "International Food"),
    "Steak": food(650, 50, "1 steak", "International Food"),
    "Grilled Chicken Breast": food(335, 38, "1 cooked chicken breast", "International Food"),
    "Roast Chicken": food(520, 42, "1 serving", "International Food"),
    "Grilled Fish": food(300, 38, "1 fillet", "International Food"),
    "Fish and Chips": food(820, 36, "1 plate", "International Food"),
    "Omelette": food(300, 18, "1 omelette", "International Food"),
    "Fried Egg": food(90, 6, "1 egg", "International Food"),
    "Scrambled Eggs": food(220, 14, "2 eggs", "International Food"),
    "Pancakes": food(430, 10, "3 pancakes", "International Food"),
    "Waffles": food(410, 9, "2 waffles", "International Food"),
    "Cereal with Milk": food(300, 10, "1 bowl", "International Food"),
    "Oatmeal": food(250, 8, "1 bowl", "International Food"),
    "Caesar Salad": food(420, 18, "1 bowl", "International Food"),
    "Garden Salad": food(220, 8, "1 bowl", "International Food"),
    "Chicken Salad": food(380, 32, "1 bowl", "International Food"),
    "Burrito": food(700, 30, "1 burrito", "International Food"),
    "Taco": food(210, 10, "1 taco", "International Food"),
    "Nachos": food(550, 18, "1 plate", "International Food"),
    "Fried Rice": food(520, 16, "1 plate", "International Food"),
    "Chicken Fried Rice": food(590, 28, "1 plate", "International Food"),
    "Shrimp Fried Rice": food(560, 26, "1 plate", "International Food"),

    # Simple staples and proteins
    "Rice": food(205, 4.3, "1 cup cooked", "Staple Food"),
    "Brown Rice": food(215, 5, "1 cup cooked", "Staple Food"),
    "Sticky Rice": food(240, 4, "1 cup cooked", "Staple Food"),
    "Noodles": food(220, 7, "1 cup cooked", "Staple Food"),
    "Bread": food(160, 6, "2 slices", "Staple Food"),
    "Chicken": food(335, 38, "1 cooked chicken breast", "Protein Food"),
    "Pork": food(420, 32, "1 serving", "Protein Food"),
    "Beef": food(430, 36, "1 serving", "Protein Food"),
    "Fish": food(240, 36, "1 fillet", "Protein Food"),
    "Shrimp": food(180, 34, "1 serving", "Protein Food"),
    "Tofu": food(180, 18, "1 serving", "Protein Food"),
    "Egg": food(78, 6, "1 large egg", "Protein Food"),

    # Fruits, snacks, desserts, drinks
    "Apple": food(95, 0.5, "1 medium apple", "Fruit"),
    "Banana": food(105, 1.3, "1 medium banana", "Fruit"),
    "Orange": food(62, 1.2, "1 orange", "Fruit"),
    "Mango": food(200, 2, "1 mango", "Fruit"),
    "Pineapple": food(82, 0.9, "1 cup", "Fruit"),
    "Watermelon": food(46, 0.9, "1 cup", "Fruit"),
    "Avocado": food(240, 3, "1 avocado", "Fruit"),
    "Ice Cream": food(270, 5, "1 cup", "Dessert"),
    "Cake": food(350, 5, "1 slice", "Dessert"),
    "Chocolate Cake": food(420, 6, "1 slice", "Dessert"),
    "Donut": food(260, 4, "1 donut", "Dessert"),
    "Cookie": food(150, 2, "1 large cookie", "Dessert"),
    "Milk Tea": food(350, 6, "1 cup", "Drink"),
    "Iced Coffee": food(180, 4, "1 cup", "Drink"),
    "Smoothie": food(280, 6, "1 cup", "Drink"),
    "Soda": food(150, 0, "1 can", "Drink"),
}


FOOD_ALIASES = {
    "bai sach chrouk": "Bai Sach Chrouk",
    "pork and rice": "Pork Rice",
    "pork rice": "Pork Rice",
    "beef loc lac": "Lok Lak",
    "luc lac": "Lok Lak",
    "loklak": "Lok Lak",
    "fish amok": "Fish Amok",
    "amok": "Fish Amok",
    "nom banh chok": "Num Banh Chok",
    "num banh chok": "Num Banh Chok",
    "kuy teav": "Kuy Teav",
    "beef noodle": "Beef Noodle Soup",
    "beef noodle soup": "Beef Noodle Soup",
    "pho": "Pho",
    "phở": "Pho",
    "vietnamese pho": "Pho",
    "vietnamese noodle soup": "Pho",
    "ramen noodles": "Ramen",
    "pad thai noodles": "Pad Thai",
    "sushi rolls": "Sushi",
    "burger": "Hamburger",
    "hamburger": "Hamburger",
    "cheese burger": "Cheeseburger",
    "hotdog": "Hot Dog",
    "fries": "French Fries",
    "chips": "French Fries",
    "pepperoni pizza": "Pepperoni Pizza",
    "pizza": "Pizza",
    "fried chicken": "Fried Chicken",
    "chicken nuggets": "Chicken Nuggets",
    "spaghetti": "Spaghetti",
    "spaghetti bolognese": "Spaghetti Bolognese",
    "omelet": "Omelette",
    "omelette": "Omelette",
    "salad": "Garden Salad",
    "fried rice": "Fried Rice",
    "chicken fried rice": "Chicken Fried Rice",
}


PORTION_MULTIPLIERS = {
    "Small (0.75x)": 0.75,
    "Medium (1x)": 1.0,
    "Large (1.5x)": 1.5,
}


def get_food_names():
    """Return sorted food names for the correction dropdown."""
    priority = [
        "Khmer Food",
        "Asian Food",
        "International Food",
        "Staple Food",
        "Protein Food",
        "Fruit",
        "Dessert",
        "Drink",
    ]
    ordered_foods = []
    for category in priority:
        ordered_foods.extend(
            sorted(
                food
                for food, info in FOOD_DATABASE.items()
                if info["category"] == category
            )
        )
    return ordered_foods


def find_food_match(predicted_label):
    """
    Match an AI label to a database item using aliases and fuzzy matching.
    Returns the best match from FOOD_DATABASE keys.
    """
    if not predicted_label:
        return None

    label = normalize_food_name(predicted_label)

    if label in FOOD_ALIASES:
        return FOOD_ALIASES[label]

    food_names = list(FOOD_DATABASE.keys())
    normalized_foods = {normalize_food_name(food): food for food in food_names}

    if label in normalized_foods:
        return normalized_foods[label]

    for normalized_food, food in normalized_foods.items():
        if normalized_food in label or label in normalized_food:
            return food

    alias_matches = difflib.get_close_matches(label, FOOD_ALIASES.keys(), n=1, cutoff=0.72)
    if alias_matches:
        return FOOD_ALIASES[alias_matches[0]]

    matches = difflib.get_close_matches(label, normalized_foods.keys(), n=1, cutoff=0.58)
    return normalized_foods[matches[0]] if matches else None


def normalize_food_name(name):
    """Clean AI labels so Food101-style names match human-readable names."""
    return (
        name.lower()
        .replace("_", " ")
        .replace("-", " ")
        .replace("/", " ")
        .strip()
    )


def calculate_nutrition(food_name, portion_option, custom_grams=None):
    """Calculate calories and protein for the selected portion."""
    food_item = FOOD_DATABASE[food_name]

    if portion_option == "Custom grams":
        # Approximation: 1 normal serving is treated as 250 grams for demo purposes.
        multiplier = custom_grams / 250
        portion_label = f"{custom_grams} grams"
    else:
        multiplier = PORTION_MULTIPLIERS[portion_option]
        portion_label = portion_option

    return {
        "calories": food_item["calories"] * multiplier,
        "protein": food_item["protein"] * multiplier,
        "portion_label": portion_label,
    }
