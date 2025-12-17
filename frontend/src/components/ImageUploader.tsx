import React, { useRef, useState } from "react";
import { uploadImagesBulk, ApiError } from "../api";
import { UPLOAD_CONFIG } from "../constants";

interface ImageUploaderProps {
  onUpload: () => void;
  showToast: (message: string) => void;
  showError: (message: string) => void;
}

export default function ImageUploader({ onUpload, showToast, showError }: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFiles = (fileList: File[]): File[] => {
    const validFiles: File[] = [];
    for (const file of fileList) {
      // Validate file type
      if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
        showError(`${file.name}: Invalid file type`);
        continue;
      }

      // Validate file size
      if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
        showError(`${file.name}: File too large (max ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB)`);
        continue;
      }

      validFiles.push(file);
    }
    return validFiles;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const fileArray = Array.from(selectedFiles);
      const validFiles = validateFiles(fileArray);
      setFiles(validFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      const response = await uploadImagesBulk(files);
      const { success_count, error_count } = response.data;
      
      if (success_count > 0) {
        showToast(`Successfully uploaded ${success_count} image(s)!`);
      }
      if (error_count > 0) {
        showError(`Failed to upload ${error_count} image(s)`);
      }

      setFiles([]);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onUpload();
    } catch (err) {
      if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        id="file-upload-compact"
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        multiple
        onChange={handleInputChange}
        disabled={isUploading}
        className="hidden"
      />
      
      {files.length > 0 ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </span>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`px-4 py-2 rounded-lg font-medium text-white shadow-md transition-all duration-200 flex items-center gap-2 ${
              isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-lg hover:scale-105'
            }`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm">Upload All</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              setFiles([]);
              if (inputRef.current) {
                inputRef.current.value = "";
              }
            }}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        <label
          htmlFor="file-upload-compact"
          className="px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm">Upload Images</span>
        </label>
      )}
    </div>
  );
}
