from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split, WeightedRandomSampler
import torch
import numpy as np
import os


def get_data_loaders(data_dir, batch_size, img_size, seed=42):

    train_transform = transforms.Compose([
        # --- Resize lớn hơn rồi crop ngẫu nhiên ---
        # Giúp model học các vùng khác nhau của lá,
        # không bị overfit vào center như ảnh lab
        transforms.Resize((img_size + 64, img_size + 64)),
        transforms.RandomCrop(img_size),

        # --- Flip & Affine (giữ nguyên) ---
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomAffine(
            degrees=30,
            translate=(0.15, 0.15),
            scale=(0.7, 1.3),
            shear=10
        ),

        # --- Màu sắc mạnh hơn ---
        # Ảnh thực tế có ánh sáng mặt trời, bóng râm,
        # camera điện thoại khác nhau → cần range lớn hơn
        transforms.ColorJitter(
            brightness=0.4,
            contrast=0.4,
            saturation=0.4,
            hue=0.15
        ),

        # --- Góc chụp nghiêng (THÊM MỚI) ---
        # Ảnh thực tế thường không vuông góc với lá
        transforms.RandomPerspective(
            distortion_scale=0.3,
            p=0.4
        ),

        # --- Blur (THÊM MỚI) ---
        # Giả lập ảnh chụp không nét, rung tay
        transforms.GaussianBlur(
            kernel_size=3,
            sigma=(0.1, 1.5)
        ),

        # --- Sharpen ngược lại (THÊM MỚI) ---
        transforms.RandomAdjustSharpness(
            sharpness_factor=2,
            p=0.3
        ),

        # --- Grayscale hiếm gặp (THÊM MỚI) ---
        # Một số điện thoại chụp thiếu màu
        transforms.RandomGrayscale(p=0.05),

        transforms.ToTensor(),
        transforms.Normalize(
            [0.485, 0.456, 0.406],
            [0.229, 0.224, 0.225]
        ),

        # --- Xóa ngẫu nhiên một vùng nhỏ (THÊM MỚI) ---
        # Giả lập lá bị che khuất bởi lá khác
        transforms.RandomErasing(
            p=0.2,
            scale=(0.02, 0.1),
            ratio=(0.3, 3.3)
        ),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((img_size + 32, img_size + 32)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(
            [0.485, 0.456, 0.406],
            [0.229, 0.224, 0.225]
        )
    ])

    full_dataset = datasets.ImageFolder(root=data_dir)
    classes = full_dataset.classes

    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size

    train_data, val_data = random_split(
        full_dataset,
        [train_size, val_size],
        generator=torch.Generator().manual_seed(seed)
    )

    # Phải set transform riêng cho từng subset
    # Lưu ý: cả 2 đang share cùng 1 dataset object,
    # nên cần dùng wrapper để tránh val bị dùng train_transform
    train_data = _TransformSubset(train_data, train_transform)
    val_data = _TransformSubset(val_data, val_transform)

    # WeightedRandomSampler để cân bằng class
    targets = [full_dataset.targets[i] for i in train_data.subset.indices]
    class_counts = np.bincount(targets)
    weights = 1.0 / class_counts
    sample_weights = [weights[label] for label in targets]

    sampler = WeightedRandomSampler(
        sample_weights,
        num_samples=len(sample_weights),
        replacement=True
    )

    train_loader = DataLoader(
        train_data,
        batch_size=batch_size,
        sampler=sampler,
        num_workers=2,
        pin_memory=True
    )

    val_loader = DataLoader(
        val_data,
        batch_size=batch_size,
        shuffle=False,
        num_workers=2,
        pin_memory=True
    )

    return train_loader, val_loader, classes


class _TransformSubset(torch.utils.data.Dataset):
    """
    Wrapper để apply transform khác nhau cho train/val
    mà không ảnh hưởng lẫn nhau (fix bug transform leak
    trong code gốc).
    """
    def __init__(self, subset, transform):
        self.subset = subset
        self.transform = transform

    def __getitem__(self, idx):
        img, label = self.subset.dataset.loader(
            self.subset.dataset.samples[self.subset.indices[idx]][0]
        ), self.subset.dataset.targets[self.subset.indices[idx]]

        from PIL import Image
        img = Image.open(
            self.subset.dataset.samples[self.subset.indices[idx]][0]
        ).convert("RGB")

        if self.transform:
            img = self.transform(img)

        return img, label

    def __len__(self):
        return len(self.subset)