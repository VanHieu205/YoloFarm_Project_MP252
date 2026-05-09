import os
import joblib
import numpy as np

from src import config
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

def train_model(X, y, models_dir):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=config.TEST_SIZE, random_state=config.RANDOM_STATE
    )

    print(f"Train Set (Train): {X_train.shape[0]} samples")
    print(f"Test Set (Test):   {X_test.shape[0]} samples")
    print("-" * 50)

    rf_model = RandomForestRegressor(
        n_estimators=11, 
        random_state=config.RANDOM_STATE,
        n_jobs=-1
    )

    xgb_model = XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        random_state=config.RANDOM_STATE,
        n_jobs=-1
    )

    models_to_train = {
        "rf": rf_model,
        "xgb": xgb_model
    }

    report_content = f"""[ DATA INFORMATION ]
Train Samples : {X_train.shape[0]:>10} samples
Test Samples  : {X_test.shape[0]:>10} samples
Features      : {X_test.shape[1]:>10} features
====================================================
"""

    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    for model_prefix, model in models_to_train.items():
        print(f"Training model {model_prefix.upper()}")
        model.fit(X_train, y_train)

        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)

        r2_train = r2_score(y_train, y_train_pred)
        r2_test = r2_score(y_test, y_test_pred)
        
        n = len(y_test)
        p = X_test.shape[1]
        adj_r2_test = 1 - (1 - r2_test) * (n - 1) / (n - p - 1)

        mae_test = mean_absolute_error(y_test, y_test_pred)
        rmse_test = np.sqrt(mean_squared_error(y_test, y_test_pred))

        report_content += f"\n[ MODEL: {model_prefix.upper()} ]\n"
        
        if model_prefix == "rf":
            report_content += f"Parameters     : n_estimators={model.n_estimators}, random_state={model.random_state}\n"
        elif model_prefix == "xgb":
            report_content += f"Parameters     : n_estimators={model.n_estimators}, learning_rate={model.learning_rate}, max_depth={model.max_depth}\n"

        report_content += f"""----------------------------------------------------
R^2 Train      : {r2_train:>10.4f}
R^2 Test       : {r2_test:>10.4f}
Adj. R^2 Test  : {adj_r2_test:>10.4f}
Gap Difference : {abs(r2_train - r2_test):>10.4f}
MAE (Test)     : {mae_test:>10.4f}
RMSE (Test)    : {rmse_test:>10.4f}
====================================================
"""
        model_path = os.path.join(models_dir, f'{model_prefix}_crop_yield_model.pkl')
        joblib.dump(model, model_path)

    report_dir = os.path.dirname(config.METRICS_REPORT_PATH)
    if report_dir and not os.path.exists(report_dir):
        os.makedirs(report_dir, exist_ok=True)

    with open(config.METRICS_REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report_content.strip())

    return rf_model, xgb_model