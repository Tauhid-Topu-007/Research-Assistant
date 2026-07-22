# backend/app/models/paper.py
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class Paper(Base):
    __tablename__ = "papers"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    authors = Column(JSON, default=[])  # Changed from ARRAY to JSON for SQLite compatibility
    abstract = Column(Text, default="")
    filename = Column(String(255))
    file_path = Column(String(500))
    upload_date = Column(DateTime, server_default=func.now())
    total_pages = Column(Integer, default=0)
    metadata_json = Column(JSON, default={})
    
    chunks = relationship("Chunk", back_populates="paper", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="paper", cascade="all, delete-orphan")