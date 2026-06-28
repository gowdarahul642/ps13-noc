import { useEffect, useRef, useState } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';
import { generateChartData } from '../data/mockData.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(6,14,30,.96)',
      borderColor: 'rgba(0,207,255,.3)', borderWidth: 1,
      titleColor: '#00CFFF', bodyColor: '#E6EFFF', padding: 10, cornerRadius: 6,
      titleFont: { family: "'JetBrains Mono',monospace", size: 11 },
      bodyFont:  { family: "'JetBrains Mono',monospace", size: 11 },
    },
  },
  scales: {
    x: {
      ticks: { color: 'rgba(110,145,200,.55)', maxTicksLimit: 8, font: { size: 9, family: "'JetBrains Mono',monospace" } },
      grid:  { color: 'rgba(0,150,210,.07)' },
      border:{ color: 'rgba(0,207,255,.1)' },
    },
    y: {
      ticks: { color: 'rgba(110,145,200,.55)', font: { size: 9, family: "'JetBrains Mono',monospace" } },
      grid:  { color: 'rgba(0,150,210,.07)' },
      border:{ color: 'rgba(0,207,255,.1)' },
    },
  },
};

function MiniChart({ canvasId, label, unit, color, data, labels }) {
  const ref = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    const instance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [...labels],
        datasets: [{
          data: [...data], borderColor: color,
          borderWidth: 2, tension: 0.4, pointRadius: 0, fill: { target: 'origin', above: `${color}15` },
        }],
      },
      options: CHART_OPTS,
    });
    chartInst.current = instance;
    return () => instance.destroy();
  }, []); // eslint-disable-line

  useEffect(() => {
    const c = chartInst.current;
    if (!c) return;
    c.data.labels = [...labels];
    c.data.datasets[0].data = [...data];
    c.update('none');
  }, [data, labels]);

  return (
    <div className="panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color, letterSpacing: '.04em' }}>{label}</span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color, fontWeight: 700 }}>
          {typeof data.at(-1) === 'number' ? data.at(-1).toFixed(1) : '—'}{unit}
        </span>
      </div>
      <div style={{ height: '100px', position: 'relative' }}>
        <canvas ref={ref} id={canvasId} aria-label={`${label} chart`}/>
      </div>
    </div>
  );
}

export default function MetricsScreen() {
  const dataRef = useRef(generateChartData(60));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const d = dataRef.current;
      const now = new Date().toLocaleTimeString('en-IN', { hour12: false });
      const push = (arr, val) => { arr.push(val); arr.shift(); };
      push(d.labels, now);
      push(d.pe02,   +(Math.max(80, Math.min(210, d.pe02.at(-1) + (Math.random()-.28)*9)).toFixed(1)));
      push(d.pe04,   +(60+Math.random()*12).toFixed(1));
      push(d.pe07,   +(46+Math.random()*8).toFixed(1));
      push(d.loss,   +(Math.min(4, Math.max(0.1, d.loss.at(-1) + (Math.random()-.25)*.15)).toFixed(2)));
      push(d.cpu02,  +(Math.min(99, Math.max(60, d.cpu02.at(-1) + (Math.random()-.3)*3)).toFixed(1)));
      push(d.cpu04,  +(82+Math.random()*7).toFixed(1));
      push(d.tput,   +(1800+Math.random()*400).toFixed(0));
      setTick(t => t + 1);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const d = dataRef.current;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
            Live Metrics
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Real-time telemetry · auto-refresh every 2s
          </div>
        </div>
        <span className="badge badge-info" style={{ fontSize: '10px' }}>● LIVE — {new Date().toLocaleTimeString('en-IN', { hour12: false })}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <MiniChart canvasId="c-lat-pe02"  label="Latency — PE-02"    unit=" ms"  color="#FFAA00" data={d.pe02}  labels={d.labels} key={`lat-pe02-${tick}`}/>
        <MiniChart canvasId="c-lat-pe04"  label="Latency — PE-04"    unit=" ms"  color="#00CFFF" data={d.pe04}  labels={d.labels} key={`lat-pe04-${tick}`}/>
        <MiniChart canvasId="c-loss"      label="Packet Loss — PE-02" unit=" %"   color="#FF3D3D" data={d.loss}  labels={d.labels} key={`loss-${tick}`}/>
        <MiniChart canvasId="c-cpu02"     label="CPU — PE-02"         unit=" %"   color="#FFAA00" data={d.cpu02} labels={d.labels} key={`cpu02-${tick}`}/>
        <MiniChart canvasId="c-cpu04"     label="CPU — PE-04"         unit=" %"   color="#00CFFF" data={d.cpu04} labels={d.labels} key={`cpu04-${tick}`}/>
        <MiniChart canvasId="c-tput"      label="Throughput — CORE"   unit=" Mbps"color="#1EE07A" data={d.tput}  labels={d.labels} key={`tput-${tick}`}/>
      </div>

      {/* Threshold table */}
      <div className="panel" style={{ padding: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '12px', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Threshold Status
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '600px' }}>
            <thead>
              <tr>
                {['Metric','Device','Current','Warn Threshold','Crit Threshold','Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', fontSize: '9.5px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { metric:'Latency',      device:'PE-02', current:`${d.pe02.at(-1)?.toFixed(0)}ms`, warn:'100ms', crit:'150ms', status: d.pe02.at(-1)>150?'crit':d.pe02.at(-1)>100?'warn':'ok' },
                { metric:'Packet Loss',  device:'PE-02', current:`${d.loss.at(-1)?.toFixed(2)}%`,  warn:'1.0%',  crit:'2.0%',  status: d.loss.at(-1)>2?'crit':d.loss.at(-1)>1?'warn':'ok' },
                { metric:'CPU Usage',    device:'PE-02', current:`${d.cpu02.at(-1)?.toFixed(0)}%`, warn:'80%',   crit:'90%',   status: d.cpu02.at(-1)>90?'crit':d.cpu02.at(-1)>80?'warn':'ok' },
                { metric:'CPU Usage',    device:'PE-04', current:`${d.cpu04.at(-1)?.toFixed(0)}%`, warn:'80%',   crit:'90%',   status: d.cpu04.at(-1)>90?'crit':d.cpu04.at(-1)>80?'warn':'ok' },
                { metric:'Latency',      device:'PE-04', current:`${d.pe04.at(-1)?.toFixed(0)}ms`, warn:'100ms', crit:'150ms', status: d.pe04.at(-1)>150?'crit':d.pe04.at(-1)>100?'warn':'ok' },
                { metric:'Throughput',   device:'CORE-01',current:`${d.tput.at(-1)?.toFixed(0)}Mbps`,warn:'2500Mbps',crit:'3000Mbps', status:'ok' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,150,210,.06)' }}>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{row.metric}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>{row.device}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: row.status==='crit'?'var(--red)':row.status==='warn'?'var(--amber)':'var(--green)' }}>{row.current}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>{row.warn}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{row.crit}</td>
                  <td style={{ padding: '8px 10px' }}><span className={`badge badge-${row.status}`}>{row.status.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
