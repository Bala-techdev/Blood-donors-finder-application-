import math
import os
import pickle
import time
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field


app = FastAPI(
    title="SmartBlood ML Service",
    version="1.2.0",
)

# ==========================================
# CORS — allow all origins so both Spring Boot
# and direct local testing can reach every endpoint
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MODEL PATHS & GLOBALS
# ==========================================
MODEL_DIR = Path(os.getenv("SMARTBLOOD_MODEL_DIR", "models"))
RESPONSE_MODEL_PATH = Path(os.getenv(
    "SMARTBLOOD_MODEL_PATH",
    str(MODEL_DIR / "response_model.joblib"),
))
RELIABILITY_MODEL_PATH = MODEL_DIR / "reliability_model.joblib"
SHORTAGE_MODEL_PATH = MODEL_DIR / "shortage_model.joblib"
RESPONSE_TIME_MODEL_PATH = MODEL_DIR / "response_time_model.joblib"
OUTREACH_MODEL_PATH = MODEL_DIR / "outreach_model.joblib"

FEATURE_NAMES = (
    "blood_compatible", "distance_km", "available", "eligible", "verified",
    "total_donations", "previous_recommendations", "previous_acceptances",
    "previous_declines", "response_rate", "acceptance_rate", "urgency_score",
)

_response_model: Any = None
_response_model_version = "unknown"
_reliability_model: Any = None
_shortage_model: Any = None
_response_time_model: Any = None
_outreach_model: Any = None

MONITORING_TOKEN = os.getenv("SMARTBLOOD_MONITORING_TOKEN")
_monitoring = {
    "prediction_requests": 0,
    "successful_predictions": 0,
    "failed_predictions": 0,
    "fallback_predictions": 0,
    "total_latency_ms": 0.0,
}


# ==========================================
# REQUEST DATA MODELS
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


class ReliabilityRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    donor_id: int = Field(ge=1)
    total_recommendations: int = Field(ge=0, default=0)
    responded_count: int = Field(ge=0, default=0)
    accepted_count: int = Field(ge=0, default=0)
    declined_count: int = Field(ge=0, default=0)
    total_donations: int = Field(ge=0, default=0)
    verified: int = Field(ge=0, le=1, default=0)
    response_rate: float = Field(ge=0, le=100, default=0.0)
    acceptance_rate: float = Field(ge=0, le=100, default=0.0)


class ShortageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    blood_group: str
    location: str = ""
    unresolved_requests: int = Field(ge=0, default=0)
    recent_requests: int = Field(ge=0, default=0)
    available_donors: int = Field(ge=0, default=0)
    historical_requests: int = Field(ge=0, default=0)


class ResponseTimeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    donor_id: int = Field(ge=1)
    distance_km: float = Field(ge=0, default=0.0)
    urgency_score: float = Field(ge=0, le=100, default=50.0)
    total_donations: int = Field(ge=0, default=0)
    response_rate: float = Field(ge=0, le=1, default=0.5)
    acceptance_rate: float = Field(ge=0, le=1, default=0.5)
    verified: int = Field(ge=0, le=1, default=0)


class OutreachRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    request_id: int = Field(ge=1)
    blood_group: str
    urgency: str = "NORMAL"
    remaining_units: int = Field(ge=0, default=1)
    candidate_count: int = Field(ge=0, default=0)
    avg_distance_km: float = Field(ge=0, default=10.0)
    avg_response_probability: float = Field(ge=0, le=100, default=50.0)


# ==========================================
# MODEL LOADERS
# ==========================================

def _load_model(path: Path, name: str) -> Any:
    """Attempt to load a joblib/pkl model. Returns None if unavailable."""
    try:
        loaded = joblib.load(path)
        if isinstance(loaded, dict) and "model" in loaded:
            return loaded["model"]
        return loaded
    except (
        FileNotFoundError,
        OSError,
        ValueError,
        EOFError,
        ImportError,
        AttributeError,
        pickle.UnpicklingError,
    ):
        return None


