import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.dirname(CURRENT_DIR)

RANDOM_STATE = 42
TABULAR_DATASET_DIR = os.path.join(ML_DIR, "dataset", "tabular")
TABULAR_MODELS_DIR = os.path.join(ML_DIR, "models", "tabular")
TABULAR_REPORTS_DIR = os.path.join(ML_DIR, "reports", "figures", "tabular")

YIELD_DATA_URL = "https://raw.githubusercontent.com/AbhishekKandoi/Crop-Yield-Prediction-based-on-Indian-Agriculture/main/Crop%20Prediction%20dataset.csv"
RAW_DATA_FILE = "crop_data_raw.csv"
RAW_DATA_PATH = os.path.join(TABULAR_DATASET_DIR, RAW_DATA_FILE)

TABULAR_MODEL_FILE = "rf_crop_yield_model.pkl"
METRICS_REPORT_PATH = os.path.join(
    TABULAR_REPORTS_DIR,
    "training_metrics.txt"
)

TEST_SIZE = 0.2

VISION_DATASET_DIR = os.path.join(ML_DIR, "dataset", "vision")
VISION_MODELS_DIR = os.path.join(ML_DIR, "models", "vision")
VISION_REPORTS_DIR = os.path.join(ML_DIR, "reports", "figures", "vision")

KAGGLE_VISION_DATASET = "emmarex/plantdisease"

VISION_MODEL_FILE = "disease_mobilenet_v2.pth"
VISION_MODEL_PATH = os.path.join(
    VISION_MODELS_DIR,
    VISION_MODEL_FILE
)

VISION_LABELS_FILE = "disease_classes.json"
VISION_LABELS_PATH = os.path.join(
    VISION_MODELS_DIR,
    VISION_LABELS_FILE
)

IMG_SIZE = 224
BATCH_SIZE = 64
EPOCHS = 15
LEARNING_RATE = 1e-4