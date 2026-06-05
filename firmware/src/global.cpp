#include "global.h"


unsigned long last_server_cmd_time = 0; 
const unsigned long OVERRIDE_TIMEOUT = 5000;

float glob_temperature = 25 ;
float glob_humidity = 25;
float glob_light = 0;
float glob_soil_moisture = 0.0f;

bool glob_lamp_state = false;
bool glob_fan_state = false;
bool glob_pump_state = false;

unsigned long bootMillis = 0;


String wifi_ssid = "Galaxy A03 06a5";
String wifi_password = "lliw6083";
boolean isWifiConnected = false;
volatile uint8_t button_press_count = 0;
QueueHandle_t xJsonQueue = NULL;
SemaphoreHandle_t xI2CMutex = NULL;
SemaphoreHandle_t xSerialMutex = NULL;
SemaphoreHandle_t xJsonQueueMutex = NULL;


