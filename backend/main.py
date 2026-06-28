"""
PS13 Predictive NOC — FastAPI Backend
=====================================
Provides:
  REST  /api/alerts, /api/predictions, /api/devices, /api/kpi, /api/audit
  WS    /ws/telemetry   — live telemetry push to frontend
  POST  /api/chat       — streaming AI Copilot (Ollama / Phi-3)

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from api.routes_alerts      import router as alerts_router
from api.routes_predictions import router as pred_router
from api.routes_devices     import router as device_router
from api.routes_audit       import router as audit_router
from api.routes_chat        import router as chat_router
from services.telemetry     import TelemetryBroadcaster

log = logging.getLogger("ps13.main")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

# ─── Lifespan ───────────────────────────────────────────────────────────────

broadcaster = TelemetryBroadcaster()

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("PS13 NOC backend starting…")
    asyncio.create_task(broadcaster.run())
    yield
    log.info("PS13 NOC backend shutting down…")
    await broadcaster.stop()

# ─── App ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PS13 Predictive NOC API",
    version="1.2.0",
    description="Air-gapped MPLS predictive maintenance backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────────────

app.include_router(alerts_router,  prefix="/api")
app.include_router(pred_router,    prefix="/api")
app.include_router(device_router,  prefix="/api")
app.include_router(audit_router,   prefix="/api")
app.include_router(chat_router,    prefix="/api")

# ─── Health ─────────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health() -> dict:
    return {
        "status": "ok",
        "ts": time.time(),
        "version": "1.2.0",
        "services": {
            "api":       "up",
            "telemetry": "up" if broadcaster.running else "degraded",
        },
    }

# ─── WebSocket telemetry ─────────────────────────────────────────────────────

@app.websocket("/ws/telemetry")
async def ws_telemetry(websocket: WebSocket):
    """
    Sends a telemetry JSON frame every ~2 seconds.
    Frame schema: { ts, routers: {...}, tunnels: {...}, riskScore }
    """
    await websocket.accept()
    broadcaster.subscribe(websocket)
    log.info("WS client connected: %s", websocket.client)
    try:
        while True:
            # Keep connection alive; actual data is pushed by broadcaster
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        log.info("WS client disconnected: %s", websocket.client)
    finally:
        broadcaster.unsubscribe(websocket)
