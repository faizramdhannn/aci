type IconName = "home" | "explore" | "grid" | "heart";

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function NavIcon({ name, active }: { name: IconName; active?: boolean }) {
  const size = 20;
  const opacity = active ? 1 : 0.85;

  switch (name) {
    case "home":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity} {...strokeProps}>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9h12v-9" />
        </svg>
      );
    case "explore":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity} {...strokeProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M15 9l-2 6-6 2 2-6z" />
        </svg>
      );
    case "grid":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity} {...strokeProps}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "heart":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity} {...strokeProps}>
          <path d="M12 20s-7-4.35-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9Z" />
        </svg>
      );
  }
}
