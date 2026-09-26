import type { SVGProps } from "react";

// Hand-drawn in lucide's style (24×24 grid, 2px round strokes) for garments
// lucide doesn't ship: pants, hijab, dress/gamis, skirt.
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function PantsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 3h10l1.5 18h-4.2L12 10l-2.3 11H5.5Z" />
      <path d="M7 6h10" />
    </Base>
  );
}

export function HijabIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3a6 6 0 0 0-6 6v3c0 4-2 6-3 8h18c-1-2-3-4-3-8V9a6 6 0 0 0-6-6Z" />
      <path d="M9 10.5a3 3 0 0 0 6 0V10a3 3 0 0 0-6 0Z" />
    </Base>
  );
}

export function DressIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 3 8 7l2 2-4.5 12h13L14 9l2-2-1-4" />
      <path d="M9 3c1 1 2 1.5 3 1.5S14 4 15 3" />
    </Base>
  );
}

export function SkirtIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 4h10" />
      <path d="M7 4 3.5 20h17L17 4" />
      <path d="M10 4l-1.5 16M14 4l1.5 16" />
    </Base>
  );
}
