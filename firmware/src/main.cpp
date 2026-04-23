#include "global.h"
#include "temp_humi_monitor.h"
#include "light_soil_monitor.h"
#include "data_logger.h"
#include "lcd.h"

void setup()
{
  Serial.begin(115200);
  xI2CMutex = xSemaphoreCreateMutex();
  xSerialMutex = xSemaphoreCreateMutex();
  xJsonQueueMutex = xSemaphoreCreateMutex();
  xJsonQueue = xQueueCreate(10, sizeof(JsonMessage));
  xTaskCreate(temp_humi_monitor, "TempHumiMonitor", 4096, NULL, 1, NULL);
  xTaskCreate(light_soil_monitor, "LightSoil_Task", 4096, NULL, 1, NULL);
  xTaskCreate(lcd_display_task, "LCD_Display", 4096, NULL, 2, NULL);
  xTaskCreate(data_logger_task, "DataLogger_Task", 8192, NULL, 2, NULL);

}
void loop()
{
}
