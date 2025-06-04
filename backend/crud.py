from sqlalchemy.orm import Session
from models import Image, Annotation
import json

def create_image(db: Session, filename: str):
    image = Image(filename=filename)
    db.add(image)
    db.commit()
    db.refresh(image)
    return image

def get_all_images(db: Session):
    return [
        {"image_id": img.id, "url": f"/uploads/{img.filename}"}
        for img in db.query(Image).all()
    ]

def get_image(db: Session, image_id: int):
    return db.query(Image).filter(Image.id == image_id).first()

# def save_annotations(db: Session, image_id: int, annotations: list):
#     for annotation in annotations:
#         ann = Annotation(
#             image_id=image_id,
#             type=annotation["type"],
#             data=json.dumps(annotation)
#         )
#         db.add(ann)
#     db.commit()

def save_annotations(db: Session, image_id: int, annotations: list):
    for annotation in annotations:
        ann = Annotation(
            image_id=image_id,
            type=annotation.type,
            data=json.dumps(annotation.dict())  # serialize the model as JSON
        )
        db.add(ann)
    db.commit()


def get_annotations_by_image(db: Session, image_id: int):
    anns = db.query(Annotation).filter(Annotation.image_id == image_id).all()
    return [json.loads(ann.data) for ann in anns]
