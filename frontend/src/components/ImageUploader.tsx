import React, { useRef, useState } from "react";
import { uploadImage } from "../api";

export default function ImageUploader({ onUpload }: { onUpload: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    try {
      await uploadImage(file);
      setFile(null); // Clear file from state
      if (inputRef.current) {
        inputRef.current.value = ""; // Clear input visually
      }
      onUpload(); // Trigger refresh in parent (re-fetch images)
    } catch (error) {
      alert("Upload failed");
      console.error(error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        ref={inputRef}
      />
      <button onClick={handleUpload} disabled={!file}>Upload</button>
    </div>
  );
}
