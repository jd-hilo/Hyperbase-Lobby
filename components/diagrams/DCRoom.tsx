"use client";

import { EB, EC } from "./WireBox";
import { SensorDot } from "./SensorDot";
import { AnnotationLabel } from "./AnnotationLabel";
import { DetailedRack, DetailedPDX, DetailedSwitchboard, DetailedSubPanel } from "./DetailedComponents";
import { PARTS } from "./types";
import type { PartInfo } from "./types";

const S = 0.02;
const cx = (x: number) => (x - 360) * S;
const cz = (y: number) => (y - 220) * S;
const w  = (n: number) => n * S;

const RACK_H = 2.2;
const RACK_BASE = 0.06;
const RACK_CY = RACK_BASE + RACK_H / 2;
const W = "#ffffff";

const L = {
  // MSB — goes straight UP (vertical leader line, no left push)
  msbLeft:  [-4.0, 6.8, -4.2] as [number,number,number],

  // Left side — sub-panels, T1, U1 go left. Z kept moderate to avoid off-screen
  u1:       [-7.2, 5.2, -3.5] as [number,number,number],
  subP1:    [-7.2, 4.4, -2.0] as [number,number,number],
  t1:       [-7.2, 3.8, -1.0] as [number,number,number],
  subP2:    [-7.2, 3.2,  0.5] as [number,number,number],
  subP3:    [-7.2, 2.5,  1.8] as [number,number,number],

  // Top — racks spread across top of scene, staggered vertically to avoid
  // screen-space label overlap at the default camera pose.
  netRack:  [-2.5, 4.2, -4.8] as [number,number,number],
  dgx1:     [ 0.5, 5.4, -5.0] as [number,number,number],
  dgx2:     [ 4.8, 5.0, -5.0] as [number,number,number],
  iec:      [ 3.0, 6.1, -5.2] as [number,number,number],

  // Right side — PDX and sensors
  pdx:      [ 5.5, 4.2,  1.0] as [number,number,number],
  t8:       [ 5.5, 3.2,  3.0] as [number,number,number],
  t9:       [ 5.5, 2.5,  3.8] as [number,number,number],

  // Data infra — MQTT goes UP (z=4.5, far left clips), InfluxDB goes right
  mqtt:     [-7.2, 1.8,  2.8] as [number,number,number],
  influx:   [ 5.5, 1.2,  4.5] as [number,number,number],
};

interface Props { onSelect: (p: PartInfo) => void; selected: PartInfo | null; }

