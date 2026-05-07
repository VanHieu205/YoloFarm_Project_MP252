CREATE DATABASE yolofarm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yolofarm;

-- =============================================
-- 1. USERS
-- =============================================
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role ENUM('admin', 'farmer') DEFAULT 'farmer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- =============================================
-- 2. DEVICES
-- =============================================
CREATE TABLE devices (
    device_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('pump', 'fan', 'light', 'sensor', 'gateway') NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    connection_status ENUM('online', 'offline', 'error') DEFAULT 'offline',
    connection_type ENUM('gpio_relay','analog','i2c','wifi'),
    is_on BOOLEAN DEFAULT FALSE,
    mode ENUM('auto', 'manual') DEFAULT 'manual',
    firmware_version VARCHAR(20),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =============================================
-- 3. DEVICE MAINTENANCE
-- =============================================
CREATE TABLE device_maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    date TIMESTAMP,
    note TEXT,
    performed_by VARCHAR(50),

    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(user_id)
);

-- =============================================
-- 4. CROPS
-- =============================================
CREATE TABLE crops (
    crop_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    plant_date DATE,
    expected_harvest_date DATE,
    area DECIMAL(10,2),
    status ENUM('growing', 'harvested', 'failed') DEFAULT 'growing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- =============================================
-- 5. SENSOR READINGS
-- =============================================
CREATE TABLE sensor_readings (
    reading_id VARCHAR(50) PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    crop_id INT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature FLOAT,
    humidity FLOAT,
    soil_moisture FLOAT,
    light_intensity FLOAT,
    co2 FLOAT,
    location VARCHAR(100),

    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE SET NULL
);

-- =============================================
-- 6. THRESHOLD CONFIG
-- =============================================
CREATE TABLE threshold_config (
    config_id VARCHAR(50) PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    created_by VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- =============================================
-- 7. THRESHOLD RULES
-- =============================================
CREATE TABLE threshold_rules (
    rule_id INT PRIMARY KEY AUTO_INCREMENT,
    config_id VARCHAR(50) NOT NULL,
    sensor_type ENUM('temperature','humidity','soil_moisture','light_intensity','co2') NOT NULL,
    operator ENUM('lt', 'gt', 'lte', 'gte', 'eq') NOT NULL,
    threshold_value FLOAT NOT NULL,
    target_device_id VARCHAR(50),
    action ENUM('turn_on','turn_off') NOT NULL,

    FOREIGN KEY (config_id) REFERENCES threshold_config(config_id) ON DELETE CASCADE,
    FOREIGN KEY (target_device_id) REFERENCES devices(device_id)
);

-- =============================================
-- 8. ALERTS
-- =============================================
CREATE TABLE alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    device_id VARCHAR(50),
    crop_id INT,
    sensor_reading_id VARCHAR(50),
    risk_type VARCHAR(50),
    severity ENUM('low', 'medium', 'high', 'critical'),
    description TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE SET NULL,
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE SET NULL,
    FOREIGN KEY (sensor_reading_id) REFERENCES sensor_readings(reading_id) ON DELETE SET NULL
);

-- =============================================
-- 9. AI RECOMMENDATIONS
-- =============================================
CREATE TABLE ai_recommendations (
    recommendation_id VARCHAR(50) PRIMARY KEY,
    crop_id INT NOT NULL,
    yield_estimated_kg FLOAT,
    confidence_percent INT,
    risk_alerts JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE CASCADE
);

-- =============================================
-- 10. AI ACTIONS
-- =============================================
CREATE TABLE ai_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recommendation_id VARCHAR(50) NOT NULL,
    priority INT,
    action TEXT,
    reason TEXT,
    related_use_case VARCHAR(50),

    FOREIGN KEY (recommendation_id)
        REFERENCES ai_recommendations(recommendation_id)
        ON DELETE CASCADE
);
-- =============================================
-- 11. Farm management
-- =============================================
-- Nhật ký chăm sóc
CREATE TABLE care_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL,
    date DATE NOT NULL,
    activity VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE CASCADE
);

-- Vật tư / phân bón
CREATE TABLE supplies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE CASCADE
);

-- Sản lượng thu hoạch
CREATE TABLE harvest_yields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL UNIQUE,
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    quality ENUM('Xuất sắc','Tốt','Bình thường','Thấp') DEFAULT 'Bình thường',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE CASCADE
);
-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_sensor_device_time ON sensor_readings(device_id, timestamp);
CREATE INDEX idx_sensor_crop ON sensor_readings(crop_id);
CREATE INDEX idx_alert_device ON alerts(device_id, created_at);
CREATE INDEX idx_crop_device ON crops(device_id);
CREATE INDEX idx_ai_actions_rec ON ai_actions(recommendation_id);