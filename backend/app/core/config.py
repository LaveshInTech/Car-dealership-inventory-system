import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Apex Motors - Dealership Inventory API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "supersecretjwtkey_change_in_production_min_32_characters_long!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./dealership.db"

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
    ]

    # Development-Only Seed Credentials (NEVER used in production)
    INITIAL_ADMIN_EMAIL: str = "admin@apexmotors.com"
    INITIAL_ADMIN_PASSWORD: str = "AdminSecurePass2026!"
    INITIAL_ADMIN_NAME: str = "Apex Dealership Admin"

    @field_validator("SECRET_KEY", mode="after")
    @classmethod
    def validate_production_secret_key(cls, v: str, info) -> str:
        env = os.getenv("ENVIRONMENT", "development").lower()
        insecure_keys = [
            "supersecretjwtkey_change_in_production_min_32_characters_long!",
            "secret",
            "changeme",
            "default",
        ]
        if env == "production":
            if not v or v in insecure_keys or len(v) < 32:
                raise ValueError(
                    "CRITICAL: A secure, randomly generated SECRET_KEY with at least 32 characters "
                    "must be provided via environment variable in production."
                )
        return v

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
