import { SCENARIOS } from './scenarios'
import type { Metric, MetricSpec, ScenarioDef, ScenarioId } from './types'

// ---- PRNG (Mulberry32) -----------------------------------------------------

/** xmur3 string hash -> uint32 seed. Deterministic for a given input string. */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

/** Mulberry32: fast, small-state, deterministic 32-bit PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---- Store -----------------------------------------------------------------

/**
 * @public
 * Reusable telemetry store returned by {@link createTwinStore}. Safe to
 * `dispose()` and resubscribe — the interval and part state rearm lazily.
 */
export interface TwinStore {
  getScenarioId(): ScenarioId
  getFlowSpeed(): number
  setScenario(id: ScenarioId): void
  subscribe(partId: string, cb: (metrics: Metric[]) => void): () => void
  dispose(): void
}

type PartState = {
  values: number[] // raw numeric values per metric, parallel to scenario.metrics[partId]
  prev: number[] // previous raw values, for trend detection
}

type Listener = (metrics: Metric[]) => void

function formatValue(spec: MetricSpec, value: number): string {
  const precision = spec.precision ?? (Number.isInteger(spec.max) && Number.isInteger(spec.min) ? 0 : 1)
  return value.toFixed(precision)
}

function trendOf(prev: number, next: number, spec: MetricSpec): 'up' | 'down' | 'flat' {
  const threshold = spec.volatility * 0.05
  const delta = next - prev
  if (delta > threshold) return 'up'
  if (delta < -threshold) return 'down'
  return 'flat'
}

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min
  if (v > max) return max
  return v
}

/**
 * Create a scenario-driven random-walk telemetry store.
 *
 * The store runs a single interval while at least one listener is subscribed,
 * and drives random-walks for every subscribed partId using a PRNG seeded from
 * `seedSalt + scenarioId`. This means two stores constructed with the same
 * seedSalt will emit identical value sequences for the same scenario.
 */
export function createTwinStore(initial: ScenarioId, seedSalt = ''): TwinStore {
  let scenarioId: ScenarioId = initial
  let scenario: ScenarioDef = SCENARIOS[scenarioId]
  let rand: () => number = mulberry32(hashSeed(seedSalt + ':' + scenarioId))

  const listeners = new Map<string, Set<Listener>>()
  const state = new Map<string, PartState>()
  let interval: ReturnType<typeof setInterval> | null = null

  // --- internal helpers ---

  function buildMetrics(partId: string): Metric[] {
    const specs = scenario.metrics[partId]
    if (!specs) return []
    const ps = state.get(partId)
    if (!ps) return []
    return specs.map((spec, i) => ({
      id: `${partId}.${spec.label}`,
      label: spec.label,
      value: formatValue(spec, ps.values[i]),
      unit: spec.unit,
      trend: trendOf(ps.prev[i], ps.values[i], spec),
    }))
  }

  function seedPart(partId: string): void {
    const specs = scenario.metrics[partId]
    if (!specs) {
      state.delete(partId)
      return
    }
    // Initialize each metric with a value near its mean, jittered by one
    // random step. Using the mean as the starting point keeps early ticks
    // well away from the clamp bounds while remaining deterministic.
    const values = specs.map((spec) => {
      const step = (rand() - 0.5) * 2 * spec.volatility
      return clamp(spec.mean + step, spec.min, spec.max)
    })
    const prev = values.slice()
    state.set(partId, { values, prev })
  }

  function emitPart(partId: string): void {
    const set = listeners.get(partId)
    if (!set || set.size === 0) return
    const metrics = buildMetrics(partId)
    for (const cb of set) cb(metrics)
  }

  function tick(): void {
    for (const partId of listeners.keys()) {
      const specs = scenario.metrics[partId]
      const ps = state.get(partId)
      if (!specs || !ps) continue
      ps.prev = ps.values.slice()
      ps.values = specs.map((spec, i) => {
        const step = (rand() - 0.5) * 2 * spec.volatility
        // Gentle pull toward mean keeps the walk bounded in practice;
        // clamp then enforces the hard spec min/max.
        const pull = (spec.mean - ps.values[i]) * 0.05
        return clamp(ps.values[i] + step + pull, spec.min, spec.max)
      })
      emitPart(partId)
    }
  }

  function ensureInterval(): void {
    if (interval !== null) return
    if (listeners.size === 0) return
    interval = setInterval(tick, scenario.tickMs)
  }

  function maybeStopInterval(): void {
    if (interval !== null && listeners.size === 0) {
      clearInterval(interval)
      interval = null
    }
  }

  // --- public API ---

  function getScenarioId(): ScenarioId {
    return scenarioId
  }

  function getFlowSpeed(): number {
    return scenario.flowSpeed
  }

  function setScenario(id: ScenarioId): void {
    scenarioId = id
    scenario = SCENARIOS[id]
    rand = mulberry32(hashSeed(seedSalt + ':' + scenarioId))

    // Clear state, then re-seed every part that currently has subscribers.
    state.clear()
    for (const partId of listeners.keys()) {
      seedPart(partId)
    }

    // Restart interval with new tickMs.
    if (interval !== null) {
      clearInterval(interval)
      interval = null
    }
    ensureInterval()

    // Emit once so subscribers can re-render immediately.
    for (const partId of listeners.keys()) {
      emitPart(partId)
    }
  }

  function subscribe(partId: string, cb: Listener): () => void {
    let set = listeners.get(partId)
    const firstForPart = !set
    if (!set) {
      set = new Set()
      listeners.set(partId, set)
    }
    set.add(cb)

    // Seed this part's state the first time anyone subscribes to it.
    if (firstForPart) {
      seedPart(partId)
    }

    ensureInterval()

    // Synchronous initial emit: call just this subscriber with current state.
    cb(buildMetrics(partId))

    let active = true
    return function unsubscribe() {
      if (!active) return
      active = false
      const s = listeners.get(partId)
      if (!s) return
      s.delete(cb)
      if (s.size === 0) {
        listeners.delete(partId)
        state.delete(partId)
      }
      maybeStopInterval()
    }
  }

  /**
   * Clears the active tick interval and in-memory state. Safe to call multiple
   * times. Re-subscribing after dispose is supported: the interval re-arms
   * lazily on the next subscribe(), and part state re-seeds from the current
   * PRNG position. Used by TwinProvider's cleanup effect, which re-mounts
   * under React StrictMode in development.
   */
  function dispose(): void {
    if (interval !== null) {
      clearInterval(interval)
      interval = null
    }
    listeners.clear()
    state.clear()
  }

  return {
    getScenarioId,
    getFlowSpeed,
    setScenario,
    subscribe,
    dispose,
  }
}

/**
 * Reduced-motion accommodation: cap the tick rate to at most one update every
 * 6 seconds, regardless of the scenario's nominal tickMs.
 */
export function applyReducedMotion(tickMs: number): number {
  return Math.max(tickMs, 6000)
}
