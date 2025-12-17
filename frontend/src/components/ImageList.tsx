import React from "react";
import { ImageMeta } from "../types";
import { API_BASE_URL } from "../constants";

export default function ImageList({
  images,
  onSelect,
  onDelete,
  selectedId
}: {
  images: ImageMeta[];
  onSelect: (img: ImageMeta) => void;
  onDelete: (img: ImageMeta) => void;
  selectedId?: number;
}) {
  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 font-medium">No images yet</p>
        <p className="text-xs text-gray-500 mt-1">Upload to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {images.map(img => {
        const isSelected = selectedId === img.image_id;
        return (
          <div
            key={img.image_id}
            onClick={() => {
              if (isSelected) {
                onSelect(null as any); // Deselect if already selected
              } else {
                onSelect(img);
              }
            }}
            className={`group relative aspect-square cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${
              isSelected
                ? 'ring-4 ring-purple-500 shadow-lg scale-105'
                : 'hover:shadow-xl hover:scale-105 shadow-md'
            }`}
          >
            <img 
              src={`${API_BASE_URL}${img.url}`} 
              alt={`Thumbnail ${img.image_id}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(img);
              }}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              title="Delete image"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 left-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-lg z-10">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            
            {/* Hover overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                <p className="text-xs font-semibold truncate">#{img.image_id}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
