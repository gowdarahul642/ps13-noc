// ─── PS13 NOC Mock Data & Live Simulation ─────────────────────────

export const SYSTEM_HEALTH = [
  { id: 'telemetry', label: 'Telemetry', status: 'ok',   detail: '3s ago' },
  { id: 'ml',        label: 'ML Engine', status: 'ok',   detail: 'Running' },
  { id: 'llm',       label: 'Phi-3 LLM', status: 'ok',   detail: 'Online' },
  { id: 'prom',      label: 'Prometheus', status: 'warn', detail: 'Lag 8s' },
  { id: 'elastic',   label: 'Elastic',   status: 'ok',   detail: 'Running' },
  { id: 'api',       label: 'FastAPI',   status: 'ok',   detail: 'Online' },
  { id: 'redis',     label: 'Redis',     status: 'ok',   detail: 'Online' },
];

export const INITIAL_KPI = [
  { id: 'routers',   label: 'Total Routers',     value: '24',   unit: '',    status: 'ok',   trend: 'stable', trendVal: '±0 · 24h',    icon: 'ti-router' },
  { id: 'tunnels',   label: 'Active Tunnels',     value: '187',  unit: '',    status: 'warn', trend: 'down',   trendVal: '−3 · 1h',     icon: 'ti-network' },
  { id: 'alerts',    label: 'Active Alerts',      value: '7',    unit: '',    status: 'crit', trend: 'up',     trendVal: '+2 · 30m',    icon: 'ti-alert-triangle' },
  { id: 'risk',      label: 'AI Risk Score',      value: '91',   unit: '%',   status: 'crit', trend: 'up',     trendVal: '+18pts · 43m', icon: 'ti-brain' },
  { id: 'latency',   label: 'Avg. Latency',       value: '142',  unit: 'ms',  status: 'warn', trend: 'up',     trendVal: '+34ms · 1h',  icon: 'ti-clock' },
  { id: 'loss',      label: 'Packet Loss',         value: '2.4',  unit: '%',   status: 'crit', trend: 'up',     trendVal: '+1.2% · 30m', icon: 'ti-activity' },
  { id: 'bandwidth', label: 'Bandwidth Used',      value: '68',   unit: '%',   status: 'ok',   trend: 'stable', trendVal: 'Stable · 2h', icon: 'ti-chart-area' },
  { id: 'links',     label: 'Healthy Links',       value: '219',  unit: '/226', status: 'warn', trend: 'down',   trendVal: '7 degraded',  icon: 'ti-link' },
];

export const PREDICTIONS = [
  {
    id: 'p1',
    device: 'Router PE-02',
    tunnel: 'MPLS-T102',
    fault: 'Tunnel Packet Loss ↑',
    risk: 91,
    confidence: 95,
    leadTime: '~43 min',
    status: 'crit',
  },
  {
    id: 'p2',
    device: 'Router PE-04',
    tunnel: 'MPLS-T088',
    fault: 'High latency / congestion',
    risk: 64,
    confidence: 78,
    leadTime: '~2.1 hr',
    status: 'warn',
  },
  {
    id: 'p3',
    device: 'CE-07',
    tunnel: 'BGP Session',
    fault: 'Route instability',
    risk: 57,
    confidence: 71,
    leadTime: '~4 hr',
    status: 'warn',
  },
];

export const ALERTS = [
  { id: 'a1', ts: '10:32:21', device: 'PE-02',      event: 'Packet Loss Spike',      sev: 'crit', status: 'Open',     owner: 'Op-01' },
  { id: 'a2', ts: '10:30:05', device: 'MPLS-T102',  event: 'Tunnel Latency ↑',       sev: 'crit', status: 'Open',     owner: 'Op-01' },
  { id: 'a3', ts: '10:28:44', device: 'CE-07',       event: 'BGP Peer Down',          sev: 'warn', status: 'Open',     owner: 'Unassigned' },
  { id: 'a4', ts: '10:25:11', device: 'PE-04',       event: 'CPU > 85%',              sev: 'warn', status: 'ACK',      owner: 'Op-02' },
  { id: 'a5', ts: '10:22:33', device: 'PE-02',       event: 'Jitter > 50ms',          sev: 'warn', status: 'Open',     owner: 'Op-01' },
  { id: 'a6', ts: '10:18:09', device: 'CORE-01',    event: 'Interface flap Gi0/2',   sev: 'warn', status: 'Resolved', owner: 'Op-02' },
  { id: 'a7', ts: '10:12:00', device: 'PE-07',       event: 'Memory usage 90%',       sev: 'warn', status: 'Open',     owner: 'Unassigned' },
];

