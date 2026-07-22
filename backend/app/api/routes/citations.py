# backend/app/api/routes/citations.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Citation, Paper
from pydantic import BaseModel

router = APIRouter(prefix="/api/citations", tags=["citations"])

class CitationRequest(BaseModel):
    paper_id: int
    citation_text: str
    reference: str
    page: int
    bbox: List[float]
    format_type: str = "apa"

@router.post("/create")
async def create_citation(
    request: CitationRequest,
    db: Session = Depends(get_db)
):
    """Create a citation"""
    try:
        paper = db.query(Paper).filter(Paper.id == request.paper_id).first()
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        citation = Citation(
            paper_id=request.paper_id,
            citation_text=request.citation_text,
            reference=request.reference,
            page=request.page,
            bbox=request.bbox,
            format_type=request.format_type
        )
        db.add(citation)
        db.commit()
        db.refresh(citation)
        
        return {
            "id": citation.id,
            "paper_id": citation.paper_id,
            "citation_text": citation.citation_text,
            "reference": citation.reference,
            "page": citation.page,
            "format_type": citation.format_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/paper/{paper_id}")
async def get_paper_citations(
    paper_id: int,
    db: Session = Depends(get_db)
):
    """Get all citations for a paper"""
    try:
        citations = db.query(Citation).filter(Citation.paper_id == paper_id).all()
        
        return [
            {
                "id": c.id,
                "citation_text": c.citation_text,
                "reference": c.reference,
                "page": c.page,
                "format_type": c.format_type
            }
            for c in citations
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))