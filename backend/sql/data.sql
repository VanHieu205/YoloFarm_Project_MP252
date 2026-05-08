-- =============================================
-- USERS
-- =============================================
INSERT INTO users VALUES
('USR-001','admin','hash123','Admin User','care_logsadmin@yolo.com','0901','admin',NOW(),NOW(),NOW()),
('USR-002','farmer1','hash456','Farmer One','farmer@yolo.com','0902','farmer',NOW(),NOW(),NOW());

-- =============================================
-- DEVICES
-- =============================================
INSERT INTO devices VALUES
('DEV-001','Pump 1','pump','USR-002','Field A','online','gpio_relay',0,'auto','v1.0',NOW(),NOW()),
('DEV-002','Fan 1','fan','USR-002','Field A','online','gpio_relay',0,'auto','v1.0',NOW(),NOW()),
('DEV-003','Sensor 1','sensor','USR-002','Field A','online','i2c',0,'auto','v1.0',NOW(),NOW()),
('DEV-004','Light 1','light','USR-002','Greenhouse A','online','gpio_relay',1,'auto','v1.0',NOW(),NOW()),
('DEV-005','Pump 2','pump','USR-002','Field B','online','gpio_relay',1,'auto','v1.0',NOW(),NOW()),
('DEV-006','Fan 2','fan','USR-002','Greenhouse B','online','gpio_relay',0,'manual','v1.0',NOW(),NOW()),
('DEV-007','Sensor 2','sensor','USR-002','Field B','online','i2c',1,'auto','v1.0',NOW(),NOW()),
('DEV-008','Light 2','light','USR-002','Greenhouse B','offline','gpio_relay',0,'manual','v1.0',NOW(),NOW());

-- =============================================
-- CROPS
-- =============================================
INSERT INTO crops VALUES
(1,'USR-002','DEV-003','Tomato','Cherry','2026-05-01','2026-07-01',50,'growing',NOW()),
(2,'USR-002','DEV-007','Lettuce','Romaine','2026-04-20','2026-06-10',35,'growing',NOW()),
(3,'USR-002','DEV-003','Cucumber','Japanese','2026-04-15','2026-06-25',40,'growing',NOW());

-- =============================================
-- SENSOR READINGS
-- =============================================
INSERT INTO sensor_readings VALUES
('READ-001','DEV-003',1,NOW(),32.5,60,30,500,400,'Field A'),
('READ-002','DEV-003',1,NOW(),28.0,70,45,300,380,'Field A'),
('READ-003','DEV-003',1,NOW(),29.5,65,40,650,390,'Field A'),
('READ-004','DEV-003',1,NOW(),31.2,70,35,720,410,'Field A'),
('READ-005','DEV-007',2,NOW(),26.4,75,55,500,350,'Field B'),
('READ-006','DEV-007',2,NOW(),27.1,72,52,480,340,'Field B'),
('READ-007','DEV-003',3,NOW(),33.5,60,28,800,450,'Greenhouse B'),
('READ-008','DEV-007',3,NOW(),24.8,80,60,300,320,'Greenhouse B');

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
('ALT-001','DEV-003',1,'READ-001','high_temp','high','Temperature too high',0,NOW()),
('ALT-002','DEV-007',2,'READ-005','high_humidity','medium','Humidity exceeded threshold',0,NOW()),
('ALT-003','DEV-003',3,'READ-007','high_temp','critical','Temperature reached dangerous level',0,NOW()),
('ALT-004','DEV-005',2,NULL,'pump_warning','low','Pump maintenance required',1,NOW());

-- =============================================
-- AI RECOMMENDATIONS
-- =============================================
INSERT INTO ai_recommendations VALUES
('REC-001',1,120,78,
JSON_ARRAY(
    JSON_OBJECT('risk_type','drought','severity','medium','description','Soil moisture below 35%')
),
NOW()),
('REC-002',2,98,82,
JSON_ARRAY(
    JSON_OBJECT('risk_type','fungus','severity','medium','description','Humidity too high')
),
NOW()),
('REC-003',3,140,88,
JSON_ARRAY(
    JSON_OBJECT('risk_type','heat','severity','high','description','High greenhouse temperature')
),
NOW());

-- =============================================
-- AI ACTIONS
-- =============================================
INSERT INTO ai_actions VALUES
(NULL,'REC-001',1,'Irrigate for 30 minutes','High temperature forecast','schedule'),
(NULL,'REC-002',2,'Reduce watering frequency','Humidity exceeded optimal level','automation'),
(NULL,'REC-003',1,'Activate cooling fans','Temperature exceeded threshold','cooling');

-- =============================================
-- CARE LOGS
-- =============================================
INSERT INTO care_logs (crop_id, date, activity, notes) VALUES
(1, '2026-05-01', 'Tưới nước', 'Tưới tự động buổi sáng'),
(1, '2026-05-03', 'Bón phân', 'Bón phân NPK lần 1'),
(1, '2026-05-05', 'Kiểm tra sâu bệnh', 'Phát hiện ít sâu lá'),
(1, '2026-05-08', 'Tưới nước', 'Tưới tự động lúc sáng'),

(2, '2026-05-02', 'Tưới nước', 'Độ ẩm đất thấp'),
(2, '2026-05-04', 'Phun thuốc', 'Phòng ngừa nấm bệnh'),
(2, '2026-05-06', 'Cắt tỉa lá', 'Loại bỏ lá úa'),
(2, '2026-05-08', 'Bón phân', 'Bón phân hữu cơ'),

(3, '2026-05-01', 'Bón phân hữu cơ', 'Bổ sung dinh dưỡng'),
(3, '2026-05-03', 'Tưới nước', 'Tưới nhẹ vào chiều tối'),
(3, '2026-05-07', 'Kiểm tra sinh trưởng', 'Cây phát triển tốt'),
(3, '2026-05-08', 'Kiểm tra sâu bệnh', 'Không phát hiện bất thường');

-- =============================================
-- SUPPLIES
-- =============================================
INSERT INTO supplies (crop_id, name, quantity, unit, date) VALUES
(1, 'Phân NPK', 25.5, 'kg', '2026-05-03'),
(1, 'Thuốc trừ sâu', 2.0, 'lít', '2026-05-05'),
(1, 'Hạt giống', 5.0, 'kg', '2026-04-20'),
(1, 'Phân hữu cơ', 15, 'kg', '2026-05-08'),

(2, 'Phân hữu cơ', 30.0, 'kg', '2026-05-02'),
(2, 'Thuốc nấm', 1.5, 'lít', '2026-05-04'),
(2, 'Dung dịch vi sinh', 10.0, 'lít', '2026-05-06'),
(2, 'Thuốc trừ sâu', 3, 'lít', '2026-05-08'),

(3, 'Phân kali', 18.0, 'kg', '2026-05-01'),
(3, 'Thuốc kích rễ', 3.0, 'lít', '2026-05-03'),
(3, 'Hệ thống tưới', 1.0, 'bộ', '2026-04-28'),
(3, 'Hạt giống', 10, 'kg', '2026-05-08');

-- =============================================
-- HARVEST YIELDS
-- =============================================
INSERT INTO harvest_yields (crop_id, quantity, unit, quality, notes) VALUES
(1, 1250.50, 'kg', 'Tốt', 'Sản lượng ổn định, chất lượng đồng đều'),
(2, 1871.25, 'kg', 'Xuất sắc', 'Năng suất cao hơn dự kiến, ổn định'),
(3, 1960.95, 'kg', 'Xuất sắc', 'Điều kiện phát triển tốt, ảnh hưởng nhẹ do thời tiết');