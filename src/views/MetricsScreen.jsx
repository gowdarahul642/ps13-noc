import { useEffect, useRef, useState } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler,
} from 'chart.js';
import { generateChartData } from '../data/mockData.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

const BASE_OPTS = {
  responsive:true, maintainAspectRatio:false, animation:{ duration:0 },
  interaction:{ mode:'index', intersect:false },
  plugins:{
    legend:{ display:false },
    tooltip:{
      backgroundColor:'rgba(6,14,30,.96)', borderColor:'rgba(0,207,255,.3)', borderWidth:1,
      titleColor:'#00CFFF', bodyColor:'#E6EFFF', padding:8, cornerRadius:6,
      titleFont:{ family:"'JetBrains Mono',monospace", size:10 },
      bodyFont:{ family:"'JetBrains Mono',monospace", size:10 },
    },
  },
  scales:{
    x:{ ticks:{ color:'rgba(110,145,200,.55)', maxTicksLimit:6, font:{ size:8, family:"'JetBrains Mono',monospace" } }, grid:{ color:'rgba(0,150,210,.07)' }, border:{ color:'rgba(0,207,255,.1)' } },
    y:{ ticks:{ color:'rgba(110,145,200,.55)', font:{ size:8, family:"'JetBrains Mono',monospace" } }, grid:{ color:'rgba(0,150,210,.07)' }, border:{ color:'rgba(0,207,255,.1)' } },
  },
};

