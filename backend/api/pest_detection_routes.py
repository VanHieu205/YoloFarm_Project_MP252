import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, status

# Khởi tạo Router độc lập cho tính năng nhận diện sâu bệnh
router = APIRouter()

@router.on_event("startup")
async def load_model():
    print("[INFO] YoloFarm: Đang nạp Model nhận diện sâu bệnh...")
    # Nơi bạn của bạn nạp file model (VD: .pt, .onnx, h5) sau này
    pass

@router.post("/detect", status_code=status.HTTP_200_OK)
async def detect_pest(image: UploadFile = File(...)):
    """
    Endpoint: Nhận ảnh từ frontend và trả về kết quả nhận diện sâu bệnh (Mock Data)
    """
    # 1. Validate file
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng tải lên file hình ảnh hợp lệ."
        )
    
    try:
        print(f"[LOG] Pest Detection Service nhận file: {image.filename}")
        
        # 2. Đọc ảnh (chuẩn bị cho AI Model)
        image_bytes = await image.read()
        
        # 3. Giả lập thời gian model xử lý (delay 1.5s)
        await asyncio.sleep(1.5)
        
        # 4. Trả về Mock Data theo chuẩn JSON Frontend đang đợi
        return {
            "success": True,
            "pestName": "Đốm lá vi khuẩn (Bacterial Leaf Spot)",
            "confidence": 94.5,
            "details": {
                "symptoms": "Xuất hiện các đốm nhỏ mọng nước trên bề mặt lá, sau đó lan rộng chuyển sang màu nâu sẫm hoặc đen.",
                "treatment": "Ngắt bỏ và tiêu hủy ngay các lá nhiễm bệnh, tránh tưới nước trực tiếp lên tán lá.",
                "solutions": [
                    "Sử dụng thuốc gốc đồng (Copper-based fungicides).",
                    "Đảm bảo khoảng cách trồng để cây thông thoáng.",
                    "Bổ sung Kali tăng sức đề kháng cho cây."
                ]
            }
        }

    except Exception as e:
        print(f"[ERROR] Lỗi hệ thống nhận diện: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Đã xảy ra lỗi trong quá trình phân tích hình ảnh."
        )