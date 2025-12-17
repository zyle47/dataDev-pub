import React from "react";
import { downloadAnnotations, ApiError } from "../api";

interface AnnotationDownloaderProps {
  imageId: number;
  showError: (message: string) => void;
}

export default function AnnotationDownloader({ imageId, showError }: AnnotationDownloaderProps) {
  const handleDownload = async () => {
    try {
      const blob = await downloadAnnotations(imageId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `image_${imageId}_annotations.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Failed to download annotations');
      }
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="w-32 py-2 text-sm rounded-lg font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download
    </button>
  );
}
