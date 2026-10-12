import os
import pickle
import time
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field


app = FastAPI(
    title="SmartBlood ML Service",
    version="1.1.0"
)

MODEL_PATH = Path(os.getenv("SMARTBLOOD_MODEL_PATH", "models/response_model.joblib"))
FEATURE_NAMES = (
    "blood_compatible", "distance_km", "available", "eligible", "verified",
    "total_donations", "previous_recommendations", "previous_acceptances",
    "previous_declines", "response_rate", "acceptance_rate", "urgency_score",
)
_model: Any = None
_model_version = "unknown"
MONITORING_TOKEN = os.getenv("SMARTBLOOD_MONITORING_TOKEN")
_monitoring = {
    "prediction_requests": 0,
    "successful_predictions": 0,
    "failed_predictions": 0,
    "fallback_predictions": 0,
    "total_latency_ms": 0.0,
}


# ==========================================
# REQUEST DATA MODEL
# ==========================================

class DonorPrediction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    blood_compatible: int = Field(ge=0, le=1)
    distance_km: float = Field(ge=0, le=10000)
    available: int = Field(ge=0, le=1)
    eligible: int = Field(ge=0, le=1)
    verified: int = Field(ge=0, le=1)

    total_donations: int = Field(ge=0, le=100000)

    previous_recommendations: int = Field(ge=0, le=100000)
    previous_acceptances: int = Field(ge=0, le=100000)
    previous_declines: int = Field(ge=0, le=100000)

    response_rate: float = Field(ge=0, le=1)
    acceptance_rate: float = Field(ge=0, le=1)

    urgency_score: float = Field(ge=0, le=100)


def _load_model() -> Any:
    global _model, _model_version
    if _model is not None:
        return _model
    try:
        loaded = joblib.load(MODEL_PATH)
    except (
        FileNotFoundError,
        OSError,
        ValueError,
        EOFError,
        ImportError,
        AttributeError,
        pickle.UnpicklingError,
    ) as exc:
        raise HTTPException(
            status_code=503,
            detail="Prediction model is unavailable.",
        ) from exc

    if isinstance(loaded, dict) and "model" in loaded:
        _model = loaded["model"]
        _model_version = str(loaded.get("model_version", "unknown"))
    else:
        _model = loaded
        _model_version = "legacy-unversioned"
    if not hasattr(_model, "predict_proba"):
        _model = None
        raise HTTPException(status_code=503, detail="Prediction model is invalid.")
    return _model


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/")
def root():

    return {
        "service": "SmartBlood ML",
        "status": "running",
        "model": "Calibrated Random Forest",
        "version": "1.1.0",
        "model_version": _model_version,
    }


@app.get("/response-time/status")
def response_time_status():
    return {
        "status": "DATA_INSUFFICIENT",
        "definition": (
            "Elapsed time in minutes from an invitation being recorded "
            "as recommendedAt until the donor records an ACCEPTED or "
            "DECLINED response at respondedAt."
        ),
        "estimate_available": False,
        "reason": (
            "The available training dataset has no recommendation timestamps, "
            "response timestamps, observation windows, or censoring indicators. "
            "Nonresponding donors cannot be treated as zero-minute responses."
        ),
        "not_a_measure_of": [
            "donor travel time",
            "time until blood reaches a patient",
            "medical response or fulfillment",
        ],
        "required_fields_for_future_model": [
            "recommended_at",
            "responded_at",
            "response_status",
            "observation_end_at",
        ],
    }


@app.get("/monitoring")
def monitoring(x_monitoring_token: str | None = Header(default=None)):
    if not MONITORING_TOKEN or x_monitoring_token != MONITORING_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="Monitoring authorization is required.",
        )
    requests = _monitoring["prediction_requests"]
    return {
        "model_name": "SmartBlood donor response classifier",
        "model_version": _model_version,
        "model_available": _model is not None,
        "prediction_requests": requests,
        "successful_predictions": _monitoring["successful_predictions"],
        "failed_predictions": _monitoring["failed_predictions"],
        "fallback_predictions": _monitoring["fallback_predictions"],
        "average_latency_ms": (
            _monitoring["total_latency_ms"] / requests if requests else 0.0
        ),
        "evaluation_metrics": None,
        "evaluation_notice": (
            "Offline metrics are available from evaluate_models.py; "
            "live predictions have no ground-truth labels yet."
        ),
    }


# ==========================================
# MODEL PREDICTION
# ==========================================

@app.post("/predict")
def predict(data: DonorPrediction):
    started = time.perf_counter()
    _monitoring["prediction_requests"] += 1
    try:
        model = _load_model()
        features = pd.DataFrame([data.model_dump()], columns=FEATURE_NAMES)
        probability = float(model.predict_proba(features)[0][1])
        if not 0 <= probability <= 1:
            raise HTTPException(status_code=503, detail="Model returned an invalid probability.")
        _monitoring["successful_predictions"] += 1
        return {
            "response_probability": round(probability, 4),
            "response_percentage": round(probability * 100, 2),
            "model_version": _model_version,
            "prediction_status": "MODEL_PREDICTED",
        }
    except HTTPException:
        _monitoring["failed_predictions"] += 1
        raise
    except (IndexError, TypeError, ValueError, OSError) as exc:
        _monitoring["failed_predictions"] += 1
        raise HTTPException(status_code=503, detail="Prediction failed.") from exc
    finally:
        _monitoring["total_latency_ms"] += (time.perf_counter() - started) * 1000