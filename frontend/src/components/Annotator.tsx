import React, { useEffect, useRef, useState } from "react";
import { Annotation, Box, Polygon, ImageMeta } from "../types";
import axios from "axios";

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
  }, [image, annotations, mode, currentPolygon, startPoint, mousePos]);

  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [image, initialAnnotations]);

  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
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
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode !== "polygon") return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.detail === 2) {
      // Double click: finish polygon
      const label = window.prompt("Enter label for this polygon:", "");
      if (!label) return; // Don't add if no label

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
    const rect = canvasRef.current!.getBoundingClientRect();
    setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mode !== "box" || !startPoint) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x2 = e.clientX - rect.left;
    const y2 = e.clientY - rect.top;

    const w = Math.abs(x2 - startPoint.x);
    const h = Math.abs(y2 - startPoint.y);

    if (w < 5 || h < 5) {
      setStartPoint(null);
      return;
    }

    const label = window.prompt("Enter label for this box:", "");
    if (!label) {
      setStartPoint(null);
      setMode("none");
      return;
    }

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

    try {
      await axios.post("/api/annotations", cleaned);
    } catch (error: any) {
      console.error(error.response?.data); // <-- Add this line
    }

    onSave(cleaned);
  };

  return (
    <div>
      <h3>Drawing Mode: {mode}</h3>
      <button onClick={() => setMode("box")}>Draw Box</button>
      <button onClick={() => setMode("polygon")}>Draw Polygon</button>
      <button onClick={saveAnnotations}>💾 Save Annotations</button>

      <canvas
        ref={canvasRef}
        style={{ border: "1px solid black", marginTop: "10px", cursor: mode !== "none" ? "crosshair" : "default" }}
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
