import { useEffect, useRef, useState } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, TimeScale, CategoryScale,
  Tooltip, Filler, Legend,
} from 'chart.js';
import { generateChartData } from '../data/mockData';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler, Legend);

const TABS = [
  { id: 'latency',    label: 'Latency (ms)' },
  { id: 'loss',       label: 'Packet Loss %' },
  { id: 'cpu',        label: 'CPU %' },
  { id: 'throughput', label: 'Throughput Mbps' },
];
const TIME_RANGES = ['5m', '1h', 'Today'];

function buildDatasets(tab, data) {
  const base = {
    tension: 0.4,
    pointRadius: 0,
    borderWidth: 1.5,
    fill: false,
  };
  if (tab === 'latency') return [
    { ...base, label: 'PE-02', data: data.pe02, borderColor: '#FFAA00', borderWidth: 2 },
    { ...base, label: 'PE-04', data: data.pe04, borderColor: '#00CFFF' },
    { ...base, label: 'PE-07', data: data.pe07, borderColor: '#1EE07A' },
  ];
  if (tab === 'loss') return [
    { ...base, label: 'PE-02 Loss', data: data.loss_pe02, borderColor: '#FF3D3D', borderWidth: 2 },
  ];
  if (tab === 'cpu') return [
    { ...base, label: 'PE-02 CPU', data: data.cpu_pe02, borderColor: '#FFAA00', borderWidth: 2 },
    { ...base, label: 'PE-04 CPU', data: data.cpu_pe04, borderColor: '#00CFFF' },
  ];
  if (tab === 'throughput') return [
    { ...base, label: 'Throughput', data: data.throughput, borderColor: '#1EE07A', fill: { target: 'origin', above: 'rgba(30,224,122,0.06)' } },
  ];
  return [];
}

export default function MetricsChart() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const dataRef = useRef(generateChartData(40));
  const [activeTab, setActiveTab] = useState('latency');
  const [activeRange, setActiveRange] = useState('5m');
  const tabRef = useRef('latency');

  useEffect(() => {
    tabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const data = dataRef.current;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [...data.labels],
        datasets: buildDatasets('latency', data),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(6,14,30,0.96)',
            borderColor: 'rgba(0,207,255,0.3)',
            borderWidth: 1,
            titleColor: 'var(--accent)',
            bodyColor: '#E6EFFF',
            padding: 10,
            cornerRadius: 6,
            titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
          },
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(110,145,200,0.55)',
              maxTicksLimit: 7,
              font: { size: 9, family: "'JetBrains Mono', monospace" },
            },
            grid: { color: 'rgba(0,150,210,0.07)' },
            border: { color: 'rgba(0,207,255,0.1)' },
          },
          y: {
            ticks: {
              color: 'rgba(110,145,200,0.55)',
              font: { size: 9, family: "'JetBrains Mono', monospace" },
            },
            grid: { color: 'rgba(0,150,210,0.07)' },
            border: { color: 'rgba(0,207,255,0.1)' },
          },
        },
      },
    });

    chartRef.current = chart;
    return () => chart.destroy();
  }, []);

  // Live update
  useEffect(() => {
    const id = setInterval(() => {
      const chart = chartRef.current;
      const data = dataRef.current;
      if (!chart) return;

      const now = new Date().toLocaleTimeString('en-IN', { hour12: false });
      const lastLat = data.pe02.at(-1);
      const newLat = Math.max(80, Math.min(220, lastLat + (Math.random() - 0.28) * 8));

      data.labels.push(now);        data.labels.shift();
      data.pe02.push(+newLat.toFixed(1)); data.pe02.shift();
      data.pe04.push(+(58 + Math.random() * 12).toFixed(1)); data.pe04.shift();
      data.pe07.push(+(44 + Math.random() * 8).toFixed(1));  data.pe07.shift();
      data.loss_pe02.push(+(Math.min(4, (data.loss_pe02.at(-1) || 0.8) + (Math.random() - 0.25) * 0.15)).toFixed(2));
      data.loss_pe02.shift();
      data.cpu_pe02.push(+(Math.min(99, (data.cpu_pe02.at(-1) || 85) + (Math.random() - 0.3) * 3)).toFixed(1));
      data.cpu_pe02.shift();
      data.cpu_pe04.push(+(82 + Math.random() * 6).toFixed(1)); data.cpu_pe04.shift();
      data.throughput.push(+(1800 + Math.random() * 400).toFixed(0)); data.throughput.shift();

      const tab = tabRef.current;
      chart.data.labels = [...data.labels];
      chart.data.datasets = buildDatasets(tab, data);
      chart.update('none');
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.datasets = buildDatasets(tab, dataRef.current);
    chart.update('none');
  };

  const legendColors = {
    latency:    [['PE-02', '#FFAA00'], ['PE-04', '#00CFFF'], ['PE-07', '#1EE07A']],
    loss:       [['PE-02 Loss', '#FF3D3D']],
    cpu:        [['PE-02', '#FFAA00'], ['PE-04', '#00CFFF']],
    throughput: [['Throughput', '#1EE07A']],
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', padding: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <i className="ti ti-chart-line" aria-hidden="true" style={{ color: 'var(--accent)', fontSize: '14px' }}/>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Live Metrics
          </span>
          <span className="badge badge-info" style={{ fontSize: '8px', padding: '1px 5px' }}>
            ● LIVE
          </span>
        </div>
        {/* Time range pills */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {TIME_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              style={{
                fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                background: activeRange === r ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${activeRange === r ? 'var(--accent-border)' : 'var(--border)'}`,
                color: activeRange === r ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all var(--dur-fast)',
              }}
            >{r}</button>
          ))}
        </div>
      </div>

      {/* Metric tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', marginBottom: '10px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            style={{
              fontSize: '10px', padding: '5px 10px',
              color: activeTab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === t.id ? 'var(--accent)' : 'transparent'}`,
              background: 'transparent', cursor: 'pointer',
              transition: 'all var(--dur-fast)',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', height: '140px', flex: '1 0 140px' }}>
        <canvas ref={canvasRef} aria-label={`Live ${activeTab} chart`}/>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
        {(legendColors[activeTab] || []).map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--text-muted)' }}>
            <div style={{ width: '16px', height: '2px', background: color, borderRadius: '1px' }}/>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
