import paho.mqtt.client as mqtt
import json
import datetime

BROKER_IP = "192.168.100.92"

TOPIC = "yolofarm/telemetry"

def on_message(client, userdata, msg):
    try:
        payload_str = msg.payload.decode('utf-8')
        data = json.loads(payload_str)
        
        print(f"[{datetime.datetime.now()}] Nhận data từ {data.get('device_id')}")
        
        if "values" in data:
            print("Nhiet do:", data["values"].get("temperature", "N/A"))
            
    except Exception as e:
        print("Loi boc tach JSON:", e)

client = mqtt.Client(client_id="Backend_Server_01", protocol=mqtt.MQTTv5)
client.on_message = on_message
client.connect(BROKER_IP, 1883, 60)

client.subscribe(TOPIC)
print("Backend dang cho du lieu tu ESP32S3")
client.loop_forever()