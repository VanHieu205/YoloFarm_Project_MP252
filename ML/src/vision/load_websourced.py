"""
load_websourced.py - Updated với đúng tên folder từ Zenodo dataset
"""

import os
import shutil

WEBSOURCED_RAW_DIR = os.path.join(
    "ML", "dataset", "vision", "WebSourced_raw"
)

PLANTVILLAGE_DIR = os.path.join(
    "ML", "dataset", "vision", "PlantVillage"
)

# ── Mapping đúng theo tên folder thực tế trong dataset ─────
CLASS_MAPPING = {
    # Cà chua
    "tomato leaf bacterial spot":   "Tomato_Bacterial_spot",
    "tomato leaf early blight":     "Tomato_Early_blight",
    "tomato leaf late blight":      "Tomato_Late_blight",
    "tomato leaf mold":             "Tomato_Leaf_Mold",
    "tomato septoria leaf spot":    "Tomato_Septoria_leaf_spot",
    "tomato leaf healthy":          "Tomato_healthy",
    "tomato leaf powdery mildew":   "Tomato_Septoria_leaf_spot",  # gần nhất

    # Khoai tây
    "potato leaf blight":           "Potato___Late_blight",
    "potato leafroll virus":        "Potato___Early_blight",      # gần nhất

    # Bỏ qua: apple, corn (không có trong model hiện tại)
}


def find_raw_dir(base_dir):
    if not os.path.exists(base_dir):
        return None

    # Đi sâu tìm thư mục chứa folder class
    for root, dirs, files in os.walk(base_dir):
        # Kiểm tra nếu có subfolder chứa ảnh
        for d in dirs:
            sub = os.path.join(root, d)
            imgs = [f for f in os.listdir(sub)
                    if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            if imgs:
                return root  # trả về thư mục cha chứa các class folder
    return base_dir


def merge_websourced():
    raw_dir = find_raw_dir(WEBSOURCED_RAW_DIR)

    if raw_dir is None or not os.path.exists(raw_dir):
        print(f"[!] Không tìm thấy dataset tại: {WEBSOURCED_RAW_DIR}")
        return 0

    print(f"[*] Tìm thấy dataset tại: {raw_dir}")

    found_folders = [
        f for f in os.listdir(raw_dir)
        if os.path.isdir(os.path.join(raw_dir, f))
    ]

    total_copied = 0
    skipped = []

    for src_folder in sorted(found_folders):
        dest_class = CLASS_MAPPING.get(src_folder.lower())

        if dest_class is None:
            skipped.append(src_folder)
            continue

        src_path = os.path.join(raw_dir, src_folder)
        dest_path = os.path.join(PLANTVILLAGE_DIR, dest_class)
        os.makedirs(dest_path, exist_ok=True)

        images = [
            f for f in os.listdir(src_path)
            if f.lower().endswith(('.jpg', '.jpeg', '.png'))
        ]

        copied = 0
        for img_name in images:
            dst_file = os.path.join(dest_path, f"ws_{img_name}")
            if not os.path.exists(dst_file):
                shutil.copy2(os.path.join(src_path, img_name), dst_file)
                copied += 1

        total_copied += copied
        print(f"    [✓] {src_folder} → {dest_class} ({copied} ảnh)")

    print(f"\n[✓] Tổng cộng {total_copied} ảnh mới")

    if skipped:
        print(f"\n[~] Bỏ qua {len(skipped)} folder (không có trong model):")
        for f in skipped:
            print(f"    - {f}")

    return total_copied


if __name__ == "__main__":
    total = merge_websourced()
    if total > 0:
        print(f"\n✅ Retrain:")
        print(f"   python -m ML.src.vision.main_vision")