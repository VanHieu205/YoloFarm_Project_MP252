CREATE DATABASE yolofarm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yolofarm;

-- =============================================
-- 1. Users
-- =============================================
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role ENUM('admin', 'farmer', 'viewer') DEFAULT 'farmer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- =============================================
-- 2. Devices
-- =============================================
CREATE TABLE devices (
    device_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('pump', 'fan', 'light', 'sensor') NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    connection_status ENUM('online', 'offline', 'error') DEFAULT 'offline',
    connection_type VARCHAR(30),
    is_on TINYINT(1) DEFAULT 0,
    mode ENUM('auto', 'manual') DEFAULT 'manual',
    firmware_version VARCHAR(20),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. Crops
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. Sensor Readings
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
    location VARCHAR(100)
);

-- =============================================
-- 5. Threshold Config
-- =============================================
CREATE TABLE threshold_config (
    config_id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(50) NOT NULL,
    created_by VARCHAR(50),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. Threshold Rules
-- =============================================
CREATE TABLE threshold_rules (
    rule_id INT PRIMARY KEY AUTO_INCREMENT,
    config_id INT NOT NULL,
    sensor_type ENUM('temperature','humidity','soil_moisture','light','co2') NOT NULL,
    operator ENUM('lt', 'gt', 'lte', 'gte', 'eq') NOT NULL,
    threshold_value FLOAT NOT NULL,
    target_device_id VARCHAR(50),
    action ENUM('turn_on','turn_off') NOT NULL
);

-- =============================================
-- 7. Alerts
-- =============================================
CREATE TABLE alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    device_id VARCHAR(50),
    crop_id INT,
    sensor_reading_id VARCHAR(50),
    risk_type VARCHAR(50),
    severity ENUM('low', 'medium', 'high', 'critical'),
    description TEXT,
    is_resolved TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 8. AI Recommendations
-- =============================================
CREATE TABLE ai_recommendations (
    recommendation_id VARCHAR(50) PRIMARY KEY,
    crop_id INT NOT NULL,
    yield_estimated_kg FLOAT,
    confidence_percent INT,
    recommendations JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FOREIGN KEYS
-- =============================================
ALTER TABLE devices 
    ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE crops 
    ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    ADD FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE;

ALTER TABLE sensor_readings 
    ADD FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    ADD FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE SET NULL;

ALTER TABLE threshold_config 
    ADD FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    ADD FOREIGN KEY (created_by) REFERENCES users(user_id);

ALTER TABLE threshold_rules 
    ADD FOREIGN KEY (config_id) REFERENCES threshold_config(config_id) ON DELETE CASCADE,
    ADD FOREIGN KEY (target_device_id) REFERENCES devices(device_id);

ALTER TABLE alerts 
    ADD FOREIGN KEY (device_id) REFERENCES devices(device_id),
    ADD FOREIGN KEY (crop_id) REFERENCES crops(crop_id),
    ADD FOREIGN KEY (sensor_reading_id) REFERENCES sensor_readings(reading_id);

ALTER TABLE ai_recommendations 
    ADD FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE CASCADE;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_sensor_device_time ON sensor_readings(device_id, timestamp);
CREATE INDEX idx_sensor_crop ON sensor_readings(crop_id);
CREATE INDEX idx_alert_device ON alerts(device_id, created_at);
CREATE INDEX idx_crop_device ON crops(device_id);