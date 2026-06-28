"""
PS13 NOC — Backend smoke tests
Run: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


# Minimal app import — skips lifespan for testing
from fastapi import FastAPI
from api.routes import router

app = FastAPI()
app.include_router(router, prefix="/api")
client = TestClient(app)


def test_health_stub():
    """Basic sanity — router is importable."""
    assert router is not None


def test_list_alerts():
    r = client.get("/api/alerts")
    assert r.status_code == 200
    data = r.json()
    assert "alerts" in data
    assert len(data["alerts"]) > 0


def test_list_predictions():
    r = client.get("/api/predictions")
    assert r.status_code == 200
    data = r.json()
    assert "predictions" in data
    assert len(data["predictions"]) == 3


def test_get_prediction_not_found():
    r = client.get("/api/predictions/nonexistent")
    assert r.status_code == 404


def test_list_devices():
    r = client.get("/api/devices")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 11


def test_kpi():
    r = client.get("/api/kpi")
    assert r.status_code == 200
    data = r.json()
    assert "riskScore" in data
    assert "activeTunnels" in data


def test_audit_write_read():
    payload = {"ts": "2026-06-27T10:00:00Z", "user": "Op-01", "action": "VIEW_DEVICE", "resource": "PE-02"}
    r = client.post("/api/audit", json=payload)
    assert r.status_code == 201

    r2 = client.get("/api/audit")
    assert r2.status_code == 200
    entries = r2.json()["entries"]
    assert any(e["action"] == "VIEW_DEVICE" for e in entries)


def test_ack_alert():
    r = client.patch("/api/alerts/a3/ack")
    assert r.status_code == 200
    assert r.json()["status"] == "ACK"
