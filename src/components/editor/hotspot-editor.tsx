"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Circle, Group, Transformer } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import type { Hotspot, ShoppableImage } from "@/types";
import { clamp01, pixelsToNormalized } from "@/lib/coordinates";

const CANVAS_WIDTH = 480;

type SaveState = "saved" | "saving" | "unsaved" | "error";

export function HotspotEditor({
  image,
  initialHotspots,
}: {
  image: ShoppableImage;
  initialHotspots: Hotspot[];
}) {
  const [hotspots, setHotspots] = useState(initialHotspots);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [showAddForm, setShowAddForm] = useState(false);
  const [bgImage] = useImage(image.imageUrl);

  const canvasHeight = Math.round((CANVAS_WIDTH * image.imageHeight) / image.imageWidth);
  const scale = CANVAS_WIDTH / image.imageWidth;

  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Record<string, Konva.Circle | null>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedId && transformerRef.current && shapeRefs.current[selectedId]) {
      transformerRef.current.nodes([shapeRefs.current[selectedId]!]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current?.nodes([]);
    }
  }, [selectedId]);

  const scheduleSave = useCallback((hotspot: Hotspot) => {
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
          }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 900);
  }, []);

  function updateHotspot(id: string, patch: Partial<Hotspot>) {
    setHotspots((prev) => {
      const next = prev.map((h) => (h._id === id ? { ...h, ...patch } : h));
      const updated = next.find((h) => h._id === id);
      if (updated) scheduleSave(updated);
      return next;
    });
  }

  async function deleteSelected() {
    if (!selectedId) return;
    const id = selectedId;
    setHotspots((prev) => prev.filter((h) => h._id !== id));
    setSelectedId(null);
    await fetch(`/api/hotspots/${id}`, { method: "DELETE" });
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_260px]">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <ToolButton active={!showAddForm} label="Select" onClick={() => setShowAddForm(false)} />
          <ToolButton active={showAddForm} label="Add Product" onClick={() => setShowAddForm(true)} />
          <button
            onClick={deleteSelected}
            disabled={!selectedId}
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

        <div className="overflow-hidden rounded-xl border border-brown/10 bg-brown/5" style={{ width: CANVAS_WIDTH }}>
          <Stage
            width={CANVAS_WIDTH}
            height={canvasHeight}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
          >
            <Layer>
              {bgImage && <KonvaImage image={bgImage} width={CANVAS_WIDTH} height={canvasHeight} />}

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
                        fill="#5A3D2B"
                        stroke="#FDF9E3"
                        strokeWidth={2}
                        opacity={0.9}
                        draggable
                        onClick={() => setSelectedId(hotspot._id)}
                        onTap={() => setSelectedId(hotspot._id)}
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
          Scale: {(scale * 100).toFixed(0)}% of source ({image.imageWidth}×{image.imageHeight}px). Drag a dot to
          move it, corner handles to resize, the top handle to rotate — the small yellow dot shows which way it
          faces.
        </p>
      </div>

      <div>
        {showAddForm ? (
          <AddProductForm
            shoppableImageId={image._id}
            onCreated={(hotspot) => {
              setHotspots((prev) => [...prev, hotspot]);
              setShowAddForm(false);
              setSelectedId(hotspot._id);
            }}
          />
        ) : selectedId ? (
          <SelectedHotspotDetails
            hotspot={hotspots.find((h) => h._id === selectedId) ?? null}
            onRotate={(rotation) => selectedId && updateHotspot(selectedId, { rotation })}
          />
        ) : (
          <p className="text-sm text-brown-soft">Select a hotspot to see its details, or add a new product.</p>
        )}
      </div>
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

function SelectedHotspotDetails({
  hotspot,
  onRotate,
}: {
  hotspot: Hotspot | null;
  onRotate: (rotation: number) => void;
}) {
  if (!hotspot) return null;
  return (
    <div className="rounded-xl border border-brown/10 bg-white/40 p-4 text-sm">
      <p className="font-semibold text-brown">{hotspot.title}</p>
      {hotspot.description && <p className="mt-1 text-brown-soft">{hotspot.description}</p>}
      <p className="mt-2 break-all text-xs text-brown-soft">{hotspot.affiliateUrl}</p>

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

function AddProductForm({
  shoppableImageId,
  onCreated,
}: {
  shoppableImageId: string;
  onCreated: (hotspot: Hotspot) => void;
}) {
  const [title, setTitle] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/hotspots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shoppableImageId,
        title,
        affiliateUrl,
        productPrice: price ? Number(price) : undefined,
        logoUrl: "/seed/badge-tag.svg",
        x: 0.5,
        y: 0.5,
        width: 0.08,
        height: 0.08,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Check the affiliate URL and try again.");
      return;
    }

    onCreated(await res.json());
    setTitle("");
    setAffiliateUrl("");
    setPrice("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-brown/10 bg-white/40 p-4 text-sm">
      <p className="font-semibold text-brown">Add a product</p>
      <label className="block">
        <span className="mb-1 block text-xs text-brown-soft">Product name</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-brown/20 bg-cream px-2.5 py-1.5 outline-none focus:border-orange"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-brown-soft">Affiliate URL</span>
        <input
          required
          type="url"
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-brown/20 bg-cream px-2.5 py-1.5 outline-none focus:border-orange"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-brown-soft">Price (optional, IDR)</span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-lg border border-brown/20 bg-cream px-2.5 py-1.5 outline-none focus:border-orange"
        />
      </label>
      {error && <p className="text-xs text-orange">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-orange px-3 py-2 text-xs font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Adding…" : "Add to photo"}
      </button>
      <p className="text-[11px] text-brown-soft">It&apos;ll drop in the middle — drag it onto the right spot after.</p>
    </form>
  );
}
