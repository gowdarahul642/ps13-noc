import { useEffect, useRef, useState } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler,
} from 'chart.js';
import { generateChartData } from '../data/mockData.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

const TABS = [
  { id: 'latency',    label: 'Latency (ms)' },
  { id: 'loss',       label: 'Pkt Loss %' },
  { id: 'cpu',        label: 'CPU %' },
  { id: 'throughput', label: 'Throughput' },
];
const RANGES = ['5m', '1h', 'Today'];

function buildDatasets(tab, d) {
  const b = { tension: 0.4, pointRadius: 0, fill: false, borderWidth: 1.8 };
  if (tab === 'latency')    return [
    { ...b, label:'PE-02', data:[...d.pe02],  borderColor:'#FFAA00', borderWidth:2 },
    { ...b, label:'PE-04', data:[...d.pe04],  borderColor:'#00CFFF' },
    { ...b, label:'PE-07', data:[...d.pe07],  borderColor:'#1EE07A' },
  ];
  if (tab === 'loss')       return [{ ...b, label:'PE-02 Loss', data:[...d.loss],  borderColor:'#FF3D3D', borderWidth:2 }];
  if (tab === 'cpu')        return [
    { ...b, label:'PE-02', data:[...d.cpu02], borderColor:'#FFAA00', borderWidth:2 },
    { ...b, label:'PE-04', data:[...d.cpu04], borderColor:'#00CFFF' },
  ];
  if (tab === 'throughput') return [{ ...b, label:'Throughput', data:[...d.tput], borderColor:'#1EE07A', fill:{ target:'origin', above:'rgba(30,224,122,.06)' } }];
  return [];
}

const LEGENDS = {
  latency:    [['PE-02','#FFAA00'],['PE-04','#00CFFF'],['PE-07','#1EE07A']],
  loss:       [['PE-02 Loss','#FF3D3D']],
  cpu:        [['PE-02','#FFAA00'],['PE-04','#00CFFF']],
  throughput: [['Throughput','#1EE07A']],
};

const OPTS = {
  responsive:true, maintainAspectRatio:false, animation:{ duration:0 },
  interaction:{ mode:'index', intersect:false },
  plugins:{
    legend:{ display:false },
    tooltip:{
      backgroundColor:'rgba(6,14,30,.96)', borderColor:'rgba(0,207,255,.3)', borderWidth:1,
      titleColor:'#00CFFF', bodyColor:'#E6EFFF', padding:10, cornerRadius:6,
      titleFont:{ family:"'JetBrains Mono',monospace", size:11 },
      bodyFont:{ family:"'JetBrains Mono',monospace", size:11 },
    },
  },
  scales:{
    x:{ ticks:{ color:'rgba(110,145,200,.55)', maxTicksLimit:7, font:{ size:9, family:"'JetBrains Mono',monospace" } }, grid:{ color:'rgba(0,150,210,.07)' }, border:{ color:'rgba(0,207,255,.1)' } },
    y:{ ticks:{ color:'rgba(110,145,200,.55)', font:{ size:9, family:"'JetBrains Mono',monospace" } }, grid:{ color:'rgba(0,150,210,.07)' }, border:{ color:'rgba(0,207,255,.1)' } },
  },
};

export default function MetricsChart() {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const dataRef   = useRef(generateChartData(40));
  const tabRef    = useRef('latency');
  const [activeTab,   setActiveTab]   = useState('latency');
  const [activeRange, setActiveRange] = useState('5m');

  useEffect(() => {
    if (!canvasRef.current) return;
    const d = dataRef.current;
    const c = new Chart(canvasRef.current.getContext('2d'), {
      type: 'line',
      data: { labels:[...d.labels], datasets: buildDatasets('latency', d) },
      options: OPTS,
    });
    chartRef.current = c;
    return () => c.destroy();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const c = chartRef.current;
      const d = dataRef.current;
      if (!c) return;
      const now = new Date().toLocaleTimeString('en-IN',{ hour12:false });
      const push = (arr, v) => { arr.push(v); arr.shift(); };
      push(d.labels, now);
      push(d.pe02,  +(Math.max(80, Math.min(210, d.pe02.at(-1)  + (Math.random()-.28)*9)).toFixed(1)));
      push(d.pe04,  +(60+Math.random()*12).toFixed(1));
      push(d.pe07,  +(46+Math.random()*8).toFixed(1));
      push(d.loss,  +(Math.min(4, Math.max(0.1, d.loss.at(-1)  + (Math.random()-.25)*.15)).toFixed(2)));
      push(d.cpu02, +(Math.min(99, Math.max(60, d.cpu02.at(-1) + (Math.random()-.3)*3)).toFixed(1)));
      push(d.cpu04, +(82+Math.random()*7).toFixed(1));
      push(d.tput,  +(1800+Math.random()*400).toFixed(0));
      c.data.labels   = [...d.labels];
      c.data.datasets = buildDatasets(tabRef.current, d);
      c.update('none');
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const switchTab = (t) => {
    setActiveTab(t);
    tabRef.current = t;
    const c = chartRef.current;
    if (!c) return;
    c.data.datasets = buildDatasets(t, dataRef.current);
    c.update('none');
  };

  return (
    <div className="panel" style={{ display:'flex', flexDirection:'column', padding:'14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
          <i className="ti ti-chart-line" aria-hidden="true" style={{ color:'var(--accent)', fontSize:'14px' }}/>
          <span style={{ fontSize:'11px', fontWeight:600, color:'var(--accent)', letterSpacing:'.06em', textTransform:'uppercase' }}>Live Metrics</span>
          <span className="badge badge-info" style={{ fontSize:'8px', padding:'1px 5px' }}>● LIVE</span>
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setActiveRange(r)} style={{
              fontSize:'10px', padding:'2px 8px', borderRadius:'4px',
              background: activeRange===r ? 'var(--accent-dim)' : 'transparent',
              border:`1px solid ${activeRange===r ? 'var(--accent-border)' : 'var(--border)'}`,
              color: activeRange===r ? 'var(--accent)' : 'var(--text-muted)',
              cursor:'pointer',
            }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:'10px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
            fontSize:'10px', padding:'5px 10px',
            color: activeTab===t.id ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom:`2px solid ${activeTab===t.id ? 'var(--accent)' : 'transparent'}`,
            background:'transparent', cursor:'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ position:'relative', height:'140px' }}>
        <canvas ref={canvasRef} aria-label={`Live ${activeTab} chart`}/>
      </div>

      <div style={{ display:'flex', gap:'14px', marginTop:'8px' }}>
        {(LEGENDS[activeTab]||[]).map(([l,c]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10px', color:'var(--text-muted)' }}>
            <div style={{ width:'14px', height:'2px', background:c, borderRadius:'1px' }}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
