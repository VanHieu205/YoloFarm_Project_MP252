import os
import shutil
import kagglehub

BASE_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        ".."
    )
)

def download_and_setup_plantdoc():
    cache_path = kagglehub.dataset_download(
        "nirmalsankalana/plantdoc-dataset"
    )

    dest_dir = os.path.join(
        BASE_DIR,
        "dataset",
        "vision",
        "PlantDoc_raw"
    )

    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)

    train_path = os.path.join(cache_path, "train")

    if os.path.exists(train_path):
        shutil.copytree(train_path, dest_dir)
    else:
        shutil.copytree(cache_path, dest_dir)

if __name__ == "__main__":
    download_and_setup_plantdoc()