# backend/app/api/routes/compare.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.rag_engine import RAGEngine
from pydantic import BaseModel

router = APIRouter(prefix="/api/compare", tags=["compare"])
rag_engine = RAGEngine()

class CompareRequest(BaseModel):
    question: str
    paper_ids: List[int]

@router.post("/papers")
async def compare_papers(
    request: CompareRequest,
    db: Session = Depends(get_db)
):
    """Compare multiple papers"""
    try:
        if len(request.paper_ids) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 papers for comparison")
        
        result = rag_engine.compare_papers(
            query=request.question,
            paper_ids=request.paper_ids
        )
        
        return {
            "question": request.question,
            "comparison": result["comparison"],
            "individual_responses": result["individual_responses"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))