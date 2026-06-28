"""
TelemetryBroadcaster
────────────────────
Polls Prometheus every POLL_INTERVAL seconds, runs the ML pipeline,
and pushes a telemetry JSON frame to all connected WebSocket clients.

In a full deployment this replaces the frontend setInterval simulation.
"""

from __future__ import annotations

import asyncio
import json
import logging
import math
import random
import time
from typing import Set

import httpx
from fastapi import WebSocket

log = logging.getLogger("ps13.telemetry")

POLL_INTERVAL = 2.0          # seconds
PROMETHEUS_URL = "http://prometheus:9090"

# Prometheus query → metric key mapping
PROM_QUERIES: dict[str, str] = {
    "cpu_pe02":     'avg(rate(node_cpu_seconds_total{instance="pe-02",mode!="idle"}[1m])) * 100',
    "cpu_pe04":     'avg(rate(node_cpu_seconds_total{instance="pe-04",mode!="idle"}[1m])) * 100',
    "lat_t102":     'mpls_tunnel_latency_ms{tunnel="MPLS-T102"}',
    "loss_t102":    'mpls_tunnel_packet_loss_percent{tunnel="MPLS-T102"}',
    "jitter_t102":  'mpls_tunnel_jitter_ms{tunnel="MPLS-T102"}',
}


async def _prom_query(client: httpx.AsyncClient, promql: str) -> float | None:
    try:
        r = await client.get(
            f"{PROMETHEUS_URL}/api/v1/query",
            params={"query": promql},
            timeout=2.0,
        )
        r.raise_for_status()
        data = r.json()
        result = data.get("data", {}).get("result", [])
        if result:
            return float(result[0]["value"][1])
    except Exception as exc:
        log.debug("Prometheus query failed: %s — %s", promql, exc)
    return None


def _sim_value(prev: float, drift: float = 0.5, sigma: float = 2.0,
               lo: float = 0.0, hi: float = 100.0) -> float:
    """Fallback: random walk when Prometheus is unavailable."""
    return round(max(lo, min(hi, prev + drift + random.gauss(0, sigma))), 2)


class TelemetryBroadcaster:
    """Singleton that holds WebSocket subscriptions and pushes live frames."""

    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()
        self._running = False
        self._state: dict = {
            "cpu_pe02": 90.0, "cpu_pe04": 83.0,
            "lat_t102": 130.0, "loss_t102": 2.0, "jitter_t102": 40.0,
            "risk": 88.0,
        }

    @property
    def running(self) -> bool:
        return self._running

    def subscribe(self, ws: WebSocket) -> None:
        self._clients.add(ws)
        log.info("Subscribed WS client — total %d", len(self._clients))

    def unsubscribe(self, ws: WebSocket) -> None:
        self._clients.discard(ws)
        log.info("Unsubscribed WS client — total %d", len(self._clients))

    async def run(self) -> None:
        self._running = True
        async with httpx.AsyncClient() as client:
            while self._running:
                frame = await self._build_frame(client)
                await self._broadcast(frame)
                await asyncio.sleep(POLL_INTERVAL)

    async def stop(self) -> None:
        self._running = False

    async def _build_frame(self, client: httpx.AsyncClient) -> dict:
        s = self._state

        # Try Prometheus; fall back to random-walk simulation
        s["cpu_pe02"]    = (await _prom_query(client, PROM_QUERIES["cpu_pe02"]))  or _sim_value(s["cpu_pe02"],   drift=-0.3, sigma=2, lo=60, hi=99)
        s["cpu_pe04"]    = (await _prom_query(client, PROM_QUERIES["cpu_pe04"]))  or _sim_value(s["cpu_pe04"],   drift=0.1,  sigma=2, lo=60, hi=99)
        s["lat_t102"]    = (await _prom_query(client, PROM_QUERIES["lat_t102"]))  or _sim_value(s["lat_t102"],   drift=0.5,  sigma=4, lo=60, hi=220)
        s["loss_t102"]   = (await _prom_query(client, PROM_QUERIES["loss_t102"])) or _sim_value(s["loss_t102"],  drift=0.05, sigma=0.1, lo=0, hi=5)
        s["jitter_t102"] = (await _prom_query(client, PROM_QUERIES["jitter_t102"])) or _sim_value(s["jitter_t102"], drift=0.1, sigma=2, lo=5, hi=100)

        # Update risk score heuristic (would be ML pipeline output in prod)
        s["risk"] = min(98, max(70, s["risk"] + (s["loss_t102"] - 2.0) * 2 + random.gauss(0, 0.5)))

        ts = time.time()
        return {
            "type": "telemetry",
            "ts":   ts,
            "routers": {
                "CORE-01": {"cpu": round(40 + random.uniform(0, 8), 1), "mem": round(55 + random.uniform(0, 6), 1), "status": "ok"},
                "PE-02":   {"cpu": round(s["cpu_pe02"], 1),             "mem": round(85 + random.uniform(0, 5), 1), "status": "crit" if s["cpu_pe02"] > 92 else "warn"},
                "PE-03":   {"cpu": round(28 + random.uniform(0, 8), 1), "mem": round(42 + random.uniform(0, 6), 1), "status": "ok"},
                "PE-04":   {"cpu": round(s["cpu_pe04"], 1),             "mem": round(68 + random.uniform(0, 6), 1), "status": "warn"},
                "PE-07":   {"cpu": round(25 + random.uniform(0, 8), 1), "mem": round(48 + random.uniform(0, 6), 1), "status": "ok"},
            },
            "tunnels": {
                "MPLS-T102": {"latency": round(s["lat_t102"], 1),  "loss": round(s["loss_t102"], 2), "jitter": round(s["jitter_t102"], 1), "status": "crit" if s["loss_t102"] > 2 else "warn"},
                "MPLS-T088": {"latency": round(62 + random.uniform(0, 12), 1), "loss": round(random.uniform(0.05, 0.25), 2), "jitter": round(8 + random.uniform(0, 5), 1), "status": "ok"},
            },
            "riskScore": round(s["risk"], 1),
        }

    async def _broadcast(self, frame: dict) -> None:
        if not self._clients:
            return
        payload = json.dumps(frame)
        dead: Set[WebSocket] = set()
        for ws in list(self._clients):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.unsubscribe(ws)
