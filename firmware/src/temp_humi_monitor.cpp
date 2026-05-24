#include "temp_humi_monitor.h"
#include "global.h"
#include <ArduinoJson.h>

DHT20 dht20;

void temp_humi_monitor(void *pvParameters)
{
    if (xI2CMutex != NULL)
    {
        xSemaphoreTake(xI2CMutex, portMAX_DELAY);
        dht20.begin();
        Wire.begin(11, 12);
        xSemaphoreGive(xI2CMutex);
    }

    pinMode(LIGHT_RELAY_PIN, OUTPUT);
    digitalWrite(LIGHT_RELAY_PIN, LOW);

    pinMode(FAN_CONTROL_PIN, OUTPUT);
    digitalWrite(FAN_CONTROL_PIN, LOW);
    const TickType_t xFrequency = pdMS_TO_TICKS(200);
    TickType_t xLastWakeTime = xTaskGetTickCount();

    while (1)
    {
        float temperature = -1.0f;
        float humidity = -1.0f;

        if (xI2CMutex != NULL)
        {
            if (xSemaphoreTake(xI2CMutex, pdMS_TO_TICKS(100)) == pdTRUE)
            {
                dht20.read();
                temperature = dht20.getTemperature();
                humidity = dht20.getHumidity();
                xSemaphoreGive(xI2CMutex);
            }
        }

        bool sensorError = (temperature == -1.0f || humidity == -1.0f);
        if (sensorError)
        {
            temperature = -1.0f;
            humidity = -1.0f;
        }

        glob_temperature = temperature;
        glob_humidity = humidity;
        String currentmode = "auto";
        
        if (millis() - last_server_cmd_time >= OVERRIDE_TIMEOUT)
        {
            if (temperature >= 35.0f && !sensorError)
            {
                glob_lamp_state = true;
                digitalWrite(LIGHT_RELAY_PIN, HIGH);
            }
            else
            {
                glob_lamp_state = false;
                digitalWrite(LIGHT_RELAY_PIN, LOW);
            }
            
        }
        else
        {
            currentmode = "manual";
        }

        JsonDocument sensorDoc;
        sensorDoc["device_id"] = "SENSOR-001";
        sensorDoc["location"] = "Vườn mẫu";
        sensorDoc["crop_id"] = 1;
        sensorDoc["temperature"] = temperature;
        sensorDoc["humidity"] = humidity;
        String sensorPayload;
        serializeJson(sensorDoc, sensorPayload);

        // JsonDocument deviceDoc;
        // deviceDoc["device_id"] = "LAMP-001";
        // deviceDoc["name"] = "den chieu sang khu a";
        // deviceDoc["type"] = "light";
        // deviceDoc["connection_status"] = "online";
        // deviceDoc["connection_type"] = "gpio_relay";
        // deviceDoc["is_on"] = glob_lamp_state;
        // deviceDoc["mode"] = currentmode;
        // String devicePayload;
        // serializeJson(deviceDoc, devicePayload);

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

                // JsonMessage msg2;
                // strncpy(msg2.topic, "yolofarm/devices/status", sizeof(msg2.topic) - 1);
                // msg2.topic[sizeof(msg2.topic) - 1] = '\0';
                // strncpy(msg2.payload, devicePayload.c_str(), sizeof(msg2.payload) - 1);
                // msg2.payload[sizeof(msg2.payload) - 1] = '\0';
                // xQueueSend(xJsonQueue, &msg2, pdMS_TO_TICKS(100));

                xSemaphoreGive(xJsonQueueMutex);
            }
        }

        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}