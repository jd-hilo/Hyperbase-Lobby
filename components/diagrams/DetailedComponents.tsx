"use client";

import { EB, EC, ER } from "./WireBox";
import { PARTS } from "./types";
import type { PartInfo } from "./types";
import { AnnotationLabel } from "./AnnotationLabel";

const W = "#ffffff";
const D = 0.55;
const B = 0.35;

// Hit-box dimensions are passed so we can add an invisible solid mesh for reliable raycasting.
// LineSegments have essentially zero raycast area — only solid meshes register clicks.
function Clickable({ partId, onSelect, children, hitW, hitH, hitD, hitX = 0, hitY = 0, hitZ = 0 }: {
  partId: string;
  onSelect: (p: PartInfo) => void;
  children: React.ReactNode;
  hitW: number; hitH: number; hitD: number;
  hitX?: number; hitY?: number; hitZ?: number;
}) {
  return (
    <group>
      {/* Invisible hit mesh — gives raycaster a solid surface to intersect */}
      <mesh
        position={[hitX, hitY, hitZ]}
        onClick={(e) => { e.stopPropagation(); onSelect(PARTS[partId]); }}
      >
        <boxGeometry args={[hitW, hitH, hitD]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {children}
    </group>
  );
}

export function DetailedRack({ x, y, z, rw, rh, rd, partId, onSelect, selected, labelText, labelTo }: {
  x: number; y: number; z: number; rw: number; rh: number; rd: number;
  partId: string; onSelect: (p: PartInfo) => void; selected: PartInfo | null;
  labelText: string;
  labelTo: [number, number, number];
}) {
  const op = selected?.id === partId ? 0.9 : D;
  const n = (dx: number, dy: number, dz: number): [number,number,number] => [x+dx, y+dy, z+dz];
  const UNITS = 16;
  const UNIT_H = (rh - 0.22) / UNITS;
  const POST_W = 0.03;

  return (
    <Clickable partId={partId} onSelect={onSelect}
      hitW={rw} hitH={rh} hitD={rd} hitX={x} hitY={y} hitZ={z}>
      {([-1,1] as number[]).flatMap(sx => ([-1,1] as number[]).map(sz => (
        <EC key={`post-${sx}-${sz}`} rt={POST_W} rb={POST_W} h={rh} seg={4}
          p={n(sx*(rw/2-POST_W), 0, sz*(rd/2-POST_W))} op={op} />
      )))}
      <EB s={[rw, 0.025, rd]} p={n(0, rh/2, 0)} op={op*0.8} />
      <EB s={[rw, 0.025, rd]} p={n(0,-rh/2, 0)} op={op*0.8} />
      {Array.from({length: UNITS+1}, (_, i) => (
        <EB key={`rail-${i}`} s={[rw-0.06, 0.008, 0.008]}
          p={n(0, -rh/2 + 0.11 + i*UNIT_H, -rd/2)} op={B} />
      ))}
      {Array.from({length: UNITS}, (_, i) => {
        const uy = -rh/2 + 0.11 + i*UNIT_H + UNIT_H/2;
        const isTall = i % 5 === 2;
        return (
          <group key={`unit-${i}`}>
            <EB s={[rw-0.08, UNIT_H*0.85, 0.018]} p={n(0, uy, -rd/2)} op={D} />
            {Array.from({length: 4}, (_, j) => (
              <EB key={j} s={[0.045, UNIT_H*0.55, 0.01]}
                p={n(-rw/2+0.1+j*0.055, uy, -rd/2)} op={D+0.1} />
            ))}
            {Array.from({length: 3}, (_, j) => (
              <EB key={`p${j}`} s={[0.025, 0.018, 0.008]}
                p={n(rw/2-0.12-j*0.04, uy, -rd/2)} op={D} />
            ))}
            <EB s={[0.012, 0.012, 0.008]} p={n(-rw/2+0.04, uy, -rd/2)} op={0.9} />
            {isTall && <>
              <EB s={[0.01, UNIT_H*0.6, 0.04]} p={n(-rw/2, uy, -rd/2+0.03)} op={B} />
              <EB s={[0.01, UNIT_H*0.6, 0.04]} p={n( rw/2, uy, -rd/2+0.03)} op={B} />
            </>}
          </group>
        );
      })}
      <EB s={[0.06, rh-0.1, 0.06]} p={n(-rw/2+0.04, 0, -rd/2+0.04)} op={B} />
      <EB s={[0.06, rh-0.1, 0.06]} p={n( rw/2-0.04, 0, -rd/2+0.04)} op={B} />
      {Array.from({length: 8}, (_,i) => (
        <EB key={`ct-${i}`} s={[rw-0.08, 0.015, 0.01]} p={n(0, -rh/2+0.2+i*(rh-0.3)/7, -rd/2+0.04)} op={B*0.8} />
      ))}
      <EB s={[rw-0.06, 0.18, rd*0.3]} p={n(0, -rh/2+0.11, rd/2-rd*0.15)} op={D} />
      {Array.from({length: 3}, (_,i) => (
        <EC key={`psu-${i}`} rt={0.03} rb={0.03} h={0.14} seg={8}
          p={n(-rw/2+0.1+i*(rw-0.2)/2, -rh/2+0.11, rd/2-rd*0.1)} r={[Math.PI/2,0,0]} op={D} />
      ))}
      <EB s={[rw-0.06, 0.25, 0.015]} p={n(0, rh/2-0.16, rd/2)} op={D} />
      {Array.from({length: 8}, (_,i) => (
        <EB key={`rport-${i}`} s={[0.028, 0.018, 0.01]}
          p={n(-rw/2+0.08+i*(rw-0.16)/7, rh/2-0.16, rd/2)} op={D+0.1} />
      ))}
      {Array.from({length: 10}, (_,i) => (
        <EB key={`vent-${i}`} s={[0.008, 0.06, rd-0.1]}
          p={n(rw/2, -rh/2+0.25+i*(rh-0.35)/9, 0)} op={B} />
      ))}
      {Array.from({length: 5}, (_,i) => (
        <EC key={`cb-${i}`} rt={0.012} rb={0.012} h={rh*0.7} seg={6}
          p={n(-rw/2+0.08+i*0.04, rh*0.1, rd/2-0.04)} op={B} />
      ))}

      {/* Label far in open space above the rack */}
      <AnnotationLabel
        from={[x, y+rh/2, z-rd/2]}
        to={labelTo}
        label={labelText}
      />
    </Clickable>
  );
}

export function DetailedPDX({ x, y, z, rw, rh, rd, onSelect, selected, labelTo }: {
  x: number; y: number; z: number; rw: number; rh: number; rd: number;
  onSelect: (p: PartInfo) => void; selected: PartInfo | null;
  labelTo: [number, number, number];
}) {
  const op = selected?.id === "vertiv_pdx" ? 0.95 : D;
  const n = (dx: number, dy: number, dz: number): [number,number,number] => [x+dx, y+dy, z+dz];

  return (
    <Clickable partId="vertiv_pdx" onSelect={onSelect}
      hitW={rw} hitH={rh} hitD={rd} hitX={x} hitY={y} hitZ={z}>
      <EB s={[rw, rh, rd]} p={[x,y,z]} op={op} />
      {Array.from({length: 18}, (_,i) => (
        <EB key={`fin-${i}`} s={[rw-0.06, 0.008, rd*0.45]}
          p={n(0, -rh/2+0.2+i*(rh-0.35)/17, rd/2-rd*0.23)} op={B+0.1} />
      ))}
      <EB s={[0.015, rh-0.25, rd*0.45]} p={n(-rw/2+0.05, 0, rd/2-rd*0.23)} op={B} />
      <EB s={[0.015, rh-0.25, rd*0.45]} p={n( rw/2-0.05, 0, rd/2-rd*0.23)} op={B} />
      {([-rw*0.2, rw*0.2] as number[]).map((dx, ci) => (
        <group key={ci}>
          <EC rt={rd*0.18} rb={rd*0.18} h={rh*0.28} seg={12}
            p={n(dx, -rh/2+rh*0.16, rd*0.12)} r={[Math.PI/2,0,0]} op={op*0.8} />
          <EC rt={rd*0.08} rb={rd*0.08} h={0.08} seg={8}
            p={n(dx, -rh/2+rh*0.27, -rd*0.07)} r={[Math.PI/2,0,0]} op={op} />
        </group>
      ))}
      {([-rw*0.35, rw*0.35] as number[]).map((dx,pi) => (
        <EC key={pi} rt={0.025} rb={0.025} h={rh*0.6} seg={8}
          p={n(dx, 0, rd/2-0.06)} op={op*0.6} />
      ))}
      {Array.from({length: 12}, (_,i) => (
        <EB key={`louv-${i}`} s={[rw-0.05, 0.015, rd*0.08]}
          p={n(0, -rh/2+0.15+i*(rh-0.3)/11, rd/2)}
          r={[0.35, 0, 0]} op={B} />
      ))}
      <EB s={[rw*0.55, 0.14, 0.018]} p={n(0, rh/2-0.1, -rd/2)} op={op} />
      <EB s={[0.12, 0.08, 0.012]} p={n(-rw*0.15, rh/2-0.1, -rd/2)} op={op} />
      {Array.from({length: 4}, (_,i) => (
        <EC key={`btn-${i}`} rt={0.013} rb={0.013} h={0.01} seg={8}
          p={n(rw*0.05+i*0.04, rh/2-0.1, -rd/2)} r={[Math.PI/2,0,0]} op={op} />
      ))}
      <EC rt={0.02} rb={0.02} h={0.015} seg={8}
        p={n(rw/2-0.06, rh/2-0.06, -rd/2)} r={[Math.PI/2,0,0]} op={0.95} />
      <pointLight position={n(rw/2-0.06, rh/2-0.06, -rd/2-0.1)} color="#ff2200" intensity={0.8} distance={2.5} />

      <AnnotationLabel from={n(0, rh/2, 0)} to={labelTo} label="COOLING" />
    </Clickable>
  );
}

export function DetailedSwitchboard({ x, y, z, sw, sh, sd, onSelect, selected, labelTo, labelAlign = "left" }: {
  x: number; y: number; z: number; sw: number; sh: number; sd: number;
  onSelect: (p: PartInfo) => void; selected: PartInfo | null;
  labelTo: [number, number, number];
  labelAlign?: "left" | "right";
}) {
  const op = selected?.id === "main_switchboard" ? 0.95 : D;
  const n = (dx: number, dy: number, dz: number): [number,number,number] => [x+dx, y+dy, z+dz];

  return (
    <Clickable partId="main_switchboard" onSelect={onSelect}
      hitW={sw} hitH={sh} hitD={sd} hitX={x} hitY={y} hitZ={z}>
      <EB s={[sw, sh, sd]} p={[x,y,z]} op={op} />
      <EB s={[sw*0.28, sh*0.55, sd*0.3]} p={n(0, 0, -sd/2+sd*0.16)} op={op} />
      <EB s={[sw*0.12, sh*0.25, sd*0.1]} p={n(0, sh*0.12, -sd/2+sd*0.18)} op={op+0.1} />
      {[-1,0,1].map(i => (
        <EB key={i} s={[0.025, sh*0.7, sd*0.08]} p={n(i*0.14, 0, -sd/2+0.12)} op={op} />
      ))}
      <EB s={[sw*0.38, sh*0.22, sd*0.06]} p={n(sw*0.25, sh*0.18, -sd/2+0.04)} op={op} />
      <EB s={[sw*0.3, sh*0.14, 0.01]} p={n(sw*0.25, sh*0.18, -sd/2+0.03)} op={op+0.15} />
      {Array.from({length: 8}, (_,i) =>
        [0,1].map(row => (
          <EB key={`b-${i}-${row}`} s={[0.055, sh*0.11, sd*0.1]}
            p={n(-sw*0.28+i*0.075, -sh*0.1+row*sh*0.18, -sd/2+0.09)} op={op} />
        ))
      )}
      {[-1,0,1].map(i => (
        <EC key={i} rt={0.04} rb={0.04} h={0.15} seg={8}
          p={n(i*sw*0.22, sh/2+0.07, -sd/2+sd*0.25)} op={op*0.8} />
      ))}
      <EB s={[sw-0.06, 0.02, sd*0.12]} p={n(0, -sh/2+0.04, -sd/2+0.08)} op={op*0.6} />

      <AnnotationLabel from={n(0, sh/2+0.05, 0)} to={labelTo} label="MAIN SWITCHBOARD" align={labelAlign} />
    </Clickable>
  );
}

export function DetailedSubPanel({ x, y, z, pw, ph, pd, partId, label, onSelect, selected, labelTo, labelAlign = "left" }: {
  x: number; y: number; z: number; pw: number; ph: number; pd: number;
  partId: string; label: string;
  onSelect: (p: PartInfo) => void; selected: PartInfo | null;
  labelTo: [number, number, number];
  labelAlign?: "left" | "right";
}) {
  const op = selected?.id === partId ? 0.95 : D;
  const n = (dx: number, dy: number, dz: number): [number,number,number] => [x+dx, y+dy, z+dz];
  const ROWS = 5; const COLS = 2;

  return (
    <Clickable partId={partId} onSelect={onSelect}
      hitW={pw} hitH={ph} hitD={pd} hitX={x} hitY={y} hitZ={z}>
      <EB s={[pw, ph, pd]} p={[x,y,z]} op={op} />
      <EB s={[pw-0.04, 0.018, 0.01]} p={n(0, ph/2-0.08, -pd/2+0.01)} op={op} />
      <EB s={[pw-0.04, 0.018, 0.01]} p={n(0,-ph/2+0.06, -pd/2+0.01)} op={op*0.6} />
      {Array.from({length: ROWS}, (_,row) =>
        Array.from({length: COLS}, (_,col) => (
          <group key={`${row}-${col}`}>
            <EB s={[0.07, ph*0.13, pd*0.25]}
              p={n(-pw*0.18+col*pw*0.38, -ph/2+0.15+row*(ph-0.22)/(ROWS-1), -pd/2+pd*0.13)} op={op} />
            <EB s={[0.025, ph*0.06, 0.01]}
              p={n(-pw*0.18+col*pw*0.38, -ph/2+0.15+row*(ph-0.22)/(ROWS-1)+ph*0.04, -pd/2+0.01)} op={op+0.1} />
          </group>
        ))
      )}
      <EC rt={0.025} rb={0.025} h={0.06} seg={8}
        p={n(pw/2-0.06, 0, -pd/2+0.04)} r={[0,0,Math.PI/2]} op={op} />
      <EB s={[pw*0.4, 0.015, pd*0.15]} p={n(0, ph/2, -pd*0.05)} op={B} />

      <AnnotationLabel from={n(0, ph/2+0.05, 0)} to={labelTo} label={`SUB-PANEL ${label.slice(-1)}`} align={labelAlign} />
    </Clickable>
  );
}
