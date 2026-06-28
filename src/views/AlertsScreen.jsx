import { useState, useMemo } from 'react';
import { ALERTS } from '../data/mockData.js';

const SEV_ORDER = { crit: 0, warn: 1, info: 2 };
const SC = { crit: 'var(--red)', warn: 'var(--amber)', info: 'var(--accent)', ok: 'var(--green)' };

const STATUS_STYLE = {
  Open:     'background:var(--red-dim);color:var(--red);border:1px solid var(--red-border)',
  ACK:      'background:var(--amber-dim);color:var(--amber);border:1px solid var(--amber-border)',
  Resolved: 'background:var(--green-dim);color:var(--green);border:1px solid var(--green-border)',
};

export default function AlertsScreen({ onRowClick }) {
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('ts');
  const [sortDir, setSortDir] = useState('desc');
  const [alerts, setAlerts] = useState(ALERTS);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    let rows = alerts.filter(a => filter === 'all' || a.sev === filter || (filter === 'open' && a.status === 'Open'));
    rows = [...rows].sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (sortKey === 'sev') { av = SEV_ORDER[a.sev] ?? 9; bv = SEV_ORDER[b.sev] ?? 9; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return rows;
  }, [alerts, filter, sortKey, sortDir]);

  const ackAlert = (id, e) => {
    e.stopPropagation();
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACK' } : a));
  };
  const resolveAlert = (id, e) => {
    e.stopPropagation();
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <i className="ti ti-selector" style={{ opacity: .3, fontSize: '11px' }}/>;
    return <i className={`ti ti-arrow-${sortDir === 'asc' ? 'up' : 'down'}`} style={{ fontSize: '11px', color: 'var(--accent)' }}/>;
  };

  const counts = { total: alerts.length, open: alerts.filter(a => a.status === 'Open').length, crit: alerts.filter(a => a.sev === 'crit').length };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>Alert Management</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {counts.total} total · {counts.open} open · {counts.crit} critical
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['all','All'],['open','Open'],['crit','Critical'],['warn','Warning']].map(([f,l]) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontSize: '10px', padding: '4px 11px', borderRadius: 'var(--r-sm)',
              background: filter===f ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${filter===f ? 'var(--accent-border)' : 'var(--border)'}`,
              color: filter===f ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all var(--dur)',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }} aria-label="Alert management table">
            <thead>
              <tr>
                {[['ts','Time'],['device','Device'],['event','Event'],['sev','Severity'],['status','Status'],['owner','Assigned']].map(([k,l]) => (
                  <th key={k}
                    onClick={() => toggleSort(k)}
                    style={{
                      textAlign: 'left', padding: '10px 12px',
                      fontSize: '9.5px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
                      color: sortKey===k ? 'var(--accent)' : 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg-panel)',
                      cursor: 'pointer', userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {l} <SortIcon k={k}/>
                    </div>
                  </th>
                ))}
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}/>
              </tr>
            </thead>
            <tbody>
              {sorted.map(a => (
                <tr
                  key={a.id}
                  onClick={() => onRowClick && onRowClick(a)}
                  style={{ cursor: 'pointer', transition: 'background var(--dur)', borderBottom: '1px solid rgba(0,150,210,.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-glow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{a.ts}</td>
                  <td style={{ padding: '9px 12px', fontWeight: 700, fontSize: '11px', color: SC[a.sev] }}>{a.device}</td>
                  <td style={{ padding: '9px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{a.event}</td>
                  <td style={{ padding: '9px 12px' }}><span className={`badge badge-${a.sev}`}>{a.sev.toUpperCase()}</span></td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', ...Object.fromEntries(STATUS_STYLE[a.status].split(';').filter(Boolean).map(s => s.split(':').map(x=>x.trim()))) }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{a.owner}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {a.status === 'Open' && (
                        <button onClick={(e) => ackAlert(a.id, e)} style={{
                          fontSize: '9.5px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
                          background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', color: 'var(--amber)',
                        }}>ACK</button>
                      )}
                      {a.status !== 'Resolved' && (
                        <button onClick={(e) => resolveAlert(a.id, e)} style={{
                          fontSize: '9.5px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
                          background: 'var(--green-dim)', border: '1px solid var(--green-border)', color: 'var(--green)',
                        }}>Resolve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
