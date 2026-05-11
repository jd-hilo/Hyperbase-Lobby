'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { AtmosphericOverlay } from '@/components/masthead/AtmosphericOverlay'
import { LogoReveal } from './LogoReveal'
import { TaglineReveal } from './TaglineReveal'
import { MacrogridStats } from './MacrogridStats'
import './front-door.css'

const HeroEntropyScene = dynamic(
  () => import('@/components/masthead/HeroEntropyScene'),
  { ssr: false },
)

export function FrontDoorLoop() {
  // Kiosk default: TV mounted in portrait, driven by a landscape browser.
  // We rotate the stage 90° CCW so it reads upright on the physical panel.
  // Append ?landscape=1 in the URL to preview without rotation on a laptop.
  const [portrait, setPortrait] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('landscape') === '1') setPortrait(false)
  }, [])

  return (
    <div className={`fd-root fixed inset-0 z-[100] bg-void overflow-hidden ${portrait ? 'fd-portrait-cw' : ''}`}>
      <div className="fd-stage absolute inset-0 bg-void overflow-hidden">
        <div className="fd-scene fd-scene-hero absolute inset-0 flex items-end justify-end">
          <div className="fd-hero-aspect">
            <HeroEntropyScene />
          </div>
        </div>

        <LogoReveal />

        {/* Small watermark logo — top-left on scenes 2 & 3, hidden during logo reveal */}
        <img
          src="/brand/hb-monogram.png"
          alt=""
          aria-hidden
          draggable={false}
          className="fd-watermark pointer-events-none select-none absolute"
          style={{ top: '72px', left: '86px', width: '80px' }}
        />

        <TaglineReveal />
        <MacrogridStats />

        <div className="pointer-events-none absolute inset-0 opacity-60">
          <AtmosphericOverlay />
        </div>
      </div>
    </div>
  )
}
