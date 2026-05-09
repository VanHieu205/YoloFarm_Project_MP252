import paho.mqtt.client as mqtt
import json
import datetime
from core.config import settings

BROKER_IP =  "broker.hivemq.com"

TOPIC = "yolofarm/telemetry"

def on_message(client, userdata, msg):
    try:
        payload_str = msg.payload.decode('utf-8')
        data = json.loads(payload_str)
        
        print(f"\n[{datetime.datetime.now()}] Nhận data từ thiết bị: {data.get('device_id', 'UNKNOWN')}")
        
        device_id = data.get("device_id", "DEV-003")
        values = data.get("values", {})
        
        temp = values.get("temperature", None)
        humid = values.get("humidity", None)
        soil = values.get("soil_moisture", None)
        
        print(f" -> Thông số: Nhiệt độ: {temp}°C | Độ ẩm: {humid}% | Ẩm đất: {soil}")

        reading_id = f"READ-{uuid.uuid4().hex[:8].upper()}"
        
        connect = get_connection()
        if connect:
            cursor = connect.cursor()
            try:
                sql = """INSERT INTO sensor_readings 
                         (reading_id, device_id, temperature, humidity, soil_moisture) 
                         VALUES (%s, %s, %s, %s, %s)"""
                         
                cursor.execute(sql, (reading_id, device_id, temp, humid, soil))
                connect.commit()
                print(f"Đã ghi vào Database với ID: {reading_id}")
                
            except Exception as db_err:
                print("[LỖI DATABASE]:", db_err)
            finally:
                close_connection(connect, cursor)
                
    except Exception as e:
        print("[LỖI XỬ LÝ CHUNG]:", e)


client = mqtt.Client(client_id="Backend_Listener_01", protocol=mqtt.MQTTv5)
client.on_message = on_message

print(f"Đang kết nối tới Broker: {settings.MQTT_BROKER}")
client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, settings.MQTT_KEEPALIVE)

client.subscribe(TOPIC)
client.loop_forever()