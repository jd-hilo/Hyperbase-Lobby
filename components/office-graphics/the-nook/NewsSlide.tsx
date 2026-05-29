'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { NewsItem } from '@/lib/news/types'
import { TOPIC_LABEL } from '@/lib/news/types'

interface Props {
  item: NewsItem
  index: number
  total: number
  isActive: boolean
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 60) return `${mins}M AGO`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours}H AGO`
  return `${Math.round(hours / 24)}D AGO`
}

export function NewsSlide({ item, index, total, isActive }: Props) {
  const rel = relativeTime(item.publishedAt)

  return (
    <div
      className="tn-slide absolute inset-0 flex flex-col"
      style={{
        paddingLeft: '110px',
        paddingRight: '110px',
        paddingTop: '72px',
        paddingBottom: '72px',
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 800ms cubic-bezier(0.2, 0, 0, 1), transform 800ms cubic-bezier(0.2, 0, 0, 1)',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {/* Top eyebrow row */}
      <div
        className="flex items-center justify-between"
        style={{ paddingBottom: '20px', borderBottom: '1px solid #1A1A1A' }}
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-[12px] tracking-[0.32em] text-trace">■</span>
          <span className="font-mono text-[12px] tracking-[0.32em] text-signal">
            {TOPIC_LABEL[item.topic]}
          </span>
          {rel && (
            <>
              <span className="font-mono text-[12px] tracking-[0.18em] text-lattice">/</span>
              <span className="font-mono text-[12px] tracking-[0.22em] text-trace">{rel}</span>
            </>
          )}
        </div>
        <span
          className="font-mono text-[12px] tracking-[0.22em] text-trace"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      {/* Headline */}
      <h1
        className="font-sans font-light text-signal"
        style={{
          fontSize: '88px',
          lineHeight: 0.98,
          letterSpacing: '-0.03em',
          marginTop: '48px',
          maxWidth: '1500px',
        }}
      >
        {item.headline}
      </h1>

      {/* Summary */}
      <p
        className="font-sans font-light text-trace"
        style={{
          fontSize: '30px',
          lineHeight: 1.32,
          letterSpacing: '-0.005em',
          marginTop: '40px',
          maxWidth: '1100px',
        }}
      >
        {item.summary}
      </p>

      {/* QR block — sits right under the summary */}
      <div className="flex justify-end" style={{ marginTop: '36px' }}>
        <div className="flex flex-col items-end" style={{ gap: '14px' }}>
          <span
            className="font-mono text-trace"
            style={{ fontSize: '12px', letterSpacing: '0.32em' }}
          >
            SCAN TO READ
          </span>
          <div
            style={{
              border: '1px solid #3F4654',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div style={{ background: '#FFFFFF', padding: '12px', lineHeight: 0 }}>
              <QRCodeSVG
                value={item.url}
                size={200}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
