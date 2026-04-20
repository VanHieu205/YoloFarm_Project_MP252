#include "light_soil_monitor.h"
#include "global.h"
#include <ArduinoJson.h>

void light_soil_monitor(void *pvParameters) {
    pinMode(LDR_PIN, INPUT);
    pinMode(SOIL_MOISTURE_PIN, INPUT);
    pinMode(PUMP_CONTROL_PIN, OUTPUT);
    digitalWrite(PUMP_CONTROL_PIN, LOW);

    Serial.println("[System] Light & Soil Monitor Task Started.");

    const TickType_t xFrequency = pdMS_TO_TICKS(5000);
    TickType_t xLastWakeTime = xTaskGetTickCount();

    while (1) {
        int raw_light = analogRead(LDR_PIN);
        glob_light = (float)raw_light; 

        int raw_soil = analogRead(SOIL_MOISTURE_PIN);
        float soil_pct = map(raw_soil, 4095, 0, 0, 100);
        glob_soil_moisture = constrain(soil_pct, 0.0f, 100.0f);

        if (glob_soil_moisture < 40.0f) {
            glob_pump_state = true;
            digitalWrite(PUMP_CONTROL_PIN, HIGH);
        } else if (glob_soil_moisture > 70.0f) {
            glob_pump_state = false;
            digitalWrite(PUMP_CONTROL_PIN, LOW);
        }

        JsonDocument sensorDoc; 
        sensorDoc["device_id"] = "GW-001";
        sensorDoc["location"] = "Zone 1";

        JsonObject values = sensorDoc["values"].to<JsonObject>();
        values["light_intensity"] = glob_light;
        values["soil_moisture"] = glob_soil_moisture;

        String sensorPayload;
        serializeJson(sensorDoc, sensorPayload);
        Serial.print("[SENSOR_DATA] ");
        Serial.println(sensorPayload);

        JsonDocument deviceDoc;
        deviceDoc["device_id"] = "PUMP-001";
        deviceDoc["name"] = "may bom khu a";
        deviceDoc["type"] = "pump";
        deviceDoc["connection_status"] = "online";
        deviceDoc["connection_type"] = "gpio_relay";
        deviceDoc["parent_id"] = "GW-001";
        deviceDoc["is_on"] = glob_pump_state;
        deviceDoc["mode"] = "auto";

        String devicePayload;
        serializeJson(deviceDoc, devicePayload);
        Serial.print("[DEVICE_STATUS] ");
        Serial.println(devicePayload);
       
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}