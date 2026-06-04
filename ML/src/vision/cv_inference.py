import os
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

from ML.src import config


class DiseaseDetector:
    def __init__(self):
        if not os.path.exists(config.VISION_LABELS_PATH):
            raise FileNotFoundError(
                f"Không tìm thấy file labels tại {config.VISION_LABELS_PATH}"
            )

        with open(config.VISION_LABELS_PATH, "r", encoding="utf-8") as f:
            self.class_names = json.load(f)

        self.num_classes = len(self.class_names)

        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        self.model = models.mobilenet_v2(weights=None)
        self.model.classifier[1] = nn.Linear(
            self.model.last_channel,
            self.num_classes
        )

        if not os.path.exists(config.VISION_MODEL_PATH):
            raise FileNotFoundError(
                f"Không tìm thấy model tại {config.VISION_MODEL_PATH}"
            )

        self.model.load_state_dict(
            torch.load(
                config.VISION_MODEL_PATH,
                map_location=self.device
            )
        )

        self.model.to(self.device)
        self.model.eval()

        # --- FIX: Thêm CenterCrop để loại bỏ nền vườn/đất ---
        # Ảnh thực tế thường có lá ở giữa, nền xung quanh gây nhiễu
        # Resize lớn hơn rồi crop center → lấy phần trung tâm là chính
        self.transform = transforms.Compose([
            transforms.Resize(
                (config.IMG_SIZE + 64, config.IMG_SIZE + 64)
            ),
            transforms.CenterCrop(config.IMG_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(
                [0.485, 0.456, 0.406],
                [0.229, 0.224, 0.225]
            )
        ])

    def predict(self, image_path, threshold=55.0):
        """
        Dự đoán bệnh từ ảnh lá cây.

        Args:
            image_path: Đường dẫn đến ảnh cần dự đoán
            threshold:  Ngưỡng confidence tối thiểu (%).
                        Nếu thấp hơn sẽ trả về cảnh báo.
                        Mặc định 55% - phù hợp ảnh thực tế.

        Returns:
            dict: {
                "disease": tên bệnh,
                "confidence": % tin cậy,
                "top3": [...],       # 3 khả năng cao nhất
                "warning": "..."     # chỉ có nếu confidence thấp
            }
        """
        image = Image.open(image_path).convert("RGB")
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.nn.functional.softmax(
                outputs[0],
                dim=0
            )

        # --- FIX: Lấy Top-3 thay vì chỉ Top-1 ---
        # Ảnh thực tế thường không rõ ràng như ảnh lab,
        # top-3 giúp người dùng có thêm thông tin để phán đoán
        top3_conf, top3_idx = torch.topk(probabilities, k=min(3, self.num_classes))

        top3 = [
            {
                "disease": self.class_names[idx.item()],
                "confidence": round(conf.item() * 100, 2)
            }
            for conf, idx in zip(top3_conf, top3_idx)
        ]

        result = {
            "disease": top3[0]["disease"],
            "confidence": top3[0]["confidence"],
            "top3": top3
        }

        # --- FIX: Cảnh báo khi confidence thấp ---
        if result["confidence"] < threshold:
            result["warning"] = (
                f"⚠️ Độ tin cậy thấp ({result['confidence']}%). "
                f"Hãy thử chụp cận hơn, đủ ánh sáng, "
                f"và tập trung vào 1 lá bị bệnh rõ nhất."
            )

        return result


if __name__ == "__main__":
    detector = DiseaseDetector()

    test_image = "ML/test_leaf.jpg"

    if os.path.exists(test_image):
        result = detector.predict(test_image)

        print(f"\n{'='*40}")
        print(f"Kết quả dự đoán:")
        print(f"  Bệnh: {result['disease']}")
        print(f"  Độ tin cậy: {result['confidence']}%")

        if "warning" in result:
            print(f"\n{result['warning']}")

        print(f"\nTop 3 khả năng:")
        for i, item in enumerate(result["top3"], 1):
            print(f"  {i}. {item['disease']}: {item['confidence']}%")
        print(f"{'='*40}\n")
    else:
        print(f"Không tìm thấy {test_image}")