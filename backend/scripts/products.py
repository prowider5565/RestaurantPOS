import os
import random
import requests
from enum import Enum


PRODUCTS_URL = "http://localhost:8000/products"
CATEGORIES_URL = "http://localhost:8000/product-categories"

IMAGE_DIR = "../frontend/public/mock-images"


class ProductMeasure(Enum):
    UNIT = "unit"
    GRAM = "gram"
    PORTION = "portion"


CATEGORY_NAMES = [
    "Pizza",
    "Burgers",
    "Drinks",
    "Desserts",
    "Salads",
    "Sandwiches",
    "Pasta",
    "Soups",
    "Grill",
    "Breakfast",
]


ADJECTIVES = [
    "Spicy",
    "Hot",
    "Classic",
    "Fresh",
    "Sweet",
    "Cheesy",
    "Crispy",
    "Smoky",
    "Juicy",
]


NOUNS = [
    "Pizza",
    "Burger",
    "Sandwich",
    "Cake",
    "Coffee",
    "Fries",
    "Wrap",
    "Soup",
    "Pasta",
    "Steak",
]


def random_name():
    return f"{random.choice(ADJECTIVES)} {random.choice(NOUNS)}"


def random_price():
    return round(random.uniform(5, 25), 2)


def random_measure():
    return random.choice(list(ProductMeasure)).value


def load_images():
    images = [
        os.path.join(IMAGE_DIR, f)
        for f in os.listdir(IMAGE_DIR)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
    ]

    if not images:
        raise Exception("No images found in mock-images folder")

    return images


def create_categories():
    """
    Creates categories and returns a mapping:
    {category_name: category_id}
    """
    category_map = {}

    for category in CATEGORY_NAMES:

        response = requests.post(
            CATEGORIES_URL,
            json={"name": category},
        )

        if response.status_code not in (200, 201):
            raise Exception(f"Failed to create category {category}: {response.text}")

        data = response.json()

        category_id = data["id"]
        category_map[category] = category_id

        print(f"Created category {category} -> ID {category_id}")

    return category_map


def seed_products(category_map):

    images = load_images()
    image_index = 0

    for category_name, category_id in category_map.items():

        product_count = random.randint(8, 15)

        print(f"\nCreating {product_count} products in category: {category_name}")

        for _ in range(product_count):

            image_path = images[image_index % len(images)]
            image_index += 1

            product_name = random_name()
            price = random_price()
            measure = random_measure()

            with open(image_path, "rb") as f:

                files = {
                    "image": (
                        os.path.basename(image_path),
                        f,
                        "image/jpeg",
                    )
                }

                data = {
                    "name": product_name,
                    "price": price,
                    "category_id": category_id,
                    "measure": measure,
                }

                response = requests.post(
                    PRODUCTS_URL,
                    data=data,
                    files=files,
                )

                print(
                    f"{product_name} | category_id={category_id} | {measure} | {response.status_code}"
                )


if __name__ == "__main__":
    category_map = create_categories()
    seed_products(category_map)