import os

class Settings:
    PROJECT_NAME: str = "Yolo Farm Smart Agriculture"
    PROJECT_VERSION: str = "1.0.0"

    # Cấu hình Database MySQL (XAMPP)
    DB_HOST: str = "localhost"
    DB_USER: str = "root"
    DB_PASS: str = "123456"
    DB_NAME: str = "yolofarm"

    # Cấu hình MQTT Broker
    MQTT_BROKER: str = "broker.hivemq.com"
    MQTT_PORT: int = 1883
    MQTT_KEEPALIVE: int = 60

settings = Settings()