#include "lcd.h"
#include "global.h" 
#include <Wire.h>

LiquidCrystal_I2C lcd(33, 16, 2);   // Địa chỉ 0x21

// --- CÁC BIẾN QUẢN LÝ TRANG ---
static bool lcd_hold = false;
const unsigned long PAGE_MS = 5000; 
const uint8_t PAGE_COUNT = 5;       // Tổng cộng 5 trang
static uint8_t currentPage = 0;
static unsigned long lastPageMs = 0;

// --- KÝ TỰ CUSTOM CHO THANH BAR ---
byte barChar[5][8] = {
  {0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0},
  {0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x1F}, 
  {0x0,0x0,0x0,0x0,0x0,0x0,0x1F,0x1F},
  {0x0,0x0,0x0,0x0,0x1F,0x1F,0x1F,0x1F},
  {0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F}
};

void lcdInitCustomChars() {
  for (int i = 0; i < 5; ++i) lcd.createChar(i, barChar[i]);
}

void lcdPrintLine(LiquidCrystal_I2C &lcdRef, uint8_t row, const char *text) {
  char buf[17];
  strncpy(buf, text, 16);
  buf[16] = '\0';
  int len = strlen(buf);
  for (int i = len; i < 16; ++i) buf[i] = ' ';
  buf[16] = '\0';
  lcdRef.setCursor(0, row);
  lcdRef.print(buf);
}

void drawBar(LiquidCrystal_I2C &lcdRef, uint8_t row, uint8_t col, float value, float maxValue, uint8_t maxChars=12) {
  if (!isfinite(value) || !isfinite(maxValue) || maxValue <= 0.0f) {
    lcdRef.setCursor(col, row);
    for (uint8_t i = 0; i < maxChars; ++i) lcdRef.print(' ');
    return;
  }
  float ratio = constrain(value / maxValue, 0.0f, 1.0f);
  float scaled = ratio * maxChars;
  int full = (int)floor(scaled);
  float frac = scaled - full;
  int partialIdx = (int)round(frac * 4.0f); 

  if (full < 0) full = 0; if (full > maxChars) full = maxChars;
  if (partialIdx < 0) partialIdx = 0; if (partialIdx > 4) partialIdx = 4;

  lcdRef.setCursor(col, row);
  for (int i = 0; i < full && i < maxChars; ++i) lcdRef.write(byte(4));
  if (full < maxChars) {
    if (partialIdx == 0) lcdRef.print(' ');
    else lcdRef.write(byte(partialIdx));
    for (int j = full + 1; j < maxChars; ++j) lcdRef.print(' ');
  }
}

void updateLCDPages() {
  unsigned long now = millis();
  
  // Tự động chuyển trang
  if (!lcd_hold && (now - lastPageMs >= PAGE_MS)) {
        currentPage = (currentPage + 1) % PAGE_COUNT;
        lastPageMs = now;
  }

  // Đọc dữ liệu từ biến toàn cục
  float temperature = glob_temperature;
  float humidity = glob_humidity;
  float light = glob_light;
  float soil = glob_soil_moisture;
  bool sensorError = (temperature == -1.0f || humidity == -1.0f);

  char line[17];

  switch (currentPage) {
    case 0: { // Trang DHT20
      if (sensorError) snprintf(line, sizeof(line), "T:ERR H:ERR");
      else snprintf(line, sizeof(line), "T:%4.1f H:%3.0f", temperature, humidity);
      lcdPrintLine(lcd, 0, line);
      
      // Hiển thị trạng thái quạt/đèn
      if (glob_lamp_state) lcdPrintLine(lcd, 1, "FAN/LAMP: ON    ");
      else lcdPrintLine(lcd, 1, "FAN/LAMP: OFF   ");
      break;
    }
    case 1: { // Trang Ánh sáng
      snprintf(line, sizeof(line), "L:%4d", (int)light);
      lcdPrintLine(lcd, 0, line);
      drawBar(lcd, 1, 0, light, 4095.0f, 12); 
      lcd.setCursor(12, 1); lcd.print("    ");
      break;
    }
    case 2: { // Trang Độ ẩm đất
      snprintf(line, sizeof(line), "SOIL: %3.0f %%", soil);
      lcdPrintLine(lcd, 0, line);
      drawBar(lcd, 1, 0, soil, 100.0f, 12);
      lcd.setCursor(12, 1);
      if (glob_pump_state) lcd.print(" ON "); else lcd.print(" OFF");
      break;
    }
    case 3: { // Trang AI 
      lcdPrintLine(lcd, 0, "AI: N/A         "); 
      lcdPrintLine(lcd, 1, "WAITING MODEL...");
      break;
    }
    case 4: { // Trang Mạng 
      if (isWifiConnected) {
        lcdPrintLine(lcd, 0, "WiFi: CONNECTED ");
        lcdPrintLine(lcd, 1, "System Online   ");
      } else {
        lcdPrintLine(lcd, 0, "WiFi:DISCONNECT ");
        lcdPrintLine(lcd, 1, "Check Network   ");
      }
      break;
    }
  }
}

void lcd_display_task(void *pvParameters) {
    if (xI2CMutex != NULL) {
        xSemaphoreTake(xI2CMutex, portMAX_DELAY);
        lcd.begin(16, 2);
        Wire.begin(11, 12); // Ép lại chân I2C
        lcdInitCustomChars();   
        lcd.backlight();
        lcd.clear();
        lcdPrintLine(lcd, 0, "Smart Farm OS");
        lcdPrintLine(lcd, 1, "Starting...");
        xSemaphoreGive(xI2CMutex);
    }
    
    vTaskDelay(pdMS_TO_TICKS(1000));
    
    while (1) {
        if (xI2CMutex != NULL) {
            if (xSemaphoreTake(xI2CMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
                updateLCDPages();
                xSemaphoreGive(xI2CMutex);
            }
        }

        // 3. Delay để nhường CPU cho các Task khác
        vTaskDelay(pdMS_TO_TICKS(100)); 
    }
}