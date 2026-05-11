"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const S = 0.02;
const cx = (x: number) => (x - 360) * S;
const cz = (y: number) => (y - 220) * S;

function AnimatedFlow({ start, end, color, speed = 0.6 }: {
  start: [number,number,number]; end: [number,number,number];
  color: string; speed?: number;
}) {
  const lineObj = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().lerpVectors(s, e, 0.5);
    mid.y += 0.25;
    const geo = new THREE.BufferGeometry().setFromPoints(
      new THREE.QuadraticBezierCurve3(s, mid, e).getPoints(30)
    );
    const mat = new THREE.LineDashedMaterial({ color, dashSize: 0.18, gapSize: 0.18, linewidth: 1, transparent: true, opacity: 0.4 });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    return line;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- geometry built once from initial props; children are fresh literals
  }, []);

  useFrame(({ clock }) => {
    (lineObj.material as any).dashOffset = -clock.elapsedTime * speed;
  });

  return <primitive object={lineObj} />;
}

/**
 * Accepts flowSpeed as a prop because React context does not cross the
 * @react-three/fiber Canvas reconciler boundary — see pmndrs gotchas.
 * The outer <EnergySystemScene> calls useFlowSpeed() and forwards the value.
 */
export function DataFlowLayer({ flowSpeed = 1 }: { flowSpeed?: number }) {
  // MQTT broker position: SVG(175, 445)
  const brokerX = cx(175);
  const brokerZ = cz(445);
  const broker: [number,number,number] = [brokerX, 0.3, brokerZ];

  return (
    <group>
      <AnimatedFlow start={[cx(155), 0.3, cz(168)]} end={broker} color="#ffffff" speed={0.7 * flowSpeed} />
      <AnimatedFlow start={[cx(118), 0.3, cz(101)]} end={broker} color="#ffffff" speed={0.5 * flowSpeed} />
      <AnimatedFlow start={[cx(420), 0.3, cz(220)]} end={broker} color="#ffffff" speed={1.0 * flowSpeed} />
      <AnimatedFlow start={[cx(550), 0.3, cz(220)]} end={broker} color="#ffffff" speed={0.8 * flowSpeed} />
      <AnimatedFlow start={[cx(583.5), 0.3, cz(368)]} end={broker} color="#ffffff" speed={0.6 * flowSpeed} />
      <AnimatedFlow start={broker} end={[cx(325), 0.3, cz(445)]} color="#aaaaaa" speed={1.3 * flowSpeed} />
    </group>
  );
}
