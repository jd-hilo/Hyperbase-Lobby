export function AtmosphericOverlay() {
  return (
    <>
      {/* Fog — biased toward the DC-rooms region of the baked image */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 75% 45%, rgba(245,247,250,0.08), transparent 60%)',
        }}
      />
      {/* Grain — inline SVG noise, overlay blend */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay"
      >
        <filter id="masthead-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#masthead-noise)" />
      </svg>
      {/* Scanline — thin horizontal repeating gradient masked top/bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(to bottom, rgba(245,247,250,0.04) 0 1px, transparent 1px 3px)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      />
    </>
  )
}
