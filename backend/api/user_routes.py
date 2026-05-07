from fastapi import APIRouter, HTTPException, Body
from core.database import get_connection, close_connection
from core.config import settings
import hashlib
import uuid
from datetime import datetime
import json

router = APIRouter()

def hash_password(password: str) -> str:
    """Hash password bằng SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Tạo token đơn giản (trong thực tế nên dùng JWT)"""
    return str(uuid.uuid4())

# =============================================
# USER LOGIN
# =============================================
@router.post("/login")
def login(email: str = Body(...), password: str = Body(...)):
    """
    Đăng nhập bằng email và password
    
    Response:
    {
        "success": true/false,
        "message": "...",
        "token": "...",
        "user": {...}
    }
    """
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
    
    try:
        # Kiểm tra email có tồn tại không
        query = "SELECT user_id, username, email, password_hash, role, full_name FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Email không tồn tại")
        
        # Kiểm tra password
        password_hash = password
        if user['password_hash'] != password_hash:
            raise HTTPException(status_code=401, detail="Mật khẩu không chính xác")
        
        # Tạo token và update last_login
        token = generate_token()
        update_query = "UPDATE users SET last_login = NOW() WHERE user_id = %s"
        cursor.execute(update_query, (user['user_id'],))
        connect.commit()
        
        return {
            "success": True,
            "message": "Đăng nhập thành công",
            "token": token,
            "user": {
                "user_id": user['user_id'],
                "username": user['username'],
                "email": user['email'],
                "full_name": user['full_name'],
                "role": user['role']
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)


# =============================================
# USER REGISTER
# =============================================
@router.post("/register")
def register(
    username: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    full_name: str = Body(...)
):
    """
    Đăng ký tài khoản mới
    
    Body:
    {
        "username": "...",
        "email": "...",
        "password": "...",
        "full_name": "..."
    }
    """
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
    
    try:
        # Kiểm tra username đã tồn tại chưa
        query = "SELECT user_id FROM users WHERE username = %s OR email = %s"
        cursor.execute(query, (username, email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username hoặc email đã tồn tại")
        
        # Tạo user mới
        user_id = str(uuid.uuid4())
        password_hash = hash_password(password)
        
        insert_query = """
        INSERT INTO users (user_id, username, email, password_hash, full_name, role)
        VALUES (%s, %s, %s, %s, %s, 'farmer')
        """
        cursor.execute(insert_query, (user_id, username, email, password_hash, full_name))
        connect.commit()
        
        # Tạo token đăng nhập luôn
        token = generate_token()
        
        return {
            "success": True,
            "message": "Đăng ký thành công",
            "token": token,
            "user": {
                "user_id": user_id,
                "username": username,
                "email": email,
                "full_name": full_name,
                "role": "farmer"
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)


# =============================================
# GET USER PROFILE
# =============================================
@router.get("/profile/{user_id}")
def get_profile(user_id: str):
    """Lấy thông tin user"""
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
    
    try:
        query = """
        SELECT user_id, username, email, full_name, phone, role, created_at, last_login
        FROM users WHERE user_id = %s
        """
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy user")
        
        return user
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)


# =============================================
# UPDATE USER PROFILE
# =============================================
@router.put("/profile/{user_id}")
def update_profile(user_id: str, full_name: str = Body(...), phone: str = Body(...)):
    """Cập nhật thông tin user"""
    connect = get_connection()
    cursor = connect.cursor()
    
    try:
        query = "UPDATE users SET full_name = %s, phone = %s WHERE user_id = %s"
        cursor.execute(query, (full_name, phone, user_id))
        connect.commit()
        
        return {
            "success": True,
            "message": "Cập nhật thông tin thành công"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)


# =============================================
# GET ALL USERS (Admin)
# =============================================
@router.get("/all")
def get_all_users(limit: int = 100, offset: int = 0):
    """Lấy danh sách tất cả user (mặc định 100 bản ghi)"""
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
    
    try:
        query = """
        SELECT user_id, username, email, full_name, role, created_at
        FROM users LIMIT %s OFFSET %s
        """
        cursor.execute(query, (limit, offset))
        users = cursor.fetchall()
        
        return {
            "total": len(users),
            "users": users
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)
