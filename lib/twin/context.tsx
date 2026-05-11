'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createTwinStore, type TwinStore } from './telemetry'
import { createLiveTwinStore, type LiveStatus, type LiveTwinStore } from './live-store'
import type { Metric, ScenarioId } from './types'

const TwinContext = createContext<TwinStore | null>(null)
const LiveTwinContext = createContext<LiveTwinStore | null>(null)

export interface TwinProviderProps {
  initialScenario: ScenarioId
  children: React.ReactNode
}

/**
 * Provides a single `TwinStore` to a subtree. The seed salt is generated once
 * per `TwinProvider` mount and persists across React StrictMode's double-mount
 * via `useRef`, so the store created in `useMemo` is stable.
 */
export function TwinProvider({ initialScenario, children }: TwinProviderProps) {
  // Stable seed salt for this provider instance. Not regenerated on
  // StrictMode's second render, because useRef's value survives.
  const seedRef = useRef<string | null>(null)
  if (seedRef.current === null) {
    seedRef.current = `twin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }

  const store = useMemo(
    () => createTwinStore(initialScenario, seedRef.current!),
    // We intentionally only create the store once; scenario changes should go
    // through `store.setScenario(...)` from consumers, not by remounting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    return () => {
      store.dispose()
    }
  }, [store])

  return <TwinContext.Provider value={store}>{children}</TwinContext.Provider>
}

export interface LiveTwinProviderProps {
  children: React.ReactNode
  pollMs?: number
}

/**
 * Provides a single `LiveTwinStore` that polls `/api/twin/live`. When nested
 * inside a `TwinProvider`, the live context takes precedence in `useTwinMetric`
 * and `useFlowSpeed` — consumers read live data when present and fall back to
 * synthetic otherwise.
 */
export function LiveTwinProvider({ children, pollMs }: LiveTwinProviderProps) {
  const storeRef = useRef<LiveTwinStore | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createLiveTwinStore(pollMs === undefined ? {} : { pollMs })
  }

  useEffect(() => {
    const current = storeRef.current
    return () => {
      current?.dispose()
    }
  }, [])

  return (
    <LiveTwinContext.Provider value={storeRef.current}>{children}</LiveTwinContext.Provider>
  )
}

/**
 * Returns the active TwinStore. Throws if used outside `<TwinProvider>` —
 * this is an internal invariant for components that require live telemetry.
 */
export function useTwinStore(): TwinStore {
  const store = useContext(TwinContext)
  if (store === null) {
    throw new Error('useTwinStore must be used within <TwinProvider>')
  }
  return store
}

/**
 * Returns the current LiveStatus if a `<LiveTwinProvider>` wraps the tree,
 * otherwise `null`. Re-renders when the live store's status changes.
 */
export function useLiveStatus(): LiveStatus | null {
  const store = useContext(LiveTwinContext)
  const [status, setStatus] = useState<LiveStatus | null>(() => (store ? store.getStatus() : null))

  useEffect(() => {
    if (!store) {
      setStatus(null)
      return
    }
    return store.subscribeStatus((s) => setStatus(s))
  }, [store])

  return status
}

/**
 * Subscribes to metrics for a given `partId`. Prefers the live store when
 * `<LiveTwinProvider>` wraps the tree; falls back to synthetic `TwinStore`.
 * When `partId` is `null`, returns an empty array and does not subscribe.
 */
export function useTwinMetric(partId: string | null): Metric[] {
  const liveStore = useContext(LiveTwinContext)
  const syntheticStore = useContext(TwinContext)
  const source: TwinStore | null = liveStore ?? syntheticStore
  const [metrics, setMetrics] = useState<Metric[]>([])

  useEffect(() => {
    if (partId === null || !source) {
      setMetrics([])
      return
    }
    return source.subscribe(partId, (next) => {
      setMetrics(next)
    })
  }, [source, partId])

  return metrics
}

/**
 * Returns the current `flowSpeed`. Prefers the live store when present,
 * otherwise reads from the synthetic `TwinStore`. Returns `1` when neither
 * provider wraps the tree.
 *
 * For live: piggybacks on `subscribeStatus` (fires each poll tick) so we
 * refresh when new telemetry arrives *and* keep the poller alive via the
 * subscription. For synthetic: polls every 250ms since scenario changes
 * aren't published through a subscription channel.
 */
export function useFlowSpeed(): number {
  const liveStore = useContext(LiveTwinContext)
  const syntheticStore = useContext(TwinContext)
  const source: TwinStore | null = liveStore ?? syntheticStore
  const [speed, setSpeed] = useState<number>(() => (source ? source.getFlowSpeed() : 1))

  useEffect(() => {
    if (!source) {
      setSpeed(1)
      return
    }
    setSpeed(source.getFlowSpeed())
    if (liveStore) {
      return liveStore.subscribeStatus(() => setSpeed(liveStore.getFlowSpeed()))
    }
    const id = setInterval(() => {
      setSpeed(source.getFlowSpeed())
    }, 250)
    return () => clearInterval(id)
  }, [source, liveStore])

  return speed
}
