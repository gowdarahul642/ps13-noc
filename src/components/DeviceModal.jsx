import { useEffect } from 'react';

export default function DeviceModal({ title, subtitle, rows, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.65)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fade-in .18s var(--ease)',
      }}
    >
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-lg)',
        width: '500px', maxWidth: '92vw', maxHeight: '82vh',
        overflowY: 'auto',
        boxShadow: '0 0 60px rgba(0,207,255,.1)',
        animation: 'fade-in .2s var(--ease)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div id="modal-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
              {title}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {subtitle}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close detail panel"
            style={{
              background: 'rgba(255,61,61,.1)', border: '1px solid rgba(255,61,61,.3)',
              color: 'var(--red)', borderRadius: 'var(--r-sm)', padding: '4px 10px',
              fontSize: '11px', cursor: 'pointer', flexShrink: 0, marginLeft: '12px',
              transition: 'all var(--dur)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,61,61,.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,61,61,.1)'; }}
          >
            ✕ Close
          </button>
        </div>

        {/* Rows */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '8px 0',
                borderBottom: i < rows.length - 1 ? '1px solid rgba(0,150,210,.07)' : 'none',
                gap: '16px',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>
                {row.label}
              </span>
              <span style={{
                fontSize: '11px',
                color: row.color || 'var(--text-primary)',
                textAlign: 'right', maxWidth: '65%',
                fontFamily: row.mono ? 'var(--font-mono)' : undefined,
                lineHeight: 1.5,
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
