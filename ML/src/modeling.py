import os
import joblib
import numpy as np
import pandas as pd

from src import config

from sklearn.model_selection import (
    train_test_split,
    KFold,
    cross_val_score,
    RandomizedSearchCV,
    GridSearchCV
)

from xgboost import XGBRegressor

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

    print(f"Train Set: {X_train.shape[0]} samples")
    print(f"Test Set : {X_test.shape[0]} samples")
    print("-" * 50)

    base_xgb = XGBRegressor(
        random_state=config.RANDOM_STATE,
        n_jobs=-1
    )

    print("Starting Coarse Tuning")

    coarse_param_grid = {
        'n_estimators': [500, 1000, 1500],
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [5, 7, 9],
        'subsample': [0.6, 0.8, 1.0],
        'colsample_bytree': [0.6, 0.8, 1.0]
    }

    coarse_search = RandomizedSearchCV(
        estimator=base_xgb,
        param_distributions=coarse_param_grid,
        n_iter=15,
        scoring='r2',
        cv=3,
        verbose=1,
        random_state=config.RANDOM_STATE,
        n_jobs=-1
    )

    coarse_search.fit(X_train, y_train)

    best_coarse = coarse_search.best_params_

    print(f"Best Coarse Params: {best_coarse}\n")

    print("Starting Fine Tuning")

    fine_param_grid = {
        'n_estimators': [best_coarse['n_estimators']],
        'learning_rate': [
            max(0.001, best_coarse['learning_rate'] - 0.02),
            best_coarse['learning_rate'],
            best_coarse['learning_rate'] + 0.02
        ],
        'max_depth': [
            max(3, best_coarse['max_depth'] - 1),
            best_coarse['max_depth'],
            best_coarse['max_depth'] + 1
        ],
        'subsample': [best_coarse['subsample']],
        'colsample_bytree': [best_coarse['colsample_bytree']]
    }

    fine_search = GridSearchCV(
        estimator=base_xgb,
        param_grid=fine_param_grid,
        scoring='r2',
        cv=3,
        verbose=1,
        n_jobs=-1
    )

    fine_search.fit(X_train, y_train)

    best_xgb_model = fine_search.best_estimator_
    best_params = fine_search.best_params_

    print(f"Best Fine Params: {best_params}\n")

    print("Evaluating Final Model...")

    y_train_pred = best_xgb_model.predict(X_train)
    y_test_pred = best_xgb_model.predict(X_test)

    r2_train = r2_score(y_train, y_train_pred)
    r2_test = r2_score(y_test, y_test_pred)

    mae_test = mean_absolute_error(y_test, y_test_pred)

    rmse_test = np.sqrt(
        mean_squared_error(y_test, y_test_pred)
    )

    print("Running 5-Fold Cross Validation")

    kf = KFold(
        n_splits=5,
        shuffle=True,
        random_state=config.RANDOM_STATE
    )

    cv_scores = cross_val_score(
        best_xgb_model,
        X_train,
        y_train,
        cv=kf,
        scoring='r2'
    )

    cv_mean = cv_scores.mean()

    report_content = f"""
[ DATA INFORMATION ]

Train Samples : {X_train.shape[0]:>10} samples
Test Samples  : {X_test.shape[0]:>10} samples
Features      : {X_test.shape[1]:>10} features

[ TUNING PROCESS ]

Coarse Params : {best_coarse}
Fine Params   : {best_params}

[ EVALUATION METRICS ]

R^2 Train      : {r2_train:>10.4f}
R^2 Test       : {r2_test:>10.4f}
5-Fold CV R^2  : {cv_mean:>10.4f}
Gap Difference : {abs(r2_train - r2_test):>10.4f}

----------------------------------------------------

MAE (Test)     : {mae_test:>10.4f}
RMSE (Test)    : {rmse_test:>10.4f}

[ MODEL CONFIGURATION ]

Algorithm      : XGBoost Regressor
Learning Rate  : {best_xgb_model.learning_rate}
Max Depth      : {best_xgb_model.max_depth}
N Estimators   : {best_xgb_model.n_estimators}
Subsample      : {best_xgb_model.subsample}
Colsample      : {best_xgb_model.colsample_bytree}
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
        'xgb_crop_yield_model.pkl'
    )

    joblib.dump(best_xgb_model, model_path)

    print("\nModel and report exported successfully")
    print(f"R2 Test Score: {r2_test:.4f}")

    return best_xgb_model