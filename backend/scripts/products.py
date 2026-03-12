import os
import random
import requests

BACKEND_URL = "http://localhost:8000/products"
IMAGE_DIR = "../frontend/public/mock-images"

CATEGORY_NAMES = [
    "Pizza",
    "Burgers",
    "Drinks",
    "Desserts",
    "Salads",
    "Sandwiches",
]

ADJECTIVES = [
    "Spicy",
    "Hot",
    "Classic",
    "Fresh",
    "Sweet",
    "Cheesy",
]

NOUNS = [
    "Pizza",
    "Burger",
    "Sandwich",
    "Cake",
    "Coffee",
    "Fries",
    "Wrap",
]


def random_name():
    return f"{random.choice(ADJECTIVES)} {random.choice(NOUNS)}"


def random_price():
    return round(random.uniform(5, 25), 2)


def seed_products():
    images = [
        f
        for f in os.listdir(IMAGE_DIR)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
    ]

    for img in images:
        image_path = os.path.join(IMAGE_DIR, img)

        product_name = random_name()
        category_name = random.choice(CATEGORY_NAMES)
        price = random_price()

        with open(image_path, "rb") as f:
            files = {"image": (img, f, "image/jpeg")}

            data = {
                "name": product_name,
                "price": price,
                "category_name": category_name,
            }

            response = requests.post(
                BACKEND_URL,
                data=data,
                files=files,
            )

            print(product_name, response.status_code)


if __name__ == "__main__":
    seed_products()
