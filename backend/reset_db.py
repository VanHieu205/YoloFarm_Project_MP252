import mysql.connector
from mysql.connector import Error

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "123456"
}

try:
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor()
    
    print("🗑️  Xóa database cũ...")
    cursor.execute("DROP DATABASE IF EXISTS yolofarm;")
    connection.commit()
    print("✓ Đã xóa database yolofarm")
    
    cursor.close()
    connection.close()
    
except Error as e:
    print(f"✗ Lỗi: {e}")
