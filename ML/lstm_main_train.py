import numpy as np
from src import config
from src.data_loader import load_and_save_data
from src.lstm_preprocessor import clean_and_prepare_data
from src.lstm_modeling import train_lstm_model
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import os
import random
import tensorflow as tf


def set_seed(seed=42):
    os.environ['PYTHONHASHSEED'] = str(seed)
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)
    os.environ['TF_DETERMINISTIC_OPS'] = '1'

set_seed(6)


def main():
    # 1. Tải và Sắp xếp dữ liệu (Quan trọng để tạo nhóm)
    df_raw = load_and_save_data(
        url=config.DATA_URL, 
        save_dir=config.DATASET_DIR, 
        file_path=config.RAW_DATA_PATH
    )
    
    # Sắp xếp để các năm của cùng một loại cây ở cùng một tỉnh đứng cạnh nhau
    df_raw = df_raw.sort_values(by=['State_Name', 'Crop', 'Crop_Year'])

    # 2. Tiền xử lý (Mã hóa Season, Crop...)
    # Lưu ý: Hàm này cần trả về DataFrame đầy đủ cột để groupby bên trong modeling
    X, y = clean_and_prepare_data(df_raw, config.MODELS_DIR)
    full_df = X.copy()
    full_df['Yield'] = y.values

    # 3. Huấn luyện LSTM
    model, X_test, y_test, scaler_y, meta = train_lstm_model(full_df, config.MODELS_DIR, time_steps=3)
    # 4. Tạo nội dung báo cáo
    report_content = f"""
[ DATA INFORMATION ]
Train Samples : {meta['n_train']:>10} samples
Test Samples  : {meta['n_test']:>10} samples

[ EVALUATION METRICS ]
R^2 Train      : {meta['r2_train']:>10.4f}
R^2 Test       : {meta['r2_test']:>10.4f}
Gap Difference : {abs(meta['r2_train'] - meta['r2_test']):>10.4f}

----------------------------------------------------

MAE (Test)     : {meta['mae_test']:>10.4f}
RMSE (Test)    : {meta['rmse_test']:>10.4f}

[ MODEL CONFIGURATION ]
Algorithm      : Long Short-Term Memory (LSTM)
Time Steps     : 3
Batch Size     : 32
Optimizer      : Adam
Random State   : {config.RANDOM_STATE}
"""

    # 5. Xuất file báo cáo
    # Sử dụng REPORTS_DIR từ config để tạo folder nếu chưa có
    report_dir = config.REPORTS_DIR
    if not os.path.exists(report_dir):
        os.makedirs(report_dir)

    report_path = os.path.join(report_dir, "lstm_training.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content.strip())

    print(f"\n--- Báo cáo đã được xuất tại: {report_path} ---")
    print(f"R2 Test: {meta['r2_test']:.4f}")

if __name__ == "__main__":
    main()