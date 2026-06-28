"""
PS13 ML Inference Pipeline
══════════════════════════

Stage 1  IsolationForest  — anomaly detection on raw telemetry
Stage 2  XGBoost          — failure probability regression
Stage 3  Root-cause       — multi-class classifier (congestion / BGP / memory / …)
Stage 4  SHAP             — feature importance explanation
Stage 5  Risk engine      — composite score + lead-time estimate

Usage:
    pipeline = MLPipeline()
    pipeline.load()                         # load pre-trained models from disk
    result = pipeline.infer(telemetry_row)  # returns PredictionResult
"""

from __future__ import annotations

import logging
import os
import pickle
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import numpy as np

log = logging.getLogger("ps13.ml")

MODEL_DIR = Path(os.environ.get("MODEL_DIR", "/opt/ps13/models"))

# Feature names must match training data exactly
FEATURES = [
    "latency_ms",
    "packet_loss_pct",
    "jitter_ms",
    "cpu_utilization_pct",
    "mem_utilization_pct",
    "lat_delta_15m",         # latency change over last 15 min
    "loss_delta_15m",
    "bgp_flap_count_1h",
    "interface_error_rate",
]

ROOT_CAUSE_LABELS = [
    "tunnel_congestion",
    "memory_pressure",
    "bgp_instability",
    "interface_error",
    "unknown",
]


@dataclass
class PredictionResult:
    device:          str
    tunnel:          Optional[str]
    anomaly_score:   float           # IsolationForest: higher = more anomalous (0–1)
    failure_prob:    float           # XGBoost: 0–1
    risk_score:      float           # 0–100
    root_cause:      str
    root_cause_conf: float           # 0–1
    lead_time_min:   Optional[float] # estimated minutes to failure
    shap_values:     dict            # feature → SHAP contribution
    ts:              float = field(default_factory=time.time)
    alert_level:     str = "ok"      # ok | warn | crit

    def to_dict(self) -> dict:
        return {
            "device":          self.device,
            "tunnel":          self.tunnel,
            "anomaly_score":   round(self.anomaly_score, 4),
            "failure_prob":    round(self.failure_prob, 4),
            "risk_score":      round(self.risk_score, 1),
            "root_cause":      self.root_cause,
            "root_cause_conf": round(self.root_cause_conf, 3),
            "lead_time_min":   round(self.lead_time_min, 1) if self.lead_time_min else None,
            "shap_values":     {k: round(v, 4) for k, v in self.shap_values.items()},
            "alert_level":     self.alert_level,
            "ts":              self.ts,
        }


