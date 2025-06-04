from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Image(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)

class Annotation(Base):
    __tablename__ = "annotations"
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"))
    type = Column(String)
    data = Column(String)  # JSON serialized
    label = Column(String, nullable=True) # Optional for annotations
