-- =============================================
-- RESET DATABASE
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE harvest_yields;
TRUNCATE TABLE supplies;
TRUNCATE TABLE care_logs;
TRUNCATE TABLE ai_recommendations;
TRUNCATE TABLE ai_predictions;
TRUNCATE TABLE alerts;
TRUNCATE TABLE threshold_rules;
TRUNCATE TABLE threshold_config;
TRUNCATE TABLE sensor_readings;
TRUNCATE TABLE crop_devices;
TRUNCATE TABLE crops;
TRUNCATE TABLE devices;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- USERS
-- =============================================

INSERT INTO users VALUES
('USR-001','admin','hash123','Admin User','admin@yolo.com','0901','admin',NOW(),NOW(),NOW()),
('USR-002','farmer1','hash456','Farmer One','farmer@yolo.com','0902','farmer',NOW(),NOW(),NOW());

-- =============================================
-- DEVICES
-- =============================================

INSERT INTO devices VALUES
('PUMP-001','Máy bơm 1','pump','USR-002','Khu A','online','gpio_relay',0,'auto','v1.0',NOW(),NOW()),
('LAMP-001','Đèn chiếu sáng','light','USR-002','Khu A','online','gpio_relay',0,'auto','v1.0',NOW(),NOW()),
('FAN-001','Quạt làm mát','fan','USR-002','Khu A','online','gpio_relay',0,'auto','v1.0',NOW(),NOW()),
('SENSOR-001','Sensor nhiệt độ ẩm','sensor','USR-002','Khu A','online','i2c',0,'auto','v1.0',NOW(),NOW()),
('SENSOR-002','Sensor đất ánh sáng','sensor','USR-002','Khu A','online','i2c',0,'auto','v1.0',NOW(),NOW());

-- =============================================
-- CROPS
-- =============================================

INSERT INTO crops
(crop_id, user_id, crop_name, variety, plant_date, expected_harvest_date, area, status, created_at)
VALUES
(1 ,'USR-002','Tomato'      ,'Cherry'       ,'2026-05-01','2026-07-01',50 ,'growing',NOW()),
(2 ,'USR-002','Lettuce'     ,'Romaine'      ,'2026-04-20','2026-06-10',35 ,'growing',NOW()),
(3 ,'USR-002','Cucumber'    ,'Japanese'     ,'2026-04-15','2026-06-25',40 ,'growing',NOW()),
(4 ,'USR-002','Rice'        ,'ST25'         ,'2026-05-01','2026-08-20',120,'growing',NOW()),
(5 ,'USR-002','Maize'       ,'Hybrid NK'    ,'2026-05-03','2026-08-01',90 ,'growing',NOW()),
(6 ,'USR-002','Sugarcane'   ,'KK3'          ,'2026-04-15','2026-11-20',200,'growing',NOW()),
(7 ,'USR-002','Coffee'      ,'Robusta'      ,'2026-03-01','2026-12-15',150,'growing',NOW()),
(8 ,'USR-002','Potato'      ,'Atlantic'     ,'2026-05-10','2026-07-25',60 ,'growing',NOW()),
(9 ,'USR-002','Dragon Fruit','Red Flesh'    ,'2026-02-20','2026-09-15',180,'growing',NOW()),
(10,'USR-002','Banana'      ,'Cavendish'    ,'2026-03-10','2026-10-10',140,'growing',NOW()),
(11,'USR-002','Mango'       ,'Cat Chu'      ,'2026-02-01','2026-09-30',220,'growing',NOW()),
(12,'USR-002','Onion'       ,'Purple Onion' ,'2026-05-05','2026-07-05',45 ,'growing',NOW()),
(13,'USR-002','Garlic'      ,'Ly Son'       ,'2026-05-08','2026-07-20',40 ,'growing',NOW()),
(14,'USR-002','Tea'         ,'Green Tea'    ,'2026-01-15','2026-12-01',160,'growing',NOW()),
(15,'USR-002','Strawberry'  ,'Albion'       ,'2026-04-01','2026-06-30',35 ,'growing',NOW()),
(16,'USR-002','Bell Pepper' ,'Red Bell'     ,'2026-05-01','2026-07-15',50 ,'growing',NOW());

