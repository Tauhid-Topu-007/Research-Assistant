from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Research Paper Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-here"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:2015@localhost:5432/research_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    
    # Vector Database
    VECTOR_DB_PATH: str = "./vector_db"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    PROCESSED_DIR: str = "./processed"
    
    # OCR
    OCR_ENGINE: str = "tesseract"  # or "paddle"
    
    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()