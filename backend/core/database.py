import mysql.connector
from mysql.connector import pooling
from mysql.connector import Error
from core.config import settings

# Cấu hình kết nối dùng settings của config
db_config = {
    "host": settings.DB_HOST,
    "user": settings.DB_USER,
    "password": settings.DB_PASS,
    "database": settings.DB_NAME
}

try:
    # Tạo một pool kết nối để tối ưu hiệu suất
    connection_pool = pooling.MySQLConnectionPool(
        pool_name = "yolopool",
        pool_size = 5, # Cho phép tối đa 5 kết nối đồng thời
        **db_config
    )
    
    print("Khởi tạo Connection Pool thành công!")
except Error as e:
    print(f"Lỗi khi khởi tạo Pool: {e}")

def get_connection():
    """Lấy một kết nối từ pool"""
    try:
        return connection_pool.get_connection()
    except Error as e:
        print(f"Không thể kết nối: {e}")
        return None
    
def close_connection(connection, cursor = None):
    """Đóng cursor và trả lại kết nối vào Pool"""
    if cursor:
        cursor.close()
    if connection and connection.is_connected():
        connection.close()