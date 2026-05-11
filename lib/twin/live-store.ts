'use client'
import type { Metric } from './types'
import type { TwinStore } from './telemetry'
import type { LiveSnapshot } from './live-shape'

type Listener = (metrics: Metric[]) => void
type StatusListener = (status: LiveStatus) => void

export interface LiveStatus {
  fresh: boolean
  stale: boolean
  lost: boolean
  ageSeconds: number | null
  publishedAt: string | null
  error?: string
}

export interface LiveTwinStore extends TwinStore {
  getStatus(): LiveStatus
  subscribeStatus(cb: StatusListener): () => void
}

const STALE_MS = 15_000
const LOST_MS = 30_000

const PRECISIONS: Record<string, number> = {
  POWER: 1, INLET: 1, UTIL: 0, SUPPLY: 1, DELTA: 1, COP: 2, FREQ: 3, FLOW: 2,
}
const UNITS: Record<string, string> = {
  POWER: 'kW/u',
  INLET: '\u00B0C',
  UTIL: '%',
  SUPPLY: '\u00B0C',
  DELTA: '\u00B0C',
  COP: 'ratio',
  FREQ: 'Hz',
  FLOW: 'pu',
}

function buildMetrics(
  partId: string,
  raw: Record<string, number>,
  prev: Record<string, number>,
): Metric[] {
  return Object.entries(raw).map(([label, v]) => {
    const p = PRECISIONS[label] ?? 1
    const before = prev[label]
    const trend: Metric['trend'] =
      before === undefined
        ? 'flat'
        : v > before + Math.abs(before) * 0.01
          ? 'up'
          : v < before - Math.abs(before) * 0.01
            ? 'down'
            : 'flat'
    return {
      id: `${partId}.${label}`,
      label,
      value: v.toFixed(p),
      unit: UNITS[label] ?? '',
      trend,
    }
  })
}

function computeStatus(publishedAtIso: string, now: number): LiveStatus {
  const age = (now - Date.parse(publishedAtIso)) / 1000
  return {
    fresh: age < STALE_MS / 1000,
    stale: age >= STALE_MS / 1000 && age < LOST_MS / 1000,
    lost: age >= LOST_MS / 1000,
    ageSeconds: age,
    publishedAt: publishedAtIso,
  }
}

export function createLiveTwinStore(opts: { pollMs?: number } = {}): LiveTwinStore {
  const pollMs = opts.pollMs ?? 5000
  const listeners = new Map<string, Set<Listener>>()
  const prevValues = new Map<string, Record<string, number>>()
  const statusListeners = new Set<StatusListener>()

  let status: LiveStatus = {
    fresh: false,
    stale: false,
    lost: false,
    ageSeconds: null,
    publishedAt: null,
  }
  let lastGood: LiveSnapshot | null = null
  let interval: ReturnType<typeof setInterval> | null = null
  let fetching = false

  function emitStatus() {
    statusListeners.forEach((cb) => cb(status))
  }

  function emitPart(partId: string, snapshot: LiveSnapshot) {
    const set = listeners.get(partId)
    if (!set || set.size === 0) return
    const raw = snapshot.parts[partId]
    if (!raw) return
    const prev = prevValues.get(partId) ?? {}
    const metrics = buildMetrics(partId, raw, prev)
    prevValues.set(partId, { ...raw })
    set.forEach((cb) => cb(metrics))
  }

  async function tick() {
    if (fetching) return
    fetching = true
    try {
      const res = await fetch('/api/twin/live', { cache: 'no-store' })
      if (!res.ok) throw new Error(`route ${res.status}`)
      const snap = (await res.json()) as LiveSnapshot
      status = computeStatus(snap.publishedAt, Date.now())
      lastGood = snap
      if (!status.lost) {
        for (const partId of listeners.keys()) emitPart(partId, snap)
      }
    } catch (e) {
      status = {
        fresh: false,
        stale: false,
        lost: true,
        ageSeconds: null,
        publishedAt: null,
        error: (e as Error).message,
      }
    } finally {
      fetching = false
      emitStatus()
    }
  }

  function ensurePolling() {
    if (interval !== null) return
    if (typeof window === 'undefined') return
    interval = setInterval(tick, pollMs)
    // Kick off an immediate tick so first data arrives before pollMs elapses.
    tick()
  }

  function teardown() {
    if (interval !== null) {
      clearInterval(interval)
      interval = null
    }
  }

  return {
    getScenarioId: () => 'PEAK',
    setScenario: () => {
      // no-op: live store is driven by publisher, not scenarios
    },
    getFlowSpeed: () => {
      if (!lastGood || status.lost) return 1
      const a = lastGood.parts.dgx1_ddn?.UTIL ?? 50
      const b = lastGood.parts.dgx2_h100?.UTIL ?? 50
      const avg = (a + b) / 2
      return 0.6 + (avg / 100) * 1.2
    },
    subscribe(partId, cb) {
      let set = listeners.get(partId)
      if (!set) {
        set = new Set()
        listeners.set(partId, set)
      }
      set.add(cb)
      ensurePolling()
      if (lastGood && !status.lost && lastGood.parts[partId]) {
        cb(buildMetrics(partId, lastGood.parts[partId], prevValues.get(partId) ?? {}))
      }
      return () => {
        const s = listeners.get(partId)
        if (!s) return
        s.delete(cb)
        if (s.size === 0) {
          listeners.delete(partId)
          prevValues.delete(partId)
        }
        if (listeners.size === 0 && statusListeners.size === 0) teardown()
      }
    },
    dispose() {
      teardown()
      listeners.clear()
      prevValues.clear()
      statusListeners.clear()
      lastGood = null
    },
    getStatus: () => status,
    subscribeStatus(cb) {
      statusListeners.add(cb)
      ensurePolling()
      cb(status)
      return () => {
        statusListeners.delete(cb)
        if (listeners.size === 0 && statusListeners.size === 0) teardown()
      }
    },
  }
}
