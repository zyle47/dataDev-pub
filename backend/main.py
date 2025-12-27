from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Body
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from database import SessionLocal, engine
from models import Base, Annotation
from schemas import AnnotationSchema
from crud import create_image, get_all_images, get_image, save_annotations, get_annotations_by_image, delete_image
import os
import shutil
import uuid
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.26:3000",     # Machine's IP
        "http://192.168.0.26:8000",     # Machine's IP
        "http://192.168.0.26",           # Machine's IP
        "http://mysite.local",           # Custom local domain
        "http://api.mysite.local",       # Custom local domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.state for configurable paths
app.state.UPLOAD_DIR = "uploads"
app.state.EXPORT_DIR = "annotations_export"
favicon_path = 'static/favicon.ico'
sample_images = 'static/sample_images'

os.makedirs(app.state.UPLOAD_DIR, exist_ok=True)
os.makedirs(app.state.EXPORT_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)
app.mount("/uploads", StaticFiles(directory=app.state.UPLOAD_DIR), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get('/favicon.ico', include_in_schema=False)
async def favicon():
    return FileResponse(favicon_path)


@app.get("/")
def read_root():
    with open("static/api_description.json", "r") as file:
        data = json.load(file)
    return data


@app.post("/images/")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid image format")

    image_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    filename = f"{image_id}{ext}"
    filepath = os.path.join(app.state.UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image = create_image(db, filename)
    return {"image_id": image.id, "url": f"/uploads/{filename}"}


@app.post("/images/bulk")
async def upload_images_bulk(files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    """Upload multiple images at once"""
    uploaded = []
    errors = []
    
    for file in files:
        try:
            if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
                errors.append({"filename": file.filename, "error": "Invalid image format"})
                continue

            image_id = str(uuid.uuid4())
            ext = os.path.splitext(file.filename)[1]
            filename = f"{image_id}{ext}"
            filepath = os.path.join(app.state.UPLOAD_DIR, filename)

            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            image = create_image(db, filename)
            uploaded.append({"image_id": image.id, "url": f"/uploads/{filename}", "original_name": file.filename})
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
    
    return {
        "uploaded": uploaded,
        "errors": errors,
        "total": len(files),
        "success_count": len(uploaded),
        "error_count": len(errors)
    }


@app.get("/images/")
def list_images(db: Session = Depends(get_db)):
    images = get_all_images(db)
    return images


@app.post("/images/{image_id}/annotations")
def add_annotations(image_id: int, annotations: list[AnnotationSchema] = Body(...), db: Session = Depends(get_db)):
    if not get_image(db, image_id):
        raise HTTPException(status_code=404, detail="Image not found")

    save_annotations(db, image_id, annotations)
    return {"status": "annotations saved"}


@app.get("/images/{image_id}/annotations")
def get_annotations(image_id: int, db: Session = Depends(get_db)):
    ann = get_annotations_by_image(db, image_id)
    return ann


@app.get("/images/{image_id}/download-annotations")
def download_annotations(image_id: int, db: Session = Depends(get_db)):
    annotations = get_annotations_by_image(db, image_id)

    if not annotations:
        raise HTTPException(status_code=404, detail="No annotations found")

    filepath = os.path.join(app.state.EXPORT_DIR, f"{image_id}_annotations.json")
    with open(filepath, "w") as f:
        json.dump(annotations, f)

    return FileResponse(filepath, filename=os.path.basename(filepath), media_type="application/json")


@app.delete("/images/{image_id}/annotations")
def delete_all_annotations(image_id: int, db: Session = Depends(get_db)):
    if not get_image(db, image_id):
        raise HTTPException(status_code=404, detail="Image not found")
    
    deleted_count = db.query(Annotation).filter(Annotation.image_id == image_id).delete()
    db.commit()
    
    return {"status": "success", "deleted_count": deleted_count}


@app.delete("/images/{image_id}")
def delete_image_endpoint(image_id: int, db: Session = Depends(get_db)):
    """Delete an image and all its annotations"""
    image = get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete all annotations for this image
    db.query(Annotation).filter(Annotation.image_id == image_id).delete()
    
    # Delete the image file from disk
    filename = delete_image(db, image_id)
    if filename:
        filepath = os.path.join(app.state.UPLOAD_DIR, filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                # Log error but don't fail if file doesn't exist
                pass
    
    return {"status": "success", "message": "Image and all annotations deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
