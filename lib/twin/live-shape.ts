export const SCHEMA_VERSION = 1
export const LIVE_PART_IDS = ['dgx1_ddn', 'dgx2_h100', 'network_switch', 'vertiv_pdx', 'u1_emporia'] as const

export const LIVE_CLAMPS: Record<string, [number, number]> = {
  POWER: [0, 22], INLET: [18, 60], UTIL: [0, 100],
  SUPPLY: [10, 24], DELTA: [2, 16], COP: [1.5, 5.5],
  FREQ: [59.5, 60.5], FLOW: [-1, 1],
}

export interface LiveSnapshot {
  publishedAt: string
  schemaVersion: number
  parts: Record<string, Record<string, number>>
}

function fail(msg: string): never { throw new Error(`[live-shape] ${msg}`) }

export function parseSnapshot(raw: unknown): LiveSnapshot {
  if (!raw || typeof raw !== 'object') fail('not an object')
  const o = raw as any
  if (typeof o.publishedAt !== 'string') fail('missing publishedAt')
  if (o.schemaVersion !== SCHEMA_VERSION) fail(`unexpected schemaVersion: ${o.schemaVersion}`)
  if (!o.parts || typeof o.parts !== 'object') fail('missing parts')

  for (const [partId, metrics] of Object.entries(o.parts)) {
    if (!LIVE_PART_IDS.includes(partId as any)) fail(`unknown part ${partId}`)
    if (!metrics || typeof metrics !== 'object') fail(`part ${partId} not object`)
    for (const [label, v] of Object.entries(metrics as any)) {
      const bounds = LIVE_CLAMPS[label]
      if (!bounds) fail(`unknown metric label ${label} on ${partId}`)
      if (typeof v !== 'number' || !Number.isFinite(v)) fail(`${partId}.${label} not finite`)
      if (v < bounds[0] || v > bounds[1]) fail(`${partId}.${label} outside clamp ${bounds}`)
    }
  }
  return o as LiveSnapshot
}
