import { useState } from 'react';
import { INITIAL_KPI } from '../data/mockData';

const STATUS_COLOR = {
  ok:   'var(--green)',
  warn: 'var(--amber)',
  crit: 'var(--red)',
};

const TREND_ICON = {
  up:     'ti-trending-up',
  down:   'ti-trending-down',
  stable: 'ti-minus',
};

export default function KpiGrid({ onCardClick }) {
  const [hovered, setHovered] = useState(null);

  return (
    <section aria-label="Key performance indicators">
      <div style={{
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
        color: 'var(--text-muted)', textTransform: 'uppercase',
        marginBottom: '8px',
      }}>
        Key Performance Indicators
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '10px',
      }}>
        {INITIAL_KPI.map((kpi) => {
          const color = STATUS_COLOR[kpi.status];
          const isHov = hovered === kpi.id;
          return (
            <button
              key={kpi.id}
              onClick={() => onCardClick && onCardClick(kpi)}
              onMouseEnter={() => setHovered(kpi.id)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`${kpi.label}: ${kpi.value}${kpi.unit}`}
              style={{
                display: 'block', textAlign: 'left',
                background: isHov ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: `1px solid ${isHov ? color : 'var(--border)'}`,
                borderTop: `2px solid ${color}`,
                borderRadius: 'var(--r-lg)',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease)',
                animation: 'fade-in 0.3s var(--ease) both',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className={`ti ${kpi.icon}`} aria-hidden="true"
                    style={{ fontSize: '12px', color: 'var(--text-muted)' }}/>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {kpi.label}
                  </span>
                </div>
                <span className={`badge badge-${kpi.status}`} style={{ fontSize: '9px' }}>
                  {kpi.status === 'ok' ? 'OK' : kpi.status === 'warn' ? 'WARN' : 'CRIT'}
                </span>
              </div>

              {/* Value */}
              <div style={{
                marginTop: '8px',
                fontSize: '28px', fontWeight: 700, lineHeight: 1,
                color: color, letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {kpi.value}
                <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '2px' }}>
                  {kpi.unit}
                </span>
              </div>

              {/* Trend */}
              <div style={{
                marginTop: '6px', fontSize: '10px',
                color: kpi.trend === 'up' ? 'var(--red)' :
                       kpi.trend === 'down' ? 'var(--green)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <i className={`ti ${TREND_ICON[kpi.trend]}`} aria-hidden="true"/>
                {kpi.trendVal}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