function MiniChart({ label, color, dataKey, unit, liveData }) {
  const ref   = useRef(null);
  const chart = useRef(null);
  const prev  = useRef([]);

  useEffect(() => {
    if (!ref.current) return;
    const d = liveData.current;
    const inst = new Chart(ref.current.getContext('2d'), {
      type:'line',
      data:{
        labels:[...d.labels],
        datasets:[{ data:[...d[dataKey]], borderColor:color, borderWidth:2,
          tension:.4, pointRadius:0, fill:{ target:'origin', above:`${color}18` } }],
      },
      options: BASE_OPTS,
    });
    chart.current = inst;
    prev.current  = [...d[dataKey]];
    return () => inst.destroy();
  }, []); // eslint-disable-line

  // Updated externally via ref — parent calls chart.current.update()
  // We expose update method via ref
  useEffect(() => {
    const id = setInterval(() => {
      const c = chart.current;
      const d = liveData.current;
      if (!c) return;
      c.data.labels         = [...d.labels];
      c.data.datasets[0].data = [...d[dataKey]];
      c.update('none');
    }, 2000);
    return () => clearInterval(id);
  }, [dataKey, liveData]);

  const last = liveData.current[dataKey]?.at(-1);

  return (
    <div className="panel" style={{ padding:'14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <span style={{ fontSize:'11px', fontWeight:600, color, letterSpacing:'.04em' }}>{label}</span>
        <span style={{ fontSize:'13px', fontFamily:'var(--font-mono)', color, fontWeight:700 }}>
          {typeof last === 'number' ? last.toFixed(1) : '—'}{unit}
        </span>
      </div>
      <div style={{ height:'90px', position:'relative' }}>
        <canvas ref={ref} aria-label={`${label} chart`}/>
      </div>
    </div>
  );
}

export default function MetricsScreen() {
  const dataRef = useRef(generateChartData(60));
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const d = dataRef.current;
      const now = new Date().toLocaleTimeString('en-IN',{ hour12:false });
      const push = (arr, v) => { arr.push(v); arr.shift(); };
      push(d.labels, now);
      push(d.pe02,  +(Math.max(80,Math.min(210, d.pe02.at(-1)+(Math.random()-.28)*9)).toFixed(1)));
      push(d.pe04,  +(60+Math.random()*12).toFixed(1));
      push(d.pe07,  +(46+Math.random()*8).toFixed(1));
      push(d.loss,  +(Math.min(4,Math.max(0.1, d.loss.at(-1)+(Math.random()-.25)*.15)).toFixed(2)));
      push(d.cpu02, +(Math.min(99,Math.max(60, d.cpu02.at(-1)+(Math.random()-.3)*3)).toFixed(1)));
      push(d.cpu04, +(82+Math.random()*7).toFixed(1));
      push(d.tput,  +(1800+Math.random()*400).toFixed(0));
      setTick(t => t+1);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const d = dataRef.current;
  const CHARTS = [
    { label:'Latency — PE-02',    color:'#FFAA00', dataKey:'pe02',  unit:' ms'   },
    { label:'Latency — PE-04',    color:'#00CFFF', dataKey:'pe04',  unit:' ms'   },
    { label:'Packet Loss — PE-02',color:'#FF3D3D', dataKey:'loss',  unit:' %'    },
    { label:'CPU — PE-02',        color:'#FFAA00', dataKey:'cpu02', unit:' %'    },
    { label:'CPU — PE-04',        color:'#00CFFF', dataKey:'cpu04', unit:' %'    },
    { label:'Throughput — CORE',  color:'#1EE07A', dataKey:'tput',  unit:' Mbps' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:'18px', fontWeight:700, color:'var(--accent)', letterSpacing:'-0.02em' }}>Live Metrics</div>
          <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>Real-time telemetry · auto-refresh 2s</div>
        </div>
        <span className="badge badge-info" style={{ fontSize:'10px' }}>● LIVE</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        {CHARTS.map(c => (
          <MiniChart key={c.dataKey+c.label} {...c} liveData={dataRef}/>
        ))}
      </div>

      <div className="panel" style={{ padding:'16px' }}>
        <div style={{ fontSize:'11px', fontWeight:600, color:'var(--accent)', marginBottom:'12px', letterSpacing:'.06em', textTransform:'uppercase' }}>Threshold Status</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
          <thead>
            <tr>{['Metric','Device','Current','Warn','Crit','Status'].map(h=>(
              <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:'1px solid var(--border)', fontSize:'9.5px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {[
              { m:'Latency',     dev:'PE-02', cur:`${d.pe02.at(-1)?.toFixed(0)}ms`,  warn:'100ms', crit:'150ms', s: d.pe02.at(-1)>150?'crit':d.pe02.at(-1)>100?'warn':'ok' },
              { m:'Packet Loss', dev:'PE-02', cur:`${d.loss.at(-1)?.toFixed(2)}%`,   warn:'1.0%',  crit:'2.0%',  s: d.loss.at(-1)>2?'crit':d.loss.at(-1)>1?'warn':'ok' },
              { m:'CPU Usage',   dev:'PE-02', cur:`${d.cpu02.at(-1)?.toFixed(0)}%`,  warn:'80%',   crit:'90%',   s: d.cpu02.at(-1)>90?'crit':d.cpu02.at(-1)>80?'warn':'ok' },
              { m:'CPU Usage',   dev:'PE-04', cur:`${d.cpu04.at(-1)?.toFixed(0)}%`,  warn:'80%',   crit:'90%',   s: d.cpu04.at(-1)>90?'crit':d.cpu04.at(-1)>80?'warn':'ok' },
              { m:'Throughput',  dev:'CORE',  cur:`${d.tput.at(-1)?.toFixed(0)} Mbps`,warn:'2500', crit:'3000',  s:'ok' },
            ].map((r,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid rgba(0,150,210,.06)' }}>
                <td style={{ padding:'7px 10px', color:'var(--text-secondary)' }}>{r.m}</td>
                <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:600 }}>{r.dev}</td>
                <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', fontWeight:700, color:r.s==='crit'?'var(--red)':r.s==='warn'?'var(--amber)':'var(--green)' }}>{r.cur}</td>
                <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', color:'var(--amber)' }}>{r.warn}</td>
                <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', color:'var(--red)' }}>{r.crit}</td>
                <td style={{ padding:'7px 10px' }}><span className={`badge badge-${r.s}`}>{r.s.toUpperCase()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
