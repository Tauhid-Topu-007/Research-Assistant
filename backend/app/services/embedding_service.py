from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Union
import torch
from app.config import settings

class EmbeddingService:
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(self.model_name, device=self.device)
    
    def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for a list of texts"""
        try:
            embeddings = self.model.encode(
                texts,
                convert_to_tensor=True,
                show_progress_bar=False
            )
            
            if isinstance(embeddings, torch.Tensor):
                embeddings = embeddings.cpu().numpy()
            
            return embeddings.tolist()
            
        except Exception as e:
            raise Exception(f"Error creating embeddings: {str(e)}")
    
    def create_single_embedding(self, text: str) -> List[float]:
        """Create embedding for a single text"""
        embeddings = self.create_embeddings([text])
        return embeddings[0] if embeddings else []
    
    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Compute cosine similarity between two embeddings"""
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))