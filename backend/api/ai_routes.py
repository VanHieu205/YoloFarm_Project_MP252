from fastapi import APIRouter, Body, HTTPException
import joblib
import os
import numpy as np
import pandas as pd

router = APIRouter()

# ===============================
# BASE PATH
# ===============================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "ML", "models", "xgb_crop_yield_model.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "ML", "models", "model_features.pkl")

# ===============================
# LOAD MODEL SAFE
# ===============================
model = None
features = None

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)

if os.path.exists(FEATURES_PATH):
    features = joblib.load(FEATURES_PATH)


if model is None or features is None:
    print("⚠️ WARNING: AI model hoặc features chưa load được")


# ===============================
# PREPROCESS
# ===============================
def preprocess_input(data: dict):

    df = pd.DataFrame([data])

    if "Crop" in df.columns:
        df["Crop"] = df["Crop"].str.strip().str.lower()

    if "Season" in df.columns:
        df["Season"] = df["Season"].str.strip().str.lower()

    if all(col in df.columns for col in ["Temperature", "Humidity", "Soil_Moisture"]):

        df["Temp_Humid_Index"] = df["Temperature"] * df["Humidity"]
        df["Soil_Temp_Ratio"] = df["Soil_Moisture"] / (df["Temperature"] + 1)
        df["Temp_Stress"] = (df["Temperature"] - 25) ** 2
        df["Humid_Stress"] = (df["Humidity"] - 60) ** 2

    df = pd.get_dummies(df)

    df = df.reindex(columns=features, fill_value=0)

    return df


# ===============================
# PREDICT API
# ===============================
@router.post("/predict")
def predict(data: dict = Body(...)):

    try:
        if model is None:
            raise HTTPException(status_code=500, detail="Model chưa được load")

        X = preprocess_input(data)

        pred_yield = float(model.predict(X)[0])

        temp = data.get("Temperature", 0)
        humidity = data.get("Humidity", 0)
        soil = data.get("Soil_Moisture", 0)

        # =========================
        # SIMPLE AI LOGIC LAYER
        # =========================
        health = 100

        if soil < 30:
            health -= 20
        if temp > 32:
            health -= 15
        if humidity < 40:
            health -= 10

        health = max(0, min(100, health))

        risk = (
            "Low" if health >= 80 else
            "Medium" if health >= 50 else
            "High"
        )

        confidence = 0.88

        yield_growth = min(50, max(0, pred_yield / 10))

        return {
            "success": True,
            "prediction": {
                "yield": round(pred_yield, 2),
                "yield_growth_percent": round(yield_growth, 2),
                "health_score": round(health, 2),
                "risk_level": risk,
                "confidence": confidence
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
