import faiss
import numpy as np
import pickle
import os
import json
from typing import List, Dict, Any, Optional
from app.config import settings

class VectorService:
    def __init__(self):
        self.index_dir = settings.VECTOR_DB_PATH
        os.makedirs(self.index_dir, exist_ok=True)
        self.dimension = 384  # Default for all-MiniLM-L6-v2
    
    def create_index(self, embeddings: List[List[float]], documents: List[Dict], paper_id: int) -> str:
        """Create FAISS index for paper chunks"""
        try:
            # Convert embeddings to numpy array
            embedding_array = np.array(embeddings, dtype=np.float32)
            
            # Create FAISS index
            index = faiss.IndexFlatL2(self.dimension)
            index.add(embedding_array)
            
            # Save index
            paper_dir = os.path.join(self.index_dir, str(paper_id))
            os.makedirs(paper_dir, exist_ok=True)
            
            index_path = os.path.join(paper_dir, "index.faiss")
            faiss.write_index(index, index_path)
            
            # Save documents metadata
            metadata_path = os.path.join(paper_dir, "metadata.pkl")
            with open(metadata_path, 'wb') as f:
                pickle.dump(documents, f)
            
            return index_path
            
        except Exception as e:
            raise Exception(f"Error creating FAISS index: {str(e)}")
    
    def search(self, query: str, paper_id: int, top_k: int = 5) -> List[Dict]:
        """Search for similar chunks"""
        try:
            paper_dir = os.path.join(self.index_dir, str(paper_id))
            index_path = os.path.join(paper_dir, "index.faiss")
            metadata_path = os.path.join(paper_dir, "metadata.pkl")
            
            if not os.path.exists(index_path) or not os.path.exists(metadata_path):
                return []
            
            # Load index
            index = faiss.read_index(index_path)
            
            # Load metadata
            with open(metadata_path, 'rb') as f:
                documents = pickle.load(f)
            
            # Create embedding for query
            from app.services.embedding_service import EmbeddingService
            embedding_service = EmbeddingService()
            query_embedding = embedding_service.create_single_embedding(query)
            
            # Search
            query_array = np.array([query_embedding], dtype=np.float32)
            distances, indices = index.search(query_array, min(top_k, len(documents)))
            
            # Get results
            results = []
            for i, idx in enumerate(indices[0]):
                if idx < len(documents):
                    doc = documents[idx]
                    results.append({
                        "text": doc["text"],
                        "page": doc["page"],
                        "bbox": doc["bbox"],
                        "score": float(1 / (1 + distances[0][i]))  # Convert distance to similarity
                    })
            
            return results
            
        except Exception as e:
            print(f"Search error: {str(e)}")
            return []
    
    def delete_paper_index(self, paper_id: int) -> bool:
        """Delete index for a paper"""
        paper_dir = os.path.join(self.index_dir, str(paper_id))
        if os.path.exists(paper_dir):
            import shutil
            shutil.rmtree(paper_dir)
            return True
        return False