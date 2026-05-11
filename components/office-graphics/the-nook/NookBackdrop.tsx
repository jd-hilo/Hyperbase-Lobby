'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Starfield({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 9 + Math.random() * 14
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count])

  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.rotation.y += dt * 0.02
    ref.current.rotation.x += dt * 0.006
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#A8B2C2"
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  )
}

function WireSphere() {
  const ref = useRef<THREE.LineSegments>(null)
  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.rotation.y += dt * 0.08
    ref.current.rotation.x += dt * 0.018
  })
  const geom = useMemo(() => {
    const sphere = new THREE.SphereGeometry(3.2, 28, 16)
    return new THREE.EdgesGeometry(sphere, 8)
  }, [])
  return (
    <lineSegments ref={ref} geometry={geom}>
      <lineBasicMaterial color="#FFFFFF" transparent opacity={0.22} />
    </lineSegments>
  )
}

function InnerCore() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.rotation.y -= dt * 0.12
    ref.current.rotation.z += dt * 0.05
  })
  const geom = useMemo(() => new THREE.IcosahedronGeometry(1.4, 0), [])
  return (
    <mesh ref={ref} geometry={geom}>
      <meshBasicMaterial color="#FFFFFF" wireframe transparent opacity={0.55} />
    </mesh>
  )
}

function ScanRing() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.x = Math.PI / 2
    ref.current.rotation.z = t * 0.4
    const scale = 1 + (Math.sin(t * 0.6) + 1) * 1.8
    ref.current.scale.setScalar(scale)
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.35 * (1 - ((scale - 1) / 3.6))
  })
  return (
    <mesh ref={ref}>
      <ringGeometry args={[2.6, 2.65, 64]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.35} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function NookBackdrop() {
  return (
    <div className="absolute inset-0 [&_canvas]:!w-full [&_canvas]:!h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        dpr={[0.75, 1.25]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      >
        <InnerCore />
      </Canvas>
    </div>
  )
}
