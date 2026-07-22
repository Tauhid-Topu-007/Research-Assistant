# backend/app/models/annotation.py
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class Annotation(Base):
    __tablename__ = "annotations"
    __table_args__ = {'extend_existing': True}  # Add this line
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"))
    page = Column(Integer)
    text = Column(Text)
    note = Column(Text)
    bbox = Column(JSON)
    color = Column(String(20), default="#FFD700")
    created_at = Column(DateTime, server_default=func.now())
    annotation_type = Column(String(50))
    
    paper = relationship("Paper", back_populates="annotations")