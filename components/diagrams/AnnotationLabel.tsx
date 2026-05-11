"use client";

import { createContext, useContext } from "react";
import { Html, Line } from "@react-three/drei";

/**
 * When set to false, all <AnnotationLabel> instances render null.
 * Used by the masthead capture route to bake a label-free image of the scene.
 * Default true means live use of the scene (platform Digital Twin) keeps labels.
 */
export const AnnotationsVisibleContext = createContext<boolean>(true);

interface Props {
  from: [number, number, number];
  to: [number, number, number];
  /** Simple single-line label */
  label?: string;
  /** Rich: short ID code e.g. "WT-01" */
  id?: string;
  /** Rich: component display name */
  title?: string;
  /** Rich: spec lines rendered below the title */
  specs?: string[];
  color?: string;
  align?: "left" | "right";
}

export function AnnotationLabel({
  from,
  to,
  label,
  id,
  title,
  specs,
  color = "#ffffff",
  align = "left",
}: Props) {
  const visible = useContext(AnnotationsVisibleContext);
  if (!visible) return null;

  // Determine display content
  const hasRich = title || id;
  const displayLabel = label ?? (id ? `${id}` : "");

  return (
    <>
      {/* Leader line */}
      <Line points={[from, to]} color={color} lineWidth={0.4} transparent opacity={0.22} />

      {/* Anchor dot */}
      <mesh position={from}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>

      <Html
        position={to}
        center={false}
        zIndexRange={[15, 20]}
        style={{
          pointerEvents: "none",
          transform: align === "right" ? "translateX(-100%)" : "none",
        }}
      >
        <div
          style={{
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            userSelect: "none",
            display: "flex",
            flexDirection: align === "right" ? "row-reverse" : "row",
            alignItems: "flex-start",
            gap: "5px",
            textShadow: "0 0 14px rgba(0,0,0,1), 0 0 6px rgba(0,0,0,1)",
          }}
        >
          <span style={{ opacity: 0.45, fontSize: "9px", marginTop: 2 }}>•</span>

          {hasRich ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {id && (
                <span
                  style={{
                    fontSize: "8px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: color,
                    opacity: 0.6,
                  }}
                >
                  {id}
                </span>
              )}
              {title && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.9)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {title}
                </span>
              )}
              {specs && specs.map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "8px",
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.45)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 400,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.9)",
                whiteSpace: "nowrap",
              }}
            >
              {displayLabel}
            </span>
          )}
        </div>
      </Html>
    </>
  );
}
