import React from "react";
import { ImageMeta } from "../types";
import "./ImageList.css";

export default function ImageList({
  images,
  onSelect
}: {
  images: ImageMeta[];
  onSelect: (img: ImageMeta) => void;
}) {
  return (
    <div className={"container"}>
      {images.map(img => (
        <div
          key={img.image_id}
          className={"imageItem"}
          onClick={() => onSelect(img)}
        >
          <img src={`http://localhost:8000${img.url}`} alt="" />
        </div>
      ))}
    </div>
  );
}
