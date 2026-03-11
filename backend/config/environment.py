import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Restaurant POS"
    admin_email: str
    items_per_page: int = 10
    DATABASE_URL: str

    class Config:
        env_file = f".env.{os.getenv('ENV', 'dev')}"

settings = Settings()