def _load_response_model() -> Any:
    """Load the response model, raising 503 only if truly needed."""
    global _response_model, _response_model_version
    if _response_model is not None:
        return _response_model
    try:
        loaded = joblib.load(RESPONSE_MODEL_PATH)
    except (
        FileNotFoundError,
        OSError,
        ValueError,
        EOFError,
        ImportError,
        AttributeError,
        pickle.UnpicklingError,
    ):
        return None

    if isinstance(loaded, dict) and "model" in loaded:
        _response_model = loaded["model"]
        _response_model_version = str(loaded.get("model_version", "unknown"))
    else:
        _response_model = loaded
        _response_model_version = "legacy-unversioned"
    if not hasattr(_response_model, "predict_proba"):
        _response_model = None
        return None
    return _response_model


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/")
def root():

    return {
        "service": "SmartBlood ML",
        "status": "running",
        "model": "Calibrated Random Forest",
        "version": "1.2.0",
        "model_version": _response_model_version,
        "endpoints": [
            "/predict",
            "/predict-reliability",
            "/predict-shortage",
            "/predict-response-time",
            "/optimize-outreach",
        ],
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
        "model_version": _response_model_version,
        "model_available": _response_model is not None,
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
# 1. /predict  — donor response probability
# ==========================================

def _rule_based_response(data: DonorPrediction) -> dict:
    """Rule-based fallback for /predict when the trained model is missing."""
    if data.blood_compatible == 0:
        prob = 0.05
    elif data.available == 0:
        prob = 0.08
    elif data.eligible == 0:
        prob = 0.10
    else:
        score = 0.55
        # Distance (±0.20)
        if data.distance_km <= 5:
            score += 0.20
        elif data.distance_km <= 15:
            score += 0.20 - (data.distance_km - 5) * 0.015
        elif data.distance_km <= 50:
            score += 0.05 - (data.distance_km - 15) * 0.004
        else:
            score -= min(0.15, (data.distance_km - 50) * 0.002)
        # Acceptance rate (max +0.15)
        score += data.acceptance_rate * 0.15
        # Response rate (max +0.05)
        score += data.response_rate * 0.05
        # Verified (+0.05)
        if data.verified == 1:
            score += 0.05
        # Donation experience (max +0.05)
        score += min(0.05, data.total_donations * 0.017)
        # Urgency (max +0.05, urgency_score 0-100)
        score += (data.urgency_score / 100.0) * 0.05
        prob = max(0.01, min(0.99, score))

    return {
        "response_probability": round(prob, 4),
        "response_percentage": round(prob * 100, 2),
        "model_version": "rule-based-fallback-v1",
        "prediction_status": "RULE_BASED_FALLBACK",
    }


@app.post("/predict")
def predict(data: DonorPrediction):
    started = time.perf_counter()
    _monitoring["prediction_requests"] += 1
    try:
        model = _load_response_model()
        if model is None:
            _monitoring["fallback_predictions"] += 1
            return _rule_based_response(data)

        features = pd.DataFrame([data.model_dump()], columns=FEATURE_NAMES)
        probability = float(model.predict_proba(features)[0][1])
        if not 0 <= probability <= 1:
            _monitoring["fallback_predictions"] += 1
            return _rule_based_response(data)
        _monitoring["successful_predictions"] += 1
        return {
            "response_probability": round(probability, 4),
            "response_percentage": round(probability * 100, 2),
            "model_version": _response_model_version,
            "prediction_status": "MODEL_PREDICTED",
        }
    except HTTPException:
        _monitoring["failed_predictions"] += 1
        raise
    except (IndexError, TypeError, ValueError, OSError):
        _monitoring["fallback_predictions"] += 1
        return _rule_based_response(data)
    finally:
        _monitoring["total_latency_ms"] += (time.perf_counter() - started) * 1000


# ==========================================
# 2. /predict-reliability  — donor reliability
# ==========================================

def _rule_based_reliability(data: ReliabilityRequest) -> dict:
    """
    Heuristic reliability score mirroring the Spring Boot
    DonorReliabilityService formula:
      score = responseRate * 0.60 + acceptanceRate * 0.40
    """
    if data.total_recommendations == 0:
        return {
            "donor_id": data.donor_id,
            "reliability_score": 50.0,
            "reliability_level": "NEW",
            "explanation": "No previous response history; default neutral score.",
            "model_version": "rule-based-fallback-v1",
            "prediction_status": "RULE_BASED_FALLBACK",
        }

    response_rate = data.response_rate  # already 0-100
    acceptance_rate = data.acceptance_rate  # already 0-100

    score = response_rate * 0.60 + acceptance_rate * 0.40

    # Verified bonus (+3)
    if data.verified == 1:
        score += 3.0

    # Donation experience bonus (max +5)
    score += min(5.0, data.total_donations * 1.0)

    score = max(0.0, min(100.0, score))
    score = round(score * 10) / 10.0

    if score >= 80:
        level = "HIGH"
    elif score >= 60:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "donor_id": data.donor_id,
        "reliability_score": score,
        "reliability_level": level,
        "total_recommendations": data.total_recommendations,
        "responded_count": data.responded_count,
        "accepted_count": data.accepted_count,
        "declined_count": data.declined_count,
        "response_rate": round(response_rate, 1),
        "acceptance_rate": round(acceptance_rate, 1),
        "explanation": (
            f"Rule-based: score = responseRate({response_rate:.0f}%) × 0.6 "
            f"+ acceptanceRate({acceptance_rate:.0f}%) × 0.4"
            + (f" + verified bonus" if data.verified else "")
            + (f" + experience bonus ({min(5, data.total_donations)} pts)"
               if data.total_donations > 0 else "")
            + "."
        ),
        "model_version": "rule-based-fallback-v1",
        "prediction_status": "RULE_BASED_FALLBACK",
    }


