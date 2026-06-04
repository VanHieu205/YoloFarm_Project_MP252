import io
import json
import os
import sys

from fastapi import APIRouter, HTTPException, File, UploadFile
import torch
from PIL import Image
from torchvision import transforms


current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../"))
if project_root not in sys.path:
    sys.path.append(project_root)

from ML.src import config
from ML.src.vision.modeling import build_model
from ML.src.vision.disease_expert import get_expert_advice

router = APIRouter()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

try:
    with open(config.VISION_LABELS_PATH, "r", encoding="utf-8") as f:
        vision_class_names = json.load(f)

    vision_model = build_model(num_classes=len(vision_class_names))
    vision_model.load_state_dict(
        torch.load(config.VISION_MODEL_PATH, map_location=device, weights_only=True)
    )
    vision_model.to(device)
    vision_model.eval()

    vision_transform = transforms.Compose([
        transforms.Resize((config.IMG_SIZE, config.IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

except Exception as e:
    print(f"Không thể tải Vision Model: {e}")
    vision_model = None


@router.post("/detect-disease-quick")
async def detect_disease_quick(file: UploadFile = File(...)):
    if not vision_model:
        raise HTTPException(status_code=503, detail="AI Vision chưa sẵn sàng.")

    try:
        image_data = await file.read()

        try:
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="File gửi lên không phải là ảnh hợp lệ.")

        input_tensor = vision_transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = vision_model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            confidence, predicted_idx = torch.max(probabilities, 0)

        disease_name = vision_class_names[predicted_idx.item()]
        conf_score = round(confidence.item() * 100, 2)

        if conf_score < 25.0:
            disease_name = "Unknown"
            expert_analysis = {
                "name_vn": "Không thể chẩn đoán rõ ràng",
                "danger_level": "N/A",
                "cause": "Ảnh bị mờ, chụp quá xa hoặc không chứa lá cây hợp lệ.",
                "symptoms": "N/A",
                "treatment": ["Vui lòng chụp lại cận cảnh vết bệnh trên lá ở nơi có ánh sáng tốt."],
                "prevention": ["Đảm bảo camera lấy nét đúng vào phần lá cây bị hỏng."]
            }
        else:
            expert_analysis = get_expert_advice(disease_name)

        return {
            "success": True,
            "ai_analysis": {
                "disease": disease_name,
                "confidence_score": conf_score,
                "confidence_display": f"{conf_score}%"
            },
            "expert_advice": expert_analysis
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))