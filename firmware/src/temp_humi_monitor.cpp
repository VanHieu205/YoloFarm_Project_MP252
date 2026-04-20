#include "temp_humi_monitor.h"
#include "global.h"
#include <ArduinoJson.h>

DHT20 dht20;

void temp_humi_monitor(void *pvParameters) {
    dht20.begin();
    Wire.begin(11, 12); 
    pinMode(LIGHT_RELAY_PIN, OUTPUT);
    digitalWrite(LIGHT_RELAY_PIN, LOW); 

    Serial.println("[System] Temp & Humi Monitor Task Started.");
    
    const TickType_t xFrequency = pdMS_TO_TICKS(5000);
    TickType_t xLastWakeTime = xTaskGetTickCount();

    while (1) {
        dht20.read();
        float temperature = dht20.getTemperature();
        float humidity    = dht20.getHumidity();

        bool sensorError = (temperature == -1.0f || humidity == -1.0f);
        if (sensorError) {
            temperature = -1.0f;
            humidity    = -1.0f;
        }

        glob_temperature = temperature;
        glob_humidity    = humidity;

        if (temperature >= 35.0f && !sensorError) {
            glob_lamp_state = true;
            digitalWrite(LIGHT_RELAY_PIN, HIGH);
        } else {
            glob_lamp_state = false;
            digitalWrite(LIGHT_RELAY_PIN, LOW);
        }

        JsonDocument sensorDoc;
        sensorDoc["device_id"] = "GW-001";
        sensorDoc["location"] = "Zone 1";

        JsonObject values = sensorDoc["values"].to<JsonObject>();
        values["temperature"] = temperature;
        values["humidity"] = humidity;

        String sensorPayload;
        serializeJson(sensorDoc, sensorPayload);
        Serial.print("[SENSOR_DATA] ");
        Serial.println(sensorPayload);

        JsonDocument deviceDoc;
        deviceDoc["device_id"] = "LAMP-001";
        deviceDoc["name"] = "den chieu sang khu a";
        deviceDoc["type"] = "light";
        deviceDoc["connection_status"] = "online";
        deviceDoc["connection_type"] = "gpio_relay";
        deviceDoc["parent_id"] = "GW-001";
        deviceDoc["is_on"] = glob_lamp_state;
        deviceDoc["mode"] = "auto";

        String devicePayload;
        serializeJson(deviceDoc, devicePayload);
        Serial.print("[DEVICE_STATUS] ");
        Serial.println(devicePayload);
        
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}