export const TIMELINE = [
  { id: 't1', time: '10:32', type: 'crit', label: 'Alert generated',   desc: 'PE-02 packet loss spike — 2.4% detected' },
  { id: 't2', time: '10:30', type: 'crit', label: 'Fault predicted',   desc: 'MPLS-T102 failure probability 91% · 43 min' },
  { id: 't3', time: '10:28', type: 'warn', label: 'BGP session down',  desc: 'CE-07 peer lost — route reconvergence in progress' },
  { id: 't4', time: '10:25', type: 'warn', label: 'CPU anomaly',       desc: 'PE-04 IsolationForest score 0.79 — above threshold' },
  { id: 't5', time: '10:20', type: 'info', label: 'Score update',      desc: 'XGBoost re-scored PE-02 tunnel: 88% → 91%' },
  { id: 't6', time: '10:15', type: 'warn', label: 'Latency drift',     desc: 'T102 latency climbing: 95ms → 148ms over 15min' },
  { id: 't7', time: '10:10', type: 'ok',   label: 'Baseline recorded', desc: 'All 24 routers nominal — telemetry cycle complete' },
];

export const CONSOLE_STREAM = [
  { ts: '10:32:21.441', component: '[TELEM]',      level: 'ok',   msg: 'Packet rcvd PE-02 · loss=2.41%  lat=148ms  jitter=52ms' },
  { ts: '10:32:21.512', component: '[ISOFOREST]',  level: 'warn', msg: 'Anomaly score: 0.847  (threshold 0.75) → ANOMALY FLAGGED' },
  { ts: '10:32:21.559', component: '[XGBOOST]',    level: 'warn', msg: 'Failure probability: 91.3%  feature: pkt_loss=2.41  Δlat=+34ms' },
  { ts: '10:32:21.601', component: '[ROOT-CAUSE]', level: 'crit', msg: 'Classifier: Tunnel congestion  conf=95%  device=PE-02  tunnel=MPLS-T102' },
  { ts: '10:32:21.620', component: '[RISK-ENGINE]',level: 'crit', msg: 'Risk score: 91%  lead_time_est=43min  action=ALERT' },
  { ts: '10:32:21.635', component: '[ALERT]',      level: 'info', msg: 'Alert #A-2847 dispatched → sev=CRITICAL → on-call notified' },
  { ts: '10:32:26.102', component: '[TELEM]',      level: 'ok',   msg: 'Packet rcvd PE-04 · loss=0.12%  lat=62ms   cpu=87%' },
  { ts: '10:32:26.188', component: '[ISOFOREST]',  level: 'ok',   msg: 'Anomaly score: 0.631  (below threshold) → nominal' },
  { ts: '10:32:31.210', component: '[TELEM]',      level: 'ok',   msg: 'Packet rcvd PE-03 · loss=0.01%  lat=44ms   mem=62%' },
  { ts: '10:32:36.440', component: '[XGBOOST]',    level: 'warn', msg: 'Risk update PE-02: 91.3% → 92.1%  trend RISING' },
  { ts: '10:32:41.800', component: '[SHAP]',       level: 'info', msg: 'Top features: pkt_loss(+0.38) lat_delta(+0.27) jitter(+0.19)' },
  { ts: '10:32:46.001', component: '[TELEM]',      level: 'ok',   msg: 'Packet rcvd CORE-01 · all 8 interfaces nominal' },
];

export const TOPOLOGY_NODES = [
  { id: 'CORE-01', x: 50, y: 50, role: 'Core', status: 'ok',   cpu: 42, mem: 58 },
  { id: 'PE-02',   x: 20, y: 75, role: 'PE',   status: 'crit', cpu: 94, mem: 88 },
  { id: 'PE-03',   x: 80, y: 75, role: 'PE',   status: 'ok',   cpu: 31, mem: 44 },
  { id: 'PE-04',   x: 20, y: 25, role: 'PE',   status: 'warn', cpu: 87, mem: 71 },
  { id: 'PE-07',   x: 80, y: 25, role: 'PE',   status: 'ok',   cpu: 28, mem: 52 },
  { id: 'CE-01',   x: 5,  y: 10, role: 'CE',   status: 'ok',   cpu: 12, mem: 30 },
  { id: 'CE-02',   x: 5,  y: 40, role: 'CE',   status: 'ok',   cpu: 18, mem: 35 },
  { id: 'CE-03',   x: 5,  y: 90, role: 'CE',   status: 'ok',   cpu: 15, mem: 28 },
  { id: 'CE-05',   x: 95, y: 10, role: 'CE',   status: 'ok',   cpu: 22, mem: 33 },
  { id: 'CE-06',   x: 95, y: 40, role: 'CE',   status: 'ok',   cpu: 19, mem: 31 },
  { id: 'CE-07',   x: 95, y: 90, role: 'CE',   status: 'warn', cpu: 45, mem: 60 },
];

