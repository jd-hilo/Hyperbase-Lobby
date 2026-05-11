'use client'

import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { DCRoom } from '@/components/diagrams/DCRoom'
import { DataFlowLayer } from '@/components/diagrams/DataFlowLayer'
import { AnnotationsVisibleContext } from '@/components/diagrams/AnnotationLabel'
import { TwinProvider, useFlowSpeed } from '@/lib/twin/context'
import { HeroFlowAccents } from './HeroFlowAccents'
function SceneInterior() {
  const flowSpeed = useFlowSpeed()
  return (
    <AnnotationsVisibleContext.Provider value={false}>
      <Suspense fallback={null}>
        <Grid
          args={[40, 40]}
          cellSize={1}
          cellThickness={0.2}
          cellColor="#131313"
          sectionSize={4}
          sectionThickness={0.35}
          sectionColor="#1a1a1a"
          fadeDistance={32}
          fadeStrength={2}
          position={[0, -0.01, 0]}
        />
        <DCRoom onSelect={() => {}} selected={null} />
        <DataFlowLayer flowSpeed={flowSpeed} />
        <HeroFlowAccents />
      </Suspense>
    </AnnotationsVisibleContext.Provider>
  )
}

export default function HeroEntropyScene() {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const fn = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', fn)
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 0)
    return () => {
      mq.removeEventListener('change', fn)
      clearTimeout(t)
    }
  }, [])

  return (
    <TwinProvider initialScenario="PEAK">
      <div className="hero-scene-fade relative w-full h-full [&_canvas]:!w-full [&_canvas]:!h-full">
        <Canvas
          camera={{ position: [0, 18, 30], fov: 29 }}
          dpr={[0.75, 1]}
          gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
        >
          <ambientLight intensity={0.1} />
          <pointLight position={[-4, 7, 2]} intensity={0.4} color="#ffffff" />
          <pointLight position={[4, 5, -2]} intensity={0.25} color="#ffffff" />
          <SceneInterior />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={false}
            autoRotate={!reduceMotion}
            autoRotateSpeed={0.6}
            maxPolarAngle={Math.PI / 2.15}
            target={[0, -2, 0]}
          />
        </Canvas>
      </div>
    </TwinProvider>
  )
}
