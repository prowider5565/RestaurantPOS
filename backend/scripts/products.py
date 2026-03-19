import requests

BASE_URL = "http://localhost:8000"

PRODUCTS_URL = f"{BASE_URL}/products"
CATEGORIES_URL = f"{BASE_URL}/product-categories"


DATA = [
  {"category":"Суюк овкатлар","name":"Суп лапша куриные","price":7000,"measure":"GRAM"},
  {"category":"Суюк овкатлар","name":"Борщ","price":7000,"measure":"GRAM"},
  {"category":"Суюк овкатлар","name":"Шурва","price":10000,"measure":"GRAM"},
  {"category":"Суюк овкатлар","name":"Кайла","price":5000,"measure":"GRAM"},
  {"category":"Суюк овкатлар","name":"Пелмен","price":20000,"measure":"PORTION"},
  {"category":"Суюк овкатлар","name":"Чечевичный суп","price":7000,"measure":"GRAM"},
  {"category":"Суюк овкатлар","name":"Щавелевый суп","price":7000,"measure":"GRAM"},

  {"category":"Тайёр куюк овкатлар","name":"Бефстроганов","price":20000,"measure":"GRAM"},
  {"category":"Тайёр куюк овкатлар","name":"Гуляш","price":20000,"measure":"GRAM"},
  {"category":"Тайёр куюк овкатлар","name":"Жаркое из баранина","price":50000,"measure":"PORTION"},
  {"category":"Тайёр куюк овкатлар","name":"Голубцы","price":5000,"measure":"UNIT"},
  {"category":"Тайёр куюк овкатлар","name":"Котлет мол гушти","price":16000,"measure":"UNIT"},
  {"category":"Тайёр куюк овкатлар","name":"Котлет товук гушти","price":16000,"measure":"UNIT"},
  {"category":"Тайёр куюк овкатлар","name":"Котлет балик","price":16000,"measure":"UNIT"},

  {"category":"гарнирлар","name":"Рис девзира","price":5000,"measure":"GRAM"},
  {"category":"гарнирлар","name":"Рис басмати с куркумой","price":3000,"measure":"GRAM"},
  {"category":"гарнирлар","name":"Гречка","price":3000,"measure":"GRAM"},
  {"category":"гарнирлар","name":"Зелёный чечевица","price":5000,"measure":"GRAM"},
  {"category":"гарнирлар","name":"Пюре","price":5000,"measure":"GRAM"},
  {"category":"гарнирлар","name":"Картофельная Дольки","price":5000,"measure":"GRAM"},
  {"category":"гарнирлар","name":"Овощи на гриле","price":10000,"measure":"GRAM"},

  {"category":"Гуштлар","name":"Кайнатилган мол гушти","price":18000,"measure":"GRAM"},
  {"category":"Гуштлар","name":"Ростбиф","price":18000,"measure":"GRAM"},
  {"category":"Гуштлар","name":"Стейк медальон","price":25000,"measure":"UNIT"},
  {"category":"Гуштлар","name":"Стейк балик","price":40000,"measure":"UNIT"},
  {"category":"Гуштлар","name":"Кайнатилган товук гушти","price":15000,"measure":"GRAM"},
  {"category":"Гуштлар","name":"Запечённые курица","price":15000,"measure":"UNIT"},
  {"category":"Гуштлар","name":"Товук оёги (ножки)","price":10000,"measure":"UNIT"},

  {"category":"Соуслар","name":"Аджика","price":5000,"measure":"GRAM"},
  {"category":"Соуслар","name":"Соус помидор","price":5000,"measure":"GRAM"},
  {"category":"Соуслар","name":"Песто","price":5000,"measure":"GRAM"},
  {"category":"Соуслар","name":"Огуречно чесночный соус","price":5000,"measure":"GRAM"},
  {"category":"Соуслар","name":"Соус тар-тар","price":5000,"measure":"GRAM"},

  {"category":"Нон","name":"Овсянкалик нон (глютенсиз)","price":4000,"measure":"UNIT"},
  {"category":"Нон","name":"Факачо","price":4000,"measure":"PORTION"},
  {"category":"Нон","name":"Ок нон","price":2000,"measure":"PORTION"},
  {"category":"Нон","name":"Кора нон","price":2000,"measure":"PORTION"}
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
