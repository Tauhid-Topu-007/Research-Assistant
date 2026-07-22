# backend/app/models/chunk.py
from sqlalchemy import Column, Integer, String, Text, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Chunk(Base):
    __tablename__ = "chunks"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"))
    page = Column(Integer, default=1)
    text = Column(Text, default="")
    bbox = Column(JSON, default=[0, 0, 0, 0])
    embedding = Column(JSON, default=[])  # Changed from ARRAY to JSON for SQLite compatibility
    font_size = Column(Float, default=0.0)
    block_num = Column(Integer, default=0)
    line_num = Column(Integer, default=0)
    char_start = Column(Integer, default=0)
    char_end = Column(Integer, default=0)
    
    paper = relationship("Paper", back_populates="chunks")
    highlights = relationship("Highlight", back_populates="chunk", cascade="all, delete-orphan")