#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "global.h"

const char* mqtt_server = "192.168.1.202";
const int mqtt_port = 1883;
const char* MQTT_TOPIC_PUB = "yolofarm/telemetry";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

void safe_print(String text) {
    if (xSerialMutex != NULL) {
        if (xSemaphoreTake(xSerialMutex, portMAX_DELAY) == pdTRUE) {
            Serial.print(text);
            Serial.flush();
            xSemaphoreGive(xSerialMutex);
        }
    }
}

void safe_println(String text) {
    if (xSerialMutex != NULL) {
        if (xSemaphoreTake(xSerialMutex, portMAX_DELAY) == pdTRUE) {
            Serial.println(text);
            Serial.flush();
            xSemaphoreGive(xSerialMutex);
        }
    }
}

void setup_wifi() {
    safe_println("");
    safe_print("[WiFi] Dang ket noi den: " + wifi_ssid + "\n");

    WiFi.mode(WIFI_STA);
    WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());

    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
        vTaskDelay(pdMS_TO_TICKS(500));
        safe_print(".");
        retry++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        safe_print("\n[WiFi] Ket noi THANH CONG! IP: ");
        safe_println(WiFi.localIP().toString());
    } else {
        safe_println("\n[WiFi] THAT BAI! Vui long kiem tra lai mang.");
    }
}

void reconnect_mqtt() {
    while (!mqttClient.connected() && WiFi.status() == WL_CONNECTED) {
        safe_print("[MQTT] Dang thu ket noi den Broker...\n");
        
        String clientId = "YoloFarm-GW-";
        clientId += String(random(0, 0xffff), HEX);
        
        if (mqttClient.connect(clientId.c_str())) {
            safe_println("[MQTT] THANH CONG");
        } else {
            safe_print("[MQTT] THAT BAI, Ma loi = " + String(mqttClient.state()) + ". Thu lai sau 5s\n");
            vTaskDelay(pdMS_TO_TICKS(5000));
        }
    }
}

void data_logger_task(void *pvParameters) {
    setup_wifi();
    mqttClient.setServer(mqtt_server, mqtt_port);

    JsonMessage receivedMsg;
    safe_println("[System] Data Logger & Network Task Started.");

    while (1) {
        if (WiFi.status() != WL_CONNECTED) {
            setup_wifi();
        } 
        else if (!mqttClient.connected()) {
            reconnect_mqtt();
        }
        
        mqttClient.loop(); 

        if (mqttClient.connected()) {
            if (xQueueReceive(xJsonQueue, &receivedMsg, pdMS_TO_TICKS(1000)) == pdTRUE) {
                safe_print("[MQTT_TX] Dang ban len Server: ");
                safe_println(String(receivedMsg.payload));
                mqttClient.publish(MQTT_TOPIC_PUB, receivedMsg.payload);
            }
        } else {
            vTaskDelay(pdMS_TO_TICKS(1000));
        }
    }
}