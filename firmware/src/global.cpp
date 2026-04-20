#include "global.h"

float glob_temperature = 25 ;
float glob_humidity = 25;
float glob_light = 0;
float glob_soil_moisture = 0.0f;

bool glob_lamp_state = false;
bool glob_pump_state = false;

unsigned long bootMillis = 0;


String ssid = "ESP32-YOUR NETWORK HERE!!!";
String password = "12345678";
String wifi_ssid = "";
String wifi_password = "";
boolean isWifiConnected = false;
volatile uint8_t button_press_count = 0;
QueueHandle_t xJsonQueue = NULL;
SemaphoreHandle_t xI2CMutex = NULL;


