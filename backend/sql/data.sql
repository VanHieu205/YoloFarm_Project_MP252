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
('DEV-001','Pump 1','pump','USR-002','Field A','online','gpio_relay',0,'auto','v1.0',NOW(),NOW()),
('DEV-002','Fan 1','fan','USR-002','Field A','online','gpio_relay',0,'auto','v1.0',NOW(),NOW()),
('DEV-003','Sensor 1','sensor','USR-002','Field A','online','i2c',0,'auto','v1.0',NOW(),NOW());

-- =============================================
-- CROPS
-- =============================================
INSERT INTO crops VALUES
(1,'USR-002','DEV-003','Tomato','Cherry','2026-05-01','2026-07-01',50,'growing',NOW());

-- =============================================
-- SENSOR READINGS
-- =============================================
INSERT INTO sensor_readings VALUES
('READ-001','DEV-003',1,NOW(),32.5,60,30,500,400,'Field A'),
('READ-002','DEV-003',1,NOW(),28.0,70,45,300,380,'Field A');

-- =============================================
-- THRESHOLD CONFIG
-- =============================================
INSERT INTO threshold_config VALUES
('CFG-001','DEV-003','USR-002',1,NOW());

-- =============================================
-- THRESHOLD RULES
-- =============================================
INSERT INTO threshold_rules VALUES
(NULL,'CFG-001','temperature','gt',30,'DEV-002','turn_on'),
(NULL,'CFG-001','soil_moisture','lt',35,'DEV-001','turn_on');

-- =============================================
-- ALERTS
-- =============================================
INSERT INTO alerts VALUES
('ALT-001','DEV-003',1,'READ-001','high_temp','high','Temperature too high',0,NOW());

-- =============================================
-- AI RECOMMENDATIONS
-- =============================================
INSERT INTO ai_recommendations VALUES
('REC-001',1,120,78,
JSON_ARRAY(
    JSON_OBJECT('risk_type','drought','severity','medium','description','Soil moisture below 35%')
),
NOW());

-- =============================================
-- AI ACTIONS
-- =============================================
INSERT INTO ai_actions VALUES
(NULL,'REC-001',1,'Irrigate for 30 minutes','High temperature forecast','schedule');