export const TOPOLOGY_LINKS = [
  { from: 'CORE-01', to: 'PE-02',  util: 94, status: 'crit' },
  { from: 'CORE-01', to: 'PE-03',  util: 38, status: 'ok' },
  { from: 'CORE-01', to: 'PE-04',  util: 72, status: 'warn' },
  { from: 'CORE-01', to: 'PE-07',  util: 41, status: 'ok' },
  { from: 'PE-04',   to: 'CE-01',  util: 25, status: 'ok' },
  { from: 'PE-04',   to: 'CE-02',  util: 33, status: 'ok' },
  { from: 'PE-02',   to: 'CE-03',  util: 88, status: 'warn' },
  { from: 'PE-07',   to: 'CE-05',  util: 28, status: 'ok' },
  { from: 'PE-07',   to: 'CE-06',  util: 35, status: 'ok' },
  { from: 'PE-03',   to: 'CE-07',  util: 55, status: 'warn' },
];

// Chat replies for AI Copilot
export const COPILOT_REPLIES = {
  default: `**Analyzing telemetry…**\n\nCurrent risk is elevated across PE-02 and CE-07. PE-02 (MPLS-T102) is at 91% failure probability with ~43 min lead time. Recommend reviewing SOP-3 for traffic rerouting.`,
  'T102': `**Tunnel MPLS-T102 Analysis**\n\n**Root cause:** Interface Gi0/1 on PE-02 is at 94% utilization, driving packet loss to 2.4% and latency to 148ms (+34ms delta).\n\n**IsolationForest score:** 0.847 (threshold 0.75)\n**XGBoost probability:** 91.3%\n\n**Recommended action:** Run \`mpls traffic-eng reoptimize\` on PE-02, shift traffic to backup LSP per **SOP-3**. Lead time before fault: ~43 min.`,
  'PE-02': `**PE-02 Device Status**\n\nCPU: 94%  |  Memory: 88%  |  Status: **Critical**\n\nAffected tunnels: MPLS-T102, MPLS-T099\nInterface Gi0/1: 94% utilization, 52ms jitter\n\nTop SHAP features: pkt_loss (+0.38), lat_delta (+0.27), jitter (+0.19)`,
  'alert': `**Active Alerts — 7 open**\n\n🔴 PE-02 Packet Loss Spike — Critical\n🔴 MPLS-T102 Latency ↑ — Critical\n🟡 CE-07 BGP Peer Down — Warning\n🟡 PE-04 CPU > 85% — Warning\n🟡 PE-02 Jitter > 50ms — Warning\n\nOldest unacknowledged: 10:22 (PE-02 jitter)`,
  'reroute': `**Reroute Recommendation for T102**\n\nBackup path: PE-02 → CORE-01 → PE-03 → CE-03\nEstimated capacity: 2.1 Gbps (currently free)\n\nCommand sequence:\n\`\`\`\npe-02# mpls traffic-eng reoptimize tunnel 102\npe-02# ip rsvp bandwidth 2000000\n\`\`\`\n\nThis follows **SOP-3 §4.2**. Estimated switchover: 8–12 seconds.`,
};

// Generate time-series chart data
export function generateChartData(points = 40) {
  const now = Date.now();
  const series = {
    labels: [],
    pe02: [],
    pe04: [],
    pe07: [],
    loss_pe02: [],
    cpu_pe02: [],
    cpu_pe04: [],
    throughput: [],
  };
  for (let i = points; i >= 0; i--) {
    const t = new Date(now - i * 5000);
    series.labels.push(t.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    // Latency — PE-02 climbing, others stable
    series.pe02.push(+(90 + (points - i) * 1.4 + Math.random() * 12).toFixed(1));
    series.pe04.push(+(58 + Math.random() * 10).toFixed(1));
    series.pe07.push(+(46 + Math.random() * 8).toFixed(1));
    // Packet loss
    series.loss_pe02.push(+(0.8 + (points - i) * 0.04 + Math.random() * 0.3).toFixed(2));
    // CPU
    series.cpu_pe02.push(+(78 + (points - i) * 0.4 + Math.random() * 5).toFixed(1));
    series.cpu_pe04.push(+(80 + Math.random() * 8).toFixed(1));
    // Throughput
    series.throughput.push(+(1800 + Math.random() * 400).toFixed(0));
  }
  return series;
}
