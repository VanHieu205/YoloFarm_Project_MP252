#include "temp_humi_monitor.h"
#include "global.h"
#include <ArduinoJson.h>

DHT20 dht20;

void temp_humi_monitor(void *pvParameters) {
    if (xI2CMutex != NULL) {
        xSemaphoreTake(xI2CMutex, portMAX_DELAY);
        dht20.begin();
        Wire.begin(11, 12); 
        xSemaphoreGive(xI2CMutex);
    }

    pinMode(LIGHT_RELAY_PIN, OUTPUT);
    digitalWrite(LIGHT_RELAY_PIN, LOW); 

    // if (xSerialMutex != NULL) {
    //     if (xSemaphoreTake(xSerialMutex, portMAX_DELAY) == pdTRUE) {
    //         Serial.println("[System] Temp & Humi Monitor Task Started.");
    //         Serial.flush();
    //         xSemaphoreGive(xSerialMutex);
    //     }
    // }
    
    const TickType_t xFrequency = pdMS_TO_TICKS(5000);
    TickType_t xLastWakeTime = xTaskGetTickCount();

    while (1) {
        float temperature = -1.0f;
        float humidity    = -1.0f;

        if (xI2CMutex != NULL) {
            if (xSemaphoreTake(xI2CMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
                dht20.read();
                temperature = dht20.getTemperature();
                humidity    = dht20.getHumidity();
                xSemaphoreGive(xI2CMutex);
            }
        }

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
        
        String logSensor = "[SENSOR_DATA] " + sensorPayload;

        // if (xSerialMutex != NULL) {
        //     if (xSemaphoreTake(xSerialMutex, portMAX_DELAY) == pdTRUE) {
        //         Serial.println(logSensor);
        //         Serial.flush();
        //         xSemaphoreGive(xSerialMutex);
        //     }
        // }

        if (xJsonQueue != NULL) {
            JsonMessage msg1;
            strncpy(msg1.payload, sensorPayload.c_str(), sizeof(msg1.payload) - 1);
            msg1.payload[sizeof(msg1.payload) - 1] = '\0';
            xQueueSend(xJsonQueue, &msg1, 0); 
        }

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
        
        String logDevice = "[DEVICE_STATUS] " + devicePayload;

        // if (xSerialMutex != NULL) {
        //     if (xSemaphoreTake(xSerialMutex, portMAX_DELAY) == pdTRUE) {
        //         Serial.println(logDevice);
        //         Serial.flush();
        //         xSemaphoreGive(xSerialMutex);
        //     }
        // }

        if (xJsonQueue != NULL) {
            JsonMessage msg2;
            strncpy(msg2.payload, devicePayload.c_str(), sizeof(msg2.payload) - 1);
            msg2.payload[sizeof(msg2.payload) - 1] = '\0';
            xQueueSend(xJsonQueue, &msg2, 0); 
        }
        
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}