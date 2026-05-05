#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "global.h"
#include <ArduinoJson.h>
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

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    
    safe_print("\n[MQTT_RX] Co lenh tu Server: ");
    safe_println(message);

    JsonDocument doc; 
    DeserializationError error = deserializeJson(doc, message);
    
    if (!error) {
        String target_device = doc["device_id"].as<String>();
        bool is_on = doc["is_on"].as<bool>(); 

        if (target_device == "PUMP-001") {
            if (is_on) {
                
                safe_println("TURN ON pump");
            } else {
                
                safe_println("TURN OFF pump");
            }
            
           
            last_server_cmd_time = millis(); 
        }
        if (target_device == "LAMP-001") {
            if (is_on) {
                
                safe_println("TURN ON lamp");
            } else {
                
                safe_println("TURN OFF lamp");
            }
            
           
            last_server_cmd_time = millis(); 
        }
        
    }
}

void setup_wifi() {
    safe_println("");
    safe_print("[WiFi] CONNECTING TO: " + wifi_ssid + "\n");

    WiFi.mode(WIFI_STA);
    WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());

    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
        vTaskDelay(pdMS_TO_TICKS(500));
        safe_print(".");
        retry++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        safe_print("\n[WiFi] CONNECTED SUCCESSFULLY.  IP: ");
        safe_println(WiFi.localIP().toString());
    } else {
        safe_println("\n[WiFi] FAILED. CHECK THE NETWORK CONNECTION.");
    }
}

void reconnect_mqtt() {
    while (!mqttClient.connected() && WiFi.status() == WL_CONNECTED) {
        safe_print("[MQTT] TRYING TO CONNECT TO BROKER\n");
        
        String clientId = "YoloFarm-GW-";
        clientId += String(random(0, 0xffff), HEX);
        
        if (mqttClient.connect(clientId.c_str())) {
            safe_println("[MQTT] SUCCESS");
            mqttClient.subscribe("yolofarm/command");
        } else {
            safe_print("[MQTT] FAIL, ERROR CODE= " + String(mqttClient.state()) + ". Try again in 5s\n");
            vTaskDelay(pdMS_TO_TICKS(5000));
        }
    }
}

void data_logger_task(void *pvParameters) {
    setup_wifi();
    mqttClient.setServer(mqtt_server, mqtt_port);
    mqttClient.setCallback(mqtt_callback);
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
                safe_print("[MQTT_TX] SEND DATA TO SERVER: ");
                safe_println(String(receivedMsg.payload));
                mqttClient.publish(MQTT_TOPIC_PUB, receivedMsg.payload);
            }
        } else {
            vTaskDelay(pdMS_TO_TICKS(1000));
        }
    }
}