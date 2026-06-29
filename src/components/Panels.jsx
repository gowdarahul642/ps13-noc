import { useEffect, useRef, useState } from 'react';
import { PREDICTIONS, ALERTS, TIMELINE, CONSOLE_STREAM, SYSTEM_HEALTH } from '../data/mockData.js';

// ─── System Health Bar ────────────────────────────────────────────────────────
export function SystemHealthBar() {
  const C = { ok:'var(--green)', warn:'var(--amber)', crit:'var(--red)' };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,minmax(0,1fr))', gap:'6px' }}
      role="region" aria-label="Service health">
      {SYSTEM_HEALTH.map(s => (
        <div key={s.id} style={{
          background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'var(--r-md)', padding:'7px 8px', textAlign:'center',
        }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:C[s.status], margin:'0 auto 4px', boxShadow:`0 0 6px ${C[s.status]}` }}/>
          <div style={{ fontSize:'9.5px', color:'var(--text-muted)', fontWeight:500 }}>{s.label}</div>
          <div style={{ fontSize:'8.5px', color:s.status==='warn'?'var(--amber)':'var(--text-muted)', marginTop:'1px', fontFamily:'var(--font-mono)' }}>{s.detail}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Prediction Cards ──────────────────────────────────────────────────────────
export function PredictionCards({ onCardClick }) {
  const SC = { crit:'var(--red)', warn:'var(--amber)' };
  const SB = { crit:'rgba(255,61,61,.08)', warn:'rgba(255,170,0,.08)' };
  const SBo= { crit:'rgba(255,61,61,.22)', warn:'rgba(255,170,0,.2)' };

  return (
    <div className="panel" style={{ padding:'12px', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-brain" aria-hidden="true" style={{ color:'var(--accent)', fontSize:'13px' }}/>
          <span style={{ fontSize:'11px', fontWeight:600, color:'var(--accent)', letterSpacing:'.06em', textTransform:'uppercase' }}>AI Predictions</span>
        </div>
        <span className="badge badge-info" style={{ fontSize:'8px', padding:'1px 5px' }}>● Active</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
        {PREDICTIONS.map(p => (
          <button key={p.id} onClick={() => onCardClick&&onCardClick(p)}
            style={{
              display:'block', textAlign:'left', width:'100%',
              background:SB[p.status], border:`1px solid ${SBo[p.status]}`,
              borderLeft:`3px solid ${SC[p.status]}`,
              borderRadius:'var(--r-md)', padding:'9px 10px',
              cursor:'pointer', transition:'all var(--dur)',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=SC[p.status];e.currentTarget.style.borderLeftColor=SC[p.status];}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=SBo[p.status];e.currentTarget.style.borderLeftColor=SC[p.status];}}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ minWidth:0, flex:1, marginRight:8 }}>
                <div style={{ fontSize:'11px', fontWeight:600, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:'4px' }}>
                  <i className="ti ti-router" aria-hidden="true" style={{ fontSize:'10px', color:'var(--text-muted)', flexShrink:0 }}/>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.device}</span>
                </div>
                <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'1px' }}>{p.fault}</div>
              </div>
              <span style={{ fontSize:'15px', fontWeight:700, color:SC[p.status], fontFamily:'var(--font-mono)', flexShrink:0 }}>{p.risk}%</span>
            </div>
            <div style={{ marginTop:'6px', display:'flex', alignItems:'center', gap:'7px' }}>
              <div style={{ flex:1, height:3, background:'rgba(255,255,255,.08)', borderRadius:2 }}>
                <div style={{ width:`${p.risk}%`, height:'100%', borderRadius:2, background:SC[p.status] }}/>
              </div>
              <span style={{ fontSize:'9px', color:'var(--text-muted)', fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>
                {p.leadTime}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Alerts Table ─────────────────────────────────────────────────────────────
export function AlertsTable({ onRowClick }) {
  const [filter, setFilter] = useState('all');
  const SC = { crit:'var(--red)', warn:'var(--amber)', info:'var(--accent)' };
  const SS = {
    Open:    'rgba(255,61,61,.12)',
    ACK:     'rgba(255,170,0,.12)',
    Resolved:'rgba(30,224,122,.12)',
  };
  const ST = { Open:'var(--red)', ACK:'var(--amber)', Resolved:'var(--green)' };

  const rows = ALERTS.filter(a => filter==='all' || a.sev===filter);

  return (
    <div className="panel" style={{ padding:'12px', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-alert-triangle" aria-hidden="true" style={{ color:'var(--accent)', fontSize:'13px' }}/>
          <span style={{ fontSize:'11px', fontWeight:600, color:'var(--accent)', letterSpacing:'.06em', textTransform:'uppercase' }}>Alerts</span>
        </div>
        <div style={{ display:'flex', gap:'3px' }}>
          {['all','crit','warn'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              fontSize:'9px', padding:'2px 7px', borderRadius:'3px', cursor:'pointer',
              background: filter===f?'var(--accent-dim)':'transparent',
              border:`1px solid ${filter===f?'var(--accent-border)':'var(--border)'}`,
              color: filter===f?'var(--accent)':'var(--text-muted)',
              textTransform:'uppercase',
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ overflowY:'auto', flex:1 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }} aria-label="Alert events">
          <thead>
            <tr>
              {['Time','Device','Event','Sev'].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'4px 6px', fontSize:'9px', fontWeight:600, letterSpacing:'.06em', color:'var(--text-muted)', textTransform:'uppercase', borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--bg-panel)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(a=>(
              <tr key={a.id} onClick={()=>onRowClick&&onRowClick(a)}
                style={{ cursor:'pointer', borderBottom:'1px solid rgba(0,150,210,.05)', transition:'background var(--dur)' }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-glow)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                <td style={{ padding:'5px 6px', fontFamily:'var(--font-mono)', fontSize:'9.5px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{a.ts}</td>
                <td style={{ padding:'5px 6px', fontWeight:700, fontSize:'10.5px', color:SC[a.sev] }}>{a.device}</td>
                <td style={{ padding:'5px 6px', fontSize:'10px', color:'var(--text-secondary)', maxWidth:'110px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.event}</td>
                <td style={{ padding:'5px 6px' }}>
                  <span className={`badge badge-${a.sev}`} style={{ fontSize:'8px', padding:'1px 4px' }}>{a.sev.toUpperCase()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fault Timeline ───────────────────────────────────────────────────────────
export function FaultTimeline() {
  const DC = { crit:'var(--red)', warn:'var(--amber)', info:'var(--accent)', ok:'var(--green)' };
  const DB = { crit:'rgba(255,61,61,.15)', warn:'rgba(255,170,0,.15)', info:'rgba(0,207,255,.15)', ok:'rgba(30,224,122,.15)' };
  const ICONS = { crit:'ti-alert-hexagon', warn:'ti-alert-triangle', info:'ti-info-circle', ok:'ti-circle-check' };

  return (
    <div className="panel" style={{ padding:'12px', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
        <i className="ti ti-list-details" aria-hidden="true" style={{ color:'var(--accent)', fontSize:'13px' }}/>
        <span style={{ fontSize:'11px', fontWeight:600, color:'var(--accent)', letterSpacing:'.06em', textTransform:'uppercase' }}>Timeline</span>
      </div>

      <div style={{ overflowY:'auto', flex:1 }} role="log" aria-live="polite">
        {TIMELINE.map((ev, i) => (
          <div key={ev.id} style={{ display:'flex', gap:'8px', paddingBottom:'8px', position:'relative' }}>
            {i < TIMELINE.length-1 && (
              <div style={{ position:'absolute', left:11, top:22, bottom:0, width:1, background:'var(--border)' }}/>
            )}
            <div style={{
              width:22, height:22, borderRadius:'50%', flexShrink:0,
              background:DB[ev.type], border:`1.5px solid ${DC[ev.type]}`,
              display:'flex', alignItems:'center', justifyContent:'center', marginTop:1,
            }}>
              <i className={`ti ${ICONS[ev.type]}`} aria-hidden="true" style={{ fontSize:'10px', color:DC[ev.type] }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                <span style={{ fontSize:'9.5px', fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{ev.time}</span>
                <span style={{ fontSize:'10px', fontWeight:600, color:DC[ev.type] }}>{ev.label}</span>
              </div>
              <div style={{ fontSize:'10px', color:'var(--text-secondary)', marginTop:1, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ML Inference Console ─────────────────────────────────────────────────────
const NEW_LINES = [
  { comp:'[TELEM]      ', level:'ok',   msg:'Packet rcvd PE-02 · loss=2.48%  lat=154ms  cpu=95%' },
  { comp:'[ISOFOREST]  ', level:'warn', msg:'Score: 0.871 on PE-02 — trend CRITICAL' },
  { comp:'[XGBOOST]    ', level:'crit', msg:'Probability updated: 92.8% → ALERT ELEVATED' },
  { comp:'[SHAP]       ', level:'info', msg:'Features: pkt_loss(+0.41) lat_delta(+0.29) cpu(+0.18)' },
  { comp:'[TELEM]      ', level:'ok',   msg:'Packet rcvd CE-07 · bgp_state=IDLE' },
  { comp:'[ROOT-CAUSE] ', level:'warn', msg:'CE-07 BGP reconvergence — monitoring' },
];
const LC = { ok:'var(--green)', warn:'var(--amber)', crit:'var(--red)', info:'var(--accent)' };

export function InferenceConsole() {
  const [lines, setLines] = useState([...CONSOLE_STREAM]);
  const bottomRef = useRef(null);
  const idxRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      const ts = new Date().toLocaleTimeString('en-IN',{ hour12:false })+'.000';
      const l = { ...NEW_LINES[idxRef.current % NEW_LINES.length], ts };
      idxRef.current++;
      setLines(prev => [...prev.slice(-28), l]);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [lines]);

  return (
    <div className="panel" style={{ padding:'12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-terminal-2" aria-hidden="true" style={{ color:'var(--accent)', fontSize:'13px' }}/>
          <span style={{ fontSize:'11px', fontWeight:600, color:'var(--accent)', letterSpacing:'.06em', textTransform:'uppercase' }}>ML Inference Console</span>
        </div>
        <span className="badge badge-info" style={{ fontSize:'8px', padding:'1px 5px' }}>● Streaming</span>
      </div>
      <div
        style={{ fontFamily:'var(--font-mono)', fontSize:'10px', lineHeight:1.7,
          color:'rgba(170,195,240,.7)', maxHeight:'110px', overflowY:'auto',
          background:'rgba(0,0,0,.25)', borderRadius:'var(--r-md)', padding:'8px 10px' }}
        role="log" aria-live="polite"
      >
        {lines.map((l, i) => (
          <div key={i} style={{ display:'flex', gap:'8px', animation: i===lines.length-1?'fade-in .3s var(--ease)':undefined }}>
            <span style={{ color:'rgba(0,207,255,.4)', flexShrink:0, minWidth:'78px' }}>{l.ts}</span>
            <span style={{ color:LC[l.level], flexShrink:0, minWidth:'90px' }}>{l.comp}</span>
            <span>{l.msg}</span>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
    </div>
  );
}
