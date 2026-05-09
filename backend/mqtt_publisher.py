import paho.mqtt.client as mqtt
import json
import time
from core.config import settings

# Cấu hình MQTT
MQTT_BROKER = settings.MQTT_BROKER
MQTT_PORT = settings.MQTT_PORT

class MQTTPublisher:
    """Class để publish lệnh điều khiển tới MQTT Broker"""
    
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        self.connected = False
    
    def connect(self):
        """Kết nối tới MQTT Broker"""
        try:
            self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.client.loop_start()
            time.sleep(1)  # Đợi kết nối
            self.connected = True
            print(f"✓ Đã kết nối MQTT Publisher tới {MQTT_BROKER}:{MQTT_PORT}")
            return True
        except Exception as e:
            print(f"✗ Lỗi kết nối MQTT: {e}")
            self.connected = False
            return False
    
    def publish_device_command(self, device_id: str, command: str, payload: dict) -> bool:
        """
        Gửi lệnh điều khiển tới thiết bị
        
        Topic: yolofarm/devices/{device_id}/command
        
        Payload ví dụ:
        {
            "command": "turn_on",  // turn_on, turn_off, set_mode
            "value": "on",         // on, off, auto, manual
            "timestamp": "2024-01-01T10:30:00"
        }
        """
        try:
            topic = f"yolofarm/devices/{device_id}/command"
            message = {
                "device_id": device_id,
                "command": command,
                **payload
            }
            
            result = self.client.publish(
                topic,
                json.dumps(message),
                qos=1,
                retain=False
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"✓ Gửi lệnh thành công: {topic} -> {command}")
                return True
            else:
                print(f"✗ Lỗi gửi lệnh: {result.rc}")
                return False
        
        except Exception as e:
            print(f"✗ Exception trong publish: {e}")
            return False
    
    def turn_on_device(self, device_id: str) -> bool:
        """Bật thiết bị"""
        return self.publish_device_command(
            device_id, 
            "turn_on",
            {"value": "on"}
        )
    
    def turn_off_device(self, device_id: str) -> bool:
        """Tắt thiết bị"""
        return self.publish_device_command(
            device_id,
            "turn_off", 
            {"value": "off"}
        )
    
    def set_device_mode(self, device_id: str, mode: str) -> bool:
        """Đặt chế độ device (auto/manual)"""
        if mode not in ["auto", "manual"]:
            print(f"✗ Chế độ không hợp lệ: {mode}")
            return False
        
        return self.publish_device_command(
            device_id,
            "set_mode",
            {"value": mode}
        )
    
    def disconnect(self):
        """Ngắt kết nối"""
        if self.connected:
            self.client.loop_stop()
            self.client.disconnect()
            print("✓ Đã ngắt kết nối MQTT Publisher")

# Tạo instance global để sử dụng trong API
mqtt_publisher = MQTTPublisher()
mqtt_publisher.connect()
