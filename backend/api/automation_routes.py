from fastapi import APIRouter, HTTPException, Body
from core.database import get_connection, close_connection
from mqtt_publisher import mqtt_publisher
import uuid
from datetime import datetime

router = APIRouter()
############################################Thresh sold ###################################
# =========================================================
# GET ALL AUTOMATION RULES
# =========================================================
@router.get("/all")
def get_all_automations(user_id: str):
    """
    Lấy toàn bộ automation của user
    """

    connect = get_connection()

    # Nếu kết nối đến database thất bại
    if not connect:
        raise HTTPException(status_code=500, detail="Lỗi kết nối Database")
    
    # Khởi tạo cursor = None
    cursor = None

    try:
        cursor = connect.cursor(dictionary=True)

        query = """
        SELECT
            tc.config_id,
            tr.rule_id,
            d.name as target_device_name,
            tr.sensor_type,
            tr.operator,
            tr.threshold_value,
            tr.action,
            tc.is_active,
            tc.created_at
        FROM threshold_config tc
        JOIN threshold_rules tr
            ON tc.config_id = tr.config_id
        LEFT JOIN devices d
            ON tr.target_device_id = d.device_id
        JOIN devices owner_device
            ON tc.device_id = owner_device.device_id
        WHERE owner_device.user_id = %s
        ORDER BY tc.created_at DESC
        """

        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()

        automations = []

        operator_map = {
            "lt": "<",
            "gt": ">",
            "lte": "<=",
            "gte": ">=",
            "eq": "="
        }

        sensor_label = {
            "temperature": "Nhiệt độ",
            "humidity": "Độ ẩm",
            "soil_moisture": "Độ ẩm đất",
            "light_intensity": "Ánh sáng",
            "co2": "CO2"
        }

        for row in rows:

            condition = (
                f"{sensor_label.get(row['sensor_type'])} "
                f"{operator_map.get(row['operator'])} "
                f"{row['threshold_value']}"
            )

            action_text = (
                "Bật "
                if row["action"] == "turn_on"
                else "Tắt "
            ) + (row["target_device_name"] or "thiết bị")

            automations.append({
                "id": row["rule_id"],
                "config_id": row["config_id"],
                "name": f"Automation #{row['rule_id']}",
                "type": "threshold",
                "condition": condition,
                "action": action_text,
                "status": "active" if row["is_active"] else "paused",
                "created_at": row["created_at"]
            })

        return {
            "total": len(automations),
            "automations": automations
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)


# =========================================================
# CREATE THRESHOLD AUTOMATION
# =========================================================
@router.post("/create")
def create_automation(
    user_id: str = Body(...),
    sensor_device_id: str = Body(...),
    sensor_type: str = Body(...),
    operator: str = Body(...),
    threshold_value: float = Body(...),
    target_device_id: str = Body(...),
    action: str = Body(...)
):
    """
    Tạo automation theo ngưỡng
    """

    connect = get_connection()

    # Nếu kết nối thất bại
    if not connect:
        raise HTTPException(status_code=500, detail="Lỗi kết nối Database")
    
    # Khởi tạo cursor = None
    cursor = None

    try:
        cursor = connect.cursor(dictionary=True)
        config_id = str(uuid.uuid4())

        insert_config = """
        INSERT INTO threshold_config(
            config_id,
            device_id,
            created_by,
            is_active
        )
        VALUES(%s, %s, %s, TRUE)
        """

        cursor.execute(
            insert_config,
            (
                config_id,
                sensor_device_id,
                user_id
            )
        )

        insert_rule = """
        INSERT INTO threshold_rules(
            config_id,
            sensor_type,
            operator,
            threshold_value,
            target_device_id,
            action
        )
        VALUES(%s, %s, %s, %s, %s, %s)
        """

        cursor.execute(
            insert_rule,
            (
                config_id,
                sensor_type,
                operator,
                threshold_value,
                target_device_id,
                action
            )
        )

        connect.commit()

        return {
            "success": True,
            "message": "Tạo automation thành công",
            "config_id": config_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)


# =========================================================
# TOGGLE AUTOMATION
# =========================================================
@router.post("/toggle")
def toggle_automation(
    config_id: str = Body(...)
):
    """
    Bật/tắt automation
    """

    connect = get_connection()

    # Nếu kết nối thất bại
    if not connect:
        raise HTTPException(status_code=500, detail="Lỗi kết nối Database")
    
    # Khởi tạo cursor = None
    cursor = None

    try:
        cursor = connect.cursor(dictionary=True)

        query = """
        SELECT is_active
        FROM threshold_config
        WHERE config_id = %s
        """

        cursor.execute(query, (config_id,))
        config = cursor.fetchone()

        if not config:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy automation"
            )

        new_status = not config["is_active"]

        update_query = """
        UPDATE threshold_config
        SET is_active = %s
        WHERE config_id = %s
        """

        cursor.execute(
            update_query,
            (
                new_status,
                config_id
            )
        )

        connect.commit()

        return {
            "success": True,
            "config_id": config_id,
            "status": "active" if new_status else "paused"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)


# =========================================================
# DELETE AUTOMATION
# =========================================================
@router.delete("/delete/{config_id}")
def delete_automation(config_id: str):

    connect = get_connection()

    # Nếu kết nối thất bại
    if not connect:
        raise HTTPException(status_code=500, detail="Lỗi kết nối Database")
    
    # Khởi tạo cursor = None
    cursor = None

    try:
        cursor = connect.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM threshold_config WHERE config_id = %s",
            (config_id,)
        )

        config = cursor.fetchone()

        if not config:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy automation"
            )

        delete_query = """
        DELETE FROM threshold_config
        WHERE config_id = %s
        """

        cursor.execute(delete_query, (config_id,))
        connect.commit()

        return {
            "success": True,
            "message": "Xóa automation thành công"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)


# =========================================================
# GET AUTOMATION DETAIL
# =========================================================
@router.get("/{config_id}")
def get_automation_detail(config_id: str):

    connect = get_connection()

    # Nếu kết nối thất bại
    if not connect:
        raise HTTPException(status_code=500, detail="Lỗi kết nối Database")
    
    # Khởi tạo cursor = None
    cursor = None

    try:
        cursor = connect.cursor(dictionary=True)

        query = """
        SELECT
            tc.config_id,
            tc.device_id as sensor_device_id,
            tc.created_by,
            tc.is_active,
            tr.rule_id,
            tr.sensor_type,
            tr.operator,
            tr.threshold_value,
            tr.target_device_id,
            tr.action
        FROM threshold_config tc
        JOIN threshold_rules tr
            ON tc.config_id = tr.config_id
        WHERE tc.config_id = %s
        """

        cursor.execute(query, (config_id,))
        automation = cursor.fetchone()

        if not automation:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy automation"
            )

        return automation

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_connection(connect, cursor)