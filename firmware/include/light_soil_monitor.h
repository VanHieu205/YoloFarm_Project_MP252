#ifndef LIGHT_SOIL_MONITOR_H
#define LIGHT_SOIL_MONITOR_H

#include <Arduino.h>
#include "global.h"

#define LDR_PIN 4             // Cổng A3 (GPIO4) - Cảm biến ánh sáng
#define SOIL_MOISTURE_PIN 1   // Cổng A0 (GPIO1) - Cảm biến độ ẩm đất
#define PUMP_CONTROL_PIN 18      // Cổng D4 (GPIO7) - Điều khiển Máy bơm
#define FAN_CONTROL_PIN 9       // Cổng D6 (GPIO9) - Điều khiển Quạt
void light_soil_monitor(void *pvParameters);

#endif