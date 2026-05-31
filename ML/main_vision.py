from src import config
from src.vision.data_loader import get_data_loaders
from src.vision.modeling import (
    build_model,
    train_model
)

import os
import json
import random
import numpy as np
import torch

def set_seed(seed=42):
    os.environ["PYTHONHASHSEED"] = str(seed)
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)

    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

set_seed(
    config.RANDOM_STATE
    if hasattr(config, "RANDOM_STATE")
    else 42
)

def main():
    train_loader, val_loader, classes = get_data_loaders(
    data_dir=os.path.join(config.VISION_DATASET_DIR, "PlantVillage"),
    batch_size=config.BATCH_SIZE,
    img_size=config.IMG_SIZE
    )

    print("\nDataset info")
    print("Classes:", classes)
    print("Number of classes:", len(classes))
    print("Train batches:", len(train_loader))
    print("Validation batches:", len(val_loader))

    os.makedirs(config.VISION_MODELS_DIR, exist_ok=True)
    with open(config.VISION_LABELS_PATH, "w", encoding="utf-8") as f:
        json.dump(classes, f, ensure_ascii=False, indent=4)
    print(f"[*] Đã lưu tự điển nhãn vào: {config.VISION_LABELS_PATH}")
    # ==========================================

    model = build_model(
        num_classes=len(classes)
    )

    print("\nModel built: MobileNetV2")

    train_model(
        model,
        train_loader,
        val_loader
    )

if __name__ == "__main__":
    main()