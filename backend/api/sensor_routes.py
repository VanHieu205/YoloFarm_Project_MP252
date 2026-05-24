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
                MAX(timestamp) AS timestamp,

                ROUND(AVG(temperature), 2) AS temperature,
                ROUND(AVG(humidity), 2) AS humidity,
                ROUND(AVG(soil_moisture), 2) AS soil_moisture,
                ROUND(AVG(light_intensity), 2) AS light_intensity,
                ROUND(AVG(co2), 2) AS co2

            FROM sensor_readings

            WHERE timestamp >= NOW() - INTERVAL 2 SECOND
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
def get_sensor_history(limit: int = Query(20, ge=1, le=100)):
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)

    try:
        query = """
            SELECT
                time_group AS timestamp,

                ROUND(AVG(temperature), 2) AS temperature,
                ROUND(AVG(humidity), 2) AS humidity,
                ROUND(AVG(soil_moisture), 2) AS soil_moisture,
                ROUND(AVG(light_intensity), 2) AS light_intensity,
                ROUND(AVG(co2), 2) AS co2

            FROM (
                SELECT
                    FLOOR(UNIX_TIMESTAMP(`timestamp`)) AS sec_group,
                    FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(`timestamp`))) AS time_group,

                    temperature,
                    humidity,
                    soil_moisture,
                    light_intensity,
                    co2
                FROM sensor_readings
                WHERE `timestamp` >= NOW() - INTERVAL %s SECOND
            ) AS grouped_data

            GROUP BY sec_group, time_group
            ORDER BY sec_group DESC
        """


        cursor.execute(query, (limit,))
        return cursor.fetchall()

    except Exception as e:
        print("HISTORY ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)