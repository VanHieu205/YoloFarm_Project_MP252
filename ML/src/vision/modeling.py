import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models
from ML.src import config


def build_model(num_classes):
    model = models.mobilenet_v2(
        weights=models.MobileNet_V2_Weights.DEFAULT
    )

    for param in model.features.parameters():
        param.requires_grad = False

    for param in model.features[-3:].parameters():
        param.requires_grad = True

    model.classifier[1] = nn.Linear(
        model.last_channel,
        num_classes
    )

    return model


def evaluate(model, loader, criterion, device):
    model.eval()

    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for inputs, labels in loader:
            inputs = inputs.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)

            outputs = model(inputs)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * inputs.size(0)

            _, predicted = torch.max(outputs, 1)

            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    loss = running_loss / len(loader.dataset)
    acc = correct / total

    return loss, acc


def train_model(model, train_loader, val_loader):
    device = torch.device(
        "cuda" if torch.cuda.is_available()
        else "cpu"
    )

    print("Using device:", device)

    if torch.cuda.is_available():
        print(
            "GPU:",
            torch.cuda.get_device_name(0)
        )

    model = model.to(device)

    criterion = nn.CrossEntropyLoss()

    optimizer = optim.Adam(
        filter(
            lambda p: p.requires_grad,
            model.parameters()
        ),
        lr=config.LEARNING_RATE
    )

    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode="max",
        factor=0.5,
        patience=2
    )

    scaler = torch.amp.GradScaler(
        "cuda",
        enabled=torch.cuda.is_available()
    )

    best_val_acc = 0.0
    patience_counter = 0
    early_stop_patience = 5

    for epoch in range(config.EPOCHS):

        model.train()

        train_loss = 0.0
        correct = 0
        total = 0

        for i, (inputs, labels) in enumerate(train_loader):

            inputs = inputs.to(
                device,
                non_blocking=True
            )

            labels = labels.to(
                device,
                non_blocking=True
            )

            optimizer.zero_grad()

            with torch.amp.autocast(
                "cuda",
                enabled=torch.cuda.is_available()
            ):
                outputs = model(inputs)
                loss = criterion(
                    outputs,
                    labels
                )

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            train_loss += (
                loss.item() *
                inputs.size(0)
            )

            _, predicted = torch.max(
                outputs,
                1
            )

            total += labels.size(0)

            correct += (
                predicted == labels
            ).sum().item()

            if (i + 1) % 20 == 0:
                print(
                    f"Batch "
                    f"{i+1}/"
                    f"{len(train_loader)}"
                )

        train_loss /= len(
            train_loader.dataset
        )

        train_acc = correct / total

        val_loss, val_acc = evaluate(
            model,
            val_loader,
            criterion,
            device
        )

        scheduler.step(val_acc)

        print(
            f"\nEpoch "
            f"{epoch+1}/"
            f"{config.EPOCHS}"
            f"\nTrain Loss: "
            f"{train_loss:.4f}"
            f" | Train Acc: "
            f"{train_acc:.4f}"
            f"\nVal Loss: "
            f"{val_loss:.4f}"
            f" | Val Acc: "
            f"{val_acc:.4f}"
        )

        if val_acc > best_val_acc:

            best_val_acc = val_acc
            patience_counter = 0

            torch.save(
                model.state_dict(),
                config.VISION_MODEL_PATH
            )

            print(
                f"[*] Saved best model "
                f"(Val Acc="
                f"{best_val_acc:.4f})"
            )

        else:
            patience_counter += 1

        if (
            patience_counter >=
            early_stop_patience
        ):
            print(
                "Early stopping!"
            )
            break

    return model