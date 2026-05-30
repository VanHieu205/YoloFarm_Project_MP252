import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from src import config


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
    df_clean = df.dropna(
        subset=['Area', 'Production']
    ).copy()

    df_clean = df_clean[
        df_clean['Area'] > 0
    ]

    target_col = 'Yield'

    df_clean[target_col] = (
        df_clean['Production'] /
        df_clean['Area']
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

    df_train, df_test = train_test_split(
        df_clean,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_STATE
    )

    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    crop_median_yield = (
        df_train
        .groupby('Crop')[target_col]
        .median()
        .to_dict()
    )

    crop_optimal_temp = {}
    crop_optimal_humid = {}

    if all(
        col in df_train.columns
        for col in ['Temperature', 'Humidity']
    ):
        crop_optimal_temp = (
            df_train
            .groupby('Crop')['Temperature']
            .median()
            .to_dict()
        )

        crop_optimal_humid = (
            df_train
            .groupby('Crop')['Humidity']
            .median()
            .to_dict()
        )

    joblib.dump(
        crop_median_yield,
        os.path.join(
            models_dir,
            'crop_base_yield_dict.pkl'
        )
    )

    joblib.dump(
        crop_optimal_temp,
        os.path.join(
            models_dir,
            'crop_optimal_temp_dict.pkl'
        )
    )

    joblib.dump(
        crop_optimal_humid,
        os.path.join(
            models_dir,
            'crop_optimal_humid_dict.pkl'
        )
    )

    def apply_features(data):
        d = data.copy()

        d['Crop_Base_Yield'] = (
            d['Crop']
            .map(crop_median_yield)
            .fillna(0)
        )

        if all(
            col in d.columns
            for col in [
                'Temperature',
                'Humidity',
                'Soil_Moisture'
            ]
        ):
            opt_temp = (
                d['Crop']
                .map(crop_optimal_temp)
                .fillna(25)
            )

            opt_humid = (
                d['Crop']
                .map(crop_optimal_humid)
                .fillna(60)
            )

            d['Temp_Humid_Index'] = (
                d['Temperature'] *
                d['Humidity']
            )

            d['Soil_Temp_Ratio'] = (
                d['Soil_Moisture'] /
                (d['Temperature'] + 1)
            )

            d['Temp_Stress'] = (
                d['Temperature'] -
                opt_temp
            ) ** 2

            d['Humid_Stress'] = (
                d['Humidity'] -
                opt_humid
            ) ** 2

        cols_to_drop = [
            'State_Name',
            'District_Name',
            'Crop_Year',
            'Area',
            'Production'
        ]

        d = d.drop(
            columns=[
                col for col in cols_to_drop
                if col in d.columns
            ]
        )

        return d

    df_train_processed = apply_features(
        df_train
    )

    df_test_processed = apply_features(
        df_test
    )

    categorical_cols = [
        col for col in [
            'Crop',
            'Season'
        ]
        if col in df_train_processed.columns
    ]

    df_train_processed[
        'is_train_set'
    ] = 1

    df_test_processed[
        'is_train_set'
    ] = 0

    combined_df = pd.concat(
        [
            df_train_processed,
            df_test_processed
        ]
    )

    combined_df = pd.get_dummies(
        combined_df,
        columns=categorical_cols,
        drop_first=False
    )

    train_final = combined_df[
        combined_df['is_train_set'] == 1
    ].drop(
        columns=['is_train_set']
    )

    test_final = combined_df[
        combined_df['is_train_set'] == 0
    ].drop(
        columns=['is_train_set']
    )

    X_train = train_final.drop(
        columns=[target_col]
    )

    y_train = train_final[target_col]

    X_test = test_final.drop(
        columns=[target_col]
    )

    y_test = test_final[target_col]

    joblib.dump(
        X_train.columns.tolist(),
        os.path.join(
            models_dir,
            'model_features.pkl'
        )
    )

    return (
        X_train,
        X_test,
        y_train,
        y_test
    )