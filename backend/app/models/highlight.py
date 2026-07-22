# backend/app/models/highlight.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class Highlight(Base):
    __tablename__ = "highlights"
    __table_args__ = {'extend_existing': True}  # Add this line
    
    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(Integer, ForeignKey("chunks.id"))
    color = Column(String(20), default="#FFD700")
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    highlight_type = Column(String(50))  # 'ai', 'user', 'citation', 'keyword'
    
    chunk = relationship("Chunk", back_populates="highlights")