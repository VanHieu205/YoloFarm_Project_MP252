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
('PUMP-001','may bom 1','pump','USR-002','Vườn mẫu','online','gpio_relay',0,'auto','v1.0',NOW(),NOW()),
('LAMP-001','den chieu sang khu a','light','USR-002','Vườn mẫu','online','gpio_relay',0,'auto','v1.0',NOW(),NOW()),
('SENSOR-001','sensor nhiet do am','sensor','USR-002','Vườn mẫu','online','i2c',0,'auto','v1.0',NOW(),NOW()),
('SENSOR-002','sensor anh sang dat','sensor','USR-002','Vườn mẫu','online','i2c',0,'auto','v1.0',NOW(),NOW());

-- =============================================
-- CROPS (bỏ device_id)
-- =============================================
INSERT INTO crops (crop_id, user_id, crop_name, variety, plant_date, expected_harvest_date, area, status, created_at) VALUES
(1,'USR-002','Tomato','Cherry','2026-05-01','2026-07-01',50,'growing',NOW()),
(2,'USR-002','Lettuce','Romaine','2026-04-20','2026-06-10',35,'growing',NOW()),
(3,'USR-002','Cucumber','Japanese','2026-04-15','2026-06-25',40,'growing',NOW());

-- =============================================
-- CROP DEVICES (thêm mới)
-- =============================================
INSERT INTO crop_devices (crop_id, device_id) VALUES
(1, 'SENSOR-001'),
(1, 'SENSOR-002'),
(1, 'PUMP-001'),
(1, 'LAMP-001'),
(2, 'SENSOR-001'),
(2, 'SENSOR-002'),
(2, 'PUMP-001'),
(3, 'SENSOR-001'),
(3, 'SENSOR-002'),
(3, 'PUMP-001');

-- =============================================
-- SENSOR READINGS
-- =============================================
INSERT INTO sensor_readings VALUES
('READ-001','SENSOR-001',1,NOW(),32.5,60,NULL,NULL,NULL,'Vườn mẫu'),
('READ-002','SENSOR-001',1,NOW(),28.0,70,NULL,NULL,NULL,'Vườn mẫu'),
('READ-003','SENSOR-001',2,NOW(),29.5,65,NULL,NULL,NULL,'Vườn mẫu'),
('READ-004','SENSOR-001',3,NOW(),31.2,70,NULL,NULL,NULL,'Vườn mẫu'),
('READ-005','SENSOR-002',1,NOW(),NULL,NULL,55,500,NULL,'Vườn mẫu'),
('READ-006','SENSOR-002',2,NOW(),NULL,NULL,52,480,NULL,'Vườn mẫu'),
('READ-007','SENSOR-002',3,NOW(),NULL,NULL,28,800,NULL,'Vườn mẫu'),
('READ-008','SENSOR-002',3,NOW(),NULL,NULL,60,300,NULL,'Vườn mẫu');

-- =============================================
-- THRESHOLD CONFIG
-- =============================================
INSERT INTO threshold_config VALUES
('CFG-001','SENSOR-001','USR-002',1,NOW());

-- =============================================
-- THRESHOLD RULES
-- =============================================
INSERT INTO threshold_rules (config_id, sensor_type, operator, threshold_value, target_device_id, action) VALUES
('CFG-001','temperature','gt',30,'PUMP-001','turn_on'),
('CFG-001','soil_moisture','lt',35,'PUMP-001','turn_on');

-- =============================================
-- ALERTS
-- =============================================
INSERT INTO alerts VALUES
('ALT-001','SENSOR-001',1,'READ-001','high_temp','high','Temperature too high',0,NOW()),
('ALT-002','SENSOR-002',2,'READ-006','high_humidity','medium','Humidity exceeded threshold',0,NOW()),
('ALT-003','SENSOR-001',3,'READ-004','high_temp','critical','Temperature reached dangerous level',0,NOW()),
('ALT-004','PUMP-001',1,NULL,'pump_warning','low','Pump maintenance required',1,NOW());

