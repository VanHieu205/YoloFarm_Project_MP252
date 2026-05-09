#include "light_soil_monitor.h"
#include "global.h"
#include <ArduinoJson.h>

void light_soil_monitor(void *pvParameters)
{
    pinMode(LDR_PIN, INPUT);
    pinMode(SOIL_MOISTURE_PIN, INPUT);
    pinMode(PUMP_CONTROL_PIN, OUTPUT);
    pinMode(FAN_CONTROL_PIN, OUTPUT);
    digitalWrite(PUMP_CONTROL_PIN, LOW);

    const TickType_t xFrequency = pdMS_TO_TICKS(5000);
    vTaskDelay(pdMS_TO_TICKS(1000));
    TickType_t xLastWakeTime = xTaskGetTickCount();

    while (1)
    {
        int raw_light = analogRead(LDR_PIN);
        glob_light = (float)raw_light;

        int raw_soil = analogRead(SOIL_MOISTURE_PIN);
        float soil_pct = map(raw_soil, 4095, 0, 0, 100);
        glob_soil_moisture = constrain(soil_pct, 0.0f, 100.0f);
        String currentmode = "auto";
        
        if (millis() - last_server_cmd_time >= OVERRIDE_TIMEOUT)
        {
            if (glob_soil_moisture < 40.0f)
            {
                glob_pump_state = true;
                digitalWrite(PUMP_CONTROL_PIN, HIGH);
            }
            else if (glob_soil_moisture > 70.0f)
            {
                glob_pump_state = false;
                digitalWrite(PUMP_CONTROL_PIN, LOW);
            }
        }
        else
        {
            currentmode = "manual";
        }

        JsonDocument sensorDoc;
        sensorDoc["device_id"] = "SENSOR-002";
        sensorDoc["location"] = "Vườn mẫu";
        sensorDoc["crop_id"] = 1;
        sensorDoc["light_intensity"] = glob_light;
        sensorDoc["soil_moisture"] = glob_soil_moisture;
        String sensorPayload;
        serializeJson(sensorDoc, sensorPayload);


        JsonDocument deviceDoc;
        deviceDoc["device_id"] = "PUMP-001";
        deviceDoc["name"] = "may bom 1";
        deviceDoc["type"] = "pump";
        deviceDoc["connection_status"] = "online";
        deviceDoc["connection_type"] = "gpio_relay";
        deviceDoc["is_on"] = glob_pump_state;
        deviceDoc["mode"] = currentmode;
        String devicePayload;
        serializeJson(deviceDoc, devicePayload);

        if (xJsonQueue != NULL && xJsonQueueMutex != NULL)
        {
            if (xSemaphoreTake(xJsonQueueMutex, pdMS_TO_TICKS(200)) == pdTRUE)
            {
                JsonMessage msg1;
                strncpy(msg1.topic, "yolofarm/sensors", sizeof(msg1.topic) - 1);
                msg1.topic[sizeof(msg1.topic) - 1] = '\0';
                strncpy(msg1.payload, sensorPayload.c_str(), sizeof(msg1.payload) - 1);
                msg1.payload[sizeof(msg1.payload) - 1] = '\0';
                xQueueSend(xJsonQueue, &msg1, pdMS_TO_TICKS(100));

                JsonMessage msg2;
                strncpy(msg2.topic, "yolofarm/devices/status", sizeof(msg2.topic) - 1);
                msg2.topic[sizeof(msg2.topic) - 1] = '\0';
                strncpy(msg2.payload, devicePayload.c_str(), sizeof(msg2.payload) - 1);
                msg2.payload[sizeof(msg2.payload) - 1] = '\0';
                xQueueSend(xJsonQueue, &msg2, pdMS_TO_TICKS(100));

                xSemaphoreGive(xJsonQueueMutex);
            }
        }

        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}