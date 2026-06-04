from datetime import datetime as dt
from fastapi import APIRouter, HTTPException, Query
from core.database import get_connection, close_connection

router = APIRouter()

@router.get("/latest")
def get_latest_data():
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
 
    try:
        query = """
            SELECT
                ROUND((SELECT timestamp FROM sensor_readings ORDER BY timestamp DESC LIMIT 1), 2) AS timestamp,
                ROUND((SELECT temperature   FROM sensor_readings WHERE temperature   IS NOT NULL ORDER BY timestamp DESC LIMIT 1), 2) AS temperature,
                ROUND((SELECT humidity      FROM sensor_readings WHERE humidity      IS NOT NULL ORDER BY timestamp DESC LIMIT 1), 2) AS humidity,
                ROUND((SELECT soil_moisture FROM sensor_readings WHERE soil_moisture IS NOT NULL ORDER BY timestamp DESC LIMIT 1), 2) AS soil_moisture,
                ROUND((SELECT light_intensity FROM sensor_readings WHERE light_intensity IS NOT NULL ORDER BY timestamp DESC LIMIT 1), 2) AS light_intensity,
                ROUND((SELECT co2           FROM sensor_readings WHERE co2           IS NOT NULL ORDER BY timestamp DESC LIMIT 1), 2) AS co2
        """
        cursor.execute(query)
        result = cursor.fetchone()
 
        if (
            result is None or
            all(value is None for key, value in result.items() if key != "timestamp")
        ):
            return {"message": "Chưa có dữ liệu."}
 
        return result
 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
    finally:
        close_connection(connect, cursor)

@router.get("/history")
def get_sensor_history_range(
    mode: str = Query("day", pattern="^(hour|day|month)$"),
    date: str = Query(None, description="Ngày cụ thể YYYY-MM-DD. Mặc định là hôm nay."),
):
    """
    mode=hour                → 60 phút gần nhất, group theo phút
    mode=day                 → ngày hôm nay,     group theo giờ  (mặc định)
    mode=day&date=2025-01-15 → ngày cụ thể,      group theo giờ
    mode=month               → 30 ngày gần nhất, group theo ngày
    """
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)

    try:
        # Validate date nếu có, mặc định là hôm nay cho mode=day
        if date:
            try:
                dt.strptime(date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="date không hợp lệ, dùng định dạng YYYY-MM-DD")
        elif mode == "day":
            date = dt.now().strftime("%Y-%m-%d")

        if mode == "hour":
            query = """
                SELECT
                    CONCAT(group_key, ':00') AS timestamp,
                    ROUND(AVG(temperature), 2)    AS temperature,
                    ROUND(AVG(humidity), 2)        AS humidity,
                    ROUND(AVG(soil_moisture), 2)   AS soil_moisture,
                    ROUND(AVG(light_intensity), 2) AS light_intensity,
                    ROUND(AVG(co2), 2)             AS co2
                FROM (
                    SELECT
                        DATE_FORMAT(`timestamp`, '%Y-%m-%dT%H:%i') AS group_key,
                        temperature, humidity, soil_moisture, light_intensity, co2
                    FROM sensor_readings
                    WHERE `timestamp` >= NOW() - INTERVAL 60 MINUTE
                ) AS t
                GROUP BY group_key
                ORDER BY group_key ASC
            """
            cursor.execute(query)

        elif mode == "day":
            query = """
                SELECT
                    CONCAT(group_key, ':00:00') AS timestamp,
                    ROUND(AVG(temperature), 2)    AS temperature,
                    ROUND(AVG(humidity), 2)        AS humidity,
                    ROUND(AVG(soil_moisture), 2)   AS soil_moisture,
                    ROUND(AVG(light_intensity), 2) AS light_intensity,
                    ROUND(AVG(co2), 2)             AS co2
                FROM (
                    SELECT
                        DATE_FORMAT(`timestamp`, '%Y-%m-%dT%H') AS group_key,
                        temperature, humidity, soil_moisture, light_intensity, co2
                    FROM sensor_readings
                    WHERE DATE(`timestamp`) = %s
                ) AS t
                GROUP BY group_key
                ORDER BY group_key ASC
            """
            cursor.execute(query, (date,))

        else:  # month
            query = """
                SELECT
                    CONCAT(group_key, 'T00:00:00') AS timestamp,
                    ROUND(AVG(temperature), 2)    AS temperature,
                    ROUND(AVG(humidity), 2)        AS humidity,
                    ROUND(AVG(soil_moisture), 2)   AS soil_moisture,
                    ROUND(AVG(light_intensity), 2) AS light_intensity,
                    ROUND(AVG(co2), 2)             AS co2
                FROM (
                    SELECT
                        DATE_FORMAT(`timestamp`, '%Y-%m-%d') AS group_key,
                        temperature, humidity, soil_moisture, light_intensity, co2
                    FROM sensor_readings
                    WHERE `timestamp` >= NOW() - INTERVAL 30 DAY
                ) AS t
                GROUP BY group_key
                ORDER BY group_key ASC
            """
            cursor.execute(query)

        return cursor.fetchall()

    except HTTPException:
        raise
    except Exception as e:
        print("HISTORY ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)