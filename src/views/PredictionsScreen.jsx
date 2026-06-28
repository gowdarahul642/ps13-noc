import { useState } from 'react';
import { PREDICTIONS } from '../data/mockData.js';

const SC = { ok: '#1EE07A', warn: '#FFAA00', crit: '#FF3D3D' };

const SHAP_DATA = {
  p1: [
    { feature: 'pkt_loss',       value: 2.41,  contrib: 0.38, dir: 'pos' },
    { feature: 'lat_delta_15m',  value: '+34ms',contrib: 0.27, dir: 'pos' },
    { feature: 'jitter',         value: 52,    contrib: 0.19, dir: 'pos' },
    { feature: 'cpu_utilization',value: '94%', contrib: 0.12, dir: 'pos' },
    { feature: 'bgp_flap_count', value: 0,     contrib: -0.04, dir: 'neg' },
  ],
  p2: [
    { feature: 'cpu_utilization',value: '87%', contrib: 0.41, dir: 'pos' },
    { feature: 'mem_pressure',   value: '71%', contrib: 0.22, dir: 'pos' },
    { feature: 'lat_delta_15m',  value: '+12ms',contrib: 0.14, dir: 'pos' },
    { feature: 'pkt_loss',       value: 0.12,  contrib: 0.08, dir: 'pos' },
    { feature: 'bgp_flap_count', value: 0,     contrib: -0.02, dir: 'neg' },
  ],
  p3: [
    { feature: 'bgp_flap_count', value: 3,     contrib: 0.52, dir: 'pos' },
    { feature: 'session_age_s',  value: 1240,  contrib: 0.31, dir: 'pos' },
    { feature: 'keepalive_miss', value: 4,     contrib: 0.18, dir: 'pos' },
    { feature: 'cpu_utilization',value: '45%', contrib: 0.05, dir: 'pos' },
    { feature: 'pkt_loss',       value: 0.08,  contrib: -0.01, dir: 'neg' },
  ],
};

function ShapBar({ contrib, dir }) {
  const width = Math.abs(contrib) * 200;
  const color = dir === 'pos' ? 'var(--red)' : 'var(--green)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {dir === 'neg' && <div style={{ width: `${width}px`, height: '8px', background: color, borderRadius: '2px', marginLeft: `${200 - width}px` }}/>}
      {dir === 'pos' && <div style={{ width: `${width}px`, height: '8px', background: color, borderRadius: '2px' }}/>}
      <span style={{ fontSize: '9.5px', color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        {dir === 'pos' ? '+' : ''}{contrib.toFixed(2)}
      </span>
    </div>
  );
}

export default function PredictionsScreen({ onCardClick }) {
  const [selected, setSelected] = useState('p1');
  const pred = PREDICTIONS.find(p => p.id === selected);
  const shap = SHAP_DATA[selected] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
          AI Predictions
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          IsolationForest + XGBoost · SHAP explainability · {PREDICTIONS.length} active predictions
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '14px' }}>
        {/* Left: prediction list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PREDICTIONS.map(p => {
            const color = SC[p.status];
            const isSelected = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setSelected(p.id); onCardClick && onCardClick(p); }}
                style={{
                  display: 'block', textAlign: 'left', width: '100%',
                  background: isSelected ? (p.status==='crit'?'rgba(255,61,61,.1)':'rgba(255,170,0,.1)') : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--r-lg)', padding: '14px 16px',
                  cursor: 'pointer', transition: 'all var(--dur)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <i className="ti ti-router" aria-hidden="true" style={{ marginRight: '5px', color: 'var(--text-muted)' }}/>
                      {p.device}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.tunnel} · {p.fault}
                    </div>
                  </div>
                  <span style={{ fontSize: '22px', fontWeight: 700, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {p.risk}%
                  </span>
                </div>

                {/* Risk bar */}
                <div style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,.07)', borderRadius: '2px' }}>
                  <div style={{ width: `${p.risk}%`, height: '100%', background: color, borderRadius: '2px' }}/>
                </div>

                <div style={{ marginTop: '7px', display: 'flex', gap: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <span>Conf: <strong style={{ color }}>{p.confidence}%</strong></span>
                  <span>Lead: <strong style={{ color: 'var(--text-secondary)' }}>{p.leadTime}</strong></span>
                  <span className={`badge badge-${p.status}`} style={{ fontSize: '8px', padding: '1px 5px' }}>
                    {p.status.toUpperCase()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: SHAP explainability */}
        {pred && (
          <div className="panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                SHAP Feature Importance
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {pred.device} / {pred.tunnel} — how each feature contributed to the {pred.risk}% risk score
              </div>
            </div>

            {/* SHAP chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shap.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {s.feature}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      val={s.value}
                    </span>
                  </div>
                  <ShapBar contrib={s.contrib} dir={s.dir}/>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '4px', padding: '10px 12px', background: 'rgba(0,0,0,.2)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Model Scores
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                {[
                  ['IsolationForest', selected==='p1'?'0.847':selected==='p2'?'0.710':'0.632', 'Anomaly Score'],
                  ['XGBoost',         `${pred.risk}%`,    'Failure Prob.'],
                  ['Confidence',      `${pred.confidence}%`, 'Model Conf.'],
                ].map(([label, val, sub]) => (
                  <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '10px 8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: SC[pred.status], fontFamily: 'var(--font-mono)' }}>{val}</div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: .7 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended action */}
            <div style={{
              background: 'rgba(0,207,255,.07)', border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-md)', padding: '12px 14px',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                <i className="ti ti-bolt" aria-hidden="true" style={{ marginRight: '5px' }}/>
                Recommended Action
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selected === 'p1' && 'Run mpls traffic-eng reoptimize on PE-02. Shift MPLS-T102 to backup LSP via CORE-01 → PE-03 per SOP-3 §4.2. Estimated switchover: 8–12 seconds.'}
                {selected === 'p2' && 'Reduce CPU load on PE-04: redistribute tunnels MPLS-T088 and T091 to PE-07. Monitor memory pressure — may require process restart if above 90%.'}
                {selected === 'p3' && 'Investigate CE-07 BGP peer configuration. Check keepalive timers and MTU mismatch. Re-establish BGP session per SOP-7 §2.1.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
