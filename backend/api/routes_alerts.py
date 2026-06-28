"""
API Routes — Alerts
"""
from fastapi import APIRouter, Query
from typing import List, Optional

router = APIRouter(tags=["alerts"])

# In production these come from Elasticsearch / MariaDB
MOCK_ALERTS = [
    {"id":"a1","ts":"10:32:21","device":"PE-02",    "event":"Packet Loss Spike",     "sev":"crit","status":"Open",    "owner":"Op-01"},
    {"id":"a2","ts":"10:30:05","device":"MPLS-T102","event":"Tunnel Latency ↑",       "sev":"crit","status":"Open",    "owner":"Op-01"},
    {"id":"a3","ts":"10:28:44","device":"CE-07",    "event":"BGP Peer Down",          "sev":"warn","status":"Open",    "owner":"Unassigned"},
    {"id":"a4","ts":"10:25:11","device":"PE-04",    "event":"CPU > 85%",              "sev":"warn","status":"ACK",     "owner":"Op-02"},
    {"id":"a5","ts":"10:22:33","device":"PE-02",    "event":"Jitter > 50ms",          "sev":"warn","status":"Open",    "owner":"Op-01"},
    {"id":"a6","ts":"10:18:09","device":"CORE-01",  "event":"Interface flap Gi0/2",   "sev":"warn","status":"Resolved","owner":"Op-02"},
    {"id":"a7","ts":"10:12:00","device":"PE-07",    "event":"Memory usage 90%",       "sev":"warn","status":"Open",    "owner":"Unassigned"},
]

@router.get("/alerts")
async def list_alerts(
    sev:    Optional[str] = Query(None, description="Filter by severity: crit|warn|info"),
    status: Optional[str] = Query(None, description="Filter by status: Open|ACK|Resolved"),
    limit:  int           = Query(50,   ge=1, le=500),
):
    rows = MOCK_ALERTS
    if sev:    rows = [r for r in rows if r["sev"]    == sev]
    if status: rows = [r for r in rows if r["status"] == status]
    return {"alerts": rows[:limit], "total": len(rows)}

@router.get("/alerts/{alert_id}")
async def get_alert(alert_id: str):
    row = next((r for r in MOCK_ALERTS if r["id"] == alert_id), None)
    if not row:
        from fastapi import HTTPException
        raise HTTPException(404, detail=f"Alert {alert_id} not found")
    return row

@router.patch("/alerts/{alert_id}/ack")
async def ack_alert(alert_id: str):
    row = next((r for r in MOCK_ALERTS if r["id"] == alert_id), None)
    if row:
        row["status"] = "ACK"
    return {"ok": True, "id": alert_id, "status": "ACK"}

@router.patch("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    row = next((r for r in MOCK_ALERTS if r["id"] == alert_id), None)
    if row:
        row["status"] = "Resolved"
    return {"ok": True, "id": alert_id, "status": "Resolved"}
