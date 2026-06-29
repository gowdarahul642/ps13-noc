import { useState, useCallback } from 'react';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import KpiGrid from './components/KpiGrid.jsx';
import MetricsChart from './components/MetricsChart.jsx';
import NetworkTopology from './components/NetworkTopology.jsx';
import { SystemHealthBar, PredictionCards, AlertsTable, FaultTimeline, InferenceConsole } from './components/Panels.jsx';
import CopilotPanel from './components/CopilotPanel.jsx';
import DeviceModal from './components/DeviceModal.jsx';
import TopologyScreen    from './views/TopologyScreen.jsx';
import MetricsScreen     from './views/MetricsScreen.jsx';
import PredictionsScreen from './views/PredictionsScreen.jsx';
import AlertsScreen      from './views/AlertsScreen.jsx';
import ReportsScreen     from './views/ReportsScreen.jsx';
import SettingsScreen    from './views/SettingsScreen.jsx';

const SC = { ok:'#1EE07A', warn:'#FFAA00', crit:'#FF3D3D' };

export default function App() {
  const [copilotOpen,  setCopilotOpen]  = useState(false);
  const [activeView,   setActiveView]   = useState('dashboard');
  const [modal,        setModal]        = useState(null);
  const [copilotQuery, setCopilotQuery] = useState('');

  const openModal  = useCallback((title, subtitle, rows) => setModal({ title, subtitle, rows }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const handleKpiClick = useCallback((kpi) => {
    const detail = {
      routers:   '24 routers online: 22 OK · 1 Critical (PE-02) · 1 Warning (PE-04).',
      tunnels:   '187 active tunnels. MPLS-T102 critical, MPLS-T088 warning.',
      alerts:    '7 open: 2 Critical · 4 Warning · 1 Info.',
      risk:      'AI Risk Score 91% — PE-02 packet loss 2.4%, latency +34ms.',
      latency:   'Avg 142ms. PE-02: 148ms. PE-04: 64ms. PE-07: 52ms.',
      loss:      'Network-wide 2.4%. PE-02/T102 primarily affected.',
      bandwidth: 'Aggregate 68% utilized. PE-02 Gi0/1 at 94%.',
      links:     '219/226 healthy. 7 degraded.',
    };
    openModal(kpi.label, `Status: ${kpi.status.toUpperCase()} · ${kpi.value}${kpi.unit}`, [
      { label:'Value',  value:`${kpi.value}${kpi.unit}` },
      { label:'Status', value:kpi.status.toUpperCase() },
      { label:'Trend',  value:kpi.trendVal },
      { label:'Detail', value:detail[kpi.id]||'—' },
    ]);
  }, [openModal]);

  const handleNodeClick = useCallback((node) => {
    openModal(`${node.id} — Device Detail`, `${node.role} · ${node.ip} · ${node.status.toUpperCase()}`, [
      { label:'Role',    value:node.role },
      { label:'IP',      value:node.ip },
      { label:'Status',  value:node.status.toUpperCase(), color:SC[node.status] },
      { label:'CPU',     value:`${node.cpu}%`, color:node.cpu>85?SC.crit:node.cpu>70?SC.warn:SC.ok },
      { label:'Memory',  value:`${node.mem}%`, color:node.mem>85?SC.crit:node.mem>70?SC.warn:SC.ok },
      { label:'Tunnels', value:`${node.tunnels}` },
      { label:'Gi0/1',   value:node.status==='crit'?'DEGRADED':'UP', color:node.status==='crit'?SC.crit:SC.ok },
    ]);
  }, [openModal]);

  const handlePredClick = useCallback((pred) => {
    const ev = {
      p1:'IsolationForest 0.847 · XGBoost 91.3% · pkt_loss(+0.38) lat_delta(+0.27)',
      p2:'IsolationForest 0.710 · XGBoost 64.1% · cpu_util(+0.41) mem(+0.22)',
      p3:'XGBoost 57.3% · bgp_flap(+0.52) session_age(+0.31)',
    };
    openModal(`Prediction — ${pred.device}`, `${pred.tunnel} · ${pred.fault}`, [
      { label:'Risk',       value:`${pred.risk}%`,       color:SC[pred.status] },
      { label:'Confidence', value:`${pred.confidence}%` },
      { label:'Lead Time',  value:pred.leadTime },
      { label:'Evidence',   value:ev[pred.id]||'—' },
      { label:'Action',     value:'mpls traffic-eng reoptimize · Shift to backup LSP per SOP-3', color:'var(--accent)' },
    ]);
  }, [openModal]);

  const handleAlertClick = useCallback((alert) => {
    openModal(`Alert — ${alert.device}`, `${alert.event} · ${alert.ts}`, [
      { label:'Device',   value:alert.device },
      { label:'Event',    value:alert.event },
      { label:'Severity', value:alert.sev.toUpperCase(), color:SC[alert.sev]||'var(--accent)' },
      { label:'Status',   value:alert.status },
      { label:'Assigned', value:alert.owner },
    ]);
  }, [openModal]);

  /* ── Shared page wrapper style ── */
  const pageStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: 0,
  };

  return (
    /* Outer shell — full viewport, top bar fixed, rest scrollable */
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg-base)' }}>
      {/* ── Top bar (sticky) ── */}
      <div style={{ position:'sticky', top:0, zIndex:100, flexShrink:0 }}>
        <TopBar copilotOpen={copilotOpen} onToggleCopilot={() => setCopilotOpen(o => !o)} />
      </div>

      {/* ── Body row ── */}
      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        {/* Sidebar (sticky) */}
        <div style={{ position:'sticky', top:48, height:'calc(100vh - 48px)', flexShrink:0, zIndex:10 }}>
          <Sidebar activeView={activeView} onNavigate={setActiveView} />
        </div>

        {/* Main content */}
        <main aria-label="Dashboard" style={pageStyle}>

          {/* ── Dashboard ────────────────────────────────────────────── */}
          {activeView === 'dashboard' && (<>
            <SystemHealthBar />
            <KpiGrid onCardClick={handleKpiClick} />

            {/* Charts + Topology */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', minHeight:320 }}>
              <MetricsChart />
              <NetworkTopology onNodeClick={handleNodeClick} />
            </div>

            {/* Prediction / Alerts / Timeline */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
              <PredictionCards onCardClick={handlePredClick} />
              <AlertsTable     onRowClick={handleAlertClick} />
              <FaultTimeline />
            </div>

            <InferenceConsole />

            <div style={{ fontSize:'9px', color:'var(--text-muted)', textAlign:'center', padding:'4px 0 8px', opacity:.5 }}>
              PS13 Predictive NOC · Model v1.2 · 2026-06-27 · ISRO Air-gapped Deployment
            </div>
          </>)}

          {activeView === 'topology'    && <TopologyScreen    onNodeClick={handleNodeClick} />}
          {activeView === 'metrics'     && <MetricsScreen />}
          {activeView === 'predictions' && <PredictionsScreen onCardClick={handlePredClick} />}
          {activeView === 'alerts'      && <AlertsScreen      onRowClick={handleAlertClick} />}
          {activeView === 'reports'     && <ReportsScreen />}
          {activeView === 'settings'    && <SettingsScreen />}
        </main>

        {/* Copilot side panel */}
        {copilotOpen && (
          <div style={{ width:300, flexShrink:0, borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'sticky', top:48, height:'calc(100vh - 48px)' }}>
            <CopilotPanel
              onClose={() => setCopilotOpen(false)}
              initialQuery={copilotQuery}
              onQueryConsumed={() => setCopilotQuery('')}
            />
          </div>
        )}
      </div>

      {modal && (
        <DeviceModal title={modal.title} subtitle={modal.subtitle} rows={modal.rows} onClose={closeModal} />
      )}
    </div>
  );
}
