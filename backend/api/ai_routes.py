from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

from ML.ai_engine import YieldPredictor
from core.database import get_connection, close_connection

router = APIRouter()

ai_predictor = YieldPredictor(models_dir="../ML/models")


class PredictRequest(BaseModel):
    user_id: str
    crop_name: str
    manual_season: Optional[str] = None   # ← sửa: thêm Optional để nhận null từ frontend


@router.post("/predict")
def get_prediction_and_advice(req: PredictRequest):
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)

    try:
        query = """
            SELECT sr.temperature, sr.humidity, sr.soil_moisture, sr.timestamp
            FROM sensor_readings sr
            JOIN devices d ON sr.device_id = d.device_id
            WHERE d.user_id = %s
              AND sr.temperature IS NOT NULL 
              AND sr.humidity IS NOT NULL 
              AND sr.soil_moisture IS NOT NULL
            ORDER BY sr.timestamp DESC 
            LIMIT 1
        """
        cursor.execute(query, (req.user_id,))
        latest_sensor = cursor.fetchone()

        if not latest_sensor:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy dữ liệu cảm biến cho người dùng này."
            )

        temp       = latest_sensor['temperature']
        humid      = latest_sensor['humidity']
        soil_moist = latest_sensor['soil_moisture']
        sensor_time = latest_sensor['timestamp']

        prediction_result = ai_predictor.predict_realtime(
            temp=temp,
            humid=humid,
            soil_moist=soil_moist,
            crop_name=req.crop_name,
            manual_season=req.manual_season,
            use_vn_base=True
        )

        advice_list = ai_predictor.generate_advice(
            temp=temp,
            humid=humid,
            soil_moist=soil_moist,
            predicted_yield=prediction_result['predicted_yield_raw'],
            base_yield=prediction_result['diagnostics']['base_yield_used'],
            crop_name=req.crop_name
        )

        prediction_result['expert_advice'] = advice_list

        # Lưu lịch sử dự đoán
        prediction_id = str(uuid.uuid4())

        if isinstance(sensor_time, datetime):
            sensor_time = sensor_time.strftime("%Y-%m-%d %H:%M:%S")

        try:
            insert_query = """
                INSERT INTO ai_prediction_history (
                    id, user_id, crop_name, temperature, humidity, soil_moisture,
                    predicted_min, predicted_max, advices
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                prediction_id,
                req.user_id,
                req.crop_name,
                temp,
                humid,
                soil_moist,
                prediction_result['safe_range']['min'],
                prediction_result['safe_range']['max'],
                str(advice_list),
            ))
            connect.commit()
        except Exception:
            # Không để lỗi INSERT phá vỡ response chính
            pass

        return {
            "success": True,
            "sensor_data_used": {
                "temperature": temp,
                "humidity":    humid,
                "soil_moisture": soil_moist,
                "timestamp":   sensor_time
            },
            "ai_analysis": prediction_result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)
