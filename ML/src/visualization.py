import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
import os

plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("muted")

def save_or_show_plot(fig, title, save_dir):
    if save_dir:
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
        filename = title.replace(" ", "_").lower() + ".png"
        filepath = os.path.join(save_dir, filename)
        fig.savefig(filepath, dpi=300, bbox_inches='tight')
    else:
        plt.show()
    plt.close(fig)

def plot_feature_importance(model, feature_names, save_dir=None):
    importances = model.feature_importances_
    
    indices = np.argsort(importances)[::-1]
    sorted_features = [feature_names[i] for i in indices]
    sorted_importances = importances[indices]

    fig, ax = plt.subplots(figsize=(10, 6))
    sns.barplot(x=sorted_importances, y=sorted_features, ax=ax, palette='viridis')
    
    ax.set_title('Mức độ ảnh hưởng của đặc trưng đến năng suất (Feature Importance)', fontsize=14, pad=15)
    ax.set_xlabel('Tầm quan trọng')
    ax.set_ylabel('Đặc trưng')
    
    plt.tight_layout()
    save_or_show_plot(fig, "Feature Importance", save_dir)