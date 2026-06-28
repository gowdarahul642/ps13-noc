import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

const SECTION = ({ title, children }) => (
  <div className="panel" style={{ padding: '18px' }}>
    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {children}
    </div>
  </div>
);

const Row = ({ label, sub, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
    </div>
    {children}
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    aria-checked={value}
    role="switch"
    style={{
      width: '38px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      background: value ? 'var(--accent)' : 'rgba(255,255,255,.12)',
      position: 'relative', transition: 'background var(--dur)', flexShrink: 0,
    }}
  >
    <div style={{
      width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
      position: 'absolute', top: '3px',
      left: value ? '21px' : '3px',
      transition: 'left var(--dur)',
    }}/>
  </button>
);

const NumberInput = ({ value, onChange, min, max, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <input
      type="number" value={value} min={min} max={max}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        width: '64px', background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', padding: '4px 8px',
        fontFamily: 'var(--font-mono)', fontSize: '12px', outline: 'none',
        transition: 'border-color var(--dur)', textAlign: 'right',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--accent-border)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
    />
    {unit && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{unit}</span>}
  </div>
);

export default function SettingsScreen() {
  const [refreshInterval,  setRefreshInterval]  = useLocalStorage('noc.refreshInterval',  2);
  const [alertSound,       setAlertSound]        = useLocalStorage('noc.alertSound',       true);
  const [highContrast,     setHighContrast]      = useLocalStorage('noc.highContrast',     false);
  const [showMinimap,      setShowMinimap]       = useLocalStorage('noc.showMinimap',      true);
  const [sessionTimeout,   setSessionTimeout]    = useLocalStorage('noc.sessionTimeout',   30);
  const [riskThreshold,    setRiskThreshold]     = useLocalStorage('noc.riskThreshold',    75);
  const [retainLogs,       setRetainLogs]        = useLocalStorage('noc.retainLogs',       7);
  const [llmModel,         setLlmModel]          = useLocalStorage('noc.llmModel',         'phi3');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px' }}>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>Configuration</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>NOC dashboard settings — stored locally. Changes apply on save.</div>
      </div>

      <SECTION title="Display & Telemetry">
        <Row label="Telemetry refresh interval" sub="How often the dashboard polls for new data">
          <NumberInput value={refreshInterval} onChange={setRefreshInterval} min={1} max={60} unit="sec"/>
        </Row>
        <Row label="Show topology minimap" sub="Display a miniature topology overview in the corner">
          <Toggle value={showMinimap} onChange={setShowMinimap}/>
        </Row>
        <Row label="High-contrast mode" sub="White-on-black inverted palette for accessibility (WCAG AAA)">
          <Toggle value={highContrast} onChange={setHighContrast}/>
        </Row>
      </SECTION>

      <SECTION title="Alerts & Notifications">
        <Row label="Audio alert on critical severity" sub="Play a sound when a new CRITICAL alert is raised">
          <Toggle value={alertSound} onChange={setAlertSound}/>
        </Row>
        <Row label="AI risk threshold" sub="Minimum risk score (%) before an alert is generated">
          <NumberInput value={riskThreshold} onChange={setRiskThreshold} min={50} max={99} unit="%"/>
        </Row>
      </SECTION>

      <SECTION title="Security & Session">
        <Row label="Session timeout" sub="Automatically log out after this many minutes of inactivity">
          <NumberInput value={sessionTimeout} onChange={setSessionTimeout} min={5} max={120} unit="min"/>
        </Row>
        <Row label="Audit log retention" sub="How many days to retain operator audit logs">
          <NumberInput value={retainLogs} onChange={setRetainLogs} min={1} max={90} unit="days"/>
        </Row>
        <Row label="Current operator" sub="Role-based access — contact Admin to change">
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', padding: '3px 10px' }}>
            Op-01 (Operator)
          </div>
        </Row>
      </SECTION>

      <SECTION title="AI Copilot / LLM">
        <Row label="Local LLM model" sub="Ollama model to use for the AI Copilot. Must be pulled locally.">
          <select
            value={llmModel} onChange={e => setLlmModel(e.target.value)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', padding: '5px 10px',
              fontFamily: 'var(--font-mono)', fontSize: '11px', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="phi3">phi3 (3.8B) — recommended</option>
            <option value="phi3:medium">phi3:medium (14B)</option>
            <option value="mistral">mistral (7B)</option>
            <option value="llama3">llama3 (8B)</option>
          </select>
        </Row>
        <Row label="Ollama endpoint" sub="Local inference server URL (must be reachable from this browser)">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '4px 10px' }}>
            http://localhost:11434
          </div>
        </Row>
      </SECTION>

      <SECTION title="System Information">
        {[
          ['PS13 Version',        'v1.2.0 (2026-06-27)'],
          ['Build Mode',          'Production — Air-gapped'],
          ['ML Model',            'XGBoost v1.7 + IsolationForest (sklearn 1.4)'],
          ['Prometheus',          'http://prometheus:9090'],
          ['Elasticsearch',       'http://elasticsearch:9200'],
          ['FastAPI Backend',     'http://api:8000'],
        ].map(([label, value]) => (
          <Row key={label} label={label}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-secondary)' }}>{value}</span>
          </Row>
        ))}
      </SECTION>

      {/* Save */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
        <button
          onClick={handleSave}
          style={{
            background: saved ? 'var(--green-dim)' : 'var(--accent-dim)',
            border: `1px solid ${saved ? 'var(--green-border)' : 'var(--accent-border)'}`,
            color: saved ? 'var(--green)' : 'var(--accent)',
            borderRadius: 'var(--r-md)', padding: '8px 22px',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            transition: 'all var(--dur)',
          }}
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
