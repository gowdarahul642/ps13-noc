import { useState, useEffect, useRef, useCallback } from 'react';

const REPLIES = {
  t102: `<strong>Tunnel MPLS-T102 Analysis</strong><br/><br/>
<strong>Root cause:</strong> Interface Gi0/1 on PE-02 at 94% utilization. Packet loss 2.4%, latency +34ms delta above 7-day baseline.<br/><br/>
<strong>Scores:</strong> IsolationForest 0.847 · XGBoost 91.3% · Confidence 95%<br/><br/>
<strong>Action:</strong> Run <code>mpls traffic-eng reoptimize</code> on PE-02. Shift traffic to backup LSP per <strong>SOP-3 §4.2</strong>.<br/><br/>
Estimated fault in: <strong style="color:var(--red)">~43 min</strong>`,

  pe02: `<strong>PE-02 Device Status</strong><br/><br/>
CPU: <span style="color:var(--red)">94%</span> · Memory: <span style="color:var(--red)">88%</span> · Status: CRITICAL<br/><br/>
Active tunnels: MPLS-T102 (critical), MPLS-T099 (warning)<br/>
Interface Gi0/1: 94% util · Gi0/2: 78% util<br/><br/>
SHAP top features: pkt_loss (+0.38) · lat_delta (+0.27) · jitter (+0.19)`,

  alerts: `<strong>Active Alerts — 7 open</strong><br/><br/>
<span style="color:var(--red)">●</span> PE-02 Packet Loss Spike — Critical (10:32)<br/>
<span style="color:var(--red)">●</span> MPLS-T102 Latency ↑ — Critical (10:30)<br/>
<span style="color:var(--amber)">●</span> CE-07 BGP Peer Down — Warning (10:28)<br/>
<span style="color:var(--amber)">●</span> PE-04 CPU &gt;85% — Warning / ACK (10:25)<br/>
<span style="color:var(--amber)">●</span> PE-02 Jitter &gt;50ms — Warning (10:22)<br/><br/>
Recommend prioritising PE-02 / T102 immediately.`,

  reroute: `<strong>Reroute Recommendation — T102</strong><br/><br/>
Backup path: PE-02 → CORE-01 → PE-03 → CE-03<br/>
Available capacity: 2.1 Gbps (currently idle)<br/><br/>
Command sequence:<br/>
<pre style="background:rgba(0,0,0,.35);padding:8px;border-radius:6px;font-size:10px;margin-top:5px;overflow-x:auto">pe-02# mpls traffic-eng reoptimize tunnel 102
pe-02# ip rsvp bandwidth 2000000
pe-02# show mpls traffic-eng tunnels brief</pre><br/>
Per <strong>SOP-3 §4.2</strong>. Switchover ~8–12 sec.`,

  risk: `<strong>Network Risk Assessment</strong><br/><br/>
Current global risk: <span style="color:var(--red);font-weight:700">91%</span> (HIGH)<br/><br/>
Primary drivers:<br/>
• PE-02 / T102 congestion — 38% contribution<br/>
• CE-07 BGP instability — 22% contribution<br/>
• PE-04 CPU saturation — 18% contribution<br/><br/>
Risk has risen +18pts in last 43 minutes. Trend: <span style="color:var(--red)">↑ Escalating</span>`,

  default: `Analysing live telemetry and topology context…<br/><br/>
Current system risk is elevated at <strong style="color:var(--red)">91%</strong>. Primary concern: PE-02 / MPLS-T102. Secondary: CE-07 BGP instability.<br/><br/>
Ask me about a specific device, tunnel, alert, or rerouting recommendation. I can also generate runbook steps.`,
};

function matchReply(q) {
  const ql = q.toLowerCase();
  if (ql.includes('t102') || ql.includes('tunnel')) return REPLIES.t102;
  if (ql.includes('pe-02') || ql.includes('pe02'))  return REPLIES.pe02;
  if (ql.includes('alert'))                          return REPLIES.alerts;
  if (ql.includes('reroute') || ql.includes('backup') || ql.includes('sop')) return REPLIES.reroute;
  if (ql.includes('risk') || ql.includes('score'))  return REPLIES.risk;
  return REPLIES.default;
}

const QUICK_PROMPTS = [
  'Why is Tunnel T102 degrading?',
  'Show active alerts',
  'Reroute recommendations for T102',
  'PE-02 full status',
  'What is driving the risk score?',
];

export default function CopilotPanel({ onClose, initialQuery, onQueryConsumed }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      html: 'PS13 NOC system online. I have full access to live telemetry, ML predictions, and network topology.<br/><br/>Current priority: <strong style="color:var(--red)">PE-02 / MPLS-T102 at 91% failure probability</strong> — ~43 min to predicted fault. How can I help?',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [typing, setTyping] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const scrollDown = () => {
    requestAnimationFrame(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    });
  };

  const sendMessage = useCallback((text) => {
    const q = (text || inputVal).trim();
    if (!q || typing) return;
    setInputVal('');
    setMessages(prev => [...prev, { role: 'user', html: q }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'ai', html: matchReply(q) }]);
    }, 900 + Math.random() * 500);
  }, [inputVal, typing]);

  // Handle external query injection
  useEffect(() => {
    if (initialQuery) {
      sendMessage(initialQuery);
      onQueryConsumed?.();
    }
  }, [initialQuery]); // eslint-disable-line

  useEffect(scrollDown, [messages, typing]);

  return (
    <aside
      role="complementary"
      aria-label="AI Copilot chat panel"
      style={{
        background: 'rgba(5,10,22,.98)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
        animation: 'slide-in-right .22s var(--ease)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '13px 15px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '11px', fontWeight: 600, color: 'var(--accent)', flexShrink: 0,
      }}>
        <i className="ti ti-robot" aria-hidden="true" style={{ fontSize: '16px' }}/>
        AI Copilot
        <span style={{ color: 'var(--text-muted)', fontSize: '9.5px', fontWeight: 400, marginLeft: '2px' }}>
          (Phi-3 Local)
        </span>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'var(--green)', boxShadow: '0 0 6px var(--green)',
          marginLeft: 'auto', animation: 'pulse-dot 2.5s ease-in-out infinite',
        }}/>
        <button
          onClick={onClose}
          aria-label="Close AI Copilot"
          style={{
            background: 'rgba(255,61,61,.08)', border: '1px solid rgba(255,61,61,.25)',
            borderRadius: 'var(--r-sm)', color: 'var(--red)', padding: '3px 7px',
            fontSize: '11px', cursor: 'pointer', marginLeft: '4px',
          }}
        >✕</button>
      </div>

      {/* Messages */}
      <div
        ref={chatRef}
        style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-sender">{m.role === 'ai' ? 'AI Copilot' : 'Op-01'}</div>
            {/* eslint-disable-next-line react/no-danger */}
            <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: m.html }}/>
          </div>
        ))}

        {typing && (
          <div className="msg ai">
            <div className="msg-sender">AI Copilot</div>
            <div className="typing">
              <span/><span/><span/>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '5px',
        padding: '8px 13px', borderTop: '1px solid var(--border)', flexShrink: 0,
      }}>
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            style={{
              background: 'rgba(0,207,255,.07)', border: '1px solid var(--border)',
              borderRadius: '14px', fontSize: '10px', color: 'var(--accent)',
              padding: '3px 9px', cursor: 'pointer', transition: 'all var(--dur)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,207,255,.18)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,207,255,.07)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >{p}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: '6px', flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="Ask a question…"
          aria-label="Chat input"
          style={{
            background: 'rgba(0,207,255,.07)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', color: 'var(--text-primary)',
            fontSize: '11px', padding: '8px 11px', flex: 1, outline: 'none',
            fontFamily: 'var(--font-ui)', transition: 'border-color var(--dur)',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent-border)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
        />
        <button
          onClick={() => sendMessage()}
          aria-label="Send message"
          style={{
            background: 'rgba(0,207,255,.18)', border: '1px solid rgba(0,207,255,.35)',
            borderRadius: 'var(--r-md)', color: 'var(--accent)', padding: '8px 11px',
            fontSize: '14px', cursor: 'pointer', transition: 'all var(--dur)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,207,255,.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,207,255,.18)'; }}
        >
          <i className="ti ti-send" aria-hidden="true"/>
        </button>
      </div>
    </aside>
  );
}