@app.post("/predict-reliability")
def predict_reliability(data: ReliabilityRequest):
    global _reliability_model
    if _reliability_model is None:
        _reliability_model = _load_model(RELIABILITY_MODEL_PATH, "reliability")

    if _reliability_model is not None:
        try:
            # Future: use trained model here
            pass
        except Exception:
            pass

    # Always fall back to rule-based for now
    return _rule_based_reliability(data)


# ==========================================
# 3. /predict-shortage  — blood shortage risk
# ==========================================

def _rule_based_shortage(data: ShortageRequest) -> dict:
    """
    Mirrors the Spring Boot BloodShortageRiskService logic:
    - HIGH if unresolved > 0 and (donors == 0 or unresolved > donors)
    - MEDIUM if recent > donors, or (unresolved > 0 and donors < 2×unresolved)
    - LOW otherwise
    """
    reasons = []

    if data.unresolved_requests > 0:
        reasons.append(
            f"{data.unresolved_requests} unresolved request(s) are currently pending."
        )
    else:
        reasons.append("No unresolved pending request is currently recorded.")

    if data.available_donors == 0:
        reasons.append(
            "No currently available donor passed eligibility and compatibility checks."
        )
    else:
        reasons.append(
            f"{data.available_donors} currently available donor(s) passed "
            "eligibility and compatibility checks."
        )

    # Risk level logic
    if data.unresolved_requests > 0 and (
        data.available_donors == 0
        or data.unresolved_requests > data.available_donors
    ):
        risk_level = "HIGH"
    elif (
        data.recent_requests > data.available_donors
        or (
            data.unresolved_requests > 0
            and data.available_donors < data.unresolved_requests * 2
        )
    ):
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Shortage probability heuristic
    if risk_level == "HIGH":
        shortage_probability = 0.85
    elif risk_level == "MEDIUM":
        shortage_probability = 0.50
    else:
        shortage_probability = 0.15

    return {
        "blood_group": data.blood_group,
        "location": data.location or "UNKNOWN",
        "risk_level": risk_level,
        "shortage_probability": round(shortage_probability, 4),
        "unresolved_requests": data.unresolved_requests,
        "available_donors": data.available_donors,
        "recent_requests": data.recent_requests,
        "historical_requests": data.historical_requests,
        "reasons": reasons,
        "model_version": "rule-based-fallback-v1",
        "prediction_status": "RULE_BASED_FALLBACK",
    }


@app.post("/predict-shortage")
def predict_shortage(data: ShortageRequest):
    global _shortage_model
    if _shortage_model is None:
        _shortage_model = _load_model(SHORTAGE_MODEL_PATH, "shortage")

    if _shortage_model is not None:
        try:
            # Future: use trained model here
            pass
        except Exception:
            pass

    return _rule_based_shortage(data)


# ==========================================
# 4. /predict-response-time  — estimated response time
# ==========================================

