from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from database import SessionLocal, engine
from models import Base, Image, Annotation
from schemas import AnnotationSchema
from crud import *
import os
import shutil
import uuid
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
UPLOAD_DIR = "uploads"
EXPORT_DIR = "annotations_export"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/images/")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png, image/jpg, image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    image_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    filename = f"{image_id}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db = SessionLocal()
    image = create_image(db, filename)
    db.close()
    return {"image_id": image.id, "url": f"/uploads/{filename}"}

@app.get("/images/")
def list_images():
    db = SessionLocal()
    images = get_all_images(db)
    db.close()
    return images

@app.post("/images/{image_id}/annotations")
def add_annotations(image_id: int, annotations: list[AnnotationSchema]):
    db = SessionLocal()
    print("Received annotations:")
    for a in annotations:
        print(a)
    if not get_image(db, image_id):
        db.close()
        raise HTTPException(status_code=404, detail="Image not found")

    save_annotations(db, image_id, annotations)
    db.close()
    return {"status": "annotations saved"}

@app.get("/images/{image_id}/annotations")
def get_annotations(image_id: int):
    db = SessionLocal()
    ann = get_annotations_by_image(db, image_id)
    db.close()
    return ann

@app.get("/images/{image_id}/download-annotations")
def download_annotations(image_id: int):
    db = SessionLocal()
    annotations = get_annotations_by_image(db, image_id)
    db.close()
    
    if not annotations:
        raise HTTPException(status_code=404, detail="No annotations found")

    filepath = os.path.join(EXPORT_DIR, f"{image_id}_annotations.json")
    with open(filepath, "w") as f:
        import json
        json.dump(annotations, f)

    return FileResponse(filepath, filename=os.path.basename(filepath), media_type="application/json")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)