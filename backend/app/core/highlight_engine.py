# backend/app/core/highlight_engine.py
from typing import List, Dict, Any, Optional
import json
import fitz
from app.models.highlight import Highlight as HighlightModel
from app.database.session import SessionLocal

class HighlightEngine:
    def __init__(self):
        self.colors = {
            "yellow": "#FFD700",
            "blue": "#4A90D9",
            "green": "#50C878",
            "pink": "#FF69B4",
            "orange": "#FF8C00",
            "purple": "#9B59B6"
        }
    
    def create_highlight(self, chunk_id: int, bbox: List[float], page: int, 
                         color: str = "#FFD700", note: str = "", 
                         highlight_type: str = "user") -> Dict:
        """Create a highlight annotation"""
        db = SessionLocal()
        try:
            highlight = HighlightModel(
                chunk_id=chunk_id,
                color=color,
                note=note,
                highlight_type=highlight_type
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
                "bbox": bbox,
                "page": page
            }
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def get_highlights_for_paper(self, paper_id: int) -> List[Dict]:
        """Get all highlights for a paper"""
        db = SessionLocal()
        try:
            from app.models.chunk import Chunk
            highlights = db.query(HighlightModel).join(Chunk).filter(
                Chunk.paper_id == paper_id
            ).all()
            
            result = []
            for h in highlights:
                result.append({
                    "id": h.id,
                    "chunk_id": h.chunk_id,
                    "color": h.color,
                    "note": h.note,
                    "type": h.highlight_type,
                    "created_at": h.created_at.isoformat() if h.created_at else None
                })
            return result
        except Exception as e:
            print(f"Error getting highlights: {e}")
            return []
        finally:
            db.close()
    
    def generate_highlight_coordinates(self, page: int, bbox: List[float], 
                                      pdf_path: str) -> Dict:
        """Generate precise highlight coordinates for PDF overlay"""
        try:
            doc = fitz.open(pdf_path)
            page_obj = doc[page - 1]
            
            # Get page dimensions
            page_rect = page_obj.rect
            page_width = page_rect.width
            page_height = page_rect.height
            
            # Convert bbox to highlight annotations
            highlight_coords = {
                "page": page,
                "rects": [],
                "bounding_box": {
                    "x1": bbox[0] / page_width if page_width > 0 else 0,
                    "y1": bbox[1] / page_height if page_height > 0 else 0,
                    "x2": bbox[2] / page_width if page_width > 0 else 0,
                    "y2": bbox[3] / page_height if page_height > 0 else 0
                }
            }
            
            doc.close()
            return highlight_coords
            
        except Exception as e:
            raise Exception(f"Error generating highlight coordinates: {str(e)}")
    
    def create_multi_line_highlight(self, chunks: List[Dict], color: str = "#FFD700") -> Dict:
        """Create highlights across multiple lines/paragraphs"""
        if not chunks:
            return {"highlights": []}
        
        highlight_regions = []
        for chunk in chunks:
            region = {
                "page": chunk.get("page", 1),
                "bbox": chunk.get("bbox", [0, 0, 0, 0]),
                "text": chunk.get("text", ""),
                "color": color
            }
            highlight_regions.append(region)
        
        return {
            "highlights": highlight_regions,
            "total_regions": len(highlight_regions),
            "color": color
        }
    
    def highlight_by_sentence(self, sentence: str, chunks: List[Dict], 
                            color: str = "#FFD700") -> List[Dict]:
        """Highlight specific sentence across chunks"""
        highlighted = []
        
        for chunk in chunks:
            if sentence.lower() in chunk.get("text", "").lower():
                # Find exact position of sentence in chunk
                start_pos = chunk["text"].lower().find(sentence.lower())
                if start_pos != -1:
                    # Calculate approximate bbox for the sentence
                    bbox = chunk.get("bbox", [0, 0, 0, 0])
                    highlighted.append({
                        "page": chunk.get("page", 1),
                        "bbox": bbox,
                        "text": sentence,
                        "color": color,
                        "chunk_id": chunk.get("id")
                    })
        
        return highlighted