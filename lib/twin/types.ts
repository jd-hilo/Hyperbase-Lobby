export type ScenarioId = 'PEAK' | 'SOLAR_MAX' | 'GRID_CONSTRAINED' | 'DISPATCH_TICK'

export interface MetricSpec {
  label: string
  unit: string
  min: number
  max: number
  mean: number
  volatility: number
  precision?: number
}

export interface Metric {
  id: string
  label: string
  value: string
  unit: string
  trend: 'up' | 'down' | 'flat'
}

export interface ScenarioDef {
  id: ScenarioId
  label: string
  description: string
  flowSpeed: number
  tickMs: number
  metrics: Record<string, MetricSpec[]>
}
