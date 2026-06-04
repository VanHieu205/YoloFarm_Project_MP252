import mysql.connector
from mysql.connector import Error
import re

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "123456"
}

def parse_sql_statements(sql_script):
    """Parse SQL statements từ script, bỏ qua comments"""
    # Loại bỏ comments (-- ...)
    lines = sql_script.split('\n')
    filtered_lines = []
    for line in lines:
        # Bỏ qua dòng comment
        if line.strip().startswith('--'):
            continue
        filtered_lines.append(line)
    
    sql_script = '\n'.join(filtered_lines)
    
    # Split bằng ; và loại bỏ whitespace
    statements = sql_script.split(';')
    result = []
    for statement in statements:
        statement = statement.strip()
        if statement:
            result.append(statement + ';')
    
    return result

def create_database():
    """Tạo database và bảng từ schema.sql"""
    try:
        # Kết nối tới MySQL server
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print("✓ Đã kết nối tới MySQL")
        
        # Đọc file schema.sql
        with open('sql/schema.sql', 'r', encoding='utf-8') as f:
            schema_script = f.read()
        
        # Parse các câu lệnh SQL
        statements = parse_sql_statements(schema_script)
        
        print(f"📝 Tìm thấy {len(statements)} câu lệnh SQL\n")
        
        success_count = 0
        skip_count = 0
        error_count = 0
        
        # Thực thi từng câu lệnh
        for i, statement in enumerate(statements, 1):
            try:
                cursor.execute(statement)
                connection.commit()
                success_count += 1
                # In dòng lệnh vừa chạy (lệnh tạo bảng)
                if "CREATE TABLE" in statement:
                    table_name = statement.split("CREATE TABLE")[1].split("(")[0].strip()
                    print(f"✓ [{i}] Tạo bảng: {table_name}")
                elif "CREATE DATABASE" in statement:
                    print(f"✓ [{i}] Tạo database")
                elif "CREATE INDEX" in statement:
                    print(f"✓ [{i}] Tạo index")
                    
            except Error as e:
                error_msg = str(e).lower()
                if "already exists" in error_msg or "duplicate" in error_msg:
                    skip_count += 1
                else:
                    error_count += 1
                    print(f"✗ [{i}] Lỗi: {e}")
        
        print(f"\n{'='*50}")
        print(f"📊 Kết quả:")
        print(f"  ✓ Thành công: {success_count}")
        print(f"  ⚠ Bỏ qua (đã tồn tại): {skip_count}")
        print(f"  ✗ Lỗi: {error_count}")
        print(f"{'='*50}\n")
        
        # Kiểm tra các bảng được tạo
        cursor.execute("SHOW TABLES FROM yolofarm;")
        tables = cursor.fetchall()
        print(f"✓ Tổng số bảng hiện có: {len(tables)}")
        print(f"\n✓ Danh sách bảng:")
        for idx, table in enumerate(tables, 1):
            print(f"  {idx:2}. {table[0]}")
        
        cursor.close()
        connection.close()
        
    except Error as e:
        print(f"✗ Lỗi kết nối: {e}")
        print("\n💡 Hướng dẫn:")
        print("1. Mở XAMPP Control Panel")
        print("2. Nhấn 'Start' cho MySQL")
        print("3. Chạy lại script này")

if __name__ == "__main__":
    print("🔧 Thiết lập Database YoloFarm...\n")
    create_database()
