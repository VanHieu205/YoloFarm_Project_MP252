#ifndef __GLOBAL_H__
#define __GLOBAL_H__

#include <Arduino.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "freertos/queue.h"

typedef struct {
    char payload[256]; 
} JsonMessage;

extern QueueHandle_t xJsonQueue;

extern SemaphoreHandle_t xI2CMutex;
extern SemaphoreHandle_t xSerialMutex;
extern SemaphoreHandle_t xJsonQueueMutex;
extern float glob_temperature;
extern float glob_humidity;
extern float glob_light;
extern float glob_soil_moisture;

extern bool glob_lamp_state;
extern bool glob_pump_state;

extern unsigned long bootMillis;

extern String wifi_ssid;
extern String wifi_password;
extern boolean isWifiConnected;

#endif