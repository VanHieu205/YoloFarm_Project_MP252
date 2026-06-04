from src import config
from src.tabular.data_loader import load_and_save_data
from src.tabular.preprocessor import clean_and_prepare_data
from src.tabular.modeling import train_model

import os
import random
import numpy as np


def set_seed(seed=42):
    os.environ["PYTHONHASHSEED"] = str(seed)
    random.seed(seed)
    np.random.seed(seed)


set_seed(
    config.RANDOM_STATE
    if hasattr(config, "RANDOM_STATE")
    else 42
)


def main():
    df = load_and_save_data(
        url=config.YIELD_DATA_URL,
        save_dir=config.TABULAR_DATASET_DIR,
        file_path=config.RAW_DATA_PATH
    )

    print(df.head())

    X_train, X_test, y_train, y_test = clean_and_prepare_data(
        df=df,
        models_dir=config.TABULAR_MODELS_DIR
    )

    best_model = train_model(
        X_train,
        X_test,
        y_train,
        y_test,
        config.TABULAR_MODELS_DIR
    )


if __name__ == "__main__":
    main()