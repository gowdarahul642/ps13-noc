import { useState } from 'react';
import { TOPOLOGY_NODES, TOPOLOGY_LINKS } from '../data/mockData.js';

const SC = { ok: '#1EE07A', warn: '#FFAA00', crit: '#FF3D3D' };
const SF = { ok: 'rgba(30,224,122,.08)', warn: 'rgba(255,170,0,.08)', crit: 'rgba(255,61,61,.12)' };
const SG = { ok: 'rgba(30,224,122,.18)', warn: 'rgba(255,170,0,.18)', crit: 'rgba(255,61,61,.22)' };

const ROLE_R = { Core: 20, PE: 14, CE: 9 };

export default function TopologyScreen({ onNodeClick }) {
  const [filter, setFilter] = useState('all');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);

  const W = 760, H = 420;
  const px = (n) => (n.x / 100) * W;
  const py = (n) => (n.y / 100) * H;
  const ns = Object.fromEntries(TOPOLOGY_NODES.map(n => [n.id, n]));

  const visibleNodes = TOPOLOGY_NODES.filter(n =>
    filter === 'all' || n.status === filter || (filter === 'pe' && n.role === 'PE') || (filter === 'ce' && n.role === 'CE')
  );
  const visibleIds = new Set(visibleNodes.map(n => n.id));

  const counts = { total: TOPOLOGY_NODES.length, ok: 0, warn: 0, crit: 0 };
  TOPOLOGY_NODES.forEach(n => counts[n.status]++);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
            Network Topology
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            MPLS core — {counts.total} nodes · {TOPOLOGY_LINKS.length} links
          </div>
        </div>
        {/* Summary pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[['ok','Healthy',counts.ok],['warn','Warning',counts.warn],['crit','Critical',counts.crit]].map(([s,l,c])=>(
            <div key={s} style={{
              background: s==='ok'?'var(--green-dim)':s==='warn'?'var(--amber-dim)':'var(--red-dim)',
              border: `1px solid ${s==='ok'?'var(--green-border)':s==='warn'?'var(--amber-border)':'var(--red-border)'}`,
              color: SC[s], borderRadius: 'var(--r-md)', padding: '5px 12px',
              fontSize: '11px', fontWeight: 600,
            }}>
              {c} {l}
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '4px' }}>FILTER:</span>
        {[['all','All Nodes'],['crit','Critical'],['warn','Warning'],['pe','PE Routers'],['ce','CE Nodes']].map(([f,l])=>(
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: '10px', padding: '3px 10px', borderRadius: '4px',
            background: filter===f ? 'var(--accent-dim)' : 'transparent',
            border: `1px solid ${filter===f ? 'var(--accent-border)' : 'var(--border)'}`,
            color: filter===f ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all var(--dur)',
          }}>{l}</button>
        ))}
      </div>

      {/* Topology SVG */}
      <div className="panel" style={{ flex: 1, overflow: 'hidden', position: 'relative', padding: '16px' }}>
        {/* Hover tooltip */}
        {hoveredNode && (() => {
          const n = ns[hoveredNode];
          if (!n) return null;
          const cpuC = n.cpu > 85 ? 'var(--red)' : n.cpu > 70 ? 'var(--amber)' : 'var(--green)';
          const memC = n.mem > 85 ? 'var(--red)' : n.mem > 70 ? 'var(--amber)' : 'var(--green)';
          return (
            <div style={{
              position: 'absolute', top: '20px', left: '20px', zIndex: 10,
              background: 'rgba(6,14,30,.97)',
              border: `1px solid ${SC[n.status]}`,
              borderRadius: 'var(--r-md)', padding: '10px 14px',
              fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: 1.8,
              pointerEvents: 'none',
            }}>
              <div style={{ fontWeight: 700, color: SC[n.status], marginBottom: '4px', fontSize: '12px' }}>
                {n.id} [{n.role}]
              </div>
              <div>IP: <span style={{ color: 'var(--text-secondary)' }}>{n.ip}</span></div>
              <div>CPU: <span style={{ color: cpuC }}>{n.cpu}%</span></div>
              <div>Memory: <span style={{ color: memC }}>{n.mem}%</span></div>
              <div>Tunnels: <span style={{ color: 'var(--accent)' }}>{n.tunnels}</span></div>
              <div>Status: <span style={{ color: SC[n.status] }}>{n.status.toUpperCase()}</span></div>
              <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                Click to open device detail
              </div>
            </div>
          );
        })()}

        <svg
          width="100%" viewBox={`0 0 ${W} ${H}`}
          aria-label="Full MPLS network topology"
          role="img"
          style={{ display: 'block' }}
        >
          {/* Background grid */}
          {[10,20,30,40,50,60,70,80,90].map(p => (
            <g key={p}>
              <line x1={(p/100)*W} y1="0" x2={(p/100)*W} y2={H} stroke="rgba(0,150,210,.04)" strokeWidth="1"/>
              <line x1="0" y1={(p/100)*H} x2={W} y2={(p/100)*H} stroke="rgba(0,150,210,.04)" strokeWidth="1"/>
            </g>
          ))}

          {/* Links */}
          {TOPOLOGY_LINKS.filter(l => visibleIds.has(l.from) && visibleIds.has(l.to)).map((l, i) => {
            const f = ns[l.from], t = ns[l.to];
            if (!f || !t) return null;
            const isHov = hoveredLink === i;
            return (
              <g key={i}>
                <line
                  x1={px(f)} y1={py(f)} x2={px(t)} y2={py(t)}
                  stroke={SC[l.status]}
                  strokeWidth={l.status === 'crit' ? 3 : l.status === 'warn' ? 2.5 : 1.5}
                  opacity={isHov ? 1 : 0.5}
                  strokeDasharray={l.status === 'crit' ? '6 4' : undefined}
                  style={{ cursor: 'pointer', transition: 'opacity .15s' }}
                  onMouseEnter={() => setHoveredLink(i)}
                  onMouseLeave={() => setHoveredLink(null)}
                />
                {/* Utilisation badge on hover */}
                {isHov && (
                  <text
                    x={(px(f)+px(t))/2} y={(py(f)+py(t))/2 - 7}
                    textAnchor="middle" fill={SC[l.status]}
                    fontSize="10" fontFamily="var(--font-mono)"
                    style={{ pointerEvents: 'none' }}
                  >
                    {l.util}% util
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map(n => {
            const x = px(n), y = py(n), r = ROLE_R[n.role];
            const isHov = hoveredNode === n.id;
            return (
              <g
                key={n.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onNodeClick && onNodeClick(n)}
                role="button"
                aria-label={`${n.id}: ${n.status}, CPU ${n.cpu}%, Memory ${n.mem}%`}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onNodeClick && onNodeClick(n); }}
              >
                {/* Glow */}
                {(n.status !== 'ok' || isHov) && (
                  <circle cx={x} cy={y} r={r + 8} fill={SG[n.status]} opacity={isHov ? 1 : 0.7}/>
                )}
                {/* Body */}
                <circle cx={x} cy={y} r={r}
                  fill={SF[n.status]}
                  stroke={SC[n.status]}
                  strokeWidth={n.status === 'crit' ? 2.5 : 1.8}
                />
                {/* Role label inside */}
                {n.role === 'Core' && (
                  <text x={x} y={y+4} textAnchor="middle"
                    fill={SC[n.status]} fontSize="7" fontWeight="700"
                    fontFamily="monospace" style={{ pointerEvents: 'none' }}>
                    CORE
                  </text>
                )}
                {/* Node label below */}
                <text x={x} y={y+r+13} textAnchor="middle"
                  fill={isHov ? SC[n.status] : 'rgba(170,195,240,.8)'}
                  fontSize={n.role === 'CE' ? 8 : 9}
                  fontFamily="monospace"
                  fontWeight={isHov ? '600' : '400'}
                  style={{ pointerEvents: 'none' }}
                >
                  {n.id}
                </text>
                {/* CPU bar below label */}
                {n.role !== 'CE' && (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect x={x-18} y={y+r+16} width="36" height="3" rx="1.5" fill="rgba(255,255,255,.08)"/>
                    <rect x={x-18} y={y+r+16}
                      width={Math.round((n.cpu/100)*36)} height="3" rx="1.5"
                      fill={n.cpu>85?SC.crit:n.cpu>70?SC.warn:SC.ok}/>
                  </g>
                )}
                {/* Critical badge */}
                {n.status === 'crit' && (
                  <g style={{ pointerEvents: 'none' }}>
                    <circle cx={x+r} cy={y-r} r="6" fill="#FF3D3D"/>
                    <text x={x+r} y={y-r+4} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700">!</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(10, ${H-22})`}>
            {[['ok','Healthy'],['warn','Warning'],['crit','Critical']].map(([s,l],i) => (
              <g key={s} transform={`translate(${i*90},0)`}>
                <circle cx="6" cy="6" r="6" fill={SF[s]} stroke={SC[s]} strokeWidth="1.5"/>
                <text x="16" y="10" fill="rgba(110,145,200,.6)" fontSize="9" fontFamily="monospace">{l}</text>
              </g>
            ))}
            <text x="285" y="10" fill="rgba(110,145,200,.4)" fontSize="9" fontFamily="monospace">
              CPU bar shown below PE/Core nodes · click any node for detail
            </text>
          </g>
        </svg>
      </div>

      {/* Link table */}
      <div className="panel" style={{ padding: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '10px', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Link Utilisation
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {TOPOLOGY_LINKS.map((l, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: `1px solid ${SC[l.status]}33`,
              borderLeft: `3px solid ${SC[l.status]}`,
              borderRadius: 'var(--r-md)', padding: '8px 10px',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: SC[l.status], fontFamily: 'var(--font-mono)' }}>
                {l.from} → {l.to}
              </div>
              <div style={{ marginTop: '5px', height: '3px', background: 'rgba(255,255,255,.07)', borderRadius: '2px' }}>
                <div style={{ width: `${l.util}%`, height: '100%', background: SC[l.status], borderRadius: '2px' }}/>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {l.util}% utilized
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
