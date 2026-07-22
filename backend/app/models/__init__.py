# backend/app/models/__init__.py
from app.database.session import Base
from .paper import Paper
from .chunk import Chunk
from .highlight import Highlight
from .annotation import Annotation

__all__ = ['Base', 'Paper', 'Chunk', 'Highlight', 'Annotation']