#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#include "global.h"
#include "light_soil_monitor.h"
#include "temp_humi_monitor.h"

const char *mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char *MQTT_TOPIC_PUB = "yolofarm/sensors";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

void safe_print(String text)
{
    if (xSerialMutex != NULL)
    {
        if (xSemaphoreTake(xSerialMutex, portMAX_DELAY) == pdTRUE)
        {
            Serial.print(text);
            Serial.flush();
            xSemaphoreGive(xSerialMutex);
        }
    }
}

void safe_println(String text)
{
    if (xSerialMutex != NULL)
    {
        if (xSemaphoreTake(xSerialMutex, portMAX_DELAY) == pdTRUE)
        {
            Serial.println(text);
            Serial.flush();
            xSemaphoreGive(xSerialMutex);
        }
    }
}

void mqtt_callback(char *topic, byte *payload, unsigned int length)
{
    String message;
    for (int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }

    safe_print("\n[MQTT_RX] RECEIVED MESSAGE ON TOPIC: ");
    safe_println(message);

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, message);

    if (!error)
    {
        String target_device = doc["device_id"].as<String>();
        String command = doc["command"].as<String>();
        String value = doc["value"].as<String>();

        if (target_device == "PUMP-001")
        {
            if (command == "turn_on" && value == "on")
            {
                glob_pump_state = true;               // Cập nhật trạng thái để gửi lại Server
                digitalWrite(PUMP_CONTROL_PIN, HIGH); // Kích điện ra chân GPIO
            }
            else if (command == "turn_off" && value == "off")
            {
                glob_pump_state = false;             // Cập nhật trạng thái
                digitalWrite(PUMP_CONTROL_PIN, LOW); // Cắt điện chân GPIO
            }
            last_server_cmd_time = millis();
        }
        if (target_device == "LAMP-001")
        {
            if (command == "turn_on" && value == "on")
            {
                glob_lamp_state = true;
                digitalWrite(LIGHT_RELAY_PIN, HIGH);
            }
            else if (command == "turn_off" && value == "off")
            {
                glob_lamp_state = false;
                digitalWrite(LIGHT_RELAY_PIN, LOW);
            }
            last_server_cmd_time = millis();
        }
    }
}

void setup_wifi()
{
    safe_println("");
    safe_print("[WiFi] CONNECTING TO: " + wifi_ssid + "\n");

    WiFi.mode(WIFI_STA);
    WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());

    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20)
    {
        vTaskDelay(pdMS_TO_TICKS(500));
        safe_print(".");
        retry++;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        safe_print("\n[WiFi] CONNECTED SUCCESSFULLY.  IP: ");
        safe_println(WiFi.localIP().toString());
    }
    else
    {
        safe_println("\n[WiFi] FAILED. CHECK THE NETWORK CONNECTION.");
    }
}

void reconnect_mqtt()
{
    while (!mqttClient.connected() && WiFi.status() == WL_CONNECTED)
    {
        safe_print("[MQTT] TRYING TO CONNECT TO BROKER\n");

        String clientId = "YoloFarm-GW-";
        clientId += String(random(0, 0xffff), HEX);

        if (mqttClient.connect(clientId.c_str()))
        {
            safe_println("[MQTT] SUCCESS");
            mqttClient.subscribe("yolofarm/devices/+/command");
        }
        else
        {
            safe_print("[MQTT] FAIL, ERROR CODE= " + String(mqttClient.state()) + ". Try again in 5s\n");
            vTaskDelay(pdMS_TO_TICKS(5000));
        }
    }
}

void data_logger_task(void *pvParameters)
{
    setup_wifi();
    mqttClient.setServer(mqtt_server, mqtt_port);
    mqttClient.setCallback(mqtt_callback);
    JsonMessage receivedMsg;
    safe_println("[System] Data Logger & Network Task Started.");

    while (1)
    {
        if (WiFi.status() != WL_CONNECTED)
        {
            setup_wifi();
        }
        else if (!mqttClient.connected())
        {
            reconnect_mqtt();
        }

        mqttClient.loop();

        if (mqttClient.connected())
        {
            if (xQueueReceive(xJsonQueue, &receivedMsg, pdMS_TO_TICKS(1000)) == pdTRUE)
            {
                safe_print("[MQTT_TX] SEND DATA TO SERVER: ");
                safe_println(String(receivedMsg.payload));
                mqttClient.publish(MQTT_TOPIC_PUB, receivedMsg.payload);
            }
        }
        else
        {
            vTaskDelay(pdMS_TO_TICKS(1000));
        }
    }
}