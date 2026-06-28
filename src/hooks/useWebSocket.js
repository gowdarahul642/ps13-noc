/**
 * useWebSocket — live telemetry feed
 *
 * Simulation mode  (default / Vercel demo):
 *   VITE_SIMULATE=true or VITE_WS_BASE not set → random-walk data, no network
 *
 * Production mode:
 *   Set VITE_WS_BASE=ws://your-backend:8000 in Vercel env vars
 *   → connects to FastAPI /ws/telemetry and receives real frames
 */
import { useEffect, useRef, useCallback, useState } from 'react';

export const EMPTY_FRAME = {
  ts: 0,
  routers: {},
  tunnels: {},
  riskScore: 0,
};

const SIMULATE =
  import.meta.env.VITE_SIMULATE === 'true' ||
  !import.meta.env.VITE_WS_BASE;

function makeFakeFrame(prev) {
  const pe02cpu  = Math.min(99, Math.max(85, (prev.routers['PE-02']?.cpu  ?? 90) + (Math.random() - 0.3) * 3));
  const pe02loss = Math.min(5,  Math.max(0,  (prev.tunnels['MPLS-T102']?.loss ?? 2.2) + (Math.random() - 0.25) * 0.15));
  const pe02lat  = Math.min(220,Math.max(80, (prev.tunnels['MPLS-T102']?.latency ?? 130) + (Math.random() - 0.28) * 9));
  return {
    ts: Date.now(),
    routers: {
      'CORE-01': { cpu: +(40 + Math.random() * 8).toFixed(1),  mem: +(55 + Math.random() * 6).toFixed(1),  status: 'ok'   },
      'PE-02':   { cpu: +pe02cpu.toFixed(1),                   mem: +(85 + Math.random() * 5).toFixed(1),  status: pe02cpu > 92 ? 'crit' : 'warn' },
      'PE-03':   { cpu: +(28 + Math.random() * 8).toFixed(1),  mem: +(42 + Math.random() * 6).toFixed(1),  status: 'ok'   },
      'PE-04':   { cpu: +(82 + Math.random() * 8).toFixed(1),  mem: +(68 + Math.random() * 6).toFixed(1),  status: 'warn' },
      'PE-07':   { cpu: +(25 + Math.random() * 8).toFixed(1),  mem: +(48 + Math.random() * 6).toFixed(1),  status: 'ok'   },
    },
    tunnels: {
      'MPLS-T102': { latency: +pe02lat.toFixed(1), loss: +pe02loss.toFixed(2), jitter: +(45 + Math.random() * 15).toFixed(1), status: pe02loss > 2 ? 'crit' : 'warn' },
      'MPLS-T088': { latency: +(62 + Math.random() * 12).toFixed(1), loss: +(0.1 + Math.random() * 0.2).toFixed(2), jitter: +(8 + Math.random() * 5).toFixed(1), status: 'ok' },
    },
    riskScore: +(Math.min(98, Math.max(85, (prev.riskScore ?? 91) + (Math.random() - 0.4) * 1.5))).toFixed(1),
  };
}

export function useWebSocket({ intervalMs = 2000 } = {}) {
  const [frame, setFrame] = useState(EMPTY_FRAME);
  const [connected, setConnected] = useState(SIMULATE);
  const prevRef = useRef(EMPTY_FRAME);
  const wsRef   = useRef(null);

  const handleFrame = useCallback((data) => {
    prevRef.current = data;
    setFrame(data);
  }, []);

  useEffect(() => {
    if (SIMULATE) {
      setConnected(true);
      const id = setInterval(() => handleFrame(makeFakeFrame(prevRef.current)), intervalMs);
      return () => clearInterval(id);
    }
    const wsUrl = import.meta.env.VITE_WS_BASE + '/ws/telemetry';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen    = () => setConnected(true);
    ws.onclose   = () => setConnected(false);
    ws.onerror   = () => setConnected(false);
    ws.onmessage = (evt) => {
      try { handleFrame(JSON.parse(evt.data)); } catch (_) {}
    };
    return () => ws.close();
  }, [intervalMs, handleFrame]);

  return { frame, connected };
}
