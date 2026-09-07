from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(
    title="ORE AI API",
    description="AI-powered Mine Subsidence Monitoring and Early Warning System",
    version="1.0.0"
)

# Load trained model
model = joblib.load("ore_ai_model.pkl")
label_encoder = joblib.load("ore_ai_label_encoder.pkl")
features = joblib.load("ore_ai_features.pkl")


class SensorData(BaseModel):
    displacement_mm: float
    displacement_rate_mm_per_15min: float
    displacement_acceleration: float
    displacement_rolling_mean: float

    tilt_deg: float
    tilt_rate_deg_per_15min: float
    tilt_acceleration: float
    tilt_rolling_mean: float

    vibration_mm_s: float
    vibration_rolling_mean: float

    crack_change_mm: float
    battery_pct: float
    signal_strength_pct: float


@app.get("/")
def home():
    return {
        "project": "ORE AI",
        "status": "online",
        "message": "Mine Subsidence AI Backend Running"
    }


@app.post("/predict")
def predict(data: SensorData):

    input_data = pd.DataFrame(
        [[getattr(data, feature) for feature in features]],
        columns=features
    )

    prediction = model.predict(input_data)

    risk_level = label_encoder.inverse_transform(prediction)[0]

    probabilities = model.predict_proba(input_data)[0]

    confidence = float(max(probabilities))

    return {
        "risk_level": risk_level,
        "confidence": round(confidence * 100, 2)
    }