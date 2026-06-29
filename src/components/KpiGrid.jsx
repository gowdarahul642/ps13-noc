import { useState } from 'react';
import { INITIAL_KPI } from '../data/mockData.js';

const SC = { ok:'var(--green)', warn:'var(--amber)', crit:'var(--red)' };
const TI = { up:'ti-trending-up', down:'ti-trending-down', stable:'ti-minus' };
const TC = { up:'var(--red)', down:'var(--green)', stable:'var(--text-muted)' };

export default function KpiGrid({ onCardClick }) {
  const [hov, setHov] = useState(null);
  return (
    <section aria-label="KPI cards">
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(4,minmax(0,1fr))',
        gap:'8px',
      }}>
        {INITIAL_KPI.map(k => {
          const color = SC[k.status];
          const isH   = hov===k.id;
          return (
            <button key={k.id}
              onClick={() => onCardClick&&onCardClick(k)}
              onMouseEnter={() => setHov(k.id)}
              onMouseLeave={() => setHov(null)}
              aria-label={`${k.label}: ${k.value}${k.unit}`}
              style={{
                display:'block', textAlign:'left',
                background: isH?'var(--bg-card-hover)':'var(--bg-card)',
                border:`1px solid ${isH?color:'var(--border)'}`,
                borderTop:`2px solid ${color}`,
                borderRadius:'var(--r-lg)', padding:'11px 12px',
                cursor:'pointer', transition:'all var(--dur) var(--ease)',
                animation:'fade-in .3s var(--ease) both',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'var(--text-muted)', fontWeight:500 }}>
                  <i className={`ti ${k.icon}`} aria-hidden="true" style={{ fontSize:'11px' }}/>
                  {k.label}
                </div>
                <span className={`badge badge-${k.status}`} style={{ fontSize:'8px', padding:'1px 5px' }}>
                  {k.status==='ok'?'OK':k.status==='warn'?'WARN':'CRIT'}
                </span>
              </div>
              <div style={{ marginTop:'7px', fontSize:'26px', fontWeight:700, lineHeight:1, color, letterSpacing:'-.02em', fontVariantNumeric:'tabular-nums' }}>
                {k.value}<span style={{ fontSize:'13px', fontWeight:400, color:'var(--text-muted)', marginLeft:'2px' }}>{k.unit}</span>
              </div>
              <div style={{ marginTop:'5px', fontSize:'10px', color:TC[k.trend], display:'flex', alignItems:'center', gap:'4px' }}>
                <i className={`ti ${TI[k.trend]}`} aria-hidden="true"/>
                {k.trendVal}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
