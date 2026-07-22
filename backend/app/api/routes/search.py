# backend/app/api/routes/search.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Paper, Chunk
from app.core.rag_engine import RAGEngine
from pydantic import BaseModel

router = APIRouter(prefix="/api/search", tags=["search"])
rag_engine = RAGEngine()

class SearchRequest(BaseModel):
    query: str
    paper_ids: Optional[List[int]] = None
    top_k: int = 10

@router.post("/semantic")
async def semantic_search(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """Perform semantic search across papers"""
    try:
        results = {}
        
        # If no paper_ids provided, search all papers
        if not request.paper_ids:
            papers = db.query(Paper).all()
            request.paper_ids = [p.id for p in papers]
        
        for paper_id in request.paper_ids:
            chunks = rag_engine.vector_service.search(
                query=request.query,
                paper_id=paper_id,
                top_k=request.top_k
            )
            results[paper_id] = chunks
        
        return {
            "query": request.query,
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))