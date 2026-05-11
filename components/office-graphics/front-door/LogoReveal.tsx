export function LogoReveal() {
  return (
    <div className="fd-scene fd-scene-logo absolute inset-0 grid place-items-center overflow-hidden">
      <img
        src="/brand/hb-monogram.png"
        alt=""
        aria-hidden
        draggable={false}
        className="fd-logo select-none"
        style={{ width: '632px' }}
      />
    </div>
  )
}
