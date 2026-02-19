"use client";

type LiveRegionProps = {
  message: string | null;
};

export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message ?? ""}
    </p>
  );
}
