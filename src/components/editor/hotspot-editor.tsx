"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Circle, Arrow, Group, Transformer } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import type { Annotation, ArrowStyle, Hotspot, ShoppableImage } from "@/types";
import { clamp01, pixelsToNormalized } from "@/lib/coordinates";
import { buildArrowPoints, toFlatPoints } from "@/lib/arrow-shapes";
import { AddProductModal } from "@/components/editor/add-product-modal";

const CANVAS_WIDTH = 480;
const ARROW_COLORS = ["#5A3D2B", "#E5781E", "#FBBA00", "#2B1E17", "#FDF9E3"];

type SaveState = "saved" | "saving" | "unsaved" | "error";
type Tool = "select" | "add-product" | "add-arrow";
type Selection = { kind: "hotspot" | "arrow"; id: string } | null;

export function HotspotEditor({
  image,
  initialHotspots,
  initialAnnotations,
}: {
  image: ShoppableImage;
  initialHotspots: Hotspot[];
  initialAnnotations: Annotation[];
}) {
  const [hotspots, setHotspots] = useState(initialHotspots);
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [selected, setSelected] = useState<Selection>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [tool, setTool] = useState<Tool>("select");
  const [arrowStyle, setArrowStyle] = useState<ArrowStyle>("straight");
  const [arrowColor, setArrowColor] = useState(ARROW_COLORS[0]);
  const [arrowWidth, setArrowWidth] = useState(4);
  const [drawing, setDrawing] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [bgImage] = useImage(image.imageUrl);

  const canvasHeight = Math.round((CANVAS_WIDTH * image.imageHeight) / image.imageWidth);
  const scale = CANVAS_WIDTH / image.imageWidth;

  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Record<string, Konva.Circle | null>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected?.kind === "hotspot" && transformerRef.current && shapeRefs.current[selected.id]) {
      transformerRef.current.nodes([shapeRefs.current[selected.id]!]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current?.nodes([]);
    }
  }, [selected]);

  const scheduleSaveHotspot = useCallback((hotspot: Hotspot) => {
    setSaveState("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/hotspots/${hotspot._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            rotation: hotspot.rotation,
            color: hotspot.color,
          }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 900);
  }, []);

  const scheduleSaveAnnotation = useCallback((annotation: Annotation) => {
    setSaveState("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/annotations/${annotation._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shoppableImageId: image._id,
            x1: annotation.x1,
            y1: annotation.y1,
            x2: annotation.x2,
            y2: annotation.y2,
            color: annotation.color,
            strokeWidth: annotation.strokeWidth,
            style: annotation.style,
          }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 900);
  }, [image._id]);

  function updateHotspot(id: string, patch: Partial<Hotspot>) {
    setHotspots((prev) => {
      const next = prev.map((h) => (h._id === id ? { ...h, ...patch } : h));
      const updated = next.find((h) => h._id === id);
      if (updated) scheduleSaveHotspot(updated);
      return next;
    });
  }

  function updateAnnotation(id: string, patch: Partial<Annotation>) {
    setAnnotations((prev) => {
      const next = prev.map((a) => (a._id === id ? { ...a, ...patch } : a));
      const updated = next.find((a) => a._id === id);
      if (updated) scheduleSaveAnnotation(updated);
      return next;
    });
  }

  async function deleteSelected() {
    if (!selected) return;
    if (selected.kind === "hotspot") {
      setHotspots((prev) => prev.filter((h) => h._id !== selected.id));
      await fetch(`/api/hotspots/${selected.id}`, { method: "DELETE" });
    } else {
      setAnnotations((prev) => prev.filter((a) => a._id !== selected.id));
      await fetch(`/api/annotations/${selected.id}`, { method: "DELETE" });
    }
    setSelected(null);
  }

  function stagePointToNormalized(stage: Konva.Stage) {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return pixelsToNormalized({ x: pos.x, y: pos.y, width: 0, height: 0 }, CANVAS_WIDTH, canvasHeight);
  }

  async function finishDrawing() {
    if (!drawing) return;
    const payload = {
      shoppableImageId: image._id,
      style: arrowStyle,
      color: arrowColor,
      strokeWidth: arrowWidth / CANVAS_WIDTH,
      x1: clamp01(drawing.x1),
      y1: clamp01(drawing.y1),
      x2: clamp01(drawing.x2),
      y2: clamp01(drawing.y2),
    };
    setDrawing(null);
    setTool("select");

    // Ignore accidental clicks with no real drag.
    if (Math.hypot(payload.x2 - payload.x1, payload.y2 - payload.y1) < 0.01) return;

    const res = await fetch("/api/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const annotation = await res.json();
      setAnnotations((prev) => [...prev, annotation]);
      setSelected({ kind: "arrow", id: annotation._id });
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_260px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ToolButton active={tool === "select"} label="Select" onClick={() => setTool("select")} />
          <ToolButton active={tool === "add-product"} label="Add Product" onClick={() => setTool("add-product")} />
          <ToolButton active={tool === "add-arrow"} label="Add Arrow" onClick={() => setTool("add-arrow")} />
          <button
            onClick={deleteSelected}
            disabled={!selected}
            className="rounded-full border border-brown/20 px-3 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-orange disabled:opacity-40"
          >
            Delete
          </button>
          <span className="ml-auto text-xs text-brown-soft">
            {saveState === "saved" && "Saved"}
            {saveState === "saving" && "Saving…"}
            {saveState === "unsaved" && "Unsaved changes"}
            {saveState === "error" && "Couldn't save"}
          </span>
        </div>

        {tool === "add-arrow" && (
          <ArrowToolbar
            style={arrowStyle}
            onStyle={setArrowStyle}
            color={arrowColor}
            onColor={setArrowColor}
            width={arrowWidth}
            onWidth={setArrowWidth}
          />
        )}

        <div className="overflow-hidden rounded-xl border border-brown/10 bg-brown/5" style={{ width: CANVAS_WIDTH }}>
          <Stage
            width={CANVAS_WIDTH}
            height={canvasHeight}
            style={{ cursor: tool === "add-arrow" ? "crosshair" : "default" }}
            onMouseDown={(e) => {
              if (tool === "add-arrow") {
                const p = stagePointToNormalized(e.target.getStage()!);
                if (p) setDrawing({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
                return;
              }
              if (e.target === e.target.getStage()) setSelected(null);
            }}
            onMouseMove={(e) => {
              if (tool === "add-arrow" && drawing) {
                const p = stagePointToNormalized(e.target.getStage()!);
                if (p) setDrawing((d) => (d ? { ...d, x2: p.x, y2: p.y } : d));
              }
            }}
            onMouseUp={() => {
              if (tool === "add-arrow" && drawing) finishDrawing();
            }}
          >
            <Layer>
              {bgImage && <KonvaImage image={bgImage} width={CANVAS_WIDTH} height={canvasHeight} />}

              {annotations.map((a) => {
                const points = toFlatPoints(
                  buildArrowPoints(a.style, { x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 })
                ).map((v, i) => (i % 2 === 0 ? v * CANVAS_WIDTH : v * canvasHeight));
                const strokeWidthPx = a.strokeWidth * CANVAS_WIDTH;

                return (
                  <Group key={a._id}>
                    <Arrow
                      points={points}
                      stroke={a.color}
                      fill={a.color}
                      strokeWidth={strokeWidthPx}
                      pointerLength={strokeWidthPx * 3}
                      pointerWidth={strokeWidthPx * 3}
                      lineCap="round"
                      hitStrokeWidth={16}
                      onClick={() => tool === "select" && setSelected({ kind: "arrow", id: a._id })}
                      onTap={() => tool === "select" && setSelected({ kind: "arrow", id: a._id })}
                    />
                    {selected?.kind === "arrow" && selected.id === a._id && (
                      <>
                        <Circle
                          x={a.x1 * CANVAS_WIDTH}
                          y={a.y1 * canvasHeight}
                          radius={6}
                          fill="#FDF9E3"
                          stroke={a.color}
                          strokeWidth={2}
                          draggable
                          onDragMove={(e) => {
                            const p = pixelsToNormalized(
                              { x: e.target.x(), y: e.target.y(), width: 0, height: 0 },
                              CANVAS_WIDTH,
                              canvasHeight
                            );
                            updateAnnotation(a._id, { x1: clamp01(p.x), y1: clamp01(p.y) });
                          }}
                        />
                        <Circle
                          x={a.x2 * CANVAS_WIDTH}
                          y={a.y2 * canvasHeight}
                          radius={6}
                          fill={a.color}
                          stroke="#FDF9E3"
                          strokeWidth={2}
                          draggable
                          onDragMove={(e) => {
                            const p = pixelsToNormalized(
                              { x: e.target.x(), y: e.target.y(), width: 0, height: 0 },
                              CANVAS_WIDTH,
                              canvasHeight
                            );
                            updateAnnotation(a._id, { x2: clamp01(p.x), y2: clamp01(p.y) });
                          }}
                        />
                      </>
                    )}
                  </Group>
                );
              })}

              {drawing && (
                <Arrow
                  points={toFlatPoints(
                    buildArrowPoints(arrowStyle, { x: drawing.x1, y: drawing.y1 }, { x: drawing.x2, y: drawing.y2 })
                  ).map((v, i) => (i % 2 === 0 ? v * CANVAS_WIDTH : v * canvasHeight))}
                  stroke={arrowColor}
                  fill={arrowColor}
                  strokeWidth={arrowWidth}
                  pointerLength={arrowWidth * 3}
                  pointerWidth={arrowWidth * 3}
                  lineCap="round"
                  opacity={0.8}
                  listening={false}
                />
              )}

              {hotspots
                .filter((h) => h.isActive)
                .map((hotspot) => {
                  const cx = hotspot.x * CANVAS_WIDTH;
                  const cy = hotspot.y * canvasHeight;
                  const radius = (hotspot.width * CANVAS_WIDTH) / 2;
                  const angleRad = (hotspot.rotation * Math.PI) / 180;

                  return (
                    <Group key={hotspot._id}>
                      <Circle
                        ref={(node) => {
                          shapeRefs.current[hotspot._id] = node;
                        }}
                        x={cx}
                        y={cy}
                        radius={radius}
                        rotation={hotspot.rotation}
                        fill={hotspot.color}
                        stroke="#FDF9E3"
                        strokeWidth={2}
                        opacity={0.9}
                        draggable={tool === "select"}
                        onClick={() => tool === "select" && setSelected({ kind: "hotspot", id: hotspot._id })}
                        onTap={() => tool === "select" && setSelected({ kind: "hotspot", id: hotspot._id })}
                        onDragMove={(e) => {
                          const { x, y } = pixelsToNormalized(
                            { x: e.target.x(), y: e.target.y(), width: 0, height: 0 },
                            CANVAS_WIDTH,
                            canvasHeight
                          );
                          updateHotspot(hotspot._id, { x: clamp01(x), y: clamp01(y) });
                        }}
                        onTransformEnd={(e) => {
                          const node = e.target as unknown as Konva.Circle;
                          const scaleX = node.scaleX();
                          const newRadius = node.radius() * scaleX;
                          const newRotation = Math.round(node.rotation());
                          node.scaleX(1);
                          node.scaleY(1);
                          const widthNorm = clamp01((newRadius * 2) / CANVAS_WIDTH);
                          updateHotspot(hotspot._id, {
                            width: widthNorm,
                            height: widthNorm,
                            rotation: newRotation,
                          });
                        }}
                      />
                      {/* direction indicator so rotation is visible on an otherwise-symmetric circle */}
                      <Circle
                        x={cx + radius * Math.sin(angleRad)}
                        y={cy - radius * Math.cos(angleRad)}
                        radius={3}
                        fill="#FBBA00"
                        listening={false}
                      />
                    </Group>
                  );
                })}

              <Transformer
                ref={transformerRef}
                rotateEnabled
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              />
            </Layer>
          </Stage>
        </div>
        <p className="mt-2 text-xs text-brown-soft">
          Scale: {(scale * 100).toFixed(0)}% of source ({image.imageWidth}×{image.imageHeight}px).{" "}
          {tool === "add-arrow"
            ? "Click and drag on the photo to draw an arrow."
            : "Drag a dot to move it, corner handles to resize, the top handle to rotate."}
        </p>
      </div>

      <div>
        {selected?.kind === "hotspot" ? (
          <SelectedHotspotDetails
            hotspot={hotspots.find((h) => h._id === selected.id) ?? null}
            onRotate={(rotation) => updateHotspot(selected.id, { rotation })}
            onColor={(color) => updateHotspot(selected.id, { color })}
          />
        ) : selected?.kind === "arrow" ? (
          <SelectedArrowDetails
            annotation={annotations.find((a) => a._id === selected.id) ?? null}
            onColor={(color) => updateAnnotation(selected.id, { color })}
            onWidth={(px) => updateAnnotation(selected.id, { strokeWidth: px / CANVAS_WIDTH })}
          />
        ) : (
          <p className="text-sm text-brown-soft">
            Select a hotspot or arrow to see its details, add a new product, or draw an arrow.
          </p>
        )}
      </div>

      {tool === "add-product" && (
        <AddProductModal
          shoppableImageId={image._id}
          onClose={() => setTool("select")}
          onCreated={(hotspot) => {
            setHotspots((prev) => [...prev, hotspot]);
            setTool("select");
            setSelected({ kind: "hotspot", id: hotspot._id });
          }}
        />
      )}
    </div>
  );
}

function ToolButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-brown text-cream" : "border border-brown/20 text-brown-soft hover:text-brown"
      }`}
    >
      {label}
    </button>
  );
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {ARROW_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={c}
          className={`h-6 w-6 rounded-full border-2 ${value === c ? "border-orange" : "border-transparent"}`}
          style={{ background: c }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-6 cursor-pointer rounded-full border border-brown/20 bg-transparent p-0"
        aria-label="Custom color"
      />
    </div>
  );
}

function ArrowToolbar({
  style,
  onStyle,
  color,
  onColor,
  width,
  onWidth,
}: {
  style: ArrowStyle;
  onStyle: (s: ArrowStyle) => void;
  color: string;
  onColor: (c: string) => void;
  width: number;
  onWidth: (w: number) => void;
}) {
  const styles: { value: ArrowStyle; label: string }[] = [
    { value: "straight", label: "Straight" },
    { value: "curved", label: "Curved" },
    { value: "spiral", label: "Spiral" },
  ];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 rounded-xl border border-brown/10 bg-surface/70 p-3">
      <div className="flex items-center gap-1">
        {styles.map((s) => (
          <button
            key={s.value}
            onClick={() => onStyle(s.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              style === s.value ? "bg-brown text-cream" : "border border-brown/20 text-brown-soft hover:text-brown"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <ColorSwatches value={color} onChange={onColor} />
      <label className="flex items-center gap-2 text-xs text-brown-soft">
        Size
        <input
          type="range"
          min={2}
          max={12}
          value={width}
          onChange={(e) => onWidth(Number(e.target.value))}
          className="accent-orange"
        />
      </label>
    </div>
  );
}

function SelectedHotspotDetails({
  hotspot,
  onRotate,
  onColor,
}: {
  hotspot: Hotspot | null;
  onRotate: (rotation: number) => void;
  onColor: (color: string) => void;
}) {
  if (!hotspot) return null;
  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4 text-sm">
      <p className="font-semibold text-brown">{hotspot.title}</p>
      {hotspot.description && <p className="mt-1 text-brown-soft">{hotspot.description}</p>}
      <p className="mt-2 break-all text-xs text-brown-soft">{hotspot.affiliateUrl}</p>

      <div className="mt-4">
        <span className="mb-1 block text-xs text-brown-soft">Marker color</span>
        <ColorSwatches value={hotspot.color} onChange={onColor} />
      </div>

      <label className="mt-4 block">
        <span className="mb-1 flex items-center justify-between text-xs text-brown-soft">
          <span>Rotation</span>
          <span>{Math.round(hotspot.rotation)}°</span>
        </span>
        <input
          type="range"
          min={0}
          max={359}
          value={Math.round(hotspot.rotation)}
          onChange={(e) => onRotate(Number(e.target.value))}
          className="w-full accent-orange"
        />
      </label>
      <p className="mt-1 text-[11px] text-brown-soft">
        Or drag the handle above the hotspot on the canvas to rotate it by hand.
      </p>
    </div>
  );
}

function SelectedArrowDetails({
  annotation,
  onColor,
  onWidth,
}: {
  annotation: Annotation | null;
  onColor: (color: string) => void;
  onWidth: (px: number) => void;
}) {
  if (!annotation) return null;
  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4 text-sm">
      <p className="font-semibold capitalize text-brown">{annotation.style} arrow</p>
      <p className="mt-1 text-xs text-brown-soft">Drag either end to move or resize it.</p>

      <div className="mt-4">
        <span className="mb-1 block text-xs text-brown-soft">Color</span>
        <ColorSwatches value={annotation.color} onChange={onColor} />
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs text-brown-soft">Thickness</span>
        <input
          type="range"
          min={2}
          max={12}
          value={Math.round(annotation.strokeWidth * CANVAS_WIDTH)}
          onChange={(e) => onWidth(Number(e.target.value))}
          className="w-full accent-orange"
        />
      </label>
    </div>
  );
}