export function DCRoom({ onSelect, selected }: Props) {
  return (
    <group>
      {/* ── ROOM SHELL ── */}
      <EB s={[10.8, 0.04, 7.0]} p={[0, 0.02, 0]} op={0.15} />
      <EB s={[0.04, 3.0, 7.0]} p={[-5.4, 1.5, 0]}  op={0.12} />
      <EB s={[0.04, 3.0, 7.0]} p={[ 5.4, 1.5, 0]}  op={0.12} />
      <EB s={[10.8, 3.0, 0.04]} p={[0, 1.5, -3.5]} op={0.12} />
      <EB s={[10.8, 3.0, 0.04]} p={[0, 1.5,  3.5]} op={0.12} />
      {([-5.4, 5.4] as number[]).flatMap(px => ([-3.5, 3.5] as number[]).map(pz => (
        <EC key={`${px}-${pz}`} rt={0.025} rb={0.025} h={3.0} seg={4} p={[px, 1.5, pz]} op={0.25} />
      )))}

      {/* Raised floor tiles */}
      {Array.from({length: 8}, (_,i) =>
        Array.from({length: 5}, (_,j) => (
          <EB key={`ft-${i}-${j}`} s={[1.1, 0.03, 0.9]}
            p={[cx(250)+i*1.15, RACK_BASE-0.02, cz(120)+j*0.95]} op={0.08} />
        ))
      )}

      {/* MSB goes up — no left align, leader is vertical */}
      <DetailedSwitchboard
        x={cx(157.5)} y={2.05} z={cz(89)}
        sw={w(95)} sh={0.7} sd={w(42)}
        onSelect={onSelect} selected={selected}
        labelTo={L.msbLeft}
      />
      {/* Conduit MSB → sub-panels */}
      <EC rt={0.018} rb={0.018} h={Math.abs(cz(308) - cz(89)) + 0.3} seg={8}
        p={[cx(120), 0.9, (cz(89)+cz(308))/2]} op={0.3} />

      {/* ── SUB-PANELS ── */}
      <DetailedSubPanel x={cx(155)} y={1.05} z={cz(168)}
        pw={w(70)} ph={1.5} pd={w(56)}
        partId="sub_p1" label="S1" onSelect={onSelect} selected={selected}
        labelTo={L.subP1} labelAlign="right" />
      <DetailedSubPanel x={cx(155)} y={1.05} z={cz(238)}
        pw={w(70)} ph={1.5} pd={w(56)}
        partId="sub_p2" label="S2" onSelect={onSelect} selected={selected}
        labelTo={L.subP2} labelAlign="right" />
      <DetailedSubPanel x={cx(155)} y={1.05} z={cz(308)}
        pw={w(70)} ph={1.5} pd={w(56)}
        partId="sub_p3" label="S3" onSelect={onSelect} selected={selected}
        labelTo={L.subP3} labelAlign="right" />

      {/* ── T1 + U1 (sensors, dot only — click for detail) ── */}
      <SensorDot position={[cx(105), 1.5, cz(130)]} partId="t1_ambient" onSelect={onSelect} selected={selected} color={W} />
      <AnnotationLabel from={[cx(105), 1.5, cz(130)]} to={L.t1} label="T1" align="right" />

      <SensorDot position={[cx(118), 2.4, cz(101)]} partId="u1_emporia" onSelect={onSelect} selected={selected} color={W} />
      <AnnotationLabel from={[cx(118), 2.4, cz(101)]} to={L.u1} label="U1" align="right" />

      {/* ── IEC 60309 connectors (east wall) ── */}
      {([370,410,460,510,560] as number[]).map((sx,i) => (
        <group key={i} position={[cx(sx), 2.8, cz(52)]}>
          <EB s={[0.22, 0.22, 0.04]} p={[0,0,0]} op={0.5} />
          <EC rt={0.09} rb={0.09} h={0.06} seg={12} p={[0,0,0]} r={[Math.PI/2,0,0]} op={0.7} />
          {[0, 1, 2].map(j => {
            const a = (j/3)*Math.PI*2 + Math.PI/6;
            return <EC key={j} rt={0.015} rb={0.015} h={0.05} seg={6}
              p={[Math.cos(a)*0.045, Math.sin(a)*0.045, 0]} r={[Math.PI/2,0,0]} op={0.8} />;
          })}
          <EC rt={0.012} rb={0.012} h={0.05} seg={6} p={[0,-0.055,0]} r={[Math.PI/2,0,0]} op={0.8} />
          <EC rt={0.015} rb={0.015} h={1.6} seg={8} p={[0,-0.9,0.15]} op={0.2} />
        </group>
      ))}
      {/* One label for all IEC connectors */}
      <AnnotationLabel from={[cx(460), 2.8, cz(52)]} to={L.iec} label="POWER INLETS ×5" />

      {/* ── COMPUTE RACKS ── */}
      <DetailedRack
        x={cx(298)} y={RACK_CY} z={cz(220)}
        rw={w(100)} rh={RACK_H} rd={w(200)}
        partId="network_switch" onSelect={onSelect} selected={selected}
        labelText="NETWORK RACK"
        labelTo={L.netRack}
      />
      <DetailedRack
        x={cx(420)} y={RACK_CY} z={cz(220)}
        rw={w(120)} rh={RACK_H} rd={w(200)}
        partId="dgx1_ddn" onSelect={onSelect} selected={selected}
        labelText="COMPUTE POD 1"
        labelTo={L.dgx1}
      />
      <DetailedRack
        x={cx(550)} y={RACK_CY} z={cz(220)}
        rw={w(140)} rh={RACK_H} rd={w(200)}
        partId="dgx2_h100" onSelect={onSelect} selected={selected}
        labelText="COMPUTE POD 2"
        labelTo={L.dgx2}
      />

      {/* ── THERMAL SENSORS — dots only, click for info ── */}
      {([
        ["t2_pod1_inlet",  cx(380), cz(120)],
        ["t3_pod1_outlet", cx(380), cz(320)],
        ["t4_pod2_inlet",  cx(510), cz(120)],
        ["t5_pod2_outlet", cx(510), cz(320)],
        ["t6_alley_e",     cx(470), cz(150)],
        ["t7_alley_w",     cx(470), cz(300)],
      ] as [string,number,number][]).map(([pid,tx,tz]) => (
        <SensorDot key={pid} position={[tx, RACK_BASE+RACK_H+0.1, tz]}
          partId={pid} onSelect={onSelect} selected={selected} color={W} />
      ))}

      {/* ── VERTIV PDX ── */}
      <DetailedPDX
        x={cx(583.5)} y={RACK_CY} z={cz(368)}
        rw={w(91)} rh={RACK_H} rd={w(52)}
        onSelect={onSelect} selected={selected}
        labelTo={L.pdx}
      />
      {/* PDX sensors */}
      <SensorDot position={[cx(544), RACK_BASE+0.4, cz(360)]} partId="t8_pdx_supply" onSelect={onSelect} selected={selected} color={W} />
      <AnnotationLabel from={[cx(544), RACK_BASE+0.5, cz(360)]} to={L.t8} label="T8" />
      <SensorDot position={[cx(544), RACK_BASE+0.7, cz(378)]} partId="t9_pdx_return" onSelect={onSelect} selected={selected} color={W} />
      <AnnotationLabel from={[cx(544), RACK_BASE+0.8, cz(378)]} to={L.t9} label="T9" />

      {/* ── DOORWAY ── */}
      <EB s={[w(120), 2.2, 0.04]} p={[cx(290), 1.1, cz(395)]} op={0.15} />

      {/* ── DATA INFRA ── */}
      {([
        { partId:"mqtt_broker", sx:175, labelTo:L.mqtt, labelText:"BROKER", align:"right" as const },
      ]).map(({ partId, sx, labelTo, labelText, align }) => (
        <group key={partId} onClick={() => onSelect(PARTS[partId])}>
          {/* Invisible hit box for reliable click detection */}
          <mesh position={[cx(sx), 0.23, cz(445)]}
            onClick={(e) => { e.stopPropagation(); onSelect(PARTS[partId]); }}>
            <boxGeometry args={[w(130), 0.35, w(30)]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <EB s={[w(130), 0.35, w(30)]} p={[cx(sx), 0.23, cz(445)]} op={0.6} />
          {Array.from({length:3},(_,i)=>(
            <EB key={i} s={[w(110), 0.08, 0.01]} p={[cx(sx), 0.1+i*0.09, cz(445)-w(15)+0.01]} op={0.3} />
          ))}
          <EC rt={0.012} rb={0.012} h={0.01} seg={6}
            p={[cx(sx)-w(55)+0.04, 0.3, cz(445)-w(15)+0.012]} r={[Math.PI/2,0,0]} op={0.7} />
          <AnnotationLabel from={[cx(sx), 0.4, cz(445)]} to={labelTo} label={labelText} align={align} />
        </group>
      ))}
    </group>
  );
}
