import { useState } from 'react';
import { ALERTS, PREDICTIONS, TIMELINE } from '../data/mockData.js';

const REPORT_TYPES = [
  { id: 'incident',   label: 'Incident Summary',     icon: 'ti-report-medical',    desc: 'All alerts, resolutions and escalations for a date range' },
  { id: 'prediction', label: 'Prediction Accuracy',  icon: 'ti-brain',             desc: 'ML model performance metrics and false-positive analysis' },
  { id: 'sla',        label: 'SLA Compliance',       icon: 'ti-chart-bar',         desc: 'Uptime, MTTR, MTTD against defined SLAs' },
  { id: 'capacity',   label: 'Capacity Planning',    icon: 'ti-database',          desc: 'Bandwidth, CPU, and memory utilisation trends' },
  { id: 'audit',      label: 'Operator Audit Log',   icon: 'ti-shield-lock',       desc: 'Full audit trail of operator actions (ISRO GIGW compliance)' },
];

function StatCard({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 16px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color, marginTop: '6px', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

export default function ReportsScreen() {
  const [selected, setSelected] = useState('incident');
  const [dateFrom, setDateFrom] = useState('2026-06-27');
  const [dateTo,   setDateTo]   = useState('2026-06-27');
  const [generated, setGenerated] = useState(false);

  const critAlerts = ALERTS.filter(a => a.sev === 'crit').length;
  const resolved   = ALERTS.filter(a => a.status === 'Resolved').length;

  const inputStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', padding: '5px 10px',
    fontFamily: 'var(--font-mono)', fontSize: '11px', outline: 'none',
    transition: 'border-color var(--dur)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>Reports</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Generate and export NOC operational reports</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '14px', alignItems: 'start' }}>
        {/* Report type selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {REPORT_TYPES.map(r => (
            <button key={r.id} onClick={() => { setSelected(r.id); setGenerated(false); }} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left',
              background: selected===r.id ? 'var(--accent-dim)' : 'var(--bg-card)',
              border: `1px solid ${selected===r.id ? 'var(--accent-border)' : 'var(--border)'}`,
              borderRadius: 'var(--r-md)', padding: '10px 12px', cursor: 'pointer', transition: 'all var(--dur)',
            }}>
              <i className={`ti ${r.icon}`} aria-hidden="true" style={{ fontSize: '16px', color: selected===r.id ? 'var(--accent)' : 'var(--text-muted)', marginTop: '1px', flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: selected===r.id ? 'var(--accent)' : 'var(--text-primary)' }}>{r.label}</div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{r.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Report content */}
        <div className="panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>From</label>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={inputStyle}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>To</label>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={inputStyle}/>
            </div>
            <button onClick={() => setGenerated(true)} style={{
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', borderRadius: 'var(--r-md)', padding: '6px 16px',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all var(--dur)',
            }}>
              <i className="ti ti-player-play" aria-hidden="true" style={{ marginRight: '5px' }}/>
              Generate
            </button>
            {generated && (
              <button style={{
                background: 'var(--green-dim)', border: '1px solid var(--green-border)',
                color: 'var(--green)', borderRadius: 'var(--r-md)', padding: '6px 14px',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              }}>
                <i className="ti ti-download" aria-hidden="true" style={{ marginRight: '5px' }}/>
                Export PDF
              </button>
            )}
          </div>

          {/* Report preview */}
          {!generated ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '12px' }}>
              <i className="ti ti-report-analytics" aria-hidden="true" style={{ fontSize: '36px', display: 'block', marginBottom: '10px', opacity: .3 }}/>
              Select a date range and click Generate to preview the report.
            </div>
          ) : selected === 'incident' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                <StatCard label="Total Alerts"     value={ALERTS.length} sub="This period"/>
                <StatCard label="Critical"         value={critAlerts}    sub="High priority" color="var(--red)"/>
                <StatCard label="Resolved"         value={resolved}      sub="Closed"        color="var(--green)"/>
                <StatCard label="MTTR"             value="14m"           sub="Mean time to resolve" color="var(--amber)"/>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '.06em', textTransform: 'uppercase' }}>Alert Log</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr>{['Time','Device','Event','Sev','Status','Owner'].map(h=>(
                      <th key={h} style={{ textAlign:'left',padding:'5px 8px',borderBottom:'1px solid var(--border)',fontSize:'9px',fontWeight:600,color:'var(--text-muted)',letterSpacing:'.06em',textTransform:'uppercase' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {ALERTS.map(a=>(
                      <tr key={a.id} style={{ borderBottom:'1px solid rgba(0,150,210,.06)' }}>
                        <td style={{padding:'6px 8px',fontFamily:'var(--font-mono)',color:'var(--text-muted)'}}>{a.ts}</td>
                        <td style={{padding:'6px 8px',fontWeight:600,color:a.sev==='crit'?'var(--red)':'var(--amber)'}}>{a.device}</td>
                        <td style={{padding:'6px 8px',color:'var(--text-secondary)'}}>{a.event}</td>
                        <td style={{padding:'6px 8px'}}><span className={`badge badge-${a.sev}`} style={{fontSize:'8px',padding:'1px 5px'}}>{a.sev.toUpperCase()}</span></td>
                        <td style={{padding:'6px 8px',color:'var(--text-muted)'}}>{a.status}</td>
                        <td style={{padding:'6px 8px',color:'var(--text-secondary)'}}>{a.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : selected === 'prediction' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                <StatCard label="Predictions Made" value="43"    sub="Last 24h"/>
                <StatCard label="True Positives"   value="39"    sub="90.7% accuracy" color="var(--green)"/>
                <StatCard label="False Positives"  value="4"     sub="9.3% FPR"       color="var(--amber)"/>
                <StatCard label="Avg Lead Time"    value="38m"   sub="Before fault"    color="var(--accent)"/>
              </div>
              <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '8px' }}>Model Performance Notes</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  XGBoost failure-probability model achieved 90.7% precision on MPLS tunnel degradation events over the last 24 hours.
                  IsolationForest anomaly detection threshold (0.75) produced 4 false positives — all on PE-04 during scheduled maintenance window.
                  Recommend re-training with maintenance schedule exclusion windows. SHAP analysis indicates packet loss and latency delta as the two highest-weight features.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '11px' }}>
              <i className="ti ti-report-analytics" aria-hidden="true" style={{ fontSize: '30px', display: 'block', marginBottom: '8px', color: 'var(--accent)', opacity: .5 }}/>
              {REPORT_TYPES.find(r=>r.id===selected)?.label} report generated for {dateFrom} — {dateTo}.<br/>
              <span style={{ fontSize: '10px', opacity: .7 }}>Export to PDF to view full detail.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
