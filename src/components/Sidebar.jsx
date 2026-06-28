import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard',  icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { id: 'topology',   icon: 'ti-topology-star-3',   label: 'Topology' },
  { id: 'metrics',    icon: 'ti-chart-line',        label: 'Metrics' },
  { id: 'predictions',icon: 'ti-brain',             label: 'Predict' },
  { id: 'divider' },
  { id: 'alerts',     icon: 'ti-alert-triangle',    label: 'Alerts' },
  { id: 'reports',    icon: 'ti-report-analytics',  label: 'Reports' },
  { id: 'settings',   icon: 'ti-settings',          label: 'Settings' },
];

export default function Sidebar({ activeView, onNavigate }) {
  const [hovered, setHovered] = useState(null);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        width: '52px',
        background: 'rgba(5, 10, 22, 0.98)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '8px 0', flexShrink: 0,
        position: 'relative', zIndex: 10,
      }}
    >
      {NAV_ITEMS.map((item) => {
        if (item.id === 'divider') {
          return (
            <div key="divider" style={{
              height: '1px', background: 'var(--border)',
              margin: '6px 10px',
            }}/>
          );
        }
        const isActive = activeView === item.id;
        const isHovered = hovered === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '7px 4px', gap: '3px',
              cursor: 'pointer',
              color: isActive ? 'var(--accent)' : isHovered ? 'var(--text-secondary)' : 'var(--text-muted)',
              borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              background: isActive ? 'var(--accent-glow)' : isHovered ? 'rgba(0,207,255,0.04)' : 'transparent',
              transition: 'all var(--dur-fast) var(--ease)',
              position: 'relative',
            }}
          >
            <i className={`ti ${item.icon}`} aria-hidden="true" style={{ fontSize: '17px' }}/>
            <span style={{ fontSize: '8.5px', fontWeight: isActive ? 600 : 400, letterSpacing: '0.02em' }}>
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }}/>

      {/* System health indicator */}
      <div
        title="System: 6/7 services healthy"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: '3px' }}
      >
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: 'var(--amber)', boxShadow: '0 0 6px var(--amber)',
        }}/>
        <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Health</span>
      </div>
    </nav>
  );
}
