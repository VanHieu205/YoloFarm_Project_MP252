import numpy as np
import os
import joblib
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from src import config
from tensorflow.keras.callbacks import ModelCheckpoint

# Đặc trưng đầu vào dựa trên dữ liệu bạn đang có
FEATURES = ["State_Name", "Crop_Year", "Season", "Crop", "Soil_Moisture", "Temperature", "Humidity"]

def create_grouped_sequences(df, scaler_X, scaler_y, time_steps=3):
    """Tạo chuỗi dữ liệu theo từng nhóm Tỉnh và Loại cây."""
    X_seq, y_seq = [], []
    
    # Nhóm theo State và Crop để đảm bảo tính tuần tự của cùng một thực thể
    grouped = df.groupby(['State_Name', 'Crop'])
    
    for _, group in grouped:
        if len(group) > time_steps:
            # Chuẩn hóa riêng cho từng group dựa trên scaler đã fit chung
            X_scaled = scaler_X.transform(group[FEATURES])
            y_scaled = scaler_y.transform(group[['Yield']])
            
            for i in range(len(group) - time_steps):
                X_seq.append(X_scaled[i : i + time_steps])
                y_seq.append(y_scaled[i + time_steps])
                
    return np.array(X_seq), np.array(y_seq)

def build_lstm_model(input_shape):
    """Kiến trúc mạng LSTM tối ưu cho bài toán Regression."""
    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=input_shape),
        Dropout(0.3),
        BatchNormalization(),
        
        LSTM(64, return_sequences=False),
        Dropout(0.3),
        BatchNormalization(),
        
        Dense(32, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

def train_lstm_model(df, models_dir, time_steps=3):
    # 1. Khởi tạo và Fit Scaler trên toàn bộ dữ liệu trước
    scaler_X = StandardScaler()
    scaler_y = StandardScaler()
    scaler_X.fit(df[FEATURES])
    scaler_y.fit(df[['Yield']])

    # 2. Tạo chuỗi theo nhóm
    print(f"--- Đang tạo chuỗi với time_steps = {time_steps} ---")
    X_seq, y_seq = create_grouped_sequences(df, scaler_X, scaler_y, time_steps)

    if len(X_seq) == 0:
        raise ValueError("Dữ liệu quá ít hoặc không đủ chuỗi thời gian cho time_steps này.")

    # 3. Chia dữ liệu NGẪU NHIÊN (Shuffle) để tập Train/Test có đủ các vùng miền
    X_train, X_test, y_train, y_test = train_test_split(
        X_seq, y_seq, 
        test_size=config.TEST_SIZE, 
        random_state=config.RANDOM_STATE,
        shuffle=True 
    )

    # 4. Xây dựng và huấn luyện
    model = build_lstm_model(input_shape=(X_seq.shape[1], X_seq.shape[2]))
    
    callbacks = [
        EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=5, verbose=1, min_lr=1e-5),
        ModelCheckpoint(os.path.join(models_dir, 'best_lstm_model.keras'), monitor='val_loss', save_best_only=True, verbose=1)
        ]

    print("\n--- Bắt đầu huấn luyện LSTM ---")
    model.fit(
        X_train, y_train,
        epochs=100,
        batch_size=32,
        validation_split=0.1,
        callbacks=callbacks,
        verbose=1
    )

    # 5. Lưu kết quả
    # Dự đoán trên cả 2 tập để lấy chỉ số báo cáo
    y_train_pred_scaled = model.predict(X_train, verbose=0)
    y_test_pred_scaled = model.predict(X_test, verbose=0)

    # Đưa về đơn vị gốc
    y_train_orig = scaler_y.inverse_transform(y_train)
    y_train_pred_orig = scaler_y.inverse_transform(y_train_pred_scaled)
    y_test_orig = scaler_y.inverse_transform(y_test)
    y_test_pred_orig = scaler_y.inverse_transform(y_test_pred_scaled)

    # Tính toán các chỉ số
    r2_train = r2_score(y_train_orig, y_train_pred_orig)
    r2_test = r2_score(y_test_orig, y_test_pred_orig)
    mae_test = mean_absolute_error(y_test_orig, y_test_pred_orig)
    rmse_test = np.sqrt(mean_squared_error(y_test_orig, y_test_pred_orig))

    # Lưu artifacts
    os.makedirs(models_dir, exist_ok=True)
    model.save(os.path.join(models_dir, 'lstm_crop_model.keras'))
    joblib.dump(scaler_X, os.path.join(models_dir, "lstm_scaler_X.pkl"))
    joblib.dump(scaler_y, os.path.join(models_dir, "lstm_scaler_y.pkl"))

    # Trả về thêm metadata để main.py ghi báo cáo
    metadata = {
        "n_train": len(X_train),
        "n_test": len(X_test),
        "r2_train": r2_train,
        "r2_test": r2_test,
        "mae_test": mae_test,
        "rmse_test": rmse_test
    }

    return model, X_test, y_test, scaler_y, metadata
