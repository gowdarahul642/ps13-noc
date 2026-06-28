"""
PS13 NOC — Backend API Routes (predictions, devices, audit, chat)
=================================================================
Consolidated into one file for clarity. In a larger project, split
into separate modules: routes_predictions.py, routes_devices.py, etc.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any, AsyncGenerator, Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

log = logging.getLogger("ps13.routes")

# ─── Predictions ────────────────────────────────────────────────────────────

router = APIRouter()

MOCK_PREDICTIONS = [
    {"id":"p1","device":"Router PE-02","tunnel":"MPLS-T102","fault":"Tunnel Packet Loss ↑",
     "risk":91,"confidence":95,"leadTime":"~43 min","status":"crit",
     "anomalyScore":0.847,"xgboostProb":0.913,
     "shap":{"pkt_loss":0.38,"lat_delta":0.27,"jitter":0.19,"cpu":0.12}},
    {"id":"p2","device":"Router PE-04","tunnel":"MPLS-T088","fault":"High latency / congestion",
     "risk":64,"confidence":78,"leadTime":"~2.1 hr","status":"warn",
     "anomalyScore":0.710,"xgboostProb":0.641,
     "shap":{"cpu_util":0.41,"mem_pressure":0.22,"lat_delta":0.14,"pkt_loss":0.08}},
    {"id":"p3","device":"CE-07","tunnel":"BGP Session","fault":"Route instability",
     "risk":57,"confidence":71,"leadTime":"~4 hr","status":"warn",
     "anomalyScore":0.632,"xgboostProb":0.573,
     "shap":{"bgp_flap":0.52,"session_age":0.31,"keepalive_miss":0.18}},
]

@router.get("/predictions", tags=["predictions"])
async def list_predictions(status: Optional[str] = None):
    rows = MOCK_PREDICTIONS
    if status:
        rows = [r for r in rows if r["status"] == status]
    return {"predictions": rows, "total": len(rows), "ts": time.time()}

@router.get("/predictions/{pred_id}", tags=["predictions"])
async def get_prediction(pred_id: str):
    row = next((r for r in MOCK_PREDICTIONS if r["id"] == pred_id), None)
    if not row:
        raise HTTPException(404, detail=f"Prediction {pred_id} not found")
    return row

# ─── Devices ────────────────────────────────────────────────────────────────

MOCK_DEVICES = [
    {"id":"CORE-01","role":"Core","ip":"10.0.0.1","status":"ok",  "cpu":42,"mem":58,"tunnels":12},
    {"id":"PE-02",  "role":"PE",  "ip":"10.0.1.2","status":"crit","cpu":94,"mem":88,"tunnels":4},
    {"id":"PE-03",  "role":"PE",  "ip":"10.0.1.3","status":"ok",  "cpu":31,"mem":44,"tunnels":3},
    {"id":"PE-04",  "role":"PE",  "ip":"10.0.1.4","status":"warn","cpu":87,"mem":71,"tunnels":5},
    {"id":"PE-07",  "role":"PE",  "ip":"10.0.1.7","status":"ok",  "cpu":28,"mem":52,"tunnels":3},
    {"id":"CE-01",  "role":"CE",  "ip":"10.0.2.1","status":"ok",  "cpu":12,"mem":30,"tunnels":1},
    {"id":"CE-02",  "role":"CE",  "ip":"10.0.2.2","status":"ok",  "cpu":18,"mem":35,"tunnels":1},
    {"id":"CE-03",  "role":"CE",  "ip":"10.0.2.3","status":"ok",  "cpu":15,"mem":28,"tunnels":1},
    {"id":"CE-05",  "role":"CE",  "ip":"10.0.2.5","status":"ok",  "cpu":22,"mem":33,"tunnels":1},
    {"id":"CE-06",  "role":"CE",  "ip":"10.0.2.6","status":"ok",  "cpu":19,"mem":31,"tunnels":1},
    {"id":"CE-07",  "role":"CE",  "ip":"10.0.2.7","status":"warn","cpu":45,"mem":60,"tunnels":1},
]

@router.get("/devices", tags=["devices"])
async def list_devices(status: Optional[str] = None, role: Optional[str] = None):
    rows = MOCK_DEVICES
    if status: rows = [r for r in rows if r["status"] == status]
    if role:   rows = [r for r in rows if r["role"]   == role]
    return {"devices": rows, "total": len(rows)}

@router.get("/devices/{device_id}", tags=["devices"])
async def get_device(device_id: str):
    row = next((r for r in MOCK_DEVICES if r["id"] == device_id), None)
    if not row:
        raise HTTPException(404, detail=f"Device {device_id} not found")
    return row

@router.get("/kpi", tags=["kpi"])
async def get_kpi():
    """Aggregated KPI snapshot for the dashboard header cards."""
    return {
        "ts":          time.time(),
        "totalRouters": len(MOCK_DEVICES),
        "activeTunnels": 187,
        "activeAlerts":  7,
        "riskScore":     91,
        "avgLatencyMs":  142,
        "packetLossPct": 2.4,
        "bandwidthPct":  68,
        "healthyLinks":  219,
        "totalLinks":    226,
    }

# ─── Audit log ──────────────────────────────────────────────────────────────

class AuditEntry(BaseModel):
    ts:       str
    user:     str
    action:   str
    resource: str = ""
    detail:   str = ""

_audit_log: list[dict] = []

@router.post("/audit", tags=["audit"], status_code=201)
async def write_audit(entry: AuditEntry):
    record = entry.model_dump()
    _audit_log.append(record)
    log.info("AUDIT %s", record)
    return {"ok": True}

@router.get("/audit", tags=["audit"])
async def read_audit(limit: int = 100, user: Optional[str] = None):
    rows = _audit_log
    if user:
        rows = [r for r in rows if r["user"] == user]
    return {"entries": rows[-limit:], "total": len(rows)}

# ─── AI Chat (streaming) ─────────────────────────────────────────────────────

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "phi3"

SYSTEM_PROMPT = """You are the PS13 NOC AI Copilot — an expert network operations assistant
for an ISRO air-gapped MPLS network. You have access to live telemetry, ML predictions,
and historical alerts. Be concise, precise, and action-oriented. Always suggest a concrete
next step. Reference SOPs when applicable (SOP-3 for rerouting, SOP-7 for BGP).
Format responses in plain text — no markdown headers, keep it scannable."""

class ChatRequest(BaseModel):
    message:  str
    history:  list[dict[str, str]] = []
    deviceCtx: Optional[str] = None  # e.g. "PE-02" — injects device context

async def _stream_ollama(prompt: str) -> AsyncGenerator[str, None]:
    """Stream tokens from local Ollama instance."""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream("POST", OLLAMA_URL, json={
                "model":  OLLAMA_MODEL,
                "prompt": prompt,
                "stream": True,
            }) as resp:
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        token = data.get("response", "")
                        if token:
                            yield f"data: {json.dumps({'token': token})}\n\n"
                        if data.get("done"):
                            yield "data: [DONE]\n\n"
                            return
                    except json.JSONDecodeError:
                        continue
    except Exception as exc:
        log.warning("Ollama unavailable (%s) — using fallback response", exc)
        # Fallback: static contextual reply
        fallback = _fallback_reply(prompt)
        for word in fallback.split():
            yield f"data: {json.dumps({'token': word + ' '})}\n\n"
            await asyncio.sleep(0.04)
        yield "data: [DONE]\n\n"

def _fallback_reply(prompt: str) -> str:
    pl = prompt.lower()
    if "t102" in pl or "tunnel" in pl:
        return ("PE-02 / MPLS-T102: packet loss 2.4%, latency 148ms, jitter 52ms. "
                "XGBoost failure probability 91.3%. Recommend running "
                "'mpls traffic-eng reoptimize' on PE-02 and shifting traffic to backup LSP per SOP-3.")
    if "pe-02" in pl:
        return "PE-02: CPU 94%, memory 88%, status CRITICAL. Two tunnels affected: T102 (critical), T099 (warning). Interface Gi0/1 at 94% utilization."
    if "alert" in pl:
        return "7 open alerts: 2 Critical (PE-02 packet loss, T102 latency), 5 Warning. Oldest unacknowledged: 10:22 PE-02 jitter >50ms."
    if "reroute" in pl or "sop" in pl:
        return ("Backup path: PE-02 → CORE-01 → PE-03 → CE-03. Capacity: 2.1 Gbps. "
                "Commands: 'mpls traffic-eng reoptimize tunnel 102' then 'ip rsvp bandwidth 2000000'. Per SOP-3 §4.2.")
    return ("Current risk: 91% (HIGH). Primary driver: PE-02/T102 congestion. "
            "Secondary: CE-07 BGP instability. Recommend immediate action on T102 per SOP-3.")

def _build_prompt(req: ChatRequest) -> str:
    history_text = ""
    for h in req.history[-6:]:  # last 6 turns for context
        role = "User" if h["role"] == "user" else "Assistant"
        history_text += f"{role}: {h['content']}\n"
    device_ctx = f"\nCurrent device context: {req.deviceCtx}" if req.deviceCtx else ""
    return f"{SYSTEM_PROMPT}{device_ctx}\n\n{history_text}User: {req.message}\nAssistant:"

@router.post("/chat", tags=["chat"])
async def chat(req: ChatRequest):
    """
    Streaming chat endpoint — returns SSE (text/event-stream).
    Each event: data: {"token": "..."}\n\n
    Final event: data: [DONE]\n\n
    """
    prompt = _build_prompt(req)
    return StreamingResponse(
        _stream_ollama(prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control":  "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
