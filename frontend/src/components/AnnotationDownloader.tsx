import React from "react";
import { downloadAnnotations, ApiError } from "../api";

interface AnnotationDownloaderProps {
  imageId: number;
  showError: (message: string) => void;
}

export default function AnnotationDownloader({ imageId, showError }: AnnotationDownloaderProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
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
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 md:gap-2"
      title="Download annotations as JSON"
    >
      {isDownloading ? (
        <>
          <svg className="w-3 h-3 md:w-4 md:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="hidden sm:inline">Downloading...</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </>
      )}
    </button>
  );
}