def _rule_based_response_time(data: ResponseTimeRequest) -> dict:
    """
    Heuristic estimate of donor response time in minutes.
    Based on common-sense factors:
    - Closer donors respond faster
    - Higher urgency → faster response
    - Experienced/verified donors respond faster
    - Higher historical response rate → faster
    """
    # Base: 120 minutes (2 hours)
    base_minutes = 120.0

    # Distance factor: each km adds ~1.5 min, capped at +90
    distance_penalty = min(90.0, data.distance_km * 1.5)

    # Urgency factor: high urgency reduces time by up to 40%
    urgency_factor = 1.0 - (data.urgency_score / 100.0) * 0.40

    # Experience factor: experienced donors are 10-30% faster
    experience_discount = min(0.30, data.total_donations * 0.03)

    # Verified donor discount: -10%
    verified_discount = 0.10 if data.verified == 1 else 0.0

    # High response rate discount (max -20%)
    response_discount = data.response_rate * 0.20

    estimated = (base_minutes + distance_penalty) * urgency_factor
    estimated *= (1.0 - experience_discount - verified_discount - response_discount)
    estimated = max(10.0, min(480.0, estimated))  # clamp 10 min – 8 hours

    # Confidence band
    lower = max(5.0, estimated * 0.6)
    upper = min(600.0, estimated * 1.6)

    return {
        "donor_id": data.donor_id,
        "estimated_response_minutes": round(estimated, 1),
        "confidence_lower_minutes": round(lower, 1),
        "confidence_upper_minutes": round(upper, 1),
        "factors": {
            "distance_km": data.distance_km,
            "urgency_score": data.urgency_score,
            "total_donations": data.total_donations,
            "verified": data.verified,
            "response_rate": data.response_rate,
        },
        "notice": (
            "This is a heuristic estimate. No trained response-time model "
            "is available because the dataset lacks recommendation/response "
            "timestamps."
        ),
        "model_version": "rule-based-fallback-v1",
        "prediction_status": "RULE_BASED_FALLBACK",
    }


@app.post("/predict-response-time")
def predict_response_time(data: ResponseTimeRequest):
    global _response_time_model
    if _response_time_model is None:
        _response_time_model = _load_model(
            RESPONSE_TIME_MODEL_PATH, "response_time"
        )

    if _response_time_model is not None:
        try:
            # Future: use trained model here
            pass
        except Exception:
            pass

    return _rule_based_response_time(data)


# ==========================================
# 5. /optimize-outreach  — outreach optimization
# ==========================================

def _rule_based_outreach(data: OutreachRequest) -> dict:
    """
    Rule-based outreach recommendation.
    Decides how many additional donors to contact and the recommended
    strategy based on urgency and remaining units.
    """
    urgency_upper = data.urgency.upper()

    # Strategy based on urgency
    if urgency_upper in ("EMERGENCY", "CRITICAL"):
        strategy = "AGGRESSIVE"
        multiplier = 4
        recommended_channels = ["SMS", "PUSH_NOTIFICATION", "PHONE_CALL"]
    elif urgency_upper == "URGENT":
        strategy = "EXPANDED"
        multiplier = 3
        recommended_channels = ["SMS", "PUSH_NOTIFICATION"]
    else:
        strategy = "STANDARD"
        multiplier = 2
        recommended_channels = ["PUSH_NOTIFICATION"]

    # How many more donors to contact
    additional_donors = max(0, data.remaining_units * multiplier - data.candidate_count)

    # Estimated success probability
    if data.candidate_count > 0 and data.avg_response_probability > 0:
        # P(at least one responds) = 1 - (1 - p)^n
        p = data.avg_response_probability / 100.0
        n = data.candidate_count
        aggregate_probability = 1.0 - math.pow(1.0 - p, n)
    else:
        aggregate_probability = 0.0

    # Recommendation text
    if additional_donors == 0 and aggregate_probability >= 0.80:
        recommendation = (
            "Current outreach appears sufficient. Monitor responses."
        )
    elif additional_donors > 0:
        recommendation = (
            f"Recommend contacting {additional_donors} additional compatible "
            f"donor(s) to improve fulfillment probability."
        )
    else:
        recommendation = (
            "Consider expanding search radius or contacting donors "
            "with lower match scores."
        )

    return {
        "request_id": data.request_id,
        "blood_group": data.blood_group,
        "urgency": data.urgency,
        "strategy": strategy,
        "remaining_units": data.remaining_units,
        "current_candidates": data.candidate_count,
        "additional_donors_recommended": additional_donors,
        "aggregate_response_probability": round(aggregate_probability * 100, 2),
        "recommended_channels": recommended_channels,
        "recommendation": recommendation,
        "model_version": "rule-based-fallback-v1",
        "prediction_status": "RULE_BASED_FALLBACK",
    }


@app.post("/optimize-outreach")
def optimize_outreach(data: OutreachRequest):
    global _outreach_model
    if _outreach_model is None:
        _outreach_model = _load_model(OUTREACH_MODEL_PATH, "outreach")

    if _outreach_model is not None:
        try:
            # Future: use trained model here
            pass
        except Exception:
            pass

    return _rule_based_outreach(data)