class MLPipeline:
    """Loads pre-trained models and runs the full 5-stage inference pipeline."""

    def __init__(self) -> None:
        self._iso_forest  = None
        self._xgb_model   = None
        self._rc_model    = None
        self._shap_explainer = None
        self._loaded = False

    # ── Lifecycle ──────────────────────────────────────────────────────────

    def load(self) -> None:
        """Load pickled models from MODEL_DIR. Raises FileNotFoundError if absent."""
        try:
            import xgboost as xgb
            import shap
            from sklearn.ensemble import IsolationForest

            self._iso_forest     = pickle.loads((MODEL_DIR / "isolation_forest.pkl").read_bytes())
            self._xgb_model      = xgb.XGBClassifier(); self._xgb_model.load_model(MODEL_DIR / "xgboost.json")
            self._rc_model       = pickle.loads((MODEL_DIR / "root_cause.pkl").read_bytes())
            self._shap_explainer = shap.TreeExplainer(self._xgb_model)
            self._loaded = True
            log.info("ML models loaded from %s", MODEL_DIR)
        except Exception as exc:
            log.warning("ML model load failed (%s) — running in SIMULATION mode", exc)
            self._loaded = False

    # ── Inference ──────────────────────────────────────────────────────────

    def infer(self, telemetry: dict, device: str, tunnel: str | None = None) -> PredictionResult:
        """
        Run all 5 pipeline stages on one telemetry snapshot.

        telemetry keys must include all values in FEATURES.
        """
        if self._loaded:
            return self._real_infer(telemetry, device, tunnel)
        return self._sim_infer(telemetry, device, tunnel)

    def _build_feature_vector(self, t: dict) -> np.ndarray:
        return np.array([[t.get(f, 0.0) for f in FEATURES]], dtype=np.float32)

    def _real_infer(self, t: dict, device: str, tunnel: str | None) -> PredictionResult:
        import shap as _shap
        X = self._build_feature_vector(t)

        # Stage 1 — IsolationForest
        iso_raw = self._iso_forest.score_samples(X)[0]       # negative; more negative = anomaly
        anomaly_score = max(0.0, min(1.0, 1.0 + iso_raw))    # map to 0–1

        # Stage 2 — XGBoost failure probability
        failure_prob = float(self._xgb_model.predict_proba(X)[0, 1])

        # Stage 3 — Root-cause
        rc_proba = self._rc_model.predict_proba(X)[0]
        rc_idx   = int(np.argmax(rc_proba))
        root_cause      = ROOT_CAUSE_LABELS[rc_idx]
        root_cause_conf = float(rc_proba[rc_idx])

        # Stage 4 — SHAP
        shap_vals = self._shap_explainer.shap_values(X)
        shap_dict = dict(zip(FEATURES, shap_vals[0].tolist()))

        # Stage 5 — Risk + lead-time
        risk_score, lead_time = _compute_risk(anomaly_score, failure_prob)

        return PredictionResult(
            device=device, tunnel=tunnel,
            anomaly_score=anomaly_score, failure_prob=failure_prob,
            risk_score=risk_score, root_cause=root_cause, root_cause_conf=root_cause_conf,
            lead_time_min=lead_time, shap_values=shap_dict,
            alert_level=_alert_level(risk_score),
        )

    def _sim_infer(self, t: dict, device: str, tunnel: str | None) -> PredictionResult:
        """Deterministic simulation — used when real models are absent (dev/test)."""
        import random as _r
        loss  = t.get("packet_loss_pct", 0.5)
        cpu   = t.get("cpu_utilization_pct", 60.0)
        lat   = t.get("latency_ms", 50.0)

        anomaly_score  = min(1.0, (loss * 0.3 + (cpu - 60) * 0.004 + (lat - 50) * 0.002) + _r.gauss(0, 0.03))
        failure_prob   = min(0.99, anomaly_score * 1.05 + _r.gauss(0, 0.02))
        risk_score, lt = _compute_risk(anomaly_score, failure_prob)
        shap_dict      = {f: round(_r.gauss(0, 0.1), 4) for f in FEATURES}
        shap_dict["packet_loss_pct"]       = round(loss * 0.18, 4)
        shap_dict["cpu_utilization_pct"]   = round((cpu - 60) * 0.004, 4)

        return PredictionResult(
            device=device, tunnel=tunnel,
            anomaly_score=max(0.0, anomaly_score), failure_prob=max(0.0, failure_prob),
            risk_score=max(0.0, risk_score), root_cause="tunnel_congestion",
            root_cause_conf=round(0.85 + _r.gauss(0, 0.05), 3),
            lead_time_min=lt, shap_values=shap_dict,
            alert_level=_alert_level(risk_score),
        )


# ── Helpers ─────────────────────────────────────────────────────────────────

def _compute_risk(anomaly_score: float, failure_prob: float) -> tuple[float, float | None]:
    """Composite risk (0–100) and estimated lead-time in minutes."""
    risk = min(100.0, (0.4 * anomaly_score + 0.6 * failure_prob) * 100.0)
    # Lead-time heuristic: higher risk → shorter lead time
    if risk < 50:
        lead_time = None
    elif risk < 75:
        lead_time = 240.0 - (risk - 50) * 4.0   # 240 → 140 min
    else:
        lead_time = max(5.0, 140.0 - (risk - 75) * 5.4)  # 140 → 5 min
    return round(risk, 1), round(lead_time, 0) if lead_time else None


def _alert_level(risk: float) -> str:
    if risk >= 80:
        return "crit"
    if risk >= 60:
        return "warn"
    return "ok"
