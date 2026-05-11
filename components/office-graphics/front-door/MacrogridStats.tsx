const STATS = [
  { n: '11+', unit: ' GW', label: 'ACTIVE PIPELINE' },
  { n: '16',  unit: '',    label: 'PROJECTS' },
  { n: '6',   unit: '',    label: 'STATES' },
  { n: '2.6', unit: ' TW', label: 'QUEUED CAPACITY' },
]

export function MacrogridStats() {
  return (
    <div className="fd-scene fd-scene-stats absolute inset-0 flex flex-col justify-center" style={{ paddingLeft: '86px', paddingRight: '86px' }}>
      <div className="fd-stats-eyebrow flex items-center gap-3 mb-12">
        <span className="font-mono text-[12px] tracking-[0.18em] text-trace">■</span>
        <span className="font-mono text-[12px] tracking-[0.18em] text-trace">
          THE AMERICAN MACROGRID
        </span>
        <img
          src="/brand/flag-us.svg"
          alt=""
          aria-hidden
          width={20}
          height={14}
          className="inline-block"
        />
      </div>

      <div className="grid grid-cols-2 gap-y-12 gap-x-3">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`fd-stats-cell fd-stats-cell-${i + 1}`}
            style={{
              paddingLeft: i % 2 === 1 ? '32px' : 0,
              borderLeft: i % 2 === 1 ? '1px solid #3F4654' : 'none',
            }}
          >
            <div
              className="font-mono font-medium text-signal leading-none"
              style={{
                fontSize: '96px',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {s.n}
              {s.unit && (
                <span
                  className="text-trace"
                  style={{ fontSize: '0.55em', letterSpacing: '0.04em' }}
                >
                  {s.unit}
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] tracking-[0.14em] text-trace mt-4">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div
        className="fd-stats-footer mt-14 pt-6 font-mono text-[11px] tracking-[0.22em] text-trace"
        style={{ borderTop: '1px solid #3F4654' }}
      >
        AI-ORCHESTRATED · DISTRIBUTED · AMERICAN
      </div>
    </div>
  )
}
