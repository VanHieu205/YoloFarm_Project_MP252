-- Join device + sensor
SELECT 
    d.name,
    s.temperature,
    s.humidity
FROM devices d
JOIN sensor_readings s
ON d.device_id = s.device_id;