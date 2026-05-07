import pandas as pd
import joblib
import os
from sklearn.preprocessing import LabelEncoder

def remove_outliers(df, column_name):
    Q1 = df[column_name].quantile(0.25)
    Q3 = df[column_name].quantile(0.75)
    IQR = Q3 - Q1
    
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    df_filtered = df[(df[column_name] >= lower_bound) & (df[column_name] <= upper_bound)]
    
    return df_filtered



def clean_and_prepare_data(df, models_dir):
    df_clean = df.dropna(subset=['Area', 'Production']).copy()

    df_clean = df_clean[df_clean['Area'] > 0]

    target_col = 'Yield'
    df_clean[target_col] = df_clean['Production'] / df_clean['Area']
    df_clean = remove_outliers(df_clean, 'Yield')
    if 'Season' in df_clean.columns:
        df_clean['Season'] = df_clean['Season'].str.strip()

    if 'Crop' in df_clean.columns:
        df_clean['Crop'] = df_clean['Crop'].str.strip()

    cols_to_drop = ['State_Name', 'District_Name', 'Crop_Year', 'Area', 'Production']
    df_clean = df_clean.drop(columns=cols_to_drop, errors='ignore')

    label_encoders = {}

    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    for col in ['Season', 'Crop']:
        if col in df_clean.columns:
            le = LabelEncoder()
            df_clean[col] = le.fit_transform(df_clean[col])
            label_encoders[col] = le

    joblib.dump(label_encoders, os.path.join(models_dir, 'label_encoders.pkl'))

    X = df_clean.drop(columns=[target_col])
    y = df_clean[target_col]

    joblib.dump(X.columns.tolist(), os.path.join(models_dir, 'model_features.pkl'))


    return X, y