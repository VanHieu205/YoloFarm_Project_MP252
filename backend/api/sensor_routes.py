from fastapi import APIRouter, HTTPException, Query
from core.database import get_connection, close_connection

router = APIRouter()

@router.get("/latest")
def get_latest_data():
    """Lấy bản ghi cảm biến mới nhất để hiển thị lên Dashboard"""
    connect = get_connection()
    # Dùng dictionary = True để trả về dữ liệu dạng JSON {cột: giá trị}
    cursor = connect.cursor(dictionary = True)

    try:
        # Lấy 1 bản ghi mới nhất sắp xếp theo thời gian
        query = "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(query)
        result = cursor.fetchone() # Lấy 1 dòng

        if not result:
            return {"message": "Chưa có dữ liệu trong bảng sensor_readings."}
        return result
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    finally:
        # Luôn đóng kết nối khi đã sử dụng xong
        close_connection(connect, cursor)

@router.get("/history")
def get_sensor_history (limit: int = Query(20, ge = 1, le = 100)):
    """Lấy danh sách dữ liệu để vẽ biểu đồ (mặc định là 20 bản ghi)"""
    connect = get_connection()
    cursor = connect.cursor(dictionary = True)

    try:
        query = "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT %s"
        cursor.execute(query, (limit,))
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    finally:
        close_connection(connect, cursor)