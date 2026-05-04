-- Users
INSERT INTO users (user_id, username, password_hash, role)
VALUES ('u1','farmer1','hash','farmer');

-- Devices
INSERT INTO devices (device_id, name, type, user_id, connection_status)
VALUES ('dev1','Water Pump','pump','u1','online');

-- Crops
INSERT INTO crops (user_id, device_id, crop_name)
VALUES ('u1','dev1','Tomato');

-- Sensor data
INSERT INTO sensor_readings (reading_id, device_id, temperature, humidity)
VALUES 
('r1','dev1',35,40),
('r2','dev1',28,60);devices