import type { Annotation } from "@/types";
import { buildArrowPoints, toSvgPath } from "@/lib/arrow-shapes";

export function ArrowOverlay({ annotations }: { annotations: Annotation[] }) {
  if (annotations.length === 0) return null;

  return (
    <svg
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        {annotations.map((a) => (
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
      {annotations.map((a) => {
        const points = buildArrowPoints(a.style, { x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 });
        return (
          <path
            key={a._id}
            d={toSvgPath(points)}
            fill="none"
            stroke={a.color}
            strokeWidth={a.strokeWidth}
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${a._id})`}
          />
        );
      })}
    </svg>
  );
}
