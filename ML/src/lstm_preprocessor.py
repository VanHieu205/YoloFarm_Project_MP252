import pandas as pd
import numpy as np
import joblib
import os
from sklearn.preprocessing import LabelEncoder

def remove_outliers_by_crop(df, target_col='Yield'):
    """
    Loại bỏ outliers dựa trên từng loại cây trồng. 
    Năng suất lúa khác hoàn toàn năng suất mía, nên không thể lọc chung.
    """
    df_filtered = pd.DataFrame()
    for crop in df['Crop'].unique():
        crop_data = df[df['Crop'] == crop]
        Q1 = crop_data[target_col].quantile(0.25)
        Q3 = crop_data[target_col].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        filtered_crop_data = crop_data[(crop_data[target_col] >= lower_bound) & 
                                       (crop_data[target_col] <= upper_bound)]
        df_filtered = pd.concat([df_filtered, filtered_crop_data], axis=0)
    
    return df_filtered

def clean_and_prepare_data(df, models_dir):
    """
    """
    # 1. Tính toán Yield và loại bỏ dữ liệu rác
    df_clean = df.dropna(subset=['Area', 'Production']).copy()
    df_clean = df_clean[df_clean['Area'] > 0]
    df_clean['Yield'] = df_clean['Production'] / df_clean['Area']

    # 2. Xử lý khoảng trắng trong text
    for col in ['Season', 'Crop', 'State_Name']:
        if col in df_clean.columns:
            df_clean[col] = df_clean[col].str.strip()

    # 3. Lọc nhiễu thông minh (theo từng loại cây)
    df_clean = remove_outliers_by_crop(df_clean, 'Yield')

    # 4. Feature Engineering: Giữ lại State_Name để mô hình biết về đặc điểm vùng miền
    # Thay vì Drop, chúng ta sẽ mã hóa nó.
    
    label_encoders = {}
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    categorical_cols = ['Season', 'Crop', 'State_Name']
    
    for col in categorical_cols:
        if col in df_clean.columns:
            le = LabelEncoder()
            df_clean[col] = le.fit_transform(df_clean[col])
            label_encoders[col] = le

    # 5. Lưu trữ các encoder và danh sách feature
    joblib.dump(label_encoders, os.path.join(models_dir, 'label_encoders_v2.pkl'))

    # Chọn đặc trưng: Giữ lại Crop_Year vì có thể có xu hướng biến đổi khí hậu theo năm
    features = ['State_Name', 'Crop_Year', 'Season', 'Crop']
    
    # Tích hợp được 3 feature (Nhiệt độ, Độ ẩm không khí, Độ ẩm đất)
    # Hãy thêm chúng vào danh sách features bên dưới:
    additional_features = ['Temperature', 'Humidity', 'Soil_Moisture']
    for f in additional_features:
        if f in df_clean.columns:
            features.append(f)

    X = df_clean[features]
    y = df_clean['Yield']

    joblib.dump(X.columns.tolist(), os.path.join(models_dir, 'model_features_v2.pkl'))

    return X, y