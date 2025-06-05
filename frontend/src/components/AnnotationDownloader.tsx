import React from "react";
import { downloadAnnotations } from "../api";
import "./AnnotationDownloader.css";

export default function AnnotationDownloader({ imageId }: { imageId: number }) {
  const handleDownload = async () => {
    try {
    const blob = await downloadAnnotations(imageId);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${imageId}_annotations.json`;
    a.click();
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // Handle 404 specifically
        alert("No annotations found for this image.");
        return;
      }
    // Handle other errors
    }
  };

  return <button className={"button"} onClick={handleDownload}>💾 Download Annotations</button>;
}