-- =============================================
-- CROP DEVICES
-- =============================================

INSERT INTO crop_devices (crop_id, device_id)
SELECT c.crop_id, d.device_id
FROM crops c
CROSS JOIN devices d
WHERE d.device_id IN (
    'SENSOR-001',
    'SENSOR-002',
    'PUMP-001',
    'LAMP-001',
    'FAN-001'
);

-- =============================================
-- THRESHOLD CONFIG
-- =============================================

INSERT INTO threshold_config VALUES
('CFG-001','SENSOR-001','USR-002',1,NOW());

-- =============================================
-- THRESHOLD RULES
-- =============================================

INSERT INTO threshold_rules
(config_id, sensor_type, operator, threshold_value, target_device_id, action)
VALUES
('CFG-001','temperature','gt',32,'FAN-001','turn_on'),
('CFG-001','soil_moisture','lt',35,'PUMP-001','turn_on'),
('CFG-001','light_intensity','lt',20000,'LAMP-001','turn_on');

-- =============================================
-- SENSOR READINGS SAMPLE
-- =============================================

INSERT INTO sensor_readings VALUES
('READ-001','SENSOR-001',1,NOW() - INTERVAL 10 SECOND,31.2,68,NULL,NULL,420,'Khu A'),
('READ-002','SENSOR-002',1,NOW() - INTERVAL 10 SECOND,NULL,NULL,58,45000,NULL,'Khu A'),

('READ-003','SENSOR-001',1,NOW() - INTERVAL 8 SECOND,31.5,69,NULL,NULL,425,'Khu A'),
('READ-004','SENSOR-002',1,NOW() - INTERVAL 8 SECOND,NULL,NULL,57,45200,NULL,'Khu A'),

('READ-005','SENSOR-001',1,NOW() - INTERVAL 6 SECOND,31.7,70,NULL,NULL,430,'Khu A'),
('READ-006','SENSOR-002',1,NOW() - INTERVAL 6 SECOND,NULL,NULL,56,45500,NULL,'Khu A'),

('READ-007','SENSOR-001',1,NOW() - INTERVAL 4 SECOND,32.0,71,NULL,NULL,440,'Khu A'),
('READ-008','SENSOR-002',1,NOW() - INTERVAL 4 SECOND,NULL,NULL,55,45800,NULL,'Khu A'),

('READ-009','SENSOR-001',1,NOW() - INTERVAL 2 SECOND,32.3,72,NULL,NULL,450,'Khu A'),
('READ-010','SENSOR-002',1,NOW() - INTERVAL 2 SECOND,NULL,NULL,54,46000,NULL,'Khu A');

-- =============================================
-- AI PREDICTIONS
-- =============================================

INSERT INTO ai_predictions
(prediction_id, crop_id, predicted_min_kg, yield_estimated_kg,
 predicted_max_kg, confidence_percent, input_snapshot,
 risk_alerts, created_at)
VALUES
('PRED-001',1,100,120,140,78,NULL,NULL,NOW()),
('PRED-002',2,85,98,115,82,NULL,NULL,NOW()),
('PRED-003',3,120,140,160,88,NULL,NULL,NOW());

-- =============================================
-- AI RECOMMENDATIONS
-- =============================================

INSERT INTO ai_recommendations
(recommendation_id, prediction_id, priority,
 action, reason, related_use_case, created_at)
VALUES
('REC-001','PRED-001',1,
 'Tưới nước 30 phút',
 'Độ ẩm đất đang thấp hơn ngưỡng',
 'irrigation',
 NOW()),

('REC-002','PRED-001',2,
 'Bật quạt làm mát',
 'Nhiệt độ vượt 32°C',
 'cooling',
 NOW());