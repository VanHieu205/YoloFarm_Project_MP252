import paho.mqtt.client as mqtt
import json
import time
import uuid
from core.database import get_connection, close_connection
from core.config import settings

# Cấu hình MQTT lấy từ file config
MQTT_BROKER = settings.MQTT_BROKER
MQTT_PORT = settings.MQTT_PORT
MQTT_TOPIC = "yolofarm/sensors"

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("Đã kết nối đến MQTT Broker!")
        client.subscribe(MQTT_TOPIC)
        print(f"Đang lắng nghe trên topic: {MQTT_TOPIC}")
    else:
        print(f"Kết nối thất bại, mã lỗi: {rc}")

def on_message(client, userdata, msg):
    connect = None
    cursor = None
    try:
        # 1. Giải mã tin nhắn JSON nhận được
        payload = json.loads(msg.payload.decode())
        print(f"Nhận được dữ liệu mới: {payload}")

        # 2. Mở kết nối tới MySQL thông qua Connection Pool
        connect = get_connection()
        cursor = connect.cursor()
        reading_id = f"READ-{uuid.uuid4().hex[:8].upper()}"
        # 3. Chuẩn bị câu lệnh SQL (Dùng device_id từ payload hoặc mặc định là 1)
        query = """
            INSERT INTO sensor_readings
            (reading_id, device_id, temperature, humidity, soil_moisture, light_intensity, co2, location, crop_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            reading_id,
            payload.get("device_id", 1),
            payload.get("temperature"),
            payload.get("humidity"),
            payload.get("soil_moisture"),
            payload.get("light_intensity"),
            payload.get("co2"),
            payload.get("location", "Vườn mẫu"),
            payload.get("crop_id",1) # crop_id
        )

        # 4. Thực thi và lưu vào DB
        cursor.execute(query, values)
        connect.commit()
        print("Đã lưu dữ liệu vào MySQL thành công.")
    
    except Exception as e:
        print(f"Lỗi xử lý tin nhắn: {e}")
    
    finally:
        if connect:
            close_connection(connect, cursor)

# Khởi tạo MQTT Client
client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

print(f"Đang kết nối tới Broker {MQTT_BROKER}")
try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()
except Exception as e:
    print(f"Không thể kết nối MQTT: {e}")