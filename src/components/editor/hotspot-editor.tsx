"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Circle, Arrow, Text, Group, Transformer } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import type { Annotation, ArrowStyle, Category, FontChoice, Hotspot, ShoppableImage } from "@/types";
import { clamp01, pixelsToNormalized } from "@/lib/coordinates";
import { buildArrowPoints, toFlatPoints } from "@/lib/arrow-shapes";
import { AddProductModal } from "@/components/editor/add-product-modal";
import { CategoryChipPicker } from "@/components/admin/category-chip-picker";
import { fontFamilyFor } from "@/lib/fonts";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";
import { format } from "@/lib/i18n/dictionaries";

const MAX_CANVAS_WIDTH = 480;
const MIN_CANVAS_WIDTH = 220;
const ARROW_COLORS = ["#5A3D2B", "#E5781E", "#FBBA00", "#2B1E17", "#FDF9E3"];
const FONT_CHOICES: FontChoice[] = ["Manrope", "Caveat", "Playfair Display", "Bebas Neue"];

type SaveState = "saved" | "saving" | "unsaved" | "error";
type Tool = "select" | "add-product" | "add-arrow" | "add-text";
type Selection = { kind: "hotspot" | "arrow" | "text"; id: string } | null;

export function HotspotEditor({
  image,
  initialHotspots,
  initialAnnotations,
  categories,
}: {
  image: ShoppableImage;
  initialHotspots: Hotspot[];
  initialAnnotations: Annotation[];
  categories: Category[];
}) {
  const t = useAdminDictionary();
  const [hotspots, setHotspots] = useState(initialHotspots);
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [selected, setSelected] = useState<Selection>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [tool, setTool] = useState<Tool>("select");
  const [arrowStyle, setArrowStyle] = useState<ArrowStyle>("straight");
  const [arrowColor, setArrowColor] = useState(ARROW_COLORS[0]);
  const [arrowWidth, setArrowWidth] = useState(4);
  const [textFont, setTextFont] = useState<FontChoice>("Manrope");
  const [textColor, setTextColor] = useState(ARROW_COLORS[0]);
  const [drawing, setDrawing] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [bgImage] = useImage(image.imageUrl);

  // Responsive canvas: shrinks to fit narrow (mobile) viewports instead of
  // overflowing the page at a fixed 480px width.
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(MAX_CANVAS_WIDTH);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setCanvasWidth(Math.max(MIN_CANVAS_WIDTH, Math.min(MAX_CANVAS_WIDTH, Math.floor(width))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const canvasHeight = Math.round((canvasWidth * image.imageHeight) / image.imageWidth);
  const scale = canvasWidth / image.imageWidth;

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
            title: hotspot.title,
            affiliateUrl: hotspot.affiliateUrl,
            productPrice: hotspot.productPrice,
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            rotation: hotspot.rotation,
            color: hotspot.color,
            categoryIds: hotspot.categoryIds,
          }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 900);
  }, []);

  const scheduleSaveAnnotation = useCallback(
    (annotation: Annotation) => {
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
              color: annotation.color,
              ...(annotation.kind === "arrow"
                ? {
                    x1: annotation.x1,
                    y1: annotation.y1,
                    x2: annotation.x2,
                    y2: annotation.y2,
                    strokeWidth: annotation.strokeWidth,
                    style: annotation.style,
                  }
                : {
                    text: annotation.text,
                    fontFamily: annotation.fontFamily,
                    fontSize: annotation.fontSize,
                    x: annotation.x,
                    y: annotation.y,
                  }),
            }),
          });
          setSaveState(res.ok ? "saved" : "error");
        } catch {
          setSaveState("error");
        }
      }, 900);
    },
    [image._id]
  );

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
    return pixelsToNormalized({ x: pos.x, y: pos.y, width: 0, height: 0 }, canvasWidth, canvasHeight);
  }

  async function finishDrawing() {
    if (!drawing) return;
    const payload = {
      kind: "arrow" as const,
      shoppableImageId: image._id,
      style: arrowStyle,
      color: arrowColor,
      strokeWidth: arrowWidth / canvasWidth,
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

  async function placeText(stage: Konva.Stage) {
    const p = stagePointToNormalized(stage);
    setTool("select");
    if (!p) return;

    const res = await fetch("/api/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "text",
        shoppableImageId: image._id,
        text: t.editor.newText,
        fontFamily: textFont,
        fontSize: 24 / canvasWidth,
        color: textColor,
        x: clamp01(p.x),
        y: clamp01(p.y),
      }),
    });
    if (res.ok) {
      const annotation = await res.json();
      setAnnotations((prev) => [...prev, annotation]);
      setSelected({ kind: "text", id: annotation._id });
    }
  }

  const arrows = annotations.filter((a) => a.kind === "arrow");
  const texts = annotations.filter((a) => a.kind === "text");
  const cursor = tool === "add-arrow" || tool === "add-text" ? "crosshair" : "default";

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,480px)_260px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ToolButton active={tool === "select"} label={t.editor.tools.select} onClick={() => setTool("select")} />
          <ToolButton active={tool === "add-product"} label={t.editor.tools.addProduct} onClick={() => setTool("add-product")} />
          <ToolButton active={tool === "add-arrow"} label={t.editor.tools.addArrow} onClick={() => setTool("add-arrow")} />
          <ToolButton active={tool === "add-text"} label={t.editor.tools.addText} onClick={() => setTool("add-text")} />
          <button
            onClick={deleteSelected}
            disabled={!selected}
            className="rounded-full border border-brown/20 px-3 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-orange disabled:opacity-40"
          >
            {t.common.delete}
          </button>
          <span className="ml-auto text-xs text-brown-soft">{t.editor.state[saveState]}</span>
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

        {tool === "add-text" && (
          <TextToolbar font={textFont} onFont={setTextFont} color={textColor} onColor={setTextColor} />
        )}

        <div
          ref={containerRef}
          className="w-full max-w-[480px] overflow-hidden rounded-xl border border-brown/10 bg-brown/5"
        >
          <Stage
            width={canvasWidth}
            height={canvasHeight}
            style={{ cursor }}
            onMouseDown={(e) => {
              if (tool === "add-arrow") {
                const p = stagePointToNormalized(e.target.getStage()!);
                if (p) setDrawing({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
                return;
              }
              if (tool === "add-text") return;
              if (e.target === e.target.getStage()) setSelected(null);
            }}
            onMouseMove={(e) => {
              if (tool === "add-arrow" && drawing) {
                const p = stagePointToNormalized(e.target.getStage()!);
                if (p) setDrawing((d) => (d ? { ...d, x2: p.x, y2: p.y } : d));
              }
            }}
            onMouseUp={(e) => {
              if (tool === "add-arrow" && drawing) finishDrawing();
              if (tool === "add-text") placeText(e.target.getStage()!);
            }}
          >
            <Layer>
              {bgImage && <KonvaImage image={bgImage} width={canvasWidth} height={canvasHeight} />}

              {arrows.map((a) => {
                const points = toFlatPoints(
                  buildArrowPoints(a.style!, { x: a.x1!, y: a.y1! }, { x: a.x2!, y: a.y2! })
                ).map((v, i) => (i % 2 === 0 ? v * canvasWidth : v * canvasHeight));
                const strokeWidthPx = a.strokeWidth! * canvasWidth;

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
                          x={a.x1! * canvasWidth}
                          y={a.y1! * canvasHeight}
                          radius={6}
                          fill="#FDF9E3"
                          stroke={a.color}
                          strokeWidth={2}
                          draggable
                          onDragMove={(e) => {
                            const p = pixelsToNormalized(
                              { x: e.target.x(), y: e.target.y(), width: 0, height: 0 },
                              canvasWidth,
                              canvasHeight
                            );
                            updateAnnotation(a._id, { x1: clamp01(p.x), y1: clamp01(p.y) });
                          }}
                        />
                        <Circle
                          x={a.x2! * canvasWidth}
                          y={a.y2! * canvasHeight}
                          radius={6}
                          fill={a.color}
                          stroke="#FDF9E3"
                          strokeWidth={2}
                          draggable
                          onDragMove={(e) => {
                            const p = pixelsToNormalized(
                              { x: e.target.x(), y: e.target.y(), width: 0, height: 0 },
                              canvasWidth,
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
                  ).map((v, i) => (i % 2 === 0 ? v * canvasWidth : v * canvasHeight))}
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

              {texts.map((t) => (
                <Text
                  key={t._id}
                  x={t.x! * canvasWidth}
                  y={t.y! * canvasHeight}
                  text={t.text}
                  fontFamily={fontFamilyFor(t.fontFamily)}
                  fontSize={t.fontSize! * canvasWidth}
                  fontStyle={t.fontFamily === "Manrope" ? "700" : "normal"}
                  fill={t.color}
                  draggable={tool === "select"}
                  onClick={() => tool === "select" && setSelected({ kind: "text", id: t._id })}
                  onTap={() => tool === "select" && setSelected({ kind: "text", id: t._id })}
                  onDragMove={(e) => {
                    const p = pixelsToNormalized(
                      { x: e.target.x(), y: e.target.y(), width: 0, height: 0 },
                      canvasWidth,
                      canvasHeight
                    );
                    updateAnnotation(t._id, { x: clamp01(p.x), y: clamp01(p.y) });
                  }}
                />
              ))}

              {hotspots
                .filter((h) => h.isActive)
                .map((hotspot) => {
                  const cx = hotspot.x * canvasWidth;
                  const cy = hotspot.y * canvasHeight;
                  const radius = (hotspot.width * canvasWidth) / 2;
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
                            canvasWidth,
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
                          const widthNorm = clamp01((newRadius * 2) / canvasWidth);
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
                // On a small mobile canvas, a hotspot's own radius can be
                // tiny — without this gap the resize/rotate handles sit
                // right on top of (or inside) the marker's own drag hit
                // area, so a finger aiming to move it easily grabs a handle
                // instead and resizes/rotates it by accident.
                padding={16}
                anchorSize={16}
                anchorCornerRadius={8}
                rotateAnchorOffset={36}
              />
            </Layer>
          </Stage>
        </div>
        <p className="mt-2 text-xs text-brown-soft">
          {format(t.editor.scale, { pct: (scale * 100).toFixed(0), w: image.imageWidth, h: image.imageHeight })}{" "}
          {tool === "add-arrow" ? t.editor.hintArrow : tool === "add-text" ? t.editor.hintText : t.editor.hintSelect}
        </p>
      </div>

      <div className="min-w-0">
        {selected?.kind === "hotspot" ? (
          <SelectedHotspotDetails
            hotspot={hotspots.find((h) => h._id === selected.id) ?? null}
            categories={categories}
            onEdit={(patch) => updateHotspot(selected.id, patch)}
            onToggleCategory={(categoryId) => {
              const hotspot = hotspots.find((h) => h._id === selected.id);
              if (!hotspot) return;
              const current = hotspot.categoryIds ?? [];
              const next = current.includes(categoryId)
                ? current.filter((c) => c !== categoryId)
                : [...current, categoryId];
              updateHotspot(selected.id, { categoryIds: next });
            }}
          />
        ) : selected?.kind === "arrow" ? (
          <SelectedArrowDetails
            annotation={annotations.find((a) => a._id === selected.id) ?? null}
            canvasWidth={canvasWidth}
            onColor={(color) => updateAnnotation(selected.id, { color })}
            onWidth={(px) => updateAnnotation(selected.id, { strokeWidth: px / canvasWidth })}
          />
        ) : selected?.kind === "text" ? (
          <SelectedTextDetails
            annotation={annotations.find((a) => a._id === selected.id) ?? null}
            canvasWidth={canvasWidth}
            onText={(text) => updateAnnotation(selected.id, { text })}
            onFont={(fontFamily) => updateAnnotation(selected.id, { fontFamily })}
            onColor={(color) => updateAnnotation(selected.id, { color })}
            onSize={(px) => updateAnnotation(selected.id, { fontSize: px / canvasWidth })}
          />
        ) : (
          <p className="text-sm text-brown-soft">{t.editor.empty}</p>
        )}
      </div>

      {tool === "add-product" && (
        <AddProductModal
          shoppableImageId={image._id}
          categories={categories}
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
  const t = useAdminDictionary();
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
        aria-label={t.common.customColor}
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
  const t = useAdminDictionary();
  const styles: ArrowStyle[] = ["straight", "curved", "spiral"];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 rounded-xl border border-brown/10 bg-surface/70 p-3">
      <div className="flex items-center gap-1">
        {styles.map((s) => (
          <button
            key={s}
            onClick={() => onStyle(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              style === s ? "bg-brown text-cream" : "border border-brown/20 text-brown-soft hover:text-brown"
            }`}
          >
            {t.editor.arrowStyles[s]}
          </button>
        ))}
      </div>
      <ColorSwatches value={color} onChange={onColor} />
      <label className="flex items-center gap-2 text-xs text-brown-soft">
        {t.common.size}
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

function FontSelect({ value, onChange }: { value: FontChoice; onChange: (f: FontChoice) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FontChoice)}
      className="rounded-full border border-brown/20 bg-cream px-3 py-1.5 text-xs text-brown outline-none focus:border-orange"
      style={{ fontFamily: fontFamilyFor(value) }}
    >
      {FONT_CHOICES.map((f) => (
        <option key={f} value={f} style={{ fontFamily: fontFamilyFor(f) }}>
          {f}
        </option>
      ))}
    </select>
  );
}

function TextToolbar({
  font,
  onFont,
  color,
  onColor,
}: {
  font: FontChoice;
  onFont: (f: FontChoice) => void;
  color: string;
  onColor: (c: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 rounded-xl border border-brown/10 bg-surface/70 p-3">
      <FontSelect value={font} onChange={onFont} />
      <ColorSwatches value={color} onChange={onColor} />
    </div>
  );
}

function SelectedHotspotDetails({
  hotspot,
  categories,
  onEdit,
  onToggleCategory,
}: {
  hotspot: Hotspot | null;
  categories: Category[];
  onEdit: (patch: Partial<Hotspot>) => void;
  onToggleCategory: (categoryId: string) => void;
}) {
  const t = useAdminDictionary();
  if (!hotspot) return null;
  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4 text-sm">
      <label className="block">
        <span className="mb-1 block text-xs text-brown-soft">{t.editor.productName}</span>
        <input
          value={hotspot.title}
          onChange={(e) => onEdit({ title: e.target.value })}
          className="w-full rounded-lg border border-brown/20 bg-cream px-2.5 py-1.5 text-sm outline-none focus:border-orange"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs text-brown-soft">{t.editor.affiliateUrl}</span>
        <input
          value={hotspot.affiliateUrl}
          onChange={(e) => onEdit({ affiliateUrl: e.target.value })}
          className="w-full rounded-lg border border-brown/20 bg-cream px-2.5 py-1.5 text-xs text-brown outline-none focus:border-orange"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs text-brown-soft">{t.editor.price}</span>
        <input
          type="number"
          value={hotspot.productPrice ?? ""}
          onChange={(e) => onEdit({ productPrice: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded-lg border border-brown/20 bg-cream px-2.5 py-1.5 text-sm outline-none focus:border-orange"
        />
      </label>

      <div className="mt-4">
        <span className="mb-1 block text-xs text-brown-soft">{t.editor.markerColor}</span>
        <ColorSwatches value={hotspot.color} onChange={(color) => onEdit({ color })} />
      </div>

      {categories.length > 0 && (
        <div className="mt-4">
          <span className="mb-1 block text-xs text-brown-soft">{t.common.categories}</span>
          <CategoryChipPicker categories={categories} selectedIds={hotspot.categoryIds} onToggle={onToggleCategory} />
        </div>
      )}

      <label className="mt-4 block">
        <span className="mb-1 flex items-center justify-between text-xs text-brown-soft">
          <span>{t.editor.rotation}</span>
          <span>{Math.round(hotspot.rotation)}°</span>
        </span>
        <input
          type="range"
          min={0}
          max={359}
          value={Math.round(hotspot.rotation)}
          onChange={(e) => onEdit({ rotation: Number(e.target.value) })}
          className="w-full accent-orange"
        />
      </label>
      <p className="mt-1 text-[11px] text-brown-soft">{t.editor.rotateHint}</p>
    </div>
  );
}

function SelectedArrowDetails({
  annotation,
  canvasWidth,
  onColor,
  onWidth,
}: {
  annotation: Annotation | null;
  canvasWidth: number;
  onColor: (color: string) => void;
  onWidth: (px: number) => void;
}) {
  const t = useAdminDictionary();
  if (!annotation) return null;
  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4 text-sm">
      <p className="font-semibold text-brown">
        {format(t.editor.arrowTitle, { style: t.editor.arrowStyles[annotation.style ?? "straight"] })}
      </p>
      <p className="mt-1 text-xs text-brown-soft">{t.editor.arrowHint}</p>

      <div className="mt-4">
        <span className="mb-1 block text-xs text-brown-soft">{t.common.color}</span>
        <ColorSwatches value={annotation.color} onChange={onColor} />
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs text-brown-soft">{t.editor.thickness}</span>
        <input
          type="range"
          min={2}
          max={12}
          value={Math.round(annotation.strokeWidth! * canvasWidth)}
          onChange={(e) => onWidth(Number(e.target.value))}
          className="w-full accent-orange"
        />
      </label>
    </div>
  );
}

function SelectedTextDetails({
  annotation,
  canvasWidth,
  onText,
  onFont,
  onColor,
  onSize,
}: {
  annotation: Annotation | null;
  canvasWidth: number;
  onText: (text: string) => void;
  onFont: (f: FontChoice) => void;
  onColor: (color: string) => void;
  onSize: (px: number) => void;
}) {
  const t = useAdminDictionary();
  if (!annotation) return null;
  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4 text-sm">
      <label className="block">
        <span className="mb-1 block text-xs text-brown-soft">{t.editor.text}</span>
        <input
          value={annotation.text}
          onChange={(e) => onText(e.target.value)}
          className="w-full rounded-lg border border-brown/20 bg-cream px-2.5 py-1.5 text-sm outline-none focus:border-orange"
          style={{ fontFamily: fontFamilyFor(annotation.fontFamily) }}
        />
      </label>

      <div className="mt-4">
        <span className="mb-1 block text-xs text-brown-soft">{t.editor.font}</span>
        <FontSelect value={annotation.fontFamily!} onChange={onFont} />
      </div>

      <div className="mt-4">
        <span className="mb-1 block text-xs text-brown-soft">{t.common.color}</span>
        <ColorSwatches value={annotation.color} onChange={onColor} />
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs text-brown-soft">{t.common.size}</span>
        <input
          type="range"
          min={12}
          max={64}
          value={Math.round(annotation.fontSize! * canvasWidth)}
          onChange={(e) => onSize(Number(e.target.value))}
          className="w-full accent-orange"
        />
      </label>
      <p className="mt-1 text-[11px] text-brown-soft">{t.editor.textHint}</p>
    </div>
  );
}
