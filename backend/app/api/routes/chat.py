# backend/app/api/routes/chat.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.rag_engine import RAGEngine
from app.database.session import get_db
from sqlalchemy.orm import Session
from app.models import Paper
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])
rag_engine = RAGEngine()

class ChatRequest(BaseModel):
    question: str
    paper_ids: List[int]
    top_k: Optional[int] = 5

@router.post("/ask")
async def ask_question(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Ask a question about a paper"""
    try:
        # Validate papers exist
        papers = db.query(Paper).filter(Paper.id.in_(request.paper_ids)).all()
        if len(papers) != len(request.paper_ids):
            raise HTTPException(status_code=404, detail="One or more papers not found")
        
        results = []
        for paper_id in request.paper_ids:
            result = rag_engine.query_paper(
                query=request.question,
                paper_id=paper_id,
                top_k=request.top_k
            )
            results.append({
                "paper_id": paper_id,
                "answer": result.get("answer", "No answer generated"),
                "sources": result.get("sources", [])
            })
        
        return {
            "question": request.question,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error in ask_question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare")
async def compare_papers(
    request: ChatRequest,
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
            "comparison": result.get("comparison", "No comparison generated"),
            "individual_responses": result.get("individual_responses", {})
        }
        
    except Exception as e:
        logger.error(f"Error in compare_papers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize")
async def summarize_paper(
    paper_id: int,
    max_length: Optional[int] = 500,
    db: Session = Depends(get_db)
):
    """Generate summary of a paper"""
    try:
        # Get paper content
        paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        # Get chunks
        from app.models import Chunk
        chunks = db.query(Chunk).filter(Chunk.paper_id == paper_id).all()
        full_text = " ".join([c.text for c in chunks]) if chunks else ""
        
        # Generate summary using RAG
        result = rag_engine.query_paper(
            query=f"Summarize this paper in {max_length} words or less. Focus on the main contributions, methodology, and results.",
            paper_id=paper_id,
            top_k=10
        )
        
        return {
            "paper_id": paper_id,
            "title": paper.title,
            "summary": result.get("answer", "No summary generated"),
            "sources": result.get("sources", [])
        }
        
    except Exception as e:
        logger.error(f"Error in summarize_paper: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))