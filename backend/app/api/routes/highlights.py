# backend/app/api/routes/highlights.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.highlight_engine import HighlightEngine
from app.database.session import get_db
from sqlalchemy.orm import Session
from app.models.highlight import Highlight
from app.models.chunk import Chunk

router = APIRouter(prefix="/api/highlights", tags=["highlights"])
highlight_engine = HighlightEngine()

class HighlightRequest(BaseModel):
    chunk_id: int
    color: str = "#FFD700"
    note: Optional[str] = ""
    highlight_type: str = "user"

class MultiHighlightRequest(BaseModel):
    chunk_ids: List[int]
    color: str = "#FFD700"
    note: Optional[str] = ""

@router.post("/create")
async def create_highlight(
    request: HighlightRequest,
    db: Session = Depends(get_db)
):
    """Create a new highlight"""
    try:
        # Get chunk
        chunk = db.query(Chunk).filter(Chunk.id == request.chunk_id).first()
        if not chunk:
            raise HTTPException(status_code=404, detail="Chunk not found")
        
        # Create highlight
        highlight = Highlight(
            chunk_id=request.chunk_id,
            color=request.color,
            note=request.note,
            highlight_type=request.highlight_type
        )
        db.add(highlight)
        db.commit()
        db.refresh(highlight)
        
        return {
            "id": highlight.id,
            "chunk_id": highlight.chunk_id,
            "color": highlight.color,
            "note": highlight.note,
            "type": highlight.highlight_type,
            "created_at": highlight.created_at.isoformat() if highlight.created_at else None,
            "paper_id": chunk.paper_id,
            "page": chunk.page,
            "bbox": chunk.bbox
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multi")
async def create_multi_highlight(
    request: MultiHighlightRequest,
    db: Session = Depends(get_db)
):
    """Create highlights for multiple chunks"""
    try:
        highlights = []
        for chunk_id in request.chunk_ids:
            chunk = db.query(Chunk).filter(Chunk.id == chunk_id).first()
            if chunk:
                highlight = Highlight(
                    chunk_id=chunk_id,
                    color=request.color,
                    note=request.note,
                    highlight_type="user"
                )
                db.add(highlight)
                highlights.append({
                    "chunk_id": chunk_id,
                    "page": chunk.page,
                    "bbox": chunk.bbox
                })
        
        db.commit()
        
        return {
            "message": f"Created {len(highlights)} highlights",
            "highlights": highlights
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/paper/{paper_id}")
async def get_paper_highlights(
    paper_id: int,
    db: Session = Depends(get_db)
):
    """Get all highlights for a paper"""
    try:
        highlights = db.query(Highlight).join(Chunk).filter(Chunk.paper_id == paper_id).all()
        
        result = []
        for h in highlights:
            chunk = db.query(Chunk).filter(Chunk.id == h.chunk_id).first()
            if chunk:
                result.append({
                    "id": h.id,
                    "chunk_id": h.chunk_id,
                    "text": chunk.text,
                    "page": chunk.page,
                    "bbox": chunk.bbox,
                    "color": h.color,
                    "note": h.note,
                    "type": h.highlight_type,
                    "created_at": h.created_at.isoformat() if h.created_at else None
                })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{highlight_id}")
async def delete_highlight(
    highlight_id: int,
    db: Session = Depends(get_db)
):
    """Delete a highlight"""
    try:
        highlight = db.query(Highlight).filter(Highlight.id == highlight_id).first()
        if not highlight:
            raise HTTPException(status_code=404, detail="Highlight not found")
        
        db.delete(highlight)
        db.commit()
        
        return {"message": "Highlight deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))