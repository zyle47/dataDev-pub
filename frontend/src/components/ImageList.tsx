import React from "react";
import { ImageMeta } from "../types";

export default function ImageList({
  images,
  onSelect
}: {
  images: ImageMeta[];
  onSelect: (img: ImageMeta) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {images.map(img => (
        <div key={img.image_id} onClick={() => onSelect(img)} style={{ cursor: "pointer" }}>
          <img src={`http://localhost:8000${img.url}`} alt="" width="150" />
        </div>
      ))}
    </div>
  );
}
