import React, { useEffect, useRef, useState } from "react";
import { Annotation, Box, Polygon, ImageMeta } from "../types";
import "./Annotator.css";

type Mode = "none" | "box" | "polygon";

export default function Annotator({
  image,
  onSave,
  initialAnnotations = []
}: {
  image: ImageMeta;
  onSave: (annotations: Annotation[]) => void;
  initialAnnotations?: Annotation[]; // <-- add this line
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>("none");
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const drawAnnotations = React.useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 10;  // Thick lines to see on large scale images
    annotations.forEach((ann) => {
      if (ann.type === "box") {
        ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
      } else if (ann.type === "polygon") {
        ctx.beginPath();
        ann.points.forEach(([x, y], idx) => {
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
      }
    });

    // Draw in-progress polygon
    if (mode === "polygon" && currentPolygon.length > 0) {
      ctx.strokeStyle = "blue";
      ctx.beginPath();
      currentPolygon.forEach(([x, y], idx) => {
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      if (mousePos) {
        ctx.lineTo(mousePos.x, mousePos.y);
      }
      ctx.stroke();
    }

    // Draw in-progress box
    if (mode === "box" && startPoint && mousePos) {
      ctx.strokeStyle = "blue";
      ctx.strokeRect(
        Math.min(startPoint.x, mousePos.x),
        Math.min(startPoint.y, mousePos.y),
        Math.abs(mousePos.x - startPoint.x),
        Math.abs(mousePos.y - startPoint.y)
      );
    }
  }, [annotations, mode, currentPolygon, mousePos, startPoint]);

  useEffect(() => {
    const img = new Image();
    img.src = `http://localhost:8000${image.url}`;
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
  }, [image, annotations, mode, currentPolygon, startPoint, mousePos, drawAnnotations]);

  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [image, initialAnnotations]);

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
      const label = window.prompt("Enter label for this polygon:", "");
      if (label === null) { // Cancel pressed
        setCurrentPolygon([]);
        setMode("none");
        return;
      }

      // If label is empty, it will be set as ""
      const poly: Polygon = {
        type: "polygon",
        points: currentPolygon,
        label
      };
      setAnnotations([...annotations, poly]);
      setCurrentPolygon([]);
      setMode("none");
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

    if (w < 5 || h < 5) {
      setStartPoint(null);
      return;
    }

    const label = window.prompt("Enter label for this box:", "");
    if (label === null) { // Cancel pressed
      setStartPoint(null);
      setMode("none");
      return;
    }

    // If label is empty, it will be set as ""
    const box: Box = {
      type: "box",
      x: Math.min(startPoint.x, x2),
      y: Math.min(startPoint.y, y2),
      w,
      h,
      label
    };

    setAnnotations([...annotations, box]);
    setStartPoint(null);
    setMode("none");
  };

  const saveAnnotations = async () => {
    const cleaned: Annotation[] = annotations.map((a) => {
      if (a.type === "box") {
        return {
          type: "box" as const,
          x: Math.round(a.x),
          y: Math.round(a.y),
          w: Math.round(a.w),
          h: Math.round(a.h),
          label: a.label // <-- include label
        };
      } else if (a.type === "polygon") {
        return {
          type: "polygon" as const,
          points: a.points.map(([x, y]) => [Math.round(x), Math.round(y)]),
          label: a.label // <-- include label
        };
      }
      
      return a;
    });

    onSave(cleaned);
  };

  return (
    <div>
    <div className={"toolbar"}>
      <h3>Drawing Mode: {mode}</h3>
      <button onClick={() => setMode("box")}>Draw Box</button>
      <button onClick={() => setMode("polygon")}>Draw Polygon</button>
      <button onClick={saveAnnotations}>💾 Save Annotations</button>
    </div>

    <canvas
    ref={canvasRef}
    style={{
    width: "1200px",
    height: "675px",
    display: "block",
    margin: "40px auto",
    border: "2px solid #444",
    borderRadius: "10px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
    cursor: mode !== "none" ? "crosshair" : "default",
    backgroundColor: "#fff",
    }}
    onMouseDown={handleMouseDown}
    onMouseUp={handleMouseUp}
    onClick={handleCanvasClick}
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
    />
    {mode === "polygon" && (
      <p>Click to add points. Double-click to finish.</p>
    )}
  </div>
  );
}
