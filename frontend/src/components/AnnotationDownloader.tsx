import React from "react";
import { downloadAnnotations } from "../api";
import "./AnnotationDownloader.css";

export default function AnnotationDownloader({ imageId }: { imageId: number }) {
  const handleDownload = async () => {
    const blob = await downloadAnnotations(imageId);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${imageId}_annotations.json`;
    a.click();
  };

  return <button className={"button"} onClick={handleDownload}>Download Annotations</button>;
}
