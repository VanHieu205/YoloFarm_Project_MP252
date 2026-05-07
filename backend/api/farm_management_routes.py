# routers/farm.py
from pydantic import BaseModel
from typing import Optional
from datetime import date
from fastapi import APIRouter, HTTPException, Query
from core.database import get_connection, close_connection

router = APIRouter()

# ── Pydantic Models ──────────────────────────────────────────────────────────

class CropCreate(BaseModel):
    user_id: str
    device_id: str
    crop_name: str
    variety: Optional[str] = None
    plant_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    area: Optional[float] = None
    notes: Optional[str] = None

class CropUpdate(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    plant_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    area: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class CareLogCreate(BaseModel):
    date: date
    activity: str
    notes: Optional[str] = None

class SupplyCreate(BaseModel):
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = "kg"
    date: Optional[date] = None

class YieldCreate(BaseModel):
    quantity: float
    unit: str = "kg"
    quality: str = "Bình thường"
    notes: Optional[str] = None

# ── Crops (Mùa vụ) ───────────────────────────────────────────────────────────

@router.get("/crops")
def get_crops(user_id: str = Query(...)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                c.*,
                hy.quantity  AS yield_quantity,
                hy.unit      AS yield_unit,
                hy.quality   AS yield_quality,
                hy.notes     AS yield_notes
            FROM crops c
            LEFT JOIN harvest_yields hy ON hy.crop_id = c.crop_id
            WHERE c.user_id = %s
            ORDER BY c.created_at DESC
        """, (user_id,))
        crops = cursor.fetchall()

        # Gắn care_logs và supplies vào từng crop
        for crop in crops:
            crop_id = crop["crop_id"]

            cursor.execute(
                "SELECT * FROM care_logs WHERE crop_id = %s ORDER BY date DESC",
                (crop_id,)
            )
            crop["careLog"] = cursor.fetchall()

            cursor.execute(
                "SELECT * FROM supplies WHERE crop_id = %s ORDER BY date DESC",
                (crop_id,)
            )
            crop["supplies"] = cursor.fetchall()

            # Gom yield thành object lồng (hoặc None)
            if crop["yield_quantity"] is not None:
                crop["yield"] = {
                    "quantity": crop["yield_quantity"],
                    "unit":     crop["yield_unit"],
                    "quality":  crop["yield_quality"],
                    "notes":    crop["yield_notes"],
                }
            else:
                crop["yield"] = None

            # Xóa các key phẳng của yield
            for k in ("yield_quantity", "yield_unit", "yield_quality", "yield_notes"):
                crop.pop(k, None)

        return crops
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(conn, cursor)


@router.post("/crops")
def create_crop(body: CropCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO crops
                (user_id, device_id, crop_name, variety, plant_date,
                 expected_harvest_date, area, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'growing')
        """, (
            body.user_id, body.device_id, body.crop_name, body.variety,
            body.plant_date, body.expected_harvest_date, body.area,
        ))
        conn.commit()
        crop_id = cursor.lastrowid
        cursor.execute("SELECT * FROM crops WHERE crop_id = %s", (crop_id,))
        return cursor.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(conn, cursor)


@router.put("/crops/{crop_id}")
def update_crop(crop_id: int, body: CropUpdate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        fields = {k: v for k, v in body.dict().items() if v is not None}
        if not fields:
            raise HTTPException(status_code=400, detail="Không có trường nào để cập nhật")

        set_clause = ", ".join(f"{k} = %s" for k in fields)
        cursor.execute(
            f"UPDATE crops SET {set_clause} WHERE crop_id = %s",
            (*fields.values(), crop_id)
        )
        conn.commit()
        cursor.execute("SELECT * FROM crops WHERE crop_id = %s", (crop_id,))
        return cursor.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(conn, cursor)


@router.delete("/crops/{crop_id}")
def delete_crop(crop_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM crops WHERE crop_id = %s", (crop_id,))
        conn.commit()
        return {"message": "Đã xóa mùa vụ"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(conn, cursor)

# ── Care Logs (Nhật ký chăm sóc) ────────────────────────────────────────────

@router.post("/crops/{crop_id}/care-logs")
def add_care_log(crop_id: int, body: CareLogCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO care_logs (crop_id, date, activity, notes) VALUES (%s, %s, %s, %s)",
            (crop_id, body.date, body.activity, body.notes)
        )
        conn.commit()
        cursor.execute("SELECT * FROM care_logs WHERE id = %s", (cursor.lastrowid,))
        return cursor.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(conn, cursor)

# ── Supplies (Vật tư) ────────────────────────────────────────────────────────

@router.post("/crops/{crop_id}/supplies")
def add_supply(crop_id: int, body: SupplyCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO supplies (crop_id, name, quantity, unit, date) VALUES (%s, %s, %s, %s, %s)",
            (crop_id, body.name, body.quantity, body.unit, body.date)
        )
        conn.commit()
        cursor.execute("SELECT * FROM supplies WHERE id = %s", (cursor.lastrowid,))
        return cursor.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(conn, cursor)


@router.delete("/crops/{crop_id}/supplies/{supply_id}")
def delete_supply(crop_id: int, supply_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM supplies WHERE id = %s AND crop_id = %s",
            (supply_id, crop_id)
        )
        conn.commit()
        return {"message": "Đã xóa vật tư"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(conn, cursor)

# ── Harvest Yield (Sản lượng) ────────────────────────────────────────────────

@router.post("/crops/{crop_id}/yield")
def add_yield(crop_id: int, body: YieldCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO harvest_yields (crop_id, quantity, unit, quality, notes)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                quantity = VALUES(quantity),
                unit     = VALUES(unit),
                quality  = VALUES(quality),
                notes    = VALUES(notes)
        """, (crop_id, body.quantity, body.unit, body.quality, body.notes))

        # Cập nhật status crop → harvested
        cursor.execute(
            "UPDATE crops SET status = 'harvested' WHERE crop_id = %s",
            (crop_id,)
        )
        conn.commit()
        return {"message": "Đã lưu sản lượng"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(conn, cursor)