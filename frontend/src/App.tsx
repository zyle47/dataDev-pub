import React, { useEffect, useState, useRef } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageList from "./components/ImageList";
import Annotator from "./components/Annotator";
import ErrorBoundary from "./components/ErrorBoundary";
import Toast from "./components/Toast";
import ConfirmDialog from "./components/ConfirmDialog";
import { getImages, getAnnotations, postAnnotations, deleteAllAnnotations, deleteImage, ApiError } from "./api";
import { Annotation, ImageMeta } from "./types";
import { useToast } from "./hooks/useToast";

function App() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [selected, setSelected] = useState<ImageMeta | null>(null);
  const [highlighted, setHighlighted] = useState<ImageMeta | null>(null); // For first click on mobile
  const [annotationsForThisImage, setAnnotationsForThisImage] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ImageMeta | null>(null);
  const [showMobileGallery, setShowMobileGallery] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prevAnnotationsRef = useRef<Annotation[]>([]);
  const { toasts, removeToast, success, error, warning } = useToast();

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768; // md breakpoint
      setIsMobile(isTouchDevice && isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // const handleDeselectImage = () => {
  //   setSelected(null);
  // };

  const handleSelectImage = (img: ImageMeta | null) => {
    if (!img) {
      // Deselect
      setHighlighted(null);
      return;
    }

    // Desktop behavior: single click opens for editing
    if (!isMobile) {
      setSelected(img);
      setHighlighted(null);
      return;
    }

    // Mobile behavior: two-step selection
    // If clicking the same highlighted image, open it for editing
    if (highlighted && highlighted.image_id === img.image_id) {
      setSelected(img);
      setHighlighted(null);
      setShowMobileGallery(false); // Close gallery on mobile after opening for edit
    } else {
      // First click - just highlight it
      setHighlighted(img);
    }
  };

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const imgs = await getImages();
      setImages(imgs);
    } catch (err) {
      if (err instanceof ApiError) {
        error(err.message);
      } else {
        error('Failed to load images');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load annotations when selected image changes
  useEffect(() => {
    const fetchAnnotations = async () => {
      if (selected) {
        try {
          setIsLoading(true);
          const anns = await getAnnotations(selected.image_id);
          setAnnotationsForThisImage(anns);
        } catch (err) {
          if (err instanceof ApiError) {
            error(err.message);
          } else {
            error('Failed to load annotations');
          }
          setAnnotationsForThisImage([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAnnotationsForThisImage([]);
      }
    };
    fetchAnnotations();
  }, [selected, error]);

  const handleSaveAnnotations = async (annotations: Annotation[]) => {
    if (!selected) return;

    // Find new annotations (not present in previous)
    const prev = prevAnnotationsRef.current;
    const isSame = (a: Annotation, b: Annotation) =>
      JSON.stringify(a) === JSON.stringify(b);

    const newAnnotations = annotations.filter(
      a => !prev.some(b => isSame(a, b))
    );

    if (newAnnotations.length === 0) {
      warning("No new annotations to save!");
      return;
    }

    try {
      setIsLoading(true);
      await postAnnotations(selected.image_id, newAnnotations);
      const count = newAnnotations.length;
      success(`${count} ${count === 1 ? 'annotation' : 'annotations'} saved successfully!`);
      setAnnotationsForThisImage(annotations); // update local state after save
    } catch (err) {
      if (err instanceof ApiError) {
        error(err.message);
      } else {
        error('Failed to save annotations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllAnnotations = async () => {
    if (!selected) return;

    try {
      setIsLoading(true);
      await deleteAllAnnotations(selected.image_id);
      setAnnotationsForThisImage([]);
      success("All annotations deleted successfully!");
    } catch (err) {
      if (err instanceof ApiError) {
        error(err.message);
      } else {
        error('Failed to delete annotations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = (img: ImageMeta) => {
    setImageToDelete(img);
  };

  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      setIsLoading(true);
      await deleteImage(imageToDelete.image_id);
      
      // If the deleted image was selected or highlighted, clear them
      if (selected && selected.image_id === imageToDelete.image_id) {
        setSelected(null);
        setAnnotationsForThisImage([]);
      }
      if (highlighted && highlighted.image_id === imageToDelete.image_id) {
        setHighlighted(null);
      }
      
      // Reload images list
      await loadImages();
      success("Image deleted successfully!");
      setImageToDelete(null);
    } catch (err) {
      if (err instanceof ApiError) {
        error(err.message);
      } else {
        error('Failed to delete image');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDeleteImage = () => {
    setImageToDelete(null);
  };

  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    prevAnnotationsRef.current = annotationsForThisImage;
  }, [annotationsForThisImage]);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 overflow-hidden">
        {/* Toast notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}

        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="mt-4 text-white font-semibold">Loading...</div>
            </div>
          </div>
        )}

        {/* Left Sidebar - Image Gallery - Fixed on mobile, in flow on desktop */}
        <div className={`
          w-80
          bg-white/95 md:bg-white/70
          backdrop-blur-sm
          border-r border-purple-200
          flex-col
          
          fixed md:hidden
          inset-y-0
          left-0
          z-40
          flex
          
          transform transition-transform duration-300 ease-in-out
          ${showMobileGallery ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="px-4 py-3 border-b border-purple-200 bg-white/50 flex items-center justify-between h-[60px]">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image Gallery
            </h2>
            <button
              onClick={() => setShowMobileGallery(false)}
              className="md:hidden p-1 rounded hover:bg-gray-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <ImageList 
              images={images} 
              onSelect={handleSelectImage} 
              onDelete={handleDeleteImage} 
              selectedId={isMobile ? highlighted?.image_id : selected?.image_id}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Main wrapper - slides on mobile only */}
        <div className={`
          flex-1 flex flex-col min-h-0
          transform transition-transform duration-300 ease-in-out
          ${showMobileGallery ? 'translate-x-80' : 'translate-x-0'}
          md:translate-x-0 md:transition-none
        `}>
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-purple-200 z-40 flex-shrink-0">
          <div className="px-4 md:px-6 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                {/* Mobile gallery toggle - always show on mobile */}
                <button
                  onClick={() => setShowMobileGallery(!showMobileGallery)}
                  className="md:hidden p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Image Annotation Tool
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {images.length} {images.length === 1 ? 'Image' : 'Images'}
                </span>
              </div>
              <div>
                <ImageUploader onUpload={loadImages} showToast={success} showError={error} />
              </div>
            </div>
          </div>
        </div>

          {/* Main Content - Split View */}
          <div className="flex-1 flex overflow-hidden relative min-h-0">
            {/* Desktop Sidebar - Only visible on desktop */}
            <div className="hidden md:flex md:w-80 bg-white/70 backdrop-blur-sm border-r border-purple-200 flex-col">
              <div className="px-4 py-3 border-b border-purple-200 bg-white/50 flex items-center h-[60px]">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Image Gallery
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <ImageList 
                  images={images} 
                  onSelect={handleSelectImage} 
                  onDelete={handleDeleteImage} 
                  selectedId={isMobile ? highlighted?.image_id : selected?.image_id}
                  isMobile={isMobile}
                />
              </div>
            </div>

            {/* Overlay for mobile when gallery is open */}
            {showMobileGallery && (
              <div 
                className="md:hidden fixed inset-0 bg-black/50 z-30"
                onClick={() => setShowMobileGallery(false)}
              />
            )}

            {/* Right Side - Annotation Canvas */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-w-0">
              {selected ? (
                <Annotator
                  image={selected}
                  initialAnnotations={annotationsForThisImage}
                  onSave={handleSaveAnnotations}
                  onClearAll={handleClearAllAnnotations}
                  showToast={success}
                  showError={error}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">Select an Image</h3>
                    <p className="text-gray-500">Choose an image from the gallery to start annotating</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog for Image Deletion */}
      <ConfirmDialog
        isOpen={imageToDelete !== null}
        title="Delete Image?"
        message={`Are you sure you want to delete image #${imageToDelete?.image_id}? This will also delete all its annotations. This action cannot be undone.`}
        onConfirm={handleConfirmDeleteImage}
        onCancel={handleCancelDeleteImage}
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
      />
    </ErrorBoundary>
  );
}

export default App;
