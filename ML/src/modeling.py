import os
import joblib
import numpy as np


from src import config
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    mean_squared_error
)

def train_model(X, y, models_dir):

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_STATE
    )

    print(f"Train Set (Train): {X_train.shape[0]} samples")
    print(f"Test Set (Test):   {X_test.shape[0]} samples")

    rf_model = RandomForestRegressor(
        n_estimators=500,
        max_depth=None,
        random_state=config.RANDOM_STATE,
        n_jobs=-1
    )


    rf_model.fit(X_train, y_train)

    y_train_pred = rf_model.predict(X_train)
    y_test_pred = rf_model.predict(X_test)

    r2_train = r2_score(y_train, y_train_pred)
    r2_test = r2_score(y_test, y_test_pred)

    mae_test = mean_absolute_error(
        y_test,
        y_test_pred
    )

    rmse_test = np.sqrt(
        mean_squared_error(
            y_test,
            y_test_pred
        )
    )

    report_content = f"""

[ DATA INFORMATION ]
Train Samples : {X_train.shape[0]:>10} samples
Test Samples  : {X_test.shape[0]:>10} samples

[ EVALUATION METRICS ]
R^2 Train      : {r2_train:>10.4f}
R^2 Test       : {r2_test:>10.4f}
Gap Difference : {abs(r2_train - r2_test):>10.4f}

----------------------------------------------------

MAE (Test)     : {mae_test:>10.4f}
RMSE (Test)    : {rmse_test:>10.4f}

[ MODEL CONFIGURATION ]
Algorithm      : Random Forest Regressor
n_estimators   : {rf_model.n_estimators}
max_depth      : {rf_model.max_depth if rf_model.max_depth else 'None'}
random_state   : {config.RANDOM_STATE}

"""

    report_dir = os.path.dirname(
        config.METRICS_REPORT_PATH
    )

    if report_dir and not os.path.exists(report_dir):
        os.makedirs(report_dir, exist_ok=True)

    with open(
        config.METRICS_REPORT_PATH,
        "w",
        encoding="utf-8"
    ) as f:
        f.write(report_content.strip())

    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    model_path = os.path.join(
        models_dir,
        'rf_crop_yield_model.pkl'
    )

    joblib.dump(rf_model, model_path)

    return rf_model