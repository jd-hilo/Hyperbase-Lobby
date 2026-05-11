import type { MetricSpec, ScenarioDef, ScenarioId } from './types'

/**
 * Single audit surface for the "digital twin" telemetry demo.
 *
 * Guard-rails (enforced by `scenarios.test.ts`):
 *  - No absolute MW/MWh values. Units are ratios, percentages, setpoints only.
 *  - No site codes, customer names, or geographic strings.
 *  - Rack util max <= 100. Inlet temp max <= 60. Frequency within [59.5, 60.5].
 *  - flowSpeed in [0.3, 2.0]; tickMs in [100, 10000].
 *  - For every metric: min <= mean <= max.
 *
 * Part IDs below map 1:1 to the scene's PartInfo.id registry in
 * `components/diagrams/types.ts`. Parts without an entry here show only
 * their static description in the InfoPanel (no live-metrics block).
 */

// ---- Helper factories ------------------------------------------------------

function RACK(powerMean: number, powerVol: number, utilMean: number, utilVol = 3): MetricSpec[] {
  return [
    { label: 'POWER', unit: 'kW/u', min: 8, max: 22, mean: powerMean, volatility: powerVol },
    { label: 'INLET', unit: '\u00B0C', min: 18, max: 32, mean: 24, volatility: 0.3 },
    { label: 'UTIL', unit: '%', min: 0, max: 100, mean: utilMean, volatility: utilVol },
  ]
}

function SWITCH(powerMean: number, utilMean: number): MetricSpec[] {
  return [
    { label: 'POWER', unit: 'kW/u', min: 1, max: 6, mean: powerMean, volatility: 0.4 },
    { label: 'UTIL', unit: '%', min: 0, max: 100, mean: utilMean, volatility: 2 },
  ]
}

function COOLING(supply: number, deltaT: number, cop: number): MetricSpec[] {
  return [
    { label: 'SUPPLY', unit: '\u00B0C', min: 10, max: 24, mean: supply, volatility: 0.25 },
    { label: 'DELTA', unit: '\u00B0C', min: 2, max: 16, mean: deltaT, volatility: 0.3 },
    { label: 'COP', unit: 'ratio', min: 1.5, max: 5.5, mean: cop, volatility: 0.08, precision: 2 },
  ]
}

function GRID(freqMean: number, flowMean: number): MetricSpec[] {
  return [
    { label: 'FREQ', unit: 'Hz', min: 59.9, max: 60.1, mean: freqMean, volatility: 0.01, precision: 3 },
    { label: 'FLOW', unit: 'pu', min: -1, max: 1, mean: flowMean, volatility: 0.05, precision: 2 },
  ]
}

// ---- Scenarios -------------------------------------------------------------
//
// Part keys correspond to `PartInfo.id` entries in the scene registry:
//   dgx1_ddn, dgx2_h100  — GPU compute pods (rack metrics)
//   network_switch        — network / switch rack (light rack metrics)
//   vertiv_pdx            — precision cooling unit (cooling metrics)
//   u1_emporia            — utility feed-in CT clamp (grid metrics)

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = {
  PEAK: {
    id: 'PEAK',
    label: 'Peak',
    description:
      'High utilization — compute load near peak. Cooling works hard, grid import elevated.',
    flowSpeed: 1.8,
    tickMs: 1500,
    metrics: {
      dgx1_ddn: RACK(18, 2.5, 72),
      dgx2_h100: RACK(17, 2.5, 72),
      network_switch: SWITCH(3.8, 58),
      vertiv_pdx: COOLING(14, 12, 3.1),
      u1_emporia: GRID(59.98, 0.45),
    },
  },
  SOLAR_MAX: {
    id: 'SOLAR_MAX',
    label: 'Solar Max',
    description:
      'Midday overgeneration — compute de-rated, cooling rides easy, grid flow reverses.',
    flowSpeed: 1.0,
    tickMs: 1500,
    metrics: {
      dgx1_ddn: RACK(13, 2, 52),
      dgx2_h100: RACK(12, 2, 48),
      network_switch: SWITCH(2.8, 42),
      vertiv_pdx: COOLING(16, 7, 4.2),
      u1_emporia: GRID(60.02, -0.25),
    },
  },
  GRID_CONSTRAINED: {
    id: 'GRID_CONSTRAINED',
    label: 'Grid Constrained',
    description:
      'Interconnect curtailment — compute trimmed, cooling scaled down, grid flow near zero.',
    flowSpeed: 0.4,
    tickMs: 1500,
    metrics: {
      dgx1_ddn: RACK(15, 2, 60),
      dgx2_h100: RACK(14, 2, 56),
      network_switch: SWITCH(3.2, 50),
      vertiv_pdx: COOLING(15, 9, 3.6),
      u1_emporia: GRID(60.0, 0.02),
    },
  },
  DISPATCH_TICK: {
    id: 'DISPATCH_TICK',
    label: 'Dispatch Tick',
    description:
      'Fast clearing cadence — setpoints update frequently, telemetry breathes.',
    flowSpeed: 1.5,
    tickMs: 400,
    metrics: {
      dgx1_ddn: RACK(16, 3, 64),
      dgx2_h100: RACK(16, 3, 64),
      network_switch: SWITCH(3.4, 54),
      vertiv_pdx: COOLING(15, 10, 3.4),
      u1_emporia: GRID(60.0, 0.15),
    },
  },
}

export const SCENARIO_ORDER: ScenarioId[] = ['PEAK', 'SOLAR_MAX', 'GRID_CONSTRAINED', 'DISPATCH_TICK']
