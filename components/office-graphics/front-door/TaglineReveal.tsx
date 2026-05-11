export function TaglineReveal() {
  return (
    <div className="fd-scene fd-scene-tagline absolute inset-0 flex flex-col justify-end pb-[12cqh] px-[8cqi]">
      <h1
        className="font-sans font-light text-signal"
        style={{
          fontSize: 'clamp(40px, 11cqi, 96px)',
          lineHeight: 0.98,
          letterSpacing: '-0.03em',
        }}
      >
        <span className="fd-tag-group fd-tag-group-1 block">
          <span className="block">When energy</span>
          <span className="block">is a given,</span>
        </span>
        <span className="fd-tag-group fd-tag-group-2 block text-trace">
          <span className="block">innovation</span>
          <span className="block">is limitless.</span>
        </span>
      </h1>
    </div>
  )
}
