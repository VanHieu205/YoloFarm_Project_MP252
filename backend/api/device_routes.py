from fastapi import APIRouter, HTTPException, Body
from core.database import get_connection, close_connection
from mqtt_publisher import mqtt_publisher
import uuid
from datetime import datetime

router = APIRouter()

# =============================================
# GET ALL DEVICES
# =============================================
@router.get("/all")
def get_all_devices(user_id: str = None):
    """
    Lấy danh sách tất cả thiết bị
    
    Query params:
    - user_id: (optional) Lọc theo user
    """
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
    
    try:
        if user_id:
            query = """
            SELECT device_id, name, type, location, connection_status, 
                   is_on, mode, firmware_version, last_updated, created_at
            FROM devices WHERE user_id = %s ORDER BY created_at DESC
            """
            cursor.execute(query, (user_id,))
        else:
            query = """
            SELECT device_id, name, type, user_id, location, connection_status, 
                   is_on, mode, firmware_version, last_updated, created_at
            FROM devices ORDER BY created_at DESC
            """
            cursor.execute(query)
        
        devices = cursor.fetchall()
        return {
            "total": len(devices),
            "devices": devices
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)


# =============================================
# GET DEVICE DETAIL
# =============================================
@router.get("/{device_id}")
def get_device_detail(device_id: str):
    """Lấy chi tiết thiết bị"""
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
    
    try:
        query = """
        SELECT device_id, name, type, user_id, location, connection_status,
               is_on, mode, firmware_version, last_updated, created_at
        FROM devices WHERE device_id = %s
        """
        cursor.execute(query, (device_id,))
        device = cursor.fetchone()
        
        if not device:
            raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị")
        
        return device
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)


# =============================================
# TURN ON DEVICE
# =============================================
@router.post("/control/turn_on")
def turn_on_device(device_id: str = Body(...)):
    """
    Bật thiết bị
    
    Body:
    {
        "device_id": "device_001"
    }
    """
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM devices WHERE device_id = %s", (device_id,))
        device = cursor.fetchone()
        
        if not device:
            raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị")
        update_query = "UPDATE devices SET is_on = TRUE, last_updated = NOW() WHERE device_id = %s"
        cursor.execute(update_query, (device_id,))
        connect.commit()
    
        success = mqtt_publisher.turn_on_device(device_id)
        
        return {
            "success": success,
            "message": "Bật thiết bị thành công" if success else "Lỗi gửi lệnh MQTT",
            "device_id": device_id,
            "is_on": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)


# =============================================
# TURN OFF DEVICE
# =============================================
@router.post("/control/turn_off")
def turn_off_device(device_id: str = Body(...)):
    """
    Tắt thiết bị
    
    Body:
    {
        "device_id": "device_001"
    }
    """
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM devices WHERE device_id = %s", (device_id,))
        device = cursor.fetchone()
        
        if not device:
            raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị")
        update_query = "UPDATE devices SET is_on = FALSE, last_updated = NOW() WHERE device_id = %s"
        cursor.execute(update_query, (device_id,))
        connect.commit()
        success = mqtt_publisher.turn_off_device(device_id)
        return {
            "success": success,
            "message": "Tắt thiết bị thành công" if success else "Lỗi gửi lệnh MQTT",
            "device_id": device_id,
            "is_on": False
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)


############################### DASH BOARD#######################################
# =============================================
@router.get("/group/status")
def get_device_group_status(user_id: str):
    """
    Lấy trạng thái theo loại thiết bị
    """

    connect = get_connection()
    cursor = connect.cursor(dictionary=True)

    try:
        query = """
        SELECT 
            type,
            COUNT(*) as total_devices,
            SUM(CASE WHEN is_on = TRUE THEN 1 ELSE 0 END) as active_devices
        FROM devices
        WHERE user_id = %s
        GROUP BY type
        """

        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()

        result = []

        for row in rows:
            result.append({
                "type": row["type"],
                "total_devices": row["total_devices"],
                "active_devices": row["active_devices"],
                "is_on": row["active_devices"] > 0
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)


# =============================================
# TURN ON DEVICE TYPE
# =============================================
@router.post("/control/type/turn_on")
def turn_on_device_type(
    user_id: str = Body(...),
    device_type: str = Body(...)
):

    connect = get_connection()
    cursor = connect.cursor(dictionary=True)

    try:
        query = """
        SELECT device_id
        FROM devices
        WHERE user_id = %s AND type = %s
        """

        cursor.execute(query, (user_id, device_type))
        devices = cursor.fetchall()

        if not devices:
            raise HTTPException(status_code=404, detail="Không có thiết bị")

        update_query = """
        UPDATE devices
        SET is_on = TRUE,
            last_updated = NOW()
        WHERE user_id = %s
          AND type = %s
        """

        cursor.execute(update_query, (user_id, device_type))
        connect.commit()

        for d in devices:
            mqtt_publisher.turn_on_device(d["device_id"])

        return {
            "success": True,
            "device_type": device_type,
            "total": len(devices),
            "is_on": True
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)
# =============================================
# TURN OFF DEVICE TYPE
# =============================================
@router.post("/control/type/turn_off")
def turn_off_device_type(
    user_id: str = Body(...),
    device_type: str = Body(...)
):

    connect = get_connection()
    cursor = connect.cursor(dictionary=True)

    try:
        query = """
        SELECT device_id
        FROM devices
        WHERE user_id = %s AND type = %s
        """

        cursor.execute(query, (user_id, device_type))
        devices = cursor.fetchall()

        if not devices:
            raise HTTPException(status_code=404, detail="Không có thiết bị")

        update_query = """
        UPDATE devices
        SET is_on = FALSE,
            last_updated = NOW()
        WHERE user_id = %s
          AND type = %s
        """

        cursor.execute(update_query, (user_id, device_type))
        connect.commit()

        for d in devices:
            mqtt_publisher.turn_off_device(d["device_id"])

        return {
            "success": True,
            "device_type": device_type,
            "total": len(devices),
            "is_on": False
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)
# =============================================
# GET DEVICE GROUP STATUS
# =============================================
@router.get("/group/status")
def get_device_group_status(user_id: str):

    connect = get_connection()
    cursor = connect.cursor(dictionary=True)

    try:
        query = """
        SELECT 
            type,
            COUNT(*) as total_devices,
            COUNT(CASE WHEN is_on = 1 THEN 1 END) as active_count
        FROM devices
        WHERE user_id = %s
        GROUP BY type
        """

        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()

        result = []

        for row in rows:
            active_count = row["active_count"] or 0

            result.append({
                "type": row["type"],
                "status": "ON" if active_count > 0 else "OFF",
                "active_count": active_count,
                "total_devices": row["total_devices"]
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)


# =============================================
# CONTROL DEVICE GROUP
# =============================================
@router.post("/group/control")
def control_device_group(
    device_type: str = Body(...),
    action: str = Body(...),
    user_id: str = Body(...)
):
    """
    Bật/tắt toàn bộ thiết bị cùng loại
    """

    connect = get_connection()
    cursor = connect.cursor(dictionary=True)

    try:
        is_on = action == "ON"

        update_query = """
        UPDATE devices
        SET is_on = %s,
            last_updated = NOW()
        WHERE type = %s
          AND user_id = %s
        """

        cursor.execute(update_query, (is_on, device_type, user_id))
        connect.commit()

        return {
            "success": True,
            "device_type": device_type,
            "status": action
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)
