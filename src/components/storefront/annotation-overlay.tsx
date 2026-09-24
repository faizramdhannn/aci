import type { Annotation } from "@/types";
import { buildArrowPoints } from "@/lib/arrow-shapes";
import { fontFamilyFor } from "@/lib/fonts";

/**
 * Renders arrow and text annotations over a shoppable image. Uses a viewBox
 * matching the image's real pixel dimensions (not a stretched 0-1 square) so
 * stroke width, font size, and the arrow's own curvature stay uniform
 * instead of distorting on non-square (e.g. portrait) photos.
 */
export function AnnotationOverlay({
  annotations,
  imageWidth,
  imageHeight,
}: {
  annotations: Annotation[];
  imageWidth: number;
  imageHeight: number;
}) {
  if (annotations.length === 0) return null;

  const arrows = annotations.filter((a) => a.kind === "arrow");
  const texts = annotations.filter((a) => a.kind === "text");

  return (
    <svg
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        {arrows.map((a) => (
          <marker
            key={a._id}
            id={`arrowhead-${a._id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth={5}
            markerHeight={5}
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={a.color} />
          </marker>
        ))}
      </defs>

      {arrows.map((a) => {
        const points = buildArrowPoints(
          a.style!,
          { x: a.x1! * imageWidth, y: a.y1! * imageHeight },
          { x: a.x2! * imageWidth, y: a.y2! * imageHeight }
        );
        const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        return (
          <path
            key={a._id}
            d={d}
            fill="none"
            stroke={a.color}
            strokeWidth={a.strokeWidth! * imageWidth}
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${a._id})`}
          />
        );
      })}

      {texts.map((a) => (
        <text
          key={a._id}
          x={a.x! * imageWidth}
          y={a.y! * imageHeight}
          fill={a.color}
          fontFamily={fontFamilyFor(a.fontFamily)}
          fontSize={a.fontSize! * imageWidth}
          fontWeight={a.fontFamily === "Manrope" ? 700 : undefined}
          dominantBaseline="hanging"
          transform={a.rotation ? `rotate(${a.rotation}, ${a.x! * imageWidth}, ${a.y! * imageHeight})` : undefined}
        >
          {a.text}
        </text>
      ))}
    </svg>
  );
}
