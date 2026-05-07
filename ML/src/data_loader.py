import pandas as pd
import os

def load_and_save_data(url, save_dir, file_path):
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    if os.path.exists(file_path):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_csv(url)
        df.to_csv(file_path, index=False)
    
    return df