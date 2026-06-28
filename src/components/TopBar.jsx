import { useState, useEffect } from 'react';

export default function TopBar({ copilotOpen, onToggleCopilot, alertCount = 7 }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      display: 'flex', alignItems: 'center',
      background: 'rgba(5, 11, 24, 0.98)',
      borderBottom: '1px solid var(--border)',
      height: '48px', padding: '0 16px', gap: '12px',
      position: 'relative', zIndex: 100,
      backdropFilter: 'blur(8px)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Animated radar icon */}
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="11" cy="11" r="10" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.3"/>
          <circle cx="11" cy="11" r="6"  fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.5"/>
          <circle cx="11" cy="11" r="2"  fill="var(--accent)"/>
          <line x1="11" y1="11" x2="11" y2="2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="11" y1="11" x2="18" y2="8" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
        </svg>
        <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent)' }}>
          PS13
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.03em' }}>
          Predictive NOC
        </span>
        <div style={{
          width: '1px', height: '16px', background: 'var(--border)',
          margin: '0 4px'
        }}/>
        <span style={{
          fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em',
          color: 'var(--text-muted)', textTransform: 'uppercase'
        }}>Air-gapped</span>
      </div>

      {/* Center — status + clock */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--green)', display: 'inline-block',
            boxShadow: '0 0 8px var(--green)',
            animation: 'pulse-dot 2.5s ease-in-out infinite',
          }}/>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            All Systems Operational
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: '12px' }}/>
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            {time}
          </span>
          <span>IST</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{date}</span>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Model version */}
        <span style={{
          fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
          padding: '2px 6px', border: '1px solid var(--border)', borderRadius: '3px',
        }}>
          Model v1.2
        </span>

        {/* Notifications */}
        <button
          aria-label={`${alertCount} notifications`}
          style={{
            position: 'relative',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', padding: '5px 9px',
            color: 'var(--text-secondary)', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'border-color var(--dur-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <i className="ti ti-bell" aria-hidden="true"/>
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: 'var(--red)', color: '#fff',
            fontSize: '9px', fontWeight: 700,
            borderRadius: '8px', padding: '1px 4px',
            minWidth: '14px', textAlign: 'center',
          }}>{alertCount}</span>
        </button>

        {/* User */}
        <button
          aria-label="User menu"
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', padding: '4px 10px',
            color: 'var(--text-secondary)', fontSize: '11px',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'border-color var(--dur-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', color: 'var(--accent)', fontWeight: 600,
          }}>O1</div>
          <span>Op-01</span>
          <i className="ti ti-chevron-down" aria-hidden="true" style={{ fontSize: '11px', opacity: 0.6 }}/>
        </button>

        {/* AI Copilot toggle */}
        <button
          onClick={onToggleCopilot}
          aria-pressed={copilotOpen}
          aria-label={copilotOpen ? 'Close AI Copilot' : 'Open AI Copilot'}
          style={{
            background: copilotOpen ? 'var(--accent-dim)' : 'var(--bg-card)',
            border: `1px solid ${copilotOpen ? 'var(--accent-border)' : 'var(--border)'}`,
            borderRadius: 'var(--r-sm)', padding: '5px 10px',
            color: copilotOpen ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '11px', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all var(--dur-fast)',
          }}
        >
          <i className="ti ti-robot" aria-hidden="true" style={{ fontSize: '14px' }}/>
          AI Copilot
        </button>
      </div>
    </header>
  );
}
