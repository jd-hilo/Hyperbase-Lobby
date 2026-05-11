"use client";

import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

// ── Legacy wireframe box ────────────────────────────────────────────────────
export function WireBox({ args, position = [0,0,0] as [number,number,number], rotation = [0,0,0] as [number,number,number], color = "#ffffff", opacity = 1 }: {
  args: [number,number,number]; position?: [number,number,number]; rotation?: [number,number,number]; color?: string; opacity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
}

// ── Clean-edge box (EdgesGeometry — no face diagonals) ─────────────────────
export function EB({ s, p = [0,0,0] as [number,number,number], r = [0,0,0] as [number,number,number], op = 0.75, color = "#ffffff" }: {
  s: [number,number,number]; p?: [number,number,number]; r?: [number,number,number]; op?: number; color?: string;
}) {
  const [sx, sy, sz] = s;
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(sx, sy, sz)), [sx, sy, sz]);
  return (
    <lineSegments geometry={edges} position={p} rotation={r}>
      <lineBasicMaterial color={color} transparent opacity={op} />
    </lineSegments>
  );
}

// ── Clean-edge cylinder ────────────────────────────────────────────────────
export function EC({ rt=0.1, rb=0.1, h=1, seg=12, p=[0,0,0] as [number,number,number], r=[0,0,0] as [number,number,number], op=0.65, color="#ffffff" }: {
  rt?: number; rb?: number; h?: number; seg?: number; p?: [number,number,number]; r?: [number,number,number]; op?: number; color?: string;
}) {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.CylinderGeometry(rt,rb,h,seg)), [rt,rb,h,seg]);
  return (
    <lineSegments geometry={edges} position={p} rotation={r}>
      <lineBasicMaterial color={color} transparent opacity={op} />
    </lineSegments>
  );
}

// ── Clean-edge torus ring ──────────────────────────────────────────────────
export function ER({ r=0.2, tube=0.02, seg=16, p=[0,0,0] as [number,number,number], rot=[0,0,0] as [number,number,number], op=0.55, color="#ffffff" }: {
  r?: number; tube?: number; seg?: number; p?: [number,number,number]; rot?: [number,number,number]; op?: number; color?: string;
}) {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.TorusGeometry(r,tube,6,seg)), [r,tube,seg]);
  return (
    <lineSegments geometry={edges} position={p} rotation={rot}>
      <lineBasicMaterial color={color} transparent opacity={op} />
    </lineSegments>
  );
}

export function PulsingRing({ position=[0,0,0] as [number,number,number], color="#00ffcc" }: { position?: [number,number,number]; color?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.08;
      ref.current.scale.set(s,s,s);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(clock.elapsedTime * 2) * 0.2;
    }
  });
  return (
    <mesh ref={ref} position={position} rotation={[Math.PI/2,0,0]}>
      <ringGeometry args={[0.6,0.65,32]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}
