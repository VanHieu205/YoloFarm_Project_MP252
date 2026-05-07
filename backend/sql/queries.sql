SELECT 
    c.crop_name,
    s.temperature,
    s.soil_moisture,
    a.action,
    a.reason
FROM sensor_readings s
JOIN crops c ON s.crop_id = c.crop_id
JOIN ai_recommendations r ON r.crop_id = c.crop_id
JOIN ai_actions a ON a.recommendation_id = r.recommendation_id
ORDER BY s.timestamp DESC;