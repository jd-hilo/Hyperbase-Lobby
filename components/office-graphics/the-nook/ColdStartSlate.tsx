'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const NookBackdrop = dynamic(
  () => import('./NookBackdrop').then((m) => m.NookBackdrop),
  { ssr: false },
)

const TOPICS = [
  { code: '01', label: 'HYPERSCALERS', sub: 'AWS · AZURE · GCP · ORACLE' },
  { code: '02', label: 'AGENTIC AI', sub: 'AGENTS · FRAMEWORKS · TOOLING' },
  { code: '03', label: 'QUANTUM COMPUTING', sub: 'HARDWARE · ERROR CORRECTION · ADVANTAGE' },
]

function useClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatCT(d: Date | null): { time: string; date: string } {
  if (!d) return { time: '--:--:--', date: '----·--·--' }
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  return { time, date: parts.replace(/-/g, '·') }
}

interface Props {
  isActive?: boolean
}

export function ColdStartSlate({ isActive = true }: Props) {
  const now = useClock()
  const { time, date } = formatCT(now)

  return (
    <div
      className="tn-slate absolute inset-0"
      style={{
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 800ms cubic-bezier(0.2, 0, 0, 1), transform 800ms cubic-bezier(0.2, 0, 0, 1)',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {/* Backdrop: diamond bleeds off bottom-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: '-140px',
          bottom: '-140px',
          width: '480px',
          height: '480px',
        }}
      >
        <NookBackdrop />
      </div>

      {/* Top status bar */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{
          top: '0',
          paddingLeft: '110px',
          paddingRight: '110px',
          paddingTop: '54px',
          paddingBottom: '24px',
          borderBottom: '1px solid #1A1A1A',
        }}
      >
        <div className="flex items-center gap-4">
          <span className="tn-live-dot block w-2 h-2 bg-signal" />
          <span className="font-mono text-[12px] tracking-[0.32em] text-signal">
            LIVE FEED
          </span>
          <span className="font-mono text-[12px] tracking-[0.18em] text-lattice">·</span>
          <span className="font-mono text-[12px] tracking-[0.18em] text-trace">
            SONAR-PRO · PERPLEXITY
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-mono text-[12px] tracking-[0.18em] text-trace">
            {date}
          </span>
          <span
            className="font-mono text-[12px] tracking-[0.18em] text-signal"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {time} CT
          </span>
        </div>
      </div>

      {/* Wordmark */}
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ paddingLeft: '110px', paddingRight: '110px' }}
      >
        <span className="tn-slate-eyebrow font-mono text-[14px] tracking-[0.32em] text-trace uppercase mb-10">
          fetching intel
        </span>
        <h1
          className="tn-slate-tagline font-sans font-light text-signal text-left"
          style={{
            fontSize: '128px',
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
          }}
        >
          <span className="block">HyperBase Intel</span>
        </h1>

        {/* Topic monitor grid */}
        <div className="mt-16 grid grid-cols-3 gap-x-3" style={{ maxWidth: '1100px' }}>
          {TOPICS.map((t, i) => (
            <div
              key={t.code}
              className="tn-topic-cell"
              style={{
                paddingLeft: i === 0 ? 0 : '28px',
                borderLeft: i === 0 ? 'none' : '1px solid #3F4654',
                animationDelay: `${i * 0.18}s`,
              }}
            >
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className="font-mono text-trace"
                  style={{ fontSize: '11px', letterSpacing: '0.18em' }}
                >
                  {t.code}
                </span>
                <span className="font-mono text-[12px] tracking-[0.06em] text-lattice">
                  / MONITORING
                </span>
              </div>
              <div
                className="font-sans font-light text-signal"
                style={{ fontSize: '32px', lineHeight: 1.05, letterSpacing: '-0.02em' }}
              >
                {t.label}
              </div>
              <div className="font-mono text-[10px] tracking-[0.18em] text-trace mt-3">
                {t.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom status bar */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{
          bottom: '0',
          paddingLeft: '110px',
          paddingRight: '110px',
          paddingTop: '24px',
          paddingBottom: '54px',
          borderTop: '1px solid #1A1A1A',
        }}
      >
        <span className="font-mono text-[11px] tracking-[0.22em] text-trace">
          AI-CURATED · DAILY · 09:00 CT
        </span>
        <span className="font-mono text-[11px] tracking-[0.22em] text-trace">
          HYPERBASE INTELLIGENCE
        </span>
      </div>
    </div>
  )
}
