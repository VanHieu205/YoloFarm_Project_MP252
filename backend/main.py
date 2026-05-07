from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.sensor_routes import router as sensor_router

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

# Đăng ký Route của Cảm biến
app.include_router(sensor_router, prefix = "/api/sensors", tags = ["Sensors"])

@app.get("/")
def root():
    return {
        "status": "Online",
        "message": "Chào mừng đến với hệ thống Yolofarm API"
    }