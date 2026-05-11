'use client'

import { useEffect, useState } from 'react'
import { AtmosphericOverlay } from '@/components/masthead/AtmosphericOverlay'
import type { NewsPayload } from '@/lib/news/types'
import { NewsSlide } from './NewsSlide'
import { ColdStartSlate } from './ColdStartSlate'
import './the-nook.css'

const POLL_INTERVAL_MS = 5 * 60 * 1000
const SLIDE_DURATION_MS = 15_000

export function TheNookLoop() {
  const [portrait, setPortrait] = useState(false)
  const [payload, setPayload] = useState<NewsPayload | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('portrait') === '1') setPortrait(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/news', { cache: 'no-store' })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = (await res.json()) as NewsPayload
        if (!cancelled) setPayload(data)
      } catch (err) {
        console.error('[the-nook] poll failed:', err)
      }
    }
    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const items = payload?.items ?? []
  // Slate is always slide 0; news slides follow.
  const total = items.length + 1

  useEffect(() => {
    if (total <= 1) {
      setActiveIndex(0)
      return
    }
    setActiveIndex(0)
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % total)
    }, SLIDE_DURATION_MS)
    return () => clearInterval(id)
  }, [total, payload?.fetchedAt])

  return (
    <div className={`tn-root fixed inset-0 z-[100] bg-void overflow-hidden ${portrait ? 'tn-portrait-cw' : ''}`}>
      <div className="tn-stage absolute inset-0 bg-void overflow-hidden">
        <ColdStartSlate isActive={activeIndex === 0} />

        {items.map((item, i) => (
          <NewsSlide
            key={`${item.topic}-${item.url}`}
            item={item}
            index={i}
            total={items.length}
            isActive={activeIndex === i + 1}
          />
        ))}

        {total > 1 && (
          <div
            className="absolute flex items-center gap-2 pointer-events-none"
            style={{ left: '110px', bottom: '52px' }}
          >
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className="block"
                style={{
                  width: i === activeIndex ? '20px' : '8px',
                  height: '2px',
                  background: '#FFFFFF',
                  opacity: i === activeIndex ? 1 : 0.25,
                  transition: 'width 500ms ease, opacity 500ms ease',
                }}
              />
            ))}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 opacity-60">
          <AtmosphericOverlay />
        </div>
      </div>
    </div>
  )
}
