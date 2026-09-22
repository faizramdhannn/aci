/** The default hotspot marker: a small colored badge with a link icon, color customizable per hotspot. */
export function LinkMarker({ color = "#5A3D2B", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow-sm">
      <circle cx="12" cy="12" r="11" fill={color} stroke="#FDF9E3" strokeWidth="1.5" />
      <path
        d="M10.5 13.5a3 3 0 0 0 4.24 0l1.5-1.5a3 3 0 0 0-4.24-4.24l-.85.85"
        fill="none"
        stroke="#FDF9E3"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 10.5a3 3 0 0 0-4.24 0l-1.5 1.5a3 3 0 0 0 4.24 4.24l.85-.85"
        fill="none"
        stroke="#FDF9E3"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
