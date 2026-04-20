#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "global.h"    

const char* mqtt_server = "192.168.1.100";  
const int mqtt_port = 1883;
const char* MQTT_TOPIC_PUB = "yolofarm/telemetry";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

void setup_wifi() {
    Serial.println();
    Serial.print("[WiFi] Connecting to SSID: ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        vTaskDelay(pdMS_TO_TICKS(500));
        Serial.print(".");
    }

    Serial.println();
    Serial.print("[WiFi] Connected. IP address: ");
    Serial.println(WiFi.localIP());
}

void reconnect_mqtt() {
    while (!mqttClient.connected()) {
        Serial.print("[MQTT] Reconnecting to MQTT Broker: ");
        
        String clientId = "YoloFarm-GW-";
        clientId += String(random(0, 0xffff), HEX);
        
        if (mqttClient.connect(clientId.c_str())) {
            Serial.println("Sucess");
        } else {
            Serial.print("Fail. Error code= ");
            Serial.print(mqttClient.state());
            Serial.println("Retrying in 5 seconds");
            vTaskDelay(pdMS_TO_TICKS(5000));
        }
    }
}

void data_logger_task(void *pvParameters) {
    setup_wifi();
    mqttClient.setServer(mqtt_server, mqtt_port);

    JsonMessage receivedMsg;

    Serial.println("[System] Data Logger & Network Task Started.");

    while (1) {
        if (WiFi.status() != WL_CONNECTED) {
            setup_wifi();
        }
        if (!mqttClient.connected()) {
            reconnect_mqtt();
        }
        
        mqttClient.loop(); 

        if (xQueueReceive(xJsonQueue, &receivedMsg, pdMS_TO_TICKS(1000)) == pdTRUE) {
            Serial.print("[MQTT_TX] Transmitting data to MQTT Broker: ");
            Serial.println(receivedMsg.payload);

            mqttClient.publish(MQTT_TOPIC_PUB, receivedMsg.payload);
        }
    }
}