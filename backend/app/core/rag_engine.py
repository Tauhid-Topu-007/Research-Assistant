# backend/app/core/rag_engine.py
from typing import List, Dict, Any, Optional
import os
import logging
from app.config import settings
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService

logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.vector_service = VectorService()
        
        # Initialize OpenAI if API key is available
        self.use_openai = bool(settings.OPENAI_API_KEY)
        self.openai_client = None
        
        if self.use_openai:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized successfully")
            except ImportError as e:
                self.use_openai = False
                logger.warning(f"OpenAI package not installed: {e}")
            except Exception as e:
                self.use_openai = False
                logger.warning(f"Failed to initialize OpenAI: {e}")
    
    def create_vector_store(self, documents: List[Dict], paper_id: int) -> str:
        """Create vector store from paper chunks"""
        try:
            # Convert chunks to documents for vector store
            docs = []
            for chunk in documents:
                docs.append({
                    "text": chunk["text"],
                    "metadata": {
                        "paper_id": paper_id,
                        "page": chunk["page"],
                        "bbox": chunk["bbox"],
                        "chunk_id": chunk.get("id", 0)
                    }
                })
            
            # Create embeddings for all texts
            texts = [d["text"] for d in docs]
            embeddings = self.embedding_service.create_embeddings(texts)
            
            # Store in vector database
            vector_store_path = self.vector_service.create_index(
                embeddings=embeddings,
                documents=docs,
                paper_id=paper_id
            )
            
            return vector_store_path
            
        except Exception as e:
            logger.error(f"Error creating vector store: {str(e)}")
            raise Exception(f"Error creating vector store: {str(e)}")
    
    def query_paper(self, query: str, paper_id: int, top_k: int = 5) -> Dict:
        """Query the paper using RAG"""
        try:
            # Get relevant chunks
            relevant_chunks = self.vector_service.search(
                query=query,
                paper_id=paper_id,
                top_k=top_k
            )
            
            if not relevant_chunks:
                return {
                    "answer": "No relevant information found in this paper.",
                    "sources": []
                }
            
            # Prepare context
            context = "\n\n".join([chunk["text"] for chunk in relevant_chunks])
            
            # Generate answer using OpenAI if available
            answer = self._generate_answer(query, context, relevant_chunks)
            
            # Prepare sources with highlight information
            sources = []
            for chunk in relevant_chunks:
                sources.append({
                    "page": chunk.get("page", 1),
                    "text": chunk.get("text", ""),
                    "bbox": chunk.get("bbox", [0, 0, 0, 0]),
                    "score": chunk.get("score", 0)
                })
            
            return {
                "answer": answer,
                "sources": sources,
                "context": context
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return {
                "answer": f"Error processing query: {str(e)}",
                "sources": []
            }
    
    def _generate_answer(self, query: str, context: str, chunks: List[Dict]) -> str:
        """Generate answer using OpenAI or fallback"""
        if self.use_openai and self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL or "gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system", 
                            "content": "You are a research paper assistant. Answer questions based on the provided context from the paper. Be precise and cite the source when possible."
                        },
                        {
                            "role": "user", 
                            "content": f"Context from paper:\n{context}\n\nQuestion: {query}"
                        }
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.error(f"OpenAI error: {str(e)}")
                return self._fallback_answer(query, context, chunks)
        else:
            return self._fallback_answer(query, context, chunks)
    
    def _fallback_answer(self, query: str, context: str, chunks: List[Dict]) -> str:
        """Fallback answer generation without OpenAI"""
        # Simple extraction of relevant sentences
        sentences = []
        for chunk in chunks:
            # Split into sentences
            chunk_sentences = chunk["text"].split('. ')
            for sent in chunk_sentences:
                if any(word in sent.lower() for word in query.lower().split()):
                    sentences.append(sent)
        
        if sentences:
            return f"Based on the paper, I found these relevant passages:\n\n" + "\n\n".join(sentences[:3])
        else:
            return f"I found the following relevant information from the paper:\n\n{context[:500]}..."
    
    def compare_papers(self, query: str, paper_ids: List[int]) -> Dict:
        """Compare multiple papers"""
        results = {}
        
        for paper_id in paper_ids:
            result = self.query_paper(query, paper_id)
            results[paper_id] = result
        
        # Generate comparison using OpenAI if available
        if self.use_openai and self.openai_client:
            try:
                comparison_prompt = "Compare the following responses from different research papers:\n\n"
                for paper_id, result in results.items():
                    comparison_prompt += f"Paper {paper_id}:\n{result['answer']}\n\n"
                
                comparison_prompt += "Provide a structured comparison highlighting differences, similarities, and key insights."
                
                response = self.openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL or "gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a research paper comparison assistant."},
                        {"role": "user", "content": comparison_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
                comparison = response.choices[0].message.content
            except Exception as e:
                logger.error(f"Comparison error: {str(e)}")
                comparison = "Error generating comparison. Please check OpenAI configuration."
        else:
            comparison = "OpenAI not configured. Please set OPENAI_API_KEY for detailed comparisons."
        
        return {
            "comparison": comparison,
            "individual_responses": results
        }