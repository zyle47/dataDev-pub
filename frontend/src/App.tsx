import React, { useEffect, useState, useRef } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageList from "./components/ImageList";
import Annotator from "./components/Annotator";
import AnnotationDownloader from "./components/AnnotationDownloader";
import { getImages, getAnnotations, postAnnotations } from "./api";
import { Annotation, ImageMeta } from "./types";
import "./App.css";
function App() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [selected, setSelected] = useState<ImageMeta | null>(null);
  const [annotationsForThisImage, setAnnotationsForThisImage] = useState<Annotation[]>([]);
  const prevAnnotationsRef = useRef<Annotation[]>([]);

  const loadImages = async () => {
    const imgs = await getImages();
    setImages(imgs);
  };

  // Load annotations when selected image changes
  useEffect(() => {
    const fetchAnnotations = async () => {
      if (selected) {
        const anns = await getAnnotations(selected.image_id);
        setAnnotationsForThisImage(anns);
      } else {
        setAnnotationsForThisImage([]);
      }
    };
    fetchAnnotations();
  }, [selected]);

  const handleSaveAnnotations = async (annotations: Annotation[]) => {
    if (!selected) return;

    // Find new annotations (not present in previous)
    const prev = prevAnnotationsRef.current;
    const isSame = (a: Annotation, b: Annotation) =>
      JSON.stringify(a) === JSON.stringify(b);

    const newAnnotations = annotations.filter(
      a => !prev.some(b => isSame(a, b))
    );

    if (newAnnotations.length === 0) {
      alert("No new annotations to save!");
      return;
    }

    await postAnnotations(selected.image_id, newAnnotations);
    alert("New annotations saved!");
    setAnnotationsForThisImage(annotations); // update local state after save
  };

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    prevAnnotationsRef.current = annotationsForThisImage;
  }, [annotationsForThisImage]);

  return (
  <div className="app-container">
      <h1 className="app-title">Image Annotation Tool</h1>
      
      <div className="upload-section">
        <ImageUploader onUpload={loadImages} />
      </div>

      <div className="image-list-section">
        <ImageList images={images} onSelect={setSelected} />
      </div>

      {selected && (
        <div className="annotation-section">
          <AnnotationDownloader imageId={selected.image_id} />
          
          <Annotator
            image={selected}
            initialAnnotations={annotationsForThisImage}
            onSave={handleSaveAnnotations}
          />
        </div>
      )}
    </div>
  );
}

export default App;
