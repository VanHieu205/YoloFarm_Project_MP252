from src import config
from src.data_loader import load_and_save_data
from src.preprocessor import clean_and_prepare_data
from src.modeling import train_model

def main():
    df = load_and_save_data(
        url=config.DATA_URL, 
        save_dir=config.DATASET_DIR, 
        file_path=config.RAW_DATA_PATH
    )
    print(df.head())
    X, y = clean_and_prepare_data(
        df=df, 
        models_dir=config.MODELS_DIR
    )
    print(X.dtypes)
    print(y.head())
    train_model(X, y, config.MODELS_DIR)
if __name__ == "__main__":
    main()