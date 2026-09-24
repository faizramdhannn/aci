export function GridSkeleton({ count = 8, cols = "grid-cols-2 md:grid-cols-4" }: { count?: number; cols?: string }) {
  return (
    <div className={`grid gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="animate-pulse rounded-xl bg-brown/10" style={{ aspectRatio: "3 / 4" }} />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-brown/10" />
        </div>
      ))}
    </div>
  );
}
