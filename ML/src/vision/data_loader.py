from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split, WeightedRandomSampler
import torch
import numpy as np
import os

def get_data_loaders(data_dir, batch_size, img_size, seed=42):
    
    train_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomAffine(
            degrees=25,
            translate=(0.1, 0.1),
            scale=(0.8, 1.2)
        ),
        transforms.ColorJitter(
            brightness=0.3,
            contrast=0.3,
            saturation=0.3,
            hue=0.1
        ),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
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


    train_data.dataset.transform = train_transform
    val_data.dataset.transform = val_transform

    targets = [label for _, label in train_data]
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