-- =============================================
-- AI PREDICTIONS (thêm trước ai_recommendations)
-- =============================================
INSERT INTO ai_predictions (prediction_id, crop_id, predicted_min_kg, yield_estimated_kg, predicted_max_kg, confidence_percent, input_snapshot, risk_alerts, created_at) VALUES
('PRED-001', 1, 100, 120, 140, 78, NULL, NULL, NOW()),
('PRED-002', 2, 85,  98,  115, 82, NULL, NULL, NOW()),
('PRED-003', 3, 120, 140, 160, 88, NULL, NULL, NOW());

-- =============================================
-- AI RECOMMENDATIONS
-- =============================================
INSERT INTO ai_recommendations (recommendation_id, prediction_id, priority, action, reason, related_use_case, created_at) VALUES
('REC-001','PRED-001',1,'Tưới nước 30 phút lúc 14:00','Soil moisture đang ở 28%, thấp hơn ngưỡng 35%','irrigation',NOW()),
('REC-002','PRED-001',2,'Kiểm tra nhiệt độ nhà kính','Nhiệt độ vượt 32°C trong 2 giờ liên tiếp','monitoring',NOW()),
('REC-003','PRED-002',1,'Giảm tần suất tưới','Độ ẩm đang ở 75%, cao hơn ngưỡng tối ưu','irrigation',NOW()),
('REC-004','PRED-003',1,'Bật quạt làm mát','Nhiệt độ vượt ngưỡng nguy hiểm 33°C','cooling',NOW());

-- =============================================
-- CARE LOGS
-- =============================================
INSERT INTO care_logs (crop_id, date, activity, notes) VALUES
(1,'2026-05-01','Tưới nước','Tưới tự động buổi sáng'),
(1,'2026-05-03','Bón phân','Bón phân NPK lần 1'),
(1,'2026-05-05','Kiểm tra sâu bệnh','Phát hiện ít sâu lá'),
(1,'2026-05-08','Tưới nước','Tưới tự động lúc sáng'),
(2,'2026-05-02','Tưới nước','Độ ẩm đất thấp'),
(2,'2026-05-04','Phun thuốc','Phòng ngừa nấm bệnh'),
(2,'2026-05-06','Cắt tỉa lá','Loại bỏ lá úa'),
(2,'2026-05-08','Bón phân','Bón phân hữu cơ'),
(3,'2026-05-01','Bón phân hữu cơ','Bổ sung dinh dưỡng'),
(3,'2026-05-03','Tưới nước','Tưới nhẹ vào chiều tối'),
(3,'2026-05-07','Kiểm tra sinh trưởng','Cây phát triển tốt'),
(3,'2026-05-08','Kiểm tra sâu bệnh','Không phát hiện bất thường');

-- =============================================
-- SUPPLIES
-- =============================================
INSERT INTO supplies (crop_id, name, quantity, unit, date) VALUES
(1,'Phân NPK',25.5,'kg','2026-05-03'),
(1,'Thuốc trừ sâu',2.0,'lít','2026-05-05'),
(1,'Hạt giống',5.0,'kg','2026-04-20'),
(1,'Phân hữu cơ',15,'kg','2026-05-08'),
(2,'Phân hữu cơ',30.0,'kg','2026-05-02'),
(2,'Thuốc nấm',1.5,'lít','2026-05-04'),
(2,'Dung dịch vi sinh',10.0,'lít','2026-05-06'),
(2,'Thuốc trừ sâu',3,'lít','2026-05-08'),
(3,'Phân kali',18.0,'kg','2026-05-01'),
(3,'Thuốc kích rễ',3.0,'lít','2026-05-03'),
(3,'Hệ thống tưới',1.0,'bộ','2026-04-28'),
(3,'Hạt giống',10,'kg','2026-05-08');

-- =============================================
-- HARVEST YIELDS
-- =============================================
INSERT INTO harvest_yields (crop_id, quantity, unit, quality, notes) VALUES
(1,1250.50,'kg','Tốt','Sản lượng ổn định, chất lượng đồng đều'),
(2,1871.25,'kg','Xuất sắc','Năng suất cao hơn dự kiến, ổn định'),
(3,1960.95,'kg','Xuất sắc','Điều kiện phát triển tốt, ảnh hưởng nhẹ do thời tiết');