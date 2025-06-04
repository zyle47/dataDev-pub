import React, { useEffect, useState } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageList from "./components/ImageList";
import Annotator from "./components/Annotator";
import AnnotationDownloader from "./components/AnnotationDownloader";
import { getImages, getAnnotations, postAnnotations } from "./api";
import { Annotation, ImageMeta } from "./types";

function App() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [selected, setSelected] = useState<ImageMeta | null>(null);
  const [annotationsForThisImage, setAnnotationsForThisImage] = useState<Annotation[]>([]);

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
    await postAnnotations(selected.image_id, annotations);
    alert("Annotations saved!");
    setAnnotationsForThisImage(annotations); // update local state after save
  };

  useEffect(() => {
    loadImages();
  }, []);

  return (
    <div>
      <h1>Image Annotator</h1>
      <ImageUploader onUpload={loadImages} />
      <ImageList images={images} onSelect={setSelected} />
      {selected && (
        <>
          <Annotator
            image={selected}
            initialAnnotations={annotationsForThisImage}
            onSave={handleSaveAnnotations}
          />
          <AnnotationDownloader imageId={selected.image_id} />
        </>
      )}
    </div>
  );
}

export default App;
