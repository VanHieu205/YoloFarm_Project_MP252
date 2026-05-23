from fastapi import APIRouter, HTTPException, Query
from core.database import get_connection, close_connection

router = APIRouter()

@router.get("/latest")
def get_latest_data():
    """Lấy bản ghi cảm biến mới nhất để hiển thị lên Dashboard"""
    connect = get_connection()
    
    # Nếu connect đến database thất bại
    if not connect:
        raise HTTPException(status_code=500, detail="Lỗi kết nối Database")
    
    # Khởi tạo cursor = None
    cursor = None

    try:
        # Dùng dictionary = True để trả về dữ liệu dạng JSON {cột: giá trị}
        cursor = connect.cursor(dictionary = True)

        # Lấy 50 bản ghi mới nhất sắp xếp theo thời gian
        query = "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 50"
        cursor.execute(query)
        result = cursor.fetchall() # Lấy tất cả các dòng truy xuất dòng

        if not result:
            return {"message": "Chưa có dữ liệu trong bảng sensor_readings."}
        
        merged_latest = {}
        for row in result:
            for key, value in row.items():
                if key not in merged_latest and value is not None:
                    merged_latest[key] = value


        return merged_latest
    
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    finally:
        # Luôn đóng kết nối khi đã sử dụng xong
        close_connection(connect, cursor)

@router.get("/history")
def get_sensor_history (limit: int = Query(20, ge = 1, le = 100)):
    """Lấy danh sách dữ liệu để vẽ biểu đồ (mặc định là 20 bản ghi)"""
    connect = get_connection()

    # Nếu kết nối đến database thất bại
    if not connect:
        raise HTTPException(status_code=500, detail="Lỗi kết nối Datavase")
    
    # Khởi tạo cursor = None
    cursor = None

    try:
        # Dùng dictionary = True để trả về dữ liệu dạng JSON {cột: giá trị}
        cursor = connect.cursor(dictionary = True)

        query = "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT %s"
        cursor.execute(query, (limit,))
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    finally:
        close_connection(connect, cursor)