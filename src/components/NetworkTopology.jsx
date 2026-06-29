import { useState } from 'react';
import { TOPOLOGY_NODES, TOPOLOGY_LINKS } from '../data/mockData.js';

const SC = { ok:'#1EE07A', warn:'#FFAA00', crit:'#FF3D3D' };
const SF = { ok:'rgba(30,224,122,.1)', warn:'rgba(255,170,0,.1)', crit:'rgba(255,61,61,.15)' };
const SG = { ok:'rgba(30,224,122,.2)', warn:'rgba(255,170,0,.2)', crit:'rgba(255,61,61,.28)' };
const ROLE_R = { Core:14, PE:10, CE:7 };

export default function NetworkTopology({ onNodeClick }) {
  const [hNode, setHNode] = useState(null);
  const [hLink, setHLink] = useState(null);

  const W = 320, H = 175;
  const px = n => (n.x / 100) * W;
  const py = n => (n.y / 100) * H;
  const ns = Object.fromEntries(TOPOLOGY_NODES.map(n => [n.id, n]));

  const hovered = hNode ? ns[hNode] : null;

  return (
    <div className="panel" style={{ padding:'12px', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-topology-star-3" aria-hidden="true" style={{ color:'var(--accent)', fontSize:'13px' }}/>
          <span style={{ fontSize:'11px', fontWeight:600, color:'var(--accent)', letterSpacing:'.06em', textTransform:'uppercase' }}>
            Network Topology
          </span>
        </div>
        <div style={{ display:'flex', gap:'8px', fontSize:'9px', color:'var(--text-muted)' }}>
          {[['ok','Healthy'],['warn','Warn'],['crit','Crit']].map(([s,l])=>(
            <span key={s} style={{ display:'flex', alignItems:'center', gap:'3px' }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:SC[s],display:'inline-block' }}/>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position:'absolute', zIndex:50, pointerEvents:'none',
          background:'rgba(6,14,30,.97)', border:`1px solid ${SC[hovered.status]}`,
          borderRadius:'var(--r-md)', padding:'8px 11px',
          fontSize:'10px', fontFamily:'var(--font-mono)', lineHeight:1.7,
          boxShadow:`0 0 20px ${SG[hovered.status]}`,
        }}>
          <div style={{ fontWeight:700, color:SC[hovered.status], marginBottom:'3px' }}>{hovered.id} [{hovered.role}]</div>
          <div>CPU <span style={{ color: hovered.cpu>85?SC.crit:hovered.cpu>70?SC.warn:SC.ok }}>{hovered.cpu}%</span></div>
          <div>MEM <span style={{ color: hovered.mem>85?SC.crit:hovered.mem>70?SC.warn:SC.ok }}>{hovered.mem}%</span></div>
          <div style={{ color:'var(--text-muted)', marginTop:'2px', fontSize:'9px' }}>click for full detail</div>
        </div>
      )}

      {/* SVG */}
      <div style={{ flex:1, position:'relative' }}>
        <svg
          width="100%" viewBox={`0 0 ${W} ${H}`}
          style={{ display:'block', borderRadius:'var(--r-md)', background:'rgba(0,0,0,.15)' }}
          aria-label="MPLS network topology"
          role="img"
        >
          {/* Subtle grid */}
          {[25,50,75].map(p=>(
            <g key={p}>
              <line x1={(p/100)*W} y1="0" x2={(p/100)*W} y2={H} stroke="rgba(0,150,210,.04)" strokeWidth="1"/>
              <line x1="0" y1={(p/100)*H} x2={W} y2={(p/100)*H} stroke="rgba(0,150,210,.04)" strokeWidth="1"/>
            </g>
          ))}

          {/* Links */}
          {TOPOLOGY_LINKS.map((l, i) => {
            const f=ns[l.from], t=ns[l.to];
            if (!f||!t) return null;
            const isH = hLink===i;
            return (
              <g key={i}>
                <line
                  x1={px(f)} y1={py(f)} x2={px(t)} y2={py(t)}
                  stroke={SC[l.status]}
                  strokeWidth={l.status==='crit'?2.5:l.status==='warn'?2:1.2}
                  opacity={isH?1:0.5}
                  strokeDasharray={l.status==='crit'?'5 3':undefined}
                  style={{ cursor:'pointer', transition:'opacity .15s' }}
                  onMouseEnter={()=>setHLink(i)}
                  onMouseLeave={()=>setHLink(null)}
                />
                {isH&&(
                  <text x={(px(f)+px(t))/2} y={(py(f)+py(t))/2-5}
                    textAnchor="middle" fill={SC[l.status]} fontSize="8"
                    fontFamily="monospace" style={{ pointerEvents:'none' }}>
                    {l.util}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {TOPOLOGY_NODES.map(n => {
            const x=px(n), y=py(n), r=ROLE_R[n.role];
            const isH = hNode===n.id;
            return (
              <g key={n.id} style={{ cursor:'pointer' }}
                onMouseEnter={()=>setHNode(n.id)}
                onMouseLeave={()=>setHNode(null)}
                onClick={()=>onNodeClick&&onNodeClick(n)}
                role="button"
                aria-label={`${n.id} ${n.status}`}
              >
                {/* Glow ring */}
                {(n.status!=='ok'||isH)&&(
                  <circle cx={x} cy={y} r={r+5} fill={SG[n.status]}
                    style={n.status==='crit'?{ animation:'pulse-dot 1.5s ease-in-out infinite' }:{}}/>
                )}
                {/* Node body */}
                <circle cx={x} cy={y} r={r}
                  fill={SF[n.status]}
                  stroke={SC[n.status]}
                  strokeWidth={isH||n.status==='crit'?2:1.5}
                />
                {/* Core label */}
                {n.role==='Core'&&(
                  <text x={x} y={y+3} textAnchor="middle"
                    fill={SC[n.status]} fontSize="5" fontWeight="700"
                    fontFamily="monospace" style={{ pointerEvents:'none' }}>
                    CORE
                  </text>
                )}
                {/* Node ID label below */}
                <text x={x} y={y+r+9} textAnchor="middle"
                  fill={isH?SC[n.status]:'rgba(170,195,240,.75)'}
                  fontSize={n.role==='CE'?6:7}
                  fontFamily="monospace"
                  fontWeight={isH?'600':'400'}
                  style={{ pointerEvents:'none' }}>
                  {n.id}
                </text>
                {/* CPU mini-bar for PE/Core */}
                {n.role!=='CE'&&(
                  <g style={{ pointerEvents:'none' }}>
                    <rect x={x-12} y={y+r+11} width="24" height="2.5" rx="1.2" fill="rgba(255,255,255,.07)"/>
                    <rect x={x-12} y={y+r+11}
                      width={Math.round((n.cpu/100)*24)} height="2.5" rx="1.2"
                      fill={n.cpu>85?SC.crit:n.cpu>70?SC.warn:SC.ok}/>
                  </g>
                )}
                {/* Critical badge */}
                {n.status==='crit'&&(
                  <g style={{ pointerEvents:'none' }}>
                    <circle cx={x+r} cy={y-r} r="5" fill="#FF3D3D"/>
                    <text x={x+r} y={y-r+3.5} textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700">!</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px', marginTop:'8px' }}>
        {[
          { label:'Critical', count: TOPOLOGY_NODES.filter(n=>n.status==='crit').length, color:'var(--red)' },
          { label:'Warning',  count: TOPOLOGY_NODES.filter(n=>n.status==='warn').length, color:'var(--amber)' },
          { label:'Healthy',  count: TOPOLOGY_NODES.filter(n=>n.status==='ok').length,   color:'var(--green)' },
        ].map(s=>(
          <div key={s.label} style={{
            background:'var(--bg-card)', border:`1px solid ${s.color}22`,
            borderRadius:'var(--r-sm)', padding:'5px 8px', textAlign:'center',
          }}>
            <div style={{ fontSize:'16px', fontWeight:700, color:s.color, lineHeight:1, fontFamily:'var(--font-mono)' }}>{s.count}</div>
            <div style={{ fontSize:'9px', color:'var(--text-muted)', marginTop:'2px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
