import requests

BASE_URL = "http://localhost:8000"

PRODUCTS_URL = f"{BASE_URL}/products"
CATEGORIES_URL = f"{BASE_URL}/product-categories"


DATA = [
  # Нонушта
  {"category":"Нонушта","name":"Каша овсяное","price":5000,"measure":"GRAM"},
  {"category":"Нонушта","name":"Каша манная","price":5000,"measure":"GRAM"},
  {"category":"Нонушта","name":"Каша рис","price":5000,"measure":"GRAM"},
  {"category":"Нонушта","name":"Каша гречка","price":5000,"measure":"GRAM"},
  {"category":"Нонушта","name":"Яичница запечённые","price":7000,"measure":"UNIT"},
  {"category":"Нонушта","name":"Яйцо отварной","price":3000,"measure":"UNIT"},
  {"category":"Нонушта","name":"Омлет с брокколи","price":14000,"measure":"PORTION"},
  {"category":"Нонушта","name":"Сендвич","price":25000,"measure":"PORTION"},

  # Перекус
  {"category":"Перекус","name":"Начинка белок","price":3000,"measure":"UNIT"},
  {"category":"Перекус","name":"Запеч. фрукта с творогом","price":10000,"measure":"UNIT"},
  {"category":"Перекус","name":"Творог с фруктами","price":10000,"measure":"PORTION"},
  {"category":"Перекус","name":"Хлебцы с паста и бананом","price":6000,"measure":"UNIT"},
  {"category":"Перекус","name":"Брускетта с помидором","price":5000,"measure":"UNIT"},
  {"category":"Перекус","name":"Хумус","price":5000,"measure":"GRAM"},
  {"category":"Перекус","name":"Катык","price":5000,"measure":"PORTION"},
  {"category":"Перекус","name":"Йогурт с фруктами","price":10000,"measure":"PORTION"},
  {"category":"Перекус","name":"Йогурт с зеленью","price":10000,"measure":"PORTION"},
  {"category":"Перекус","name":"Йогурт с куркумой","price":10000,"measure":"PORTION"},
  {"category":"Перекус","name":"Тухум оқи (белок)","price":2000,"measure":"UNIT"},
  {"category":"Перекус","name":"Шоколад с бананом","price":20000,"measure":"GRAM"},
  {"category":"Перекус","name":"Овсяной медовик","price":25000,"measure":"UNIT"},
  {"category":"Перекус","name":"Мусс","price":30000,"measure":"UNIT"},

  # Ичимликлар
  {"category":"Ичимликлар","name":"Морс клюква","price":10000,"measure":"GRAM"},
  {"category":"Ичимликлар","name":"Чой малина","price":20000,"measure":"PORTION"},
  {"category":"Ичимликлар","name":"Чой имбирь","price":20000,"measure":"PORTION"},
  {"category":"Ичимликлар","name":"Чой куркума","price":20000,"measure":"PORTION"},
  {"category":"Ичимликлар","name":"Компот","price":5000,"measure":"GRAM"},
  {"category":"Ичимликлар","name":"Чой кора, кук","price":3000,"measure":"PORTION"},
  {"category":"Ичимликлар","name":"Айрон","price":10000,"measure":"GRAM"},
  {"category":"Ичимликлар","name":"Сок помидор","price":10000,"measure":"GRAM"},

  # Салатлар
  {"category":"Салатлар","name":"Греческий","price":15000,"measure":"GRAM"},
  {"category":"Салатлар","name":"Карам салат","price":10000,"measure":"GRAM"},
  {"category":"Салатлар","name":"Свежий салат","price":10000,"measure":"GRAM"},
  {"category":"Салатлар","name":"Шакароп","price":10000,"measure":"GRAM"},
  {"category":"Салатлар","name":"Молодой огурец и молодая морковка","price":10000,"measure":"GRAM"},
]


def fetch_existing_categories():
    res = requests.get(CATEGORIES_URL)

    if res.status_code != 200:
        raise Exception(f"Failed to fetch categories: {res.text}")

    data = res.json()

    if not isinstance(data, list):
        raise Exception(f"Invalid categories response: {data}")

    return {c["name"]: c["id"] for c in data if isinstance(c, dict)}


def create_categories():
    category_map = {}

    existing_map = fetch_existing_categories()
    unique_categories = set(item["category"] for item in DATA)

    for name in unique_categories:
        if name in existing_map:
            category_map[name] = existing_map[name]
            continue

        res = requests.post(CATEGORIES_URL, json={"name": name})

        if res.status_code in (200, 201):
            category_map[name] = res.json()["id"]
        else:
            raise Exception(f"Failed to create category '{name}': {res.text}")

    return category_map


def create_products(category_map):
    for item in DATA:
        payload = {
            "name": item["name"],
            "price": item["price"],
            "category_id": category_map[item["category"]],
            "measure": str(item["measure"]).strip().lower(),
        }

        res = requests.post(PRODUCTS_URL, data=payload)

        print(
            item["name"],
            "|",
            item["category"],
            "|",
            res.status_code,
            "|",
            res.text if res.status_code not in (200, 201) else "OK"
        )


if __name__ == "__main__":
    category_map = create_categories()
    create_products(category_map)
