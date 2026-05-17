import os

DATA_URL = "https://raw.githubusercontent.com/AbhishekKandoi/Crop-Yield-Prediction-based-on-Indian-Agriculture/main/Crop%20Prediction%20dataset.csv"
DATASET_DIR = "dataset"
RAW_DATA_FILE = "crop_data_raw.csv"



MODELS_DIR = "models"
MODEL_FILE = "rf_crop_yield_model.pkl"
REPORTS_DIR = "reports/figures"




RAW_DATA_PATH = os.path.join(DATASET_DIR, RAW_DATA_FILE)
METRICS_REPORT_PATH = os.path.join(REPORTS_DIR, "training_metrics.txt")


TEST_SIZE = 0.2
RANDOM_STATE = 42