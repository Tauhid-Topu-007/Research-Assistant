import fitz  # PyMuPDF
import pdfplumber
import re
from typing import List, Dict, Any, Optional, Tuple
import json
import os
from app.config import settings

class PDFProcessor:
    def __init__(self):
        self.supported_extensions = ['.pdf']
    
    def process_pdf(self, file_path: str, paper_id: int) -> Dict[str, Any]:
        """
        Process PDF and extract text with bounding boxes
        """
        result = {
            "pages": [],
            "total_pages": 0,
            "text": "",
            "metadata": {}
        }
        
        try:
            # Open PDF with PyMuPDF for bounding boxes
            doc = fitz.open(file_path)
            result["total_pages"] = len(doc)
            
            # Extract metadata
            result["metadata"] = {
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject", ""),
                "keywords": doc.metadata.get("keywords", ""),
                "creator": doc.metadata.get("creator", "")
            }
            
            # Process each page
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                
                # Get text with bounding boxes
                blocks = page.get_text("dict")["blocks"]
                page_chunks = []
                
                for block in blocks:
                    if "lines" in block:
                        for line in block["lines"]:
                            for span in line["spans"]:
                                if span["text"].strip():
                                    chunk = {
                                        "page": page_num + 1,
                                        "text": span["text"],
                                        "bbox": span["bbox"],
                                        "font_size": span["size"],
                                        "block_num": block.get("number", 0),
                                        "line_num": line.get("number", 0),
                                        "char_start": 0,
                                        "char_end": len(span["text"])
                                    }
                                    page_chunks.append(chunk)
                
                result["pages"].append({
                    "number": page_num + 1,
                    "text": page_text,
                    "chunks": page_chunks
                })
                
                result["text"] += page_text + "\n"
            
            doc.close()
            
            # Also extract tables using pdfplumber
            tables = self.extract_tables(file_path)
            result["tables"] = tables
            
            # Extract images
            images = self.extract_images(file_path)
            result["images"] = images
            
            return result
            
        except Exception as e:
            raise Exception(f"Error processing PDF: {str(e)}")
    
    def extract_tables(self, file_path: str) -> List[Dict]:
        """Extract tables from PDF"""
        tables = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    page_tables = page.extract_tables()
                    for table in page_tables:
                        if table and len(table) > 0:
                            tables.append({
                                "page": page_num + 1,
                                "data": table,
                                "rows": len(table),
                                "cols": len(table[0]) if table else 0
                            })
        except Exception as e:
            print(f"Table extraction error: {str(e)}")
        return tables
    
    def extract_images(self, file_path: str) -> List[Dict]:
        """Extract images from PDF"""
        images = []
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images()
                
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    pix = fitz.Pixmap(doc, xref)
                    
                    if pix.n - pix.alpha < 4:
                        images.append({
                            "page": page_num + 1,
                            "index": img_index,
                            "width": pix.width,
                            "height": pix.height,
                            "format": "png"
                        })
                    pix = None
            doc.close()
        except Exception as e:
            print(f"Image extraction error: {str(e)}")
        return images
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Chunk text for embedding"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
        
        return chunks
    
    def extract_equations(self, text: str) -> List[Dict]:
        """Extract mathematical equations from text"""
        equation_patterns = [
            r'\$[^\$]+\$',  # Inline math
            r'\\\[.*?\\\]',  # Display math
            r'\\begin\{equation\}.*?\\end\{equation\}',  # Equation environment
            r'\\begin\{align\}.*?\\end\{align\}'  # Align environment
        ]
        
        equations = []
        for pattern in equation_patterns:
            matches = re.findall(pattern, text, re.DOTALL)
            for match in matches:
                equations.append({
                    "text": match,
                    "type": "equation"
                })
        
        return equations