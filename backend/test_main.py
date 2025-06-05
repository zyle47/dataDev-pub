import os
import shutil
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, Base, get_db

# Create temporary database for tests
TEST_DB_PATH = tempfile.mktemp(suffix=".db")
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

# Override the engine and SessionLocal
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Override dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

# Use temp directories
TEMP_UPLOAD_DIR = "test_uploads"
TEMP_EXPORT_DIR = "test_exports"


@pytest.fixture(scope="session", autouse=True)
def setup_and_teardown():
    os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)
    os.makedirs(TEMP_EXPORT_DIR, exist_ok=True)

    app.UPLOAD_DIR = TEMP_UPLOAD_DIR
    app.EXPORT_DIR = TEMP_EXPORT_DIR

    Base.metadata.create_all(bind=engine)

    yield

    shutil.rmtree(TEMP_UPLOAD_DIR)
    shutil.rmtree(TEMP_EXPORT_DIR)

    # Dispose of engine to close all connections
    engine.dispose()

    # Now it’s safe to delete the test database
    os.remove(TEST_DB_PATH)


# Helper to upload a dummy image
def upload_dummy_image():
    img_path = "test_dummy.jpg"
    with open(img_path, "wb") as f:
        f.write(os.urandom(1024))  # 1KB dummy content

    with open(img_path, "rb") as f:
        response = client.post("/images/", files={"file": ("test_dummy.jpg", f, "image/jpeg")})

    os.remove(img_path)
    return response.json()["image_id"]


# ------------------ TEST CASES ------------------

def test_upload_image():
    img_path = "test_upload.jpg"
    with open(img_path, "wb") as f:
        f.write(os.urandom(1024))

    with open(img_path, "rb") as f:
        response = client.post("/images/", files={"file": ("test_upload.jpg", f, "image/jpeg")})

    os.remove(img_path)
    assert response.status_code == 200
    assert "image_id" in response.json()


def test_add_annotations():
    image_id = upload_dummy_image()
    annotations = [
        {"type": "box", "label": "cat", "x": 10, "y": 20, "w": 100, "h": 200},
        {"type": "box", "label": "dog", "x": 50, "y": 60, "w": 80, "h": 120},
    ]
    response = client.post(f"/images/{image_id}/annotations", json=annotations)
    assert response.status_code == 200
    assert response.json() == {"status": "annotations saved"}


def test_get_annotations():
    image_id = upload_dummy_image()
    annotations = [{"type": "box", "label": "tree", "x": 5, "y": 5, "w": 10, "h": 15}]
    client.post(f"/images/{image_id}/annotations", json=annotations)

    response = client.get(f"/images/{image_id}/annotations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["label"] == "tree"


def test_download_annotations():
    image_id = upload_dummy_image()
    annotations = [{"type": "box", "label": "car", "x": 1, "y": 2, "w": 3, "h": 4}]
    client.post(f"/images/{image_id}/annotations", json=annotations)

    response = client.get(f"/images/{image_id}/download-annotations")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"


def test_add_annotations_to_nonexistent_image():
    non_existent_id = 9999
    annotations = [{"type": "box", "label": "ghost", "x": 1, "y": 1, "w": 1, "h": 1}]
    response = client.post(f"/images/{non_existent_id}/annotations", json=annotations)
    assert response.status_code == 404


def test_add_invalid_annotation_format():
    image_id = upload_dummy_image()
    invalid_annotations = [{"label": "missing_type", "x": 0, "y": 0, "w": 10, "h": 10}]
    response = client.post(f"/images/{image_id}/annotations", json=invalid_annotations)
    assert response.status_code == 422
