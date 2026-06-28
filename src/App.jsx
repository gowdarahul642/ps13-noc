import { useState, useCallback } from 'react';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import KpiGrid from './components/KpiGrid.jsx';
import MetricsChart from './components/MetricsChart.jsx';
import NetworkTopology from './components/NetworkTopology.jsx';
import { SystemHealthBar, PredictionCards, AlertsTable, FaultTimeline, InferenceConsole } from './components/Panels.jsx';
import CopilotPanel from './components/CopilotPanel.jsx';
import DeviceModal from './components/DeviceModal.jsx';
import TopologyScreen   from './views/TopologyScreen.jsx';
import MetricsScreen    from './views/MetricsScreen.jsx';
import PredictionsScreen from './views/PredictionsScreen.jsx';
import AlertsScreen     from './views/AlertsScreen.jsx';
import ReportsScreen    from './views/ReportsScreen.jsx';
import SettingsScreen   from './views/SettingsScreen.jsx';

const SC = { ok: '#1EE07A', warn: '#FFAA00', crit: '#FF3D3D' };

export default function App() {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [activeView,  setActiveView]  = useState('dashboard');
  const [modal,       setModal]       = useState(null);
  const [copilotQuery, setCopilotQuery] = useState('');

  const openModal = useCallback((title, subtitle, rows) => setModal({ title, subtitle, rows }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const handleKpiClick = useCallback((kpi) => {
    const detail = {
      routers:   '24 routers online: 22 OK · 1 Critical (PE-02) · 1 Warning (PE-04). 3 unreachable links detected.',
      tunnels:   '187 active tunnels. MPLS-T102 (critical), MPLS-T088 (warning). 3 tunnels decommissioned last hour.',
      alerts:    '7 open alerts: 2 Critical · 4 Warning · 1 Info. Oldest unacknowledged: 10:22 (PE-02 jitter).',
      risk:      'AI Risk Score 91% — driven by PE-02 packet loss (2.4%) and latency delta (+34ms). Score rising.',
      latency:   'Avg latency 142ms. PE-02: 148ms (critical threshold 150ms). PE-04: 64ms. PE-07: 52ms.',
      loss:      'Network-wide packet loss 2.4%. PE-02/T102 primarily affected. Threshold: 1.5% (critical).',
      bandwidth: 'Aggregate bandwidth 68% utilized. Peak: PE-02 Gi0/1 at 94%. No congestion on core trunk.',
      links:     '219/226 links healthy. 7 degraded: 2 critical, 5 warning. No links fully down.',
    };
    openModal(kpi.label, `Status: ${kpi.status.toUpperCase()} · Current value: ${kpi.value}${kpi.unit}`, [
      { label: 'Current Value', value: `${kpi.value}${kpi.unit}` },
      { label: 'Status',        value: kpi.status.toUpperCase() },
      { label: 'Trend',         value: kpi.trendVal },
      { label: 'Detail',        value: detail[kpi.id] || 'No detail available' },
    ]);
  }, [openModal]);

  const handleNodeClick = useCallback((node) => {
    openModal(
      `${node.id} — Device Detail`,
      `${node.role} Router · IP ${node.ip} · Status ${node.status.toUpperCase()}`,
      [
        { label: 'Node Role',       value: node.role },
        { label: 'IP Address',      value: node.ip, mono: true },
        { label: 'Status',          value: node.status.toUpperCase(), color: SC[node.status] },
        { label: 'CPU Utilization', value: `${node.cpu}%`, color: node.cpu > 85 ? SC.crit : node.cpu > 70 ? SC.warn : SC.ok },
        { label: 'Memory Usage',    value: `${node.mem}%`, color: node.mem > 85 ? SC.crit : node.mem > 70 ? SC.warn : SC.ok },
        { label: 'Active Tunnels',  value: `${node.tunnels}` },
        { label: 'Interfaces',      value: `Gi0/0 UP · Gi0/1 ${node.status === 'crit' ? 'DEGRADED' : 'UP'} · Gi0/2 UP` },
      ]
    );
  }, [openModal]);

  const handlePredClick = useCallback((pred) => {
    const evidence = {
      p1: 'IsolationForest: 0.847 · XGBoost: 91.3% · SHAP: pkt_loss(+0.38) lat_delta(+0.27) jitter(+0.19). T102 latency 95ms→148ms over 15 min.',
      p2: 'PE-04 CPU >85% for 18 min. IsolationForest: 0.71 · XGBoost: 64.1% · SHAP: cpu_util(+0.41) mem_pressure(+0.22).',
      p3: 'CE-07 BGP peer flap ×3 in 25 min. XGBoost: 57.3% · SHAP: bgp_flap_count(+0.52) session_age(+0.31).',
    };
    openModal(`Prediction — ${pred.device}`, `${pred.tunnel} · ${pred.fault}`, [
      { label: 'Fault Type',  value: pred.fault },
      { label: 'Risk Score',  value: `${pred.risk}%`, color: SC[pred.status] },
      { label: 'Confidence',  value: `${pred.confidence}%` },
      { label: 'Lead Time',   value: pred.leadTime },
      { label: 'Status',      value: pred.status.toUpperCase(), color: SC[pred.status] },
      { label: 'Evidence',    value: evidence[pred.id] || '', mono: true },
      { label: 'Action',      value: 'Run: mpls traffic-eng reoptimize · Shift to backup LSP per SOP-3', color: 'var(--accent)' },
    ]);
  }, [openModal]);

  const handleAlertClick = useCallback((alert) => {
    openModal(`Alert — ${alert.device}`, `${alert.event} · ${alert.ts}`, [
      { label: 'Device',   value: alert.device },
      { label: 'Event',    value: alert.event },
      { label: 'Severity', value: alert.sev.toUpperCase(), color: SC[alert.sev] || 'var(--accent)' },
      { label: 'Status',   value: alert.status },
      { label: 'Time',     value: alert.ts, mono: true },
      { label: 'Assigned', value: alert.owner },
      { label: 'Action',   value: `Investigate ${alert.device} — check interface stats and tunnel logs`, color: 'var(--accent)' },
    ]);
  }, [openModal]);

  const VIEW_LABELS = {
    dashboard: 'Dashboard', topology: 'Network Topology', metrics: 'Live Metrics',
    predictions: 'AI Predictions', alerts: 'Alert Management',
    reports: 'Reports', settings: 'Configuration',
  };

  return (
    <div style={{ display: 'grid', gridTemplateRows: '48px 1fr', height: '100vh', overflow: 'hidden' }}>
      <TopBar
        copilotOpen={copilotOpen}
        onToggleCopilot={() => setCopilotOpen(o => !o)}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: copilotOpen ? '52px 1fr 320px' : '52px 1fr',
        overflow: 'hidden',
        transition: 'grid-template-columns 200ms cubic-bezier(.16,1,.3,1)',
      }}>
        <Sidebar activeView={activeView} onNavigate={setActiveView} />

        <main
          aria-label={VIEW_LABELS[activeView] || 'Dashboard'}
          style={{ overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {/* ── Dashboard ──────────────────────────────────── */}
          {activeView === 'dashboard' && (<>
            <SystemHealthBar />
            <KpiGrid onCardClick={handleKpiClick} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <MetricsChart />
              <NetworkTopology onNodeClick={handleNodeClick} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <PredictionCards onCardClick={handlePredClick} />
              <AlertsTable onRowClick={handleAlertClick} />
              <FaultTimeline />
            </div>
            <InferenceConsole />
            <footer style={{ fontSize: '9.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
              PS13 Predictive NOC · Model v1.2 · Build 2026-06-27 · ISRO Air-gapped Deployment
            </footer>
          </>)}

          {activeView === 'topology'    && <TopologyScreen    onNodeClick={handleNodeClick} />}
          {activeView === 'metrics'     && <MetricsScreen />}
          {activeView === 'predictions' && <PredictionsScreen onCardClick={handlePredClick} />}
          {activeView === 'alerts'      && <AlertsScreen      onRowClick={handleAlertClick} />}
          {activeView === 'reports'     && <ReportsScreen />}
          {activeView === 'settings'    && <SettingsScreen />}
        </main>

        {copilotOpen && (
          <CopilotPanel
            onClose={() => setCopilotOpen(false)}
            initialQuery={copilotQuery}
            onQueryConsumed={() => setCopilotQuery('')}
          />
        )}
      </div>

      {modal && (
        <DeviceModal
          title={modal.title}
          subtitle={modal.subtitle}
          rows={modal.rows}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
