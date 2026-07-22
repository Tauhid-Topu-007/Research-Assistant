# backend/app/api/routes/papers.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import logging
from app.database.session import get_db
from app.models import Paper, Chunk
from app.core.pdf_processor import PDFProcessor
from app.core.rag_engine import RAGEngine
from app.config import settings

# Create router FIRST
router = APIRouter(prefix="/api/papers", tags=["papers"])

logger = logging.getLogger(__name__)
pdf_processor = PDFProcessor()
rag_engine = RAGEngine()

@router.post("/upload")
async def upload_paper(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    authors: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload a research paper"""
    file_path = None
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Create upload directory
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Save file
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Process PDF
        processed_data = pdf_processor.process_pdf(file_path, 0)
        
        # Create paper record
        paper = Paper(
            title=title or processed_data["metadata"].get("title", file.filename),
            authors=authors.split(',') if authors else [processed_data["metadata"].get("author", "Unknown")],
            abstract=processed_data["text"][:1000] if processed_data["text"] else "",
            filename=filename,  # Store the saved filename
            file_path=file_path,
            total_pages=processed_data["total_pages"],
            metadata_json=processed_data["metadata"]
        )
        
        db.add(paper)
        db.commit()
        db.refresh(paper)
        
        # Create chunks
        for page_data in processed_data["pages"]:
            for chunk_data in page_data["chunks"]:
                chunk = Chunk(
                    paper_id=paper.id,
                    page=chunk_data["page"],
                    text=chunk_data["text"],
                    bbox=chunk_data["bbox"],
                    font_size=chunk_data["font_size"],
                    block_num=chunk_data["block_num"],
                    line_num=chunk_data["line_num"],
                    char_start=chunk_data["char_start"],
                    char_end=chunk_data["char_end"]
                )
                db.add(chunk)
        
        db.commit()
        
        # Create vector embeddings
        try:
            if processed_data["pages"] and processed_data["pages"][0]["chunks"]:
                rag_engine.create_vector_store(processed_data["pages"][0]["chunks"], paper.id)
        except Exception as e:
            logger.warning(f"Vector store creation warning: {e}")
        
        return {
            "message": "Paper uploaded successfully",
            "paper_id": paper.id,
            "title": paper.title,
            "filename": filename,
            "total_pages": paper.total_pages
        }
        
    except Exception as e:
        # Clean up on error
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_papers(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get all papers"""
    papers = db.query(Paper).offset(skip).limit(limit).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "authors": p.authors,
            "abstract": p.abstract,
            "filename": p.filename,
            "upload_date": p.upload_date.isoformat() if p.upload_date else None,
            "total_pages": p.total_pages
        }
        for p in papers
    ]

@router.get("/files")
async def list_uploaded_files():
    """List all uploaded files"""
    try:
        if os.path.exists(settings.UPLOAD_DIR):
            files = os.listdir(settings.UPLOAD_DIR)
            return {
                "files": files,
                "count": len(files)
            }
        return {"files": [], "count": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{paper_id}")
async def get_paper(
    paper_id: int,
    db: Session = Depends(get_db)
):
    """Get paper by ID"""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    return {
        "id": paper.id,
        "title": paper.title,
        "authors": paper.authors,
        "abstract": paper.abstract,
        "filename": paper.filename,
        "total_pages": paper.total_pages,
        "metadata": paper.metadata_json,
        "upload_date": paper.upload_date.isoformat() if paper.upload_date else None
    }

@router.delete("/{paper_id}")
async def delete_paper(
    paper_id: int,
    db: Session = Depends(get_db)
):
    """Delete a paper"""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Delete file
    if os.path.exists(paper.file_path):
        try:
            os.remove(paper.file_path)
        except:
            pass
    
    # Delete vector index
    try:
        rag_engine.vector_service.delete_paper_index(paper_id)
    except:
        pass
    
    # Delete from database
    db.delete(paper)
    db.commit()
    
    return {"message": "Paper deleted successfully"}

@router.get("/{paper_id}/chunks")
async def get_paper_chunks(
    paper_id: int,
    page: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get chunks for a paper"""
    query = db.query(Chunk).filter(Chunk.paper_id == paper_id)
    if page:
        query = query.filter(Chunk.page == page)
    
    chunks = query.all()
    return [
        {
            "id": c.id,
            "page": c.page,
            "text": c.text,
            "bbox": c.bbox,
            "font_size": c.font_size,
            "block_num": c.block_num,
            "line_num": c.line_num
        }
        for c in chunks
    ]