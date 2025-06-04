from typing import Union, Literal
from pydantic import BaseModel

class Box(BaseModel):
    type: Literal["box"]
    x: int
    y: int
    w: int
    h: int
    label: str

class Polygon(BaseModel):
    type: Literal["polygon"]
    points: list[list[int]]
    label: str

AnnotationSchema = Union[Box, Polygon]