"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

interface SensorDotProps {
  position: [number, number, number];
  partId: string;
  onSelect: (p: any) => void;
  selected: any;
  color: string;
}

export function SensorDot({ position, partId, onSelect, selected, color }: SensorDotProps) {
  const ref = useRef<THREE.Mesh>(null);
  const isSelected = selected?.id === partId;

  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isSelected ? 1 : 0.6 + Math.sin(clock.elapsedTime * 2 + position[0]) * 0.25;
    }
  });

  return (
    <group position={position} onClick={() => onSelect({ id: partId })}>
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.13, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Center dot */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
