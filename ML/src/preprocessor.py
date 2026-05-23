import pandas as pd
import numpy as np
import joblib
import os


def remove_outliers_by_crop(df, target_col='Yield'):
    df_filtered = pd.DataFrame()

    for crop in df['Crop'].unique():
        crop_data = df[df['Crop'] == crop]

        Q1 = crop_data[target_col].quantile(0.25)
        Q3 = crop_data[target_col].quantile(0.75)
        IQR = Q3 - Q1

        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        filtered_crop_data = crop_data[
            (crop_data[target_col] >= lower_bound) &
            (crop_data[target_col] <= upper_bound)
        ]

        df_filtered = pd.concat(
            [df_filtered, filtered_crop_data],
            axis=0
        )

    return df_filtered


def clean_and_prepare_data(df, models_dir):
    df_clean = df.dropna(subset=['Area', 'Production']).copy()

    df_clean = df_clean[df_clean['Area'] > 0]

    target_col = 'Yield'

    df_clean[target_col] = (
        df_clean['Production'] / df_clean['Area']
    )

    if 'Crop' in df_clean.columns:
        df_clean['Crop'] = (
            df_clean['Crop']
            .str.strip()
            .str.lower()
        )

    if 'Season' in df_clean.columns:
        df_clean['Season'] = (
            df_clean['Season']
            .str.strip()
            .str.lower()
        )

    df_clean = remove_outliers_by_crop(
        df_clean,
        target_col
    )

    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    crop_median_yield = (
        df_clean
        .groupby('Crop')[target_col]
        .median()
        .to_dict()
    )

    df_clean['Crop_Base_Yield'] = (
        df_clean['Crop']
        .map(crop_median_yield)
    )

    joblib.dump(
        crop_median_yield,
        os.path.join(
            models_dir,
            'crop_base_yield_dict.pkl'
        )
    )

    if all(
        col in df_clean.columns
        for col in [
            'Temperature',
            'Humidity',
            'Soil_Moisture'
        ]
    ):
        df_clean['Temp_Humid_Index'] = (
            df_clean['Temperature'] *
            df_clean['Humidity']
        )

        df_clean['Soil_Temp_Ratio'] = (
            df_clean['Soil_Moisture'] /
            (df_clean['Temperature'] + 1)
        )

        df_clean['Temp_Stress'] = (
            (df_clean['Temperature'] - 25) ** 2
        )

        df_clean['Humid_Stress'] = (
            (df_clean['Humidity'] - 60) ** 2
        )

    cols_to_drop = [
        'State_Name',
        'District_Name',
        'Crop_Year',
        'Area',
        'Production'
    ]

    df_clean = df_clean.drop(
        columns=[
            col for col in cols_to_drop
            if col in df_clean.columns
        ]
    )

    categorical_cols = [
        col for col in ['Crop', 'Season']
        if col in df_clean.columns
    ]

    df_clean = pd.get_dummies(
        df_clean,
        columns=categorical_cols,
        drop_first=False
    )

    X = df_clean.drop(columns=[target_col])

    y = df_clean[target_col]

    joblib.dump(
        X.columns.tolist(),
        os.path.join(
            models_dir,
            'model_features.pkl'
        )
    )

    return X, y