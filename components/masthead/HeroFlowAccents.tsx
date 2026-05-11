'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const S = 0.02
const cx = (x: number) => (x - 360) * S
const cz = (y: number) => (y - 220) * S

// Flow paths mirroring DataFlowLayer's quadratic Bezier curves into the broker.
const BROKER: [number, number, number] = [cx(175), 0.05, cz(445)]
const PATHS: { start: [number, number, number]; speed: number; color: string }[] = [
  { start: [cx(155),   0.05, cz(168)], speed: 0.55, color: '#ffffff' },
  { start: [cx(118),   0.05, cz(101)], speed: 0.40, color: '#ffffff' },
  { start: [cx(420),   0.05, cz(220)], speed: 0.80, color: '#ffffff' },
  { start: [cx(550),   0.05, cz(220)], speed: 0.65, color: '#ffffff' },
  { start: [cx(583.5), 0.05, cz(368)], speed: 0.50, color: '#ffffff' },
]

function bezierPoint(
  a: THREE.Vector3,
  b: THREE.Vector3,
  t: number,
): THREE.Vector3 {
  const mid = new THREE.Vector3().lerpVectors(a, b, 0.5)
  mid.y += 0.08
  return new THREE.QuadraticBezierCurve3(a, mid, b).getPoint(t)
}

function TravelingParticle({
  start,
  end,
  speed,
  color,
  phase,
}: {
  start: [number, number, number]
  end: [number, number, number]
  speed: number
  color: string
  phase: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  const a = useMemo(() => new THREE.Vector3(...start), [start])
  const b = useMemo(() => new THREE.Vector3(...end), [end])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = ((clock.elapsedTime * speed + phase) % 1)
    const p = bezierPoint(a, b, t)
    ref.current.position.copy(p)
    const fade = Math.sin(t * Math.PI)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.65 * fade
    const scale = 0.7 + 0.5 * fade
    ref.current.scale.setScalar(scale)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.025, 10, 10]} />
      <meshBasicMaterial color={color} transparent opacity={0} />
    </mesh>
  )
}

function PulsingRing({ position, baseRadius = 0.35, color = '#ffffff', period = 2.4 }: {
  position: [number, number, number]
  baseRadius?: number
  color?: string
  period?: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.elapsedTime % period) / period
    const s = 1 + t * 2.5
    ref.current.scale.set(s, s, s)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.5
  })
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[baseRadius, baseRadius + 0.04, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}

function BeaconLight({ position, period = 1.6, color = '#ffffff' }: {
  position: [number, number, number]
  period?: number
  color?: string
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.elapsedTime % period) / period
    const breathe = 0.5 + 0.5 * Math.sin(t * Math.PI * 2)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.6 * breathe
    const s = 0.8 + 0.4 * breathe
    ref.current.scale.setScalar(s)
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  )
}

export function HeroFlowAccents() {
  return (
    <group>
      {/* Particles flowing into broker */}
      {PATHS.map((p, i) => (
        <TravelingParticle key={`p-${i}`} start={p.start} end={BROKER} speed={p.speed} color={p.color} phase={i * 0.18} />
      ))}

      {/* Outbound dispatch from broker to compute */}
      <TravelingParticle start={BROKER} end={[cx(325), 0.05, cz(445)]} speed={1.0} color="#ffffff" phase={0.0} />
    </group>
  )
}
