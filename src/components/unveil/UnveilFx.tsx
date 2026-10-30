import React from "react";

const CRACKS = [
  "M50 50 L38 12", "M50 50 L72 8", "M50 50 L88 46", "M50 50 L60 96", "M50 50 L14 70", "M50 50 L22 94",
  "M38 12 L30 0", "M72 8 L80 2", "M60 96 L70 100", "M14 70 L2 60", "M22 94 L10 100",
];

/** Cracks that spread out from the centre while the screen shakes. */
export function CrackOverlay() {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      {CRACKS.map((d, i) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          className="unveil-crack"
          style={{ animationDelay: `${i * 45}ms` }}
          fill="none"
          stroke="rgba(221, 214, 254, 0.9)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/** Expanding ring that marks the moment the screen breaks open. */
export function ShockwaveRing() {
  return <div className="unveil-ring" aria-hidden="true" />;
}
