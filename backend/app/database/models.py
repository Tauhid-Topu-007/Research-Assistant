from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class Paper(Base):
    __tablename__ = "papers"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    authors = Column(ARRAY(String))
    abstract = Column(Text)
    filename = Column(String(255))
    file_path = Column(String(500))
    upload_date = Column(DateTime, server_default=func.now())
    total_pages = Column(Integer)
    metadata_json = Column(JSON)
    
    chunks = relationship("Chunk", back_populates="paper", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="paper", cascade="all, delete-orphan")

class Chunk(Base):
    __tablename__ = "chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"))
    page = Column(Integer)
    text = Column(Text)
    bbox = Column(JSON)  # [x1, y1, x2, y2]
    embedding = Column(ARRAY(Float))
    font_size = Column(Float)
    block_num = Column(Integer)
    line_num = Column(Integer)
    char_start = Column(Integer)
    char_end = Column(Integer)
    
    paper = relationship("Paper", back_populates="chunks")
    highlights = relationship("Highlight", back_populates="chunk", cascade="all, delete-orphan")

class Highlight(Base):
    __tablename__ = "highlights"
    
    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(Integer, ForeignKey("chunks.id"))
    color = Column(String(20), default="#FFD700")
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    highlight_type = Column(String(50))  # 'ai', 'user', 'citation', 'keyword'
    
    chunk = relationship("Chunk", back_populates="highlights")

class Annotation(Base):
    __tablename__ = "annotations"
    
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

class Citation(Base):
    __tablename__ = "citations"
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"))
    citation_text = Column(Text)
    reference = Column(Text)
    page = Column(Integer)
    bbox = Column(JSON)
    format_type = Column(String(20))  # 'apa', 'ieee', 'mla', 'chicago', 'bibtex'
    
    paper = relationship("Paper")