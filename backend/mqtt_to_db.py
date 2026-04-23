import paho.mqtt.client as mqtt
import json
import sqlite3
import datetime

BROKER_IP = "192.168.1.202"
TOPIC = "yolofarm/telemetry"

def init_db():
    conn = sqlite3.connect('yolofarm_data.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS farm_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time DATETIME DEFAULT CURRENT_TIMESTAMP,
            device_id TEXT,
            temp REAL,
            humi REAL,
            light REAL,
            soil REAL
        )
    ''')
    conn.commit()
    conn.close()

def save_to_sqlite(device_id, temp, humi, light, soil):
    conn = sqlite3.connect('yolofarm_data.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO farm_logs (device_id, temp, humi, light, soil)
        VALUES (?, ?, ?, ?, ?)
    ''', (device_id, temp, humi, light, soil))
    conn.commit()
    conn.close()

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print("OK:", payload)

        if "values" in payload:
            vals = payload["values"]
            temp = vals.get("temperature")
            humi = vals.get("humidity")
            light = vals.get("light_intensity")
            soil = vals.get("soil_moisture")

            save_to_sqlite(payload["device_id"], temp, humi, light, soil)

    except Exception as e:
        print("JSON ERROR:", msg.payload.decode())

def main():
    init_db()
    client = mqtt.Client(client_id="Backend_Server_01")
    client.on_message = on_message
    client.connect(BROKER_IP, 1883, 60)
    client.subscribe(TOPIC)
    client.loop_forever()

if __name__ == "__main__":
    main()