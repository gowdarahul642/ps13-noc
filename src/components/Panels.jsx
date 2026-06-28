import { useEffect, useRef, useState } from 'react';
import { PREDICTIONS, ALERTS, TIMELINE, CONSOLE_STREAM, SYSTEM_HEALTH } from '../data/mockData';

// ─── System Health Bar ─────────────────────────────────────────────
export function SystemHealthBar() {
  const STATUS_COLOR = { ok: 'var(--green)', warn: 'var(--amber)', crit: 'var(--red)' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px' }}
      role="region" aria-label="System health status">
      {SYSTEM_HEALTH.map(s => (
        <div key={s.id} className="panel" style={{
          padding: '8px 10px', textAlign: 'center',
          background: 'var(--bg-card)',
        }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: STATUS_COLOR[s.status],
            margin: '0 auto 5px',
            boxShadow: `0 0 6px ${STATUS_COLOR[s.status]}`,
          }}/>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
          <div style={{ fontSize: '9px', color: s.status === 'warn' ? 'var(--amber)' : 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {s.detail}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Prediction Cards ──────────────────────────────────────────────
export function PredictionCards({ onCardClick }) {
  const STATUS_COLOR = { crit: 'var(--red)', warn: 'var(--amber)' };
  const STATUS_BG    = { crit: 'rgba(255,61,61,0.07)', warn: 'rgba(255,170,0,0.07)' };
  const STATUS_BORDER= { crit: 'rgba(255,61,61,0.25)', warn: 'rgba(255,170,0,0.22)' };

  return (
    <div className="panel" style={{ padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <i className="ti ti-brain" aria-hidden="true" style={{ color: 'var(--accent)', fontSize: '14px' }}/>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            AI Predictions
          </span>
        </div>
        <span className="badge badge-info" style={{ fontSize: '8px', padding: '1px 5px' }}>● Active</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '210px', overflowY: 'auto' }}>
        {PREDICTIONS.map(p => (
          <button
            key={p.id}
            onClick={() => onCardClick && onCardClick(p)}
            style={{
              display: 'block', textAlign: 'left', width: '100%',
              background: STATUS_BG[p.status],
              border: `1px solid ${STATUS_BORDER[p.status]}`,
              borderLeft: `3px solid ${STATUS_COLOR[p.status]}`,
              borderRadius: 'var(--r-md)', padding: '9px 11px',
              cursor: 'pointer', transition: 'all var(--dur-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = STATUS_COLOR[p.status]}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = STATUS_BORDER[p.status];
              e.currentTarget.style.borderLeftColor = STATUS_COLOR[p.status];
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="ti ti-router" aria-hidden="true" style={{ fontSize: '11px', color: 'var(--text-muted)' }}/>
                  {p.device}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {p.tunnel} · {p.fault}
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: STATUS_COLOR[p.status], fontFamily: 'var(--font-mono)' }}>
                {p.risk}%
              </span>
            </div>

            {/* Risk bar */}
            <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                <div style={{
                  width: `${p.risk}%`, height: '100%', borderRadius: '2px',
                  background: STATUS_COLOR[p.status],
                  transition: 'width 0.5s var(--ease)',
                }}/>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                {p.leadTime} · conf {p.confidence}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Alerts Table ──────────────────────────────────────────────────
export function AlertsTable({ onRowClick }) {
  const [sortKey, setSortKey] = useState('ts');
  const [filter, setFilter] = useState('all');

  const SEV_COLOR = { crit: 'var(--red)', warn: 'var(--amber)', info: 'var(--accent)' };
  const STATUS_BADGE = {
    Open:     { bg: 'var(--red-dim)',    color: 'var(--red)',    border: 'var(--red-border)' },
    ACK:      { bg: 'var(--amber-dim)',  color: 'var(--amber)',  border: 'var(--amber-border)' },
    Resolved: { bg: 'var(--green-dim)',  color: 'var(--green)',  border: 'var(--green-border)' },
  };

  const filtered = ALERTS.filter(a => filter === 'all' || a.sev === filter);

  return (
    <div className="panel" style={{ padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <i className="ti ti-alert-triangle" aria-hidden="true" style={{ color: 'var(--accent)', fontSize: '14px' }}/>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Recent Alerts
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'crit', 'warn'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: '9px', padding: '2px 7px', borderRadius: '3px',
                background: filter === f ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${filter === f ? 'var(--accent-border)' : 'var(--border)'}`,
                color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all var(--dur-fast)',
                textTransform: 'uppercase',
              }}
            >{f}</button>
          ))}
        </div>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: '195px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} role="table" aria-label="Alert events">
          <thead>
            <tr>
              {['Time', 'Device', 'Event', 'Sev', 'Status'].map(col => (
                <th key={col} style={{
                  textAlign: 'left', padding: '4px 6px',
                  fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em',
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  borderBottom: '1px solid var(--border)', position: 'sticky', top: 0,
                  background: 'var(--bg-panel)',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr
                key={a.id}
                onClick={() => onRowClick && onRowClick(a)}
                style={{
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0,150,210,0.06)',
                  transition: 'background var(--dur-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '5px 6px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>{a.ts}</td>
                <td style={{ padding: '5px 6px', fontSize: '11px', fontWeight: 600, color: SEV_COLOR[a.sev] }}>{a.device}</td>
                <td style={{ padding: '5px 6px', fontSize: '10px', color: 'var(--text-secondary)' }}>{a.event}</td>
                <td style={{ padding: '5px 6px' }}>
                  <span className={`badge badge-${a.sev}`} style={{ fontSize: '8px', padding: '1px 5px' }}>
                    {a.sev.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '5px 6px' }}>
                  <span style={{
                    fontSize: '9px', padding: '1px 5px', borderRadius: '3px',
                    background: STATUS_BADGE[a.status]?.bg,
                    color: STATUS_BADGE[a.status]?.color,
                    border: `1px solid ${STATUS_BADGE[a.status]?.border}`,
                  }}>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fault Timeline ────────────────────────────────────────────────
export function FaultTimeline() {
  const DOT_COLOR = { crit: 'var(--red)', warn: 'var(--amber)', info: 'var(--accent)', ok: 'var(--green)' };
  const DOT_BG    = { crit: 'rgba(255,61,61,0.15)', warn: 'rgba(255,170,0,0.15)', info: 'rgba(0,207,255,0.15)', ok: 'rgba(30,224,122,0.15)' };
  const TYPE_ICON = { crit: 'ti-alert-hexagon', warn: 'ti-alert-triangle', info: 'ti-info-circle', ok: 'ti-circle-check' };

  return (
    <div className="panel" style={{ padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
        <i className="ti ti-list-details" aria-hidden="true" style={{ color: 'var(--accent)', fontSize: '14px' }}/>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Fault Timeline
        </span>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: '210px' }} role="log" aria-label="Fault event timeline" aria-live="polite">
        {TIMELINE.map((ev, i) => (
          <div key={ev.id} style={{ display: 'flex', gap: '10px', paddingBottom: '10px', position: 'relative' }}>
            {/* Vertical line */}
            {i < TIMELINE.length - 1 && (
              <div style={{
                position: 'absolute', left: '12px', top: '22px', bottom: '0',
                width: '1px', background: 'var(--border)',
              }}/>
            )}
            {/* Dot */}
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
              background: DOT_BG[ev.type],
              border: `1.5px solid ${DOT_COLOR[ev.type]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: '1px',
            }}>
              <i className={`ti ${TYPE_ICON[ev.type]}`} aria-hidden="true"
                style={{ fontSize: '11px', color: DOT_COLOR[ev.type] }}/>
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{ev.time}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: DOT_COLOR[ev.type] }}>{ev.label}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                {ev.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ML Inference Console ──────────────────────────────────────────
export function InferenceConsole() {
  const [lines, setLines] = useState([...CONSOLE_STREAM]);
  const bottomRef = useRef(null);
  const streamIdx = useRef(0);

  const LEVEL_COLOR = { ok: 'var(--green)', warn: 'var(--amber)', crit: 'var(--red)', info: 'var(--accent)' };
  const NEW_LINES = [
    { ts: '10:32:51.001', component: '[TELEM]',      level: 'ok',   msg: 'Packet rcvd PE-02 · loss=2.48%  lat=154ms  cpu=95%' },
    { ts: '10:32:56.120', component: '[ISOFOREST]',  level: 'warn', msg: 'Score update PE-02: 0.871  trend CRITICAL' },
    { ts: '10:33:01.331', component: '[XGBOOST]',    level: 'crit', msg: 'Probability updated: 92.8% → ALERT ELEVATED' },
    { ts: '10:33:06.554', component: '[SHAP]',       level: 'info', msg: 'SHAP explanation: pkt_loss(+0.41) lat_delta(+0.29) cpu(+0.18)' },
    { ts: '10:33:11.001', component: '[TELEM]',      level: 'ok',   msg: 'Packet rcvd CE-07 · bgp_state=IDLE  (expected ESTABLISHED)' },
    { ts: '10:33:16.002', component: '[ROOT-CAUSE]', level: 'warn', msg: 'CE-07 BGP reconvergence in progress — monitoring' },
  ];

  useEffect(() => {
    const id = setInterval(() => {
      const line = NEW_LINES[streamIdx.current % NEW_LINES.length];
      streamIdx.current++;
      setLines(prev => [...prev.slice(-30), { ...line, ts: new Date().toLocaleTimeString('en-IN', { hour12: false }) + '.000' }]);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="panel" style={{ padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <i className="ti ti-terminal-2" aria-hidden="true" style={{ color: 'var(--accent)', fontSize: '14px' }}/>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ML Inference Console
          </span>
        </div>
        <span className="badge badge-info" style={{ fontSize: '8px', padding: '1px 5px' }}>● Streaming</span>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)', fontSize: '10.5px',
          lineHeight: 1.7, color: 'rgba(170,195,240,0.7)',
          maxHeight: '120px', overflowY: 'auto',
          background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--r-md)',
          padding: '8px 10px',
        }}
        role="log" aria-label="ML inference log" aria-live="polite"
      >
        {lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', animation: i === lines.length - 1 ? 'fade-in 0.3s var(--ease)' : undefined }}>
            <span style={{ color: 'rgba(0,207,255,0.4)', flexShrink: 0 }}>{l.ts}</span>
            <span style={{ color: LEVEL_COLOR[l.level], flexShrink: 0, minWidth: '90px' }}>{l.component}</span>
            <span>{l.msg}</span>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
    </div>
  );
}
