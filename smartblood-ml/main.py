from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd


app = FastAPI(
    title="SmartBlood ML Service",
    version="1.0.0"
)


# ==========================================
# LOAD TRAINED MODEL
# ==========================================

MODEL_PATH = "models/response_model.joblib"

model = joblib.load(MODEL_PATH)


# ==========================================
# REQUEST DATA MODEL
# ==========================================

class DonorPrediction(BaseModel):

    blood_compatible: int
    distance_km: float
    available: int
    eligible: int
    verified: int

    total_donations: int

    previous_recommendations: int
    previous_acceptances: int
    previous_declines: int

    response_rate: float
    acceptance_rate: float

    urgency_score: float


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/")
def root():

    return {
        "service": "SmartBlood ML",
        "status": "running",
        "model": "Random Forest",
        "version": "1.0.0"
    }


# ==========================================
# MODEL PREDICTION
# ==========================================

@app.post("/predict")
def predict(data: DonorPrediction):

    # Create DataFrame using the SAME
    # feature names used during model training

    features = pd.DataFrame([{

        "blood_compatible":
            data.blood_compatible,

        "distance_km":
            data.distance_km,

        "available":
            data.available,

        "eligible":
            data.eligible,

        "verified":
            data.verified,

        "total_donations":
            data.total_donations,

        "previous_recommendations":
            data.previous_recommendations,

        "previous_acceptances":
            data.previous_acceptances,

        "previous_declines":
            data.previous_declines,

        "response_rate":
            data.response_rate,

        "acceptance_rate":
            data.acceptance_rate,

        "urgency_score":
            data.urgency_score
    }])


    # Get probability of donor responding

    probability = model.predict_proba(features)[0][1]


    # Return prediction

    return {

        "response_probability":
            round(float(probability), 4),

        "response_percentage":
            round(float(probability * 100), 2)
    }