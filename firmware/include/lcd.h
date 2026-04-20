#ifndef LCD_MANAGER_H
#define LCD_MANAGER_H

#include <Arduino.h>
#include "LiquidCrystal_I2C.h"
#include "global.h"

// Khai báo Task hiển thị LCD
void lcd_display_task(void *pvParameters);

#endif