// Scene component registry for the digital-twin view.
// Zones: A (electrical), B (compute), C (cooling), D (utility/grid edge), INFRA (data).
// Identifiers and descriptions are kept generic; click-through InfoPanel
// shows only functional detail, never vendor or model names.

export interface PartInfo {
  id: string;
  name: string;
  zone?: "A" | "B" | "C" | "D" | "INFRA";
  category: string;
  description: string;
  specs: Record<string, string>;
  mqttTopic?: string;
  status: "online" | "standby" | "offline" | "alarm";
}

// Zone color map matching the schematic
export const ZONE_COLORS = {
  A: "#e65c00",   // orange — North Wall Electrical
  B: "#1a7a3c",   // green  — DGX Compute Alley
  C: "#c0392b",   // red    — Vertiv PDX
  D: "#1a4f8a",   // blue   — Utility / Grid Edge
  INFRA: "#888888",
} as const;

export const PARTS: Record<string, PartInfo> = {
  main_switchboard: {
    id: "main_switchboard",
    name: "Main Switchboard",
    zone: "A",
    category: "Electrical / North Wall",
    description: "Primary utility feed-in panel. Distributes power to Sub-P1, Sub-P2, and Sub-P3 downstream sub-panels via 3-phase bus.",
    specs: {
      "Feed": "Utility Feed In",
      "Downstream": "Sub-P1, Sub-P2, Sub-P3",
      "Voltage": "208V 3Ø",
      "Location": "North Wall NE Corner",
    },
    status: "online",
  },
  sub_p1: {
    id: "sub_p1",
    name: "Sub-Panel 1",
    zone: "A",
    category: "Electrical / North Wall",
    description: "Distribution sub-panel fed from the main switchboard. Per-phase power metering via CT clamps.",
    specs: {
      "Voltage": "208V 3Ø",
      "Metering": "Per-phase CT",
      "Breaker": "BKR inline",
    },
    status: "online",
  },
  sub_p2: {
    id: "sub_p2",
    name: "Sub-Panel 2",
    zone: "A",
    category: "Electrical / North Wall",
    description: "Distribution sub-panel fed from the main switchboard. Per-phase power metering via CT clamps.",
    specs: {
      "Voltage": "208V 3Ø",
      "Metering": "Per-phase CT",
      "Breaker": "BKR inline",
    },
    status: "online",
  },
  sub_p3: {
    id: "sub_p3",
    name: "Sub-Panel 3",
    zone: "A",
    category: "Electrical / North Wall",
    description: "Third distribution sub-panel from Main Switchboard. Powers downstream DGX compute loads.",
    specs: {
      "Voltage": "208V 3Ø",
      "Location": "North Wall lower",
      "Breaker": "BKR inline",
    },
    status: "online",
  },
  t1_ambient: {
    id: "t1_ambient",
    name: "T1",
    zone: "A",
    category: "Sensor / Thermal",
    description: "Ambient temperature and humidity sensor mounted between the switchboard and sub-panels on the North Wall.",
    specs: {
      "Measures": "Temp · Humidity · Pressure",
      "Location": "North Wall ambient",
      "Poll Rate": "5–10 sec",
    },
    status: "online",
  },
  u1_emporia: {
    id: "u1_emporia",
    name: "U1",
    zone: "D",
    category: "Sensor / Power / Utility",
    description: "CT clamp on the main utility feed. Grid-edge measurement anchor.",
    specs: {
      "Measures": "Current · Voltage · kW",
      "Location": "Main switchboard feed",
      "Role": "Grid-edge anchor",
    },
    status: "online",
  },
  network_switch: {
    id: "network_switch",
    name: "Network / Switch Rack",
    zone: "B",
    category: "Infrastructure / Compute",
    description: "Network and switch infrastructure rack. Houses core switching, patch panels, and rack infra for the DGX compute alley.",
    specs: {
      "Type": "Network / RACK / INFRA",
      "Location": "Zone B center-left",
    },
    status: "online",
  },
  dgx1_ddn: {
    id: "dgx1_ddn",
    name: "Compute Pod 1",
    zone: "B",
    category: "Compute / Storage",
    description: "GPU compute pod with integrated storage. Per-GPU power, temperature, utilization, and memory are exposed via in-band telemetry.",
    specs: {
      "Role": "Compute + storage",
      "Inlet Sensor": "T2",
      "Outlet Sensor": "T3",
    },
    status: "online",
  },
  dgx2_h100: {
    id: "dgx2_h100",
    name: "Compute Pod 2",
    zone: "B",
    category: "Compute / GPU",
    description: "GPU compute pod with in-line UPS. Per-GPU telemetry streamed to the broker.",
    specs: {
      "Role": "GPU compute",
      "UPS": "In-line",
      "Inlet Sensor": "T4",
      "Outlet Sensor": "T5",
    },
    status: "online",
  },
  t2_pod1_inlet: { id: "t2_pod1_inlet", name: "T2", zone: "B", category: "Sensor / Thermal", description: "Thermal sensor at Pod-1 east face (inlet air).", specs: { "Position": "Pod-1 inlet (east face)", "Poll Rate": "5–10 sec" }, status: "online" },
  t3_pod1_outlet: { id: "t3_pod1_outlet", name: "T3", zone: "B", category: "Sensor / Thermal", description: "Thermal sensor at Pod-1 west face (outlet air).", specs: { "Position": "Pod-1 outlet (west face)", "Poll Rate": "5–10 sec" }, status: "online" },
  t4_pod2_inlet: { id: "t4_pod2_inlet", name: "T4", zone: "B", category: "Sensor / Thermal", description: "Thermal sensor at Pod-2 east face (inlet air).", specs: { "Position": "Pod-2 inlet (east face)", "Poll Rate": "5–10 sec" }, status: "online" },
  t5_pod2_outlet: { id: "t5_pod2_outlet", name: "T5", zone: "B", category: "Sensor / Thermal", description: "Thermal sensor at Pod-2 west face (outlet air).", specs: { "Position": "Pod-2 outlet (west face)", "Poll Rate": "5–10 sec" }, status: "online" },
  t6_alley_e: { id: "t6_alley_e", name: "T6", zone: "B", category: "Sensor / Thermal", description: "Thermal sensor in hot/cold aisle, east position.", specs: { "Position": "Alley East" }, status: "online" },
  t7_alley_w: { id: "t7_alley_w", name: "T7", zone: "B", category: "Sensor / Thermal", description: "Thermal sensor in hot/cold aisle, west position.", specs: { "Position": "Alley West" }, status: "online" },
  vertiv_pdx: {
    id: "vertiv_pdx",
    name: "Precision Cooling",
    zone: "C",
    category: "Cooling / CRAC",
    description: "Precision cooling unit. Supply and return air temperatures measured at T8 and T9.",
    specs: {
      "Role": "Precision cooling",
      "Location": "SW Corner",
      "Supply Sensor": "T8",
      "Return Sensor": "T9",
    },
    status: "online",
  },
  t8_pdx_supply: { id: "t8_pdx_supply", name: "T8", zone: "C", category: "Sensor / Thermal", description: "Thermal sensor on cooling supply air side.", specs: { "Position": "Cooling supply air" }, status: "alarm" },
  t9_pdx_return: { id: "t9_pdx_return", name: "T9", zone: "C", category: "Sensor / Thermal", description: "Thermal sensor on cooling return air side.", specs: { "Position": "Cooling return air" }, status: "online" },
  mqtt_broker: {
    id: "mqtt_broker",
    name: "Broker",
    zone: "INFRA",
    category: "Data Infrastructure",
    description: "Central message broker aggregating telemetry from all sensor nodes.",
    specs: {
      "Role": "Telemetry aggregation",
      "QoS": "Level 1",
      "Power poll": "1–5 sec",
      "Thermal poll": "5–10 sec",
    },
    status: "online",
  },
};
