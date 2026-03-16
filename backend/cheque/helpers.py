from config.settings import settings


def get_requisite_data():
    """
    Return static requisite data for the restaurant.
    In a real application, this could be fetched from a database or config file.
    """
    return {
        "company_name": settings.COMPANY_NAME,
        "address": settings.ADDRESS,
        "phone_number": settings.PHONE_NUMBER,
        "stir": settings.STIR,
        "registry_number": settings.REGISTRY_NUMBER,
    }

