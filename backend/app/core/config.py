import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Crop2X CRM"
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "secret")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    # Comma-separated origins, e.g. http://localhost:3000,https://crm.example.com
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    ALLOW_PUBLIC_REGISTER: bool = os.getenv("ALLOW_PUBLIC_REGISTER", "true").lower() == "true"
    PUBLIC_REGISTER_ROLES: str = os.getenv(
        "PUBLIC_REGISTER_ROLES",
        "ADMIN,MANAGER,BUSINESS,AGRONOMY,HARDWARE,ACCOUNTS,EMPLOYEE"
    )
    SETUP_SECRET: str = os.getenv("SETUP_SECRET", "")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()