import { useState } from 'react';
import { TOPOLOGY_NODES, TOPOLOGY_LINKS } from '../data/mockData';

const STATUS_COLORS = { ok: '#1EE07A', warn: '#FFAA00', crit: '#FF3D3D' };
const STATUS_GLOW   = { ok: 'rgba(30,224,122,0.25)', warn: 'rgba(255,170,0,0.25)', crit: 'rgba(255,61,61,0.3)' };
const STATUS_FILL   = { ok: 'rgba(30,224,122,0.08)', warn: 'rgba(255,170,0,0.08)', crit: 'rgba(255,61,61,0.12)' };

const ROLE_RADIUS = { Core: 16, PE: 12, CE: 8 };

function pct(v, max) { return (v / 100) * max; }

export default function NetworkTopology({ onNodeClick }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);

  const W = 340, H = 200;

  const nodePos = (node) => ({
    x: pct(node.x, W),
    y: pct(node.y, H),
  });

  const getLinkColor = (link) => STATUS_COLORS[link.status];

  return (
    <div className="panel" style={{ padding: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <i className="ti ti-topology-star-3" aria-hidden="true" style={{ color: 'var(--accent)', fontSize: '14px' }}/>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Network Topology
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MPLS core · 24 nodes</span>
      </div>

      {/* Tooltip */}
      {hoveredNode && (() => {
        const n = TOPOLOGY_NODES.find(n => n.id === hoveredNode);
        if (!n) return null;
        return (
          <div style={{
            position: 'absolute', zIndex: 50,
            background: 'rgba(6,14,30,0.97)',
            border: `1px solid ${STATUS_COLORS[n.status]}`,
            borderRadius: 'var(--r-md)', padding: '8px 12px',
            fontSize: '10px', color: 'var(--text-primary)',
            pointerEvents: 'none',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 700, color: STATUS_COLORS[n.status], marginBottom: '4px' }}>{n.id} [{n.role}]</div>
            <div>CPU: <span style={{ color: n.cpu > 85 ? 'var(--red)' : n.cpu > 70 ? 'var(--amber)' : 'var(--green)' }}>{n.cpu}%</span></div>
            <div>MEM: <span style={{ color: n.mem > 85 ? 'var(--red)' : n.mem > 70 ? 'var(--amber)' : 'var(--green)' }}>{n.mem}%</span></div>
            <div>Status: <span style={{ color: STATUS_COLORS[n.status] }}>{n.status.toUpperCase()}</span></div>
          </div>
        );
      })()}

      {/* SVG topology */}
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        aria-label="MPLS network topology. Nodes color-coded by health status."
        role="img"
        style={{ cursor: 'default' }}
      >
        <title>MPLS Network Topology</title>

        {/* Grid lines (subtle) */}
        {[25,50,75].map(p => (
          <g key={p}>
            <line x1={pct(p,W)} y1="0" x2={pct(p,W)} y2={H} stroke="rgba(0,150,210,0.05)" strokeWidth="1"/>
            <line x1="0" y1={pct(p,H)} x2={W} y2={pct(p,H)} stroke="rgba(0,150,210,0.05)" strokeWidth="1"/>
          </g>
        ))}

        {/* Links */}
        {TOPOLOGY_LINKS.map((link, i) => {
          const from = TOPOLOGY_NODES.find(n => n.id === link.from);
          const to   = TOPOLOGY_NODES.find(n => n.id === link.to);
          if (!from || !to) return null;
          const fp = nodePos(from), tp = nodePos(to);
          const color = getLinkColor(link);
          const isHov = hoveredLink === i;
          return (
            <g key={i}>
              <line
                x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                stroke={color}
                strokeWidth={link.status === 'crit' ? 2.5 : link.status === 'warn' ? 2 : 1.2}
                opacity={isHov ? 1 : 0.55}
                strokeDasharray={link.status === 'crit' ? '4 3' : undefined}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={() => setHoveredLink(i)}
                onMouseLeave={() => setHoveredLink(null)}
              />
              {/* Utilization label on link midpoint */}
              {isHov && (
                <text
                  x={(fp.x + tp.x) / 2}
                  y={(fp.y + tp.y) / 2 - 4}
                  textAnchor="middle"
                  fill={color}
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                  style={{ pointerEvents: 'none' }}
                >
                  {link.util}%
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {TOPOLOGY_NODES.map((node) => {
          const { x, y } = nodePos(node);
          const r = ROLE_RADIUS[node.role];
          const color = STATUS_COLORS[node.status];
          const glow  = STATUS_GLOW[node.status];
          const fill  = STATUS_FILL[node.status];
          const isHov = hoveredNode === node.id;

          return (
            <g
              key={node.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onNodeClick && onNodeClick(node)}
              role="button"
              aria-label={`${node.id}: ${node.status}, CPU ${node.cpu}%, Memory ${node.mem}%`}
            >
              {/* Glow halo */}
              {(node.status !== 'ok' || isHov) && (
                <circle
                  cx={x} cy={y} r={r + 5}
                  fill={glow}
                  style={{
                    animation: node.status === 'crit' ? 'pulse-dot 1.5s ease-in-out infinite' : undefined,
                  }}
                />
              )}
              {/* Main circle */}
              <circle
                cx={x} cy={y} r={r}
                fill={fill}
                stroke={color}
                strokeWidth={node.status === 'crit' ? 2 : 1.5}
              />
              {/* Label */}
              <text
                x={x} y={y + r + 9}
                textAnchor="middle"
                fill={isHov ? color : 'rgba(170,195,240,0.7)'}
                fontSize={node.role === 'Core' ? '8' : node.role === 'PE' ? '7' : '6'}
                fontFamily="var(--font-mono)"
                fontWeight={node.role === 'Core' ? '600' : '400'}
              >
                {node.id}
              </text>
              {/* Role label inside circle */}
              {node.role === 'Core' && (
                <text
                  x={x} y={y + 3}
                  textAnchor="middle"
                  fill={color}
                  fontSize="6"
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                >
                  CORE
                </text>
              )}
              {/* Critical alert badge */}
              {node.status === 'crit' && (
                <g>
                  <circle cx={x + r - 1} cy={y - r + 1} r="5" fill="#FF3D3D"/>
                  <text x={x + r - 1} y={y - r + 4} textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700">!</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(4, ${H - 18})`}>
          {[['ok','Healthy'],['warn','Warning'],['crit','Critical']].map(([s,l], i) => (
            <g key={s} transform={`translate(${i * 70}, 0)`}>
              <circle cx="4" cy="4" r="4" fill={STATUS_FILL[s]} stroke={STATUS_COLORS[s]} strokeWidth="1"/>
              <text x="12" y="8" fill="rgba(110,145,200,0.55)" fontSize="7" fontFamily="var(--font-mono)">{l}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
