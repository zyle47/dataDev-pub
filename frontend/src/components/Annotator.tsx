import React, { useEffect, useRef, useState } from "react";
import { Annotation, Box, Polygon, ImageMeta } from "../types";
import { API_BASE_URL, CANVAS_CONFIG, ANNOTATION_CONFIG } from "../constants";
import "./Annotator.css";
import AnnotationDownloader from "./AnnotationDownloader";
import ConfirmDialog from "./ConfirmDialog";
import InputDialog from "./InputDialog";

type Mode = "none" | "box" | "polygon";

interface AnnotatorProps {
  image: ImageMeta;
  onSave: (annotations: Annotation[]) => void;
  onClearAll: () => void;
  initialAnnotations?: Annotation[];
  showToast: (message: string) => void;
  showError: (message: string) => void;
}

interface PendingAnnotation {
  type: "box" | "polygon";
  data: any;
}

export default function Annotator({
  image,
  onSave,
  onClearAll,
  initialAnnotations = [],
  showToast,
  showError
}: AnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>("none");
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [savedAnnotationCount, setSavedAnnotationCount] = useState(initialAnnotations.length);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<number[][]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);

  const drawAnnotations = React.useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    // Calculate scale factor based on image size (for consistent line thickness)
    const baseSize = 1000;
    const currentScale = Math.max(canvas.width, canvas.height) / baseSize;
    
    annotations.forEach((ann, index) => {
      const isSelected = index === selectedAnnotationIndex;
      
      // Add subtle shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4 * currentScale;
      ctx.shadowOffsetX = 2 * currentScale;
      ctx.shadowOffsetY = 2 * currentScale;
      
      ctx.strokeStyle = isSelected ? ANNOTATION_CONFIG.COLORS.SELECTED : ANNOTATION_CONFIG.COLORS.SAVED;
      ctx.lineWidth = (isSelected ? CANVAS_CONFIG.ANNOTATION_LINE_WIDTH + 2 : CANVAS_CONFIG.ANNOTATION_LINE_WIDTH) * currentScale;
      
      if (ann.type === "box") {
        // Draw border only
        ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
        
        // Reset shadow for label
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        if (ann.label) {
          // Draw label with background
          ctx.font = `bold ${CANVAS_CONFIG.ANNOTATION_FONT_SIZE * currentScale}px Arial`;
          const textMetrics = ctx.measureText(ann.label);
          const padding = 6 * currentScale;
          const labelX = ann.x;
          const labelY = ann.y - (8 * currentScale);
          const rectX = labelX - padding / 2;
          const rectY = labelY - CANVAS_CONFIG.ANNOTATION_FONT_SIZE * currentScale - padding / 2;
          const rectW = textMetrics.width + padding;
          const rectH = CANVAS_CONFIG.ANNOTATION_FONT_SIZE * currentScale + padding;
          const radius = 4 * currentScale;
          
          // Draw rounded background rectangle
          ctx.fillStyle = isSelected ? ANNOTATION_CONFIG.COLORS.SELECTED : ANNOTATION_CONFIG.COLORS.LABEL_BG;
          ctx.beginPath();
          ctx.moveTo(rectX + radius, rectY);
          ctx.lineTo(rectX + rectW - radius, rectY);
          ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius);
          ctx.lineTo(rectX + rectW, rectY + rectH - radius);
          ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH);
          ctx.lineTo(rectX + radius, rectY + rectH);
          ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius);
          ctx.lineTo(rectX, rectY + radius);
          ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
          ctx.closePath();
          ctx.fill();
          
          // Draw text
          ctx.fillStyle = ANNOTATION_CONFIG.COLORS.LABEL_TEXT;
          ctx.fillText(ann.label, labelX, labelY);
        }
      } else if (ann.type === "polygon") {
        ctx.beginPath();
        ann.points.forEach(([x, y], idx) => {
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        // Draw border only
        ctx.stroke();
        
        // Reset shadow for label
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        if (ann.label && ann.points.length > 0) {
          const [labelX, labelY] = ann.points[0];
          ctx.font = `bold ${CANVAS_CONFIG.ANNOTATION_FONT_SIZE * currentScale}px Arial`;
          const textMetrics = ctx.measureText(ann.label);
          const padding = 6 * currentScale;
          const textY = labelY - (8 * currentScale);
          const rectX = labelX - padding / 2;
          const rectY = textY - CANVAS_CONFIG.ANNOTATION_FONT_SIZE * currentScale - padding / 2;
          const rectW = textMetrics.width + padding;
          const rectH = CANVAS_CONFIG.ANNOTATION_FONT_SIZE * currentScale + padding;
          const radius = 4 * currentScale;
          
          // Draw rounded background rectangle
          ctx.fillStyle = isSelected ? ANNOTATION_CONFIG.COLORS.SELECTED : ANNOTATION_CONFIG.COLORS.LABEL_BG;
          ctx.beginPath();
          ctx.moveTo(rectX + radius, rectY);
          ctx.lineTo(rectX + rectW - radius, rectY);
          ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius);
          ctx.lineTo(rectX + rectW, rectY + rectH - radius);
          ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH);
          ctx.lineTo(rectX + radius, rectY + rectH);
          ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius);
          ctx.lineTo(rectX, rectY + radius);
          ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
          ctx.closePath();
          ctx.fill();
          
          // Draw text
          ctx.fillStyle = ANNOTATION_CONFIG.COLORS.LABEL_TEXT;
          ctx.fillText(ann.label, labelX, textY);
        }
      }
    });

    // Draw in-progress polygon
    if (mode === "polygon" && currentPolygon.length > 0) {
      ctx.strokeStyle = ANNOTATION_CONFIG.COLORS.IN_PROGRESS;
      ctx.lineWidth = CANVAS_CONFIG.IN_PROGRESS_LINE_WIDTH * currentScale;
      ctx.beginPath();
      currentPolygon.forEach(([x, y], idx) => {
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      if (mousePos) {
        ctx.lineTo(mousePos.x, mousePos.y);
      }
      ctx.stroke();
      
      // Draw dots at each point for visual feedback
      ctx.fillStyle = ANNOTATION_CONFIG.COLORS.IN_PROGRESS;
      currentPolygon.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4 * currentScale, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw in-progress box
    if (mode === "box" && startPoint && mousePos) {
      ctx.strokeStyle = ANNOTATION_CONFIG.COLORS.IN_PROGRESS;
      ctx.lineWidth = CANVAS_CONFIG.IN_PROGRESS_LINE_WIDTH * currentScale;
      const x = Math.min(startPoint.x, mousePos.x);
      const y = Math.min(startPoint.y, mousePos.y);
      const w = Math.abs(mousePos.x - startPoint.x);
      const h = Math.abs(mousePos.y - startPoint.y);
      ctx.strokeRect(x, y, w, h);
    }
  }, [annotations, mode, currentPolygon, mousePos, startPoint, selectedAnnotationIndex]);

  useEffect(() => {
    const img = new Image();
    img.src = `${API_BASE_URL}${image.url}`;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      drawAnnotations(ctx);
    };
  }, [image.url, drawAnnotations]);

  useEffect(() => {
    setAnnotations(initialAnnotations);
    setSavedAnnotationCount(initialAnnotations.length);
  }, [image, initialAnnotations]);

  useEffect(() => {
    setMode("none");
  }, [image]);

  // Utility to get scaled mouse position
  function getScaledMousePos(
    e: React.MouseEvent,
    canvas: HTMLCanvasElement
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setMousePos(getScaledMousePos(e, canvas));
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode !== "polygon") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getScaledMousePos(e, canvas);

    if (e.detail === 2) {
      // Double click: finish polygon
      if (currentPolygon.length < ANNOTATION_CONFIG.MIN_POLYGON_POINTS) {
        showError(`Polygon must have at least ${ANNOTATION_CONFIG.MIN_POLYGON_POINTS} points.`);
        setCurrentPolygon([]);
        setMode("none");
        return;
      }

      // Open input dialog for label
      setPendingAnnotation({
        type: "polygon",
        data: { points: currentPolygon }
      });
      setShowInputDialog(true);
    } else {
      // Single click: add point
      setCurrentPolygon([...currentPolygon, [x, y]]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== "box") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setStartPoint(getScaledMousePos(e, canvas));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mode !== "box" || !startPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x: x2, y: y2 } = getScaledMousePos(e, canvas);

    const w = Math.abs(x2 - startPoint.x);
    const h = Math.abs(y2 - startPoint.y);

    if (w < ANNOTATION_CONFIG.MIN_BOX_SIZE || h < ANNOTATION_CONFIG.MIN_BOX_SIZE) {
      showError(`Box must be at least ${ANNOTATION_CONFIG.MIN_BOX_SIZE}px in width and height.`);
      setStartPoint(null);
      return;
    }

    // Open input dialog for label
    setPendingAnnotation({
      type: "box",
      data: {
        x: Math.min(startPoint.x, x2),
        y: Math.min(startPoint.y, y2),
        w,
        h
      }
    });
    setShowInputDialog(true);
  };

  const saveAnnotations = () => {
    const unsavedCount = annotations.length - savedAnnotationCount;
    
    if (unsavedCount === 0) {
      showError("No new annotations to save.");
      return;
    }

    const cleaned: Annotation[] = annotations.map((a) => {
      if (a.type === "box") {
        return {
          type: "box" as const,
          x: Math.round(a.x),
          y: Math.round(a.y),
          w: Math.round(a.w),
          h: Math.round(a.h),
          label: a.label
        };
      } else if (a.type === "polygon") {
        return {
          type: "polygon" as const,
          points: a.points.map(([x, y]) => [Math.round(x), Math.round(y)]),
          label: a.label
        };
      }
      
      return a;
    });

    onSave(cleaned);
    setSavedAnnotationCount(annotations.length);
  };

  const deleteAnnotation = (index: number) => {
    const updatedAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(updatedAnnotations);
    setSelectedAnnotationIndex(null);
    showToast("Annotation deleted.");
  };

  const clearAllAnnotations = () => {
    if (annotations.length === 0) {
      showError("No annotations to clear.");
      return;
    }
    
    setShowClearDialog(true);
  };

  const handleConfirmClear = () => {
    setAnnotations([]);
    setSavedAnnotationCount(0);
    setSelectedAnnotationIndex(null);
    setShowClearDialog(false);
    // Delete all annotations from backend
    onClearAll();
  };

  const handleCancelClear = () => {
    setShowClearDialog(false);
  };

  const handleLabelConfirm = (label: string) => {
    if (!pendingAnnotation) return;

    if (pendingAnnotation.type === "polygon") {
      const poly: Polygon = {
        type: "polygon",
        points: pendingAnnotation.data.points,
        label: label
      };
      setAnnotations([...annotations, poly]);
      setCurrentPolygon([]);
      showToast("Polygon annotation created!");
    } else if (pendingAnnotation.type === "box") {
      const box: Box = {
        type: "box",
        x: pendingAnnotation.data.x,
        y: pendingAnnotation.data.y,
        w: pendingAnnotation.data.w,
        h: pendingAnnotation.data.h,
        label: label
      };
      setAnnotations([...annotations, box]);
      setStartPoint(null);
      showToast("Box annotation created!");
    }

    setMode("none");
    setShowInputDialog(false);
    setPendingAnnotation(null);
  };

  const handleLabelCancel = () => {
    setShowInputDialog(false);
    setPendingAnnotation(null);
    setCurrentPolygon([]);
    setStartPoint(null);
    setMode("none");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-purple-200 px-6 flex-shrink-0 h-[60px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Drawing Mode:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("box")}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${
                  mode === "box"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📦 Box
              </button>
              <button
                onClick={() => setMode("polygon")}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${
                  mode === "polygon"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🔷 Polygon
              </button>
              {(mode === "polygon" || mode === "box") && (
                <span className="ml-2 text-xs text-gray-500 flex items-center">
                  {mode === "polygon" && `Click to add points, double-click to finish (min ${ANNOTATION_CONFIG.MIN_POLYGON_POINTS})`}
                  {mode === "box" && "Click and drag to draw a bounding box"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveAnnotations}
              disabled={annotations.length - savedAnnotationCount === 0}
              className={`w-32 py-2 text-sm rounded-lg font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                annotations.length - savedAnnotationCount === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save ({annotations.length - savedAnnotationCount})
            </button>
            <button
              onClick={clearAllAnnotations}
              className="w-28 py-2 text-sm rounded-lg font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
            <AnnotationDownloader imageId={image.image_id} showError={showError} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-full shadow-2xl rounded-lg border-2 border-gray-300 select-none ${
              mode !== "none" ? "cursor-crosshair" : "cursor-default"
            }`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* Annotations Sidebar */}
        {annotations.length > 0 && (
          <div className="w-64 bg-white/80 backdrop-blur-sm border-l border-purple-200 flex flex-col">
            <div className="px-4 py-3 border-b border-purple-200 bg-white/50">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Annotations ({annotations.length})
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {annotations.map((ann, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedAnnotationIndex(index)}
                  className={`group p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    index === selectedAnnotationIndex
                      ? "bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-400 shadow-md"
                      : "bg-white hover:bg-gray-50 border border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-lg">{ann.type === 'box' ? '📦' : '🔷'}</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase">{ann.type}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{ann.label}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(index);
                      }}
                      className="flex-shrink-0 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog for Clear All */}
      <ConfirmDialog
        isOpen={showClearDialog}
        title="Delete All Annotations?"
        message={`Are you sure you want to delete all ${annotations.length} annotation(s)? This action cannot be undone and will be saved immediately.`}
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        confirmText="Delete All"
        cancelText="Cancel"
        danger={true}
      />

      {/* Input Dialog for Annotation Labels */}
      <InputDialog
        isOpen={showInputDialog}
        title={`Enter Label for ${pendingAnnotation?.type === 'box' ? 'Box' : 'Polygon'}`}
        message="Add a descriptive label to identify this annotation"
        placeholder="e.g., person, car, building..."
        onConfirm={handleLabelConfirm}
        onCancel={handleLabelCancel}
        confirmText="Create"
        cancelText="Cancel"
      />
    </div>
  );
}
