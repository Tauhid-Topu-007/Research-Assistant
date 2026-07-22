# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    APP_NAME: str = "AI Research Paper Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-here"
    
    # Force SQLite for development
    DATABASE_URL: str = "sqlite:///./research.db"
    
    REDIS_URL: str = "redis://localhost:6379"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    VECTOR_DB_PATH: str = "./vector_db"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    UPLOAD_DIR: str = "./uploads"
    PROCESSED_DIR: str = "./processed"
    OCR_ENGINE: str = "tesseract"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = 'utf-8'

settings = Settings()