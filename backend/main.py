from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.sensor_routes import router as sensor_router
from api.farm_management_routes import router as farm_router
from api.user_routes import router as user_router
from api.device_routes import router as device_router
from api.weather_routes import router as weather_router
from api.automation_routes import router as autorouter
from api.ai_routes import router as ai_router
app = FastAPI(
    title = "YoloFarm API System",
    description = "Backend API cho hệ thống nông nghiệp thông minh",
    version = "1.0.0"
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)


# Đăng ký Route của User
app.include_router(user_router, prefix = "/api/users", tags = ["Users"])

# Đăng ký Route của Thiết bị
app.include_router(device_router, prefix = "/api/devices", tags = ["Devices"])

# Đăng ký Route của Cảm biến
app.include_router(sensor_router, prefix = "/api/sensors", tags = ["Sensors"])

app.include_router(weather_router, prefix="/api/weather", tags=["Weather"])

app.include_router(autorouter, prefix="/api/automation", tags=["Automation"])
# Đăng ký Route của Farm
app.include_router(farm_router, prefix="/api/farm", tags=["Farm"])  
app.include_router(ai_router, prefix="/api/ai", tags=["AI Prediction"])
@app.get("/")
def root():
    return {
        "status": "Online",
        "message": "Chào mừng đến với hệ thống Yolofarm API"
    }
