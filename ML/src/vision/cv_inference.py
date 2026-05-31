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

        self.transform = transforms.Compose([
            transforms.Resize((config.IMG_SIZE, config.IMG_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                [0.485, 0.456, 0.406],
                [0.229, 0.224, 0.225]
            )
        ])

    def predict(self, image_path):
        image = Image.open(image_path).convert("RGB")

        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.nn.functional.softmax(
                outputs[0],
                dim=0
            )
            confidence, predicted_idx = torch.max(
                probabilities,
                0
            )

        return {
            "disease": self.class_names[predicted_idx.item()],
            "confidence": round(confidence.item() * 100, 2)
        }


if __name__ == "__main__":
    detector = DiseaseDetector()

    test_image = "ML/test_leaf.jpg"

    if os.path.exists(test_image):
        result = detector.predict(test_image)
        print(result)
    else:
        print(f"Không tìm thấy {test_image}")