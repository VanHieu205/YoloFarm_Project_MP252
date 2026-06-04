import os
import shutil

PLANTVILLAGE_DIR = os.path.join(
    "ML", "dataset", "vision", "PlantVillage"
)

PLANTDOC_DIR = os.path.join(
    "ML", "dataset", "vision", "PlantDoc_raw"
)

CLASS_MAPPING = {
    "Tomato_leaf_late_blight": "Tomato_Late_blight",
    "Tomato_leaf_yellow_virus": "Tomato__Tomato_YellowLeaf__Curl_Virus",
    "Tomato_leaf_mosaic_virus": "Tomato__Tomato_mosaic_virus",
    "Tomato_leaf_bacterial_spot": "Tomato_Bacterial_spot",
    "Tomato_Early_blight_leaf": "Tomato_Early_blight",
    "Tomato_Septoria_leaf_spot": "Tomato_Septoria_leaf_spot",
    "Tomato_leaf": "Tomato_healthy",
    "Tomato_mold_leaf": "Tomato_Leaf_Mold",

    "Potato_leaf_early_blight": "Potato___Early_blight",
    "Potato_leaf_late_blight": "Potato___Late_blight",

    "Bell_pepper_leaf_spot": "Pepper__bell___Bacterial_spot",
    "Bell_pepper_leaf": "Pepper__bell___healthy",
}

def merge_datasets():
    if not os.path.exists(PLANTDOC_DIR):
        print(0)
        return

    total = 0

    for doc_folder, village_folder in CLASS_MAPPING.items():
        source_path = os.path.join(PLANTDOC_DIR, doc_folder)
        dest_path = os.path.join(PLANTVILLAGE_DIR, village_folder)

        if not os.path.exists(source_path):
            continue

        os.makedirs(dest_path, exist_ok=True)

        images = [
            f for f in os.listdir(source_path)
            if f.lower().endswith(('.png', '.jpg', '.jpeg'))
        ]

        for img_name in images:
            src_file = os.path.join(source_path, img_name)
            dst_file = os.path.join(dest_path, f"pd_{img_name}")
            shutil.copy2(src_file, dst_file)
            total += 1

    print(total)

if __name__ == "__main__":
    merge_datasets()