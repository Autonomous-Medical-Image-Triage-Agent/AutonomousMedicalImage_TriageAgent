# Autonomous Medical Image Triage Agent

**Multi-Label Chest X-Ray Classification using Deep Learning + RAG + Agentic AI**

A CNN-based pathology detection system that analyzes chest X-rays to detect multiple pathological conditions, prioritize cases by urgency, and provide evidence-based recommendations using RAG pipeline.

## Authors
- Vishal Kumar
- Deepashree Srinivasa Rao Rannore

**Course:** DS 5500 - Data Science Capstone
**Institution:** Northeastern University

---

## Problem Statement

Radiologists are overwhelmed with massive scan volumes, and critical cases often wait hours in the queue alongside routine cases. Our system analyzes chest X-rays to detect pathological conditions, prioritize life-threatening cases for immediate attention, and provide evidence-based clinical recommendations.

---

## Dataset

**CheXpert** (Stanford ML Group)
- 224,316 chest radiographs from 65,240 patients
- 14 pathology labels with uncertainty annotations
- Source: [Kaggle](https://www.kaggle.com/datasets/willarevalo/chexpert-v10-small)

### Target Pathologies
- Cardiomegaly
- Pneumonia
- Pneumothorax
- Edema
- Pleural Effusion

---

## Model Architecture

| Model | Parameters | Best AUC |
|-------|------------|----------|
| **EfficientNet-B0** | 5.3M | **0.878** |
| EfficientNet-B3 | 12M | 0.875 |
| ResNet-50 | 25M | 0.867 |
| DenseNet-121 | 7M | 0.861 |
| **Ensemble (4 models)** | - | **0.8827** |

---

## Results

### Ensemble AUC — Above Baseline ✅

| Method | AUC |
|--------|-----|
| Plain Ensemble | **0.8825** |
| Weighted Ensemble | **0.8827** |
| CheXpert Baseline | 0.8500 |

### Per-Class AUC (Best Model: EfficientNet-B0)

| Pathology | AUC |
|-----------|-----|
| Edema | **0.942** |
| Pleural Effusion | **0.927** |
| Pneumothorax | 0.859 |
| Pneumonia | 0.841 |
| Cardiomegaly | 0.822 |

---

## Key Features

- **Transfer Learning**: ImageNet pretrained weights
- **4-Model Ensemble**: DenseNet-121, EfficientNet-B0, ResNet-50, EfficientNet-B3
- **Weighted Ensemble**: Better models get more influence on final prediction
- **Early Stopping**: Patience=5 to prevent overfitting
- **Cosine Annealing with Warm Restarts**: Better LR scheduling
- **Label Smoothing**: Reduces overconfidence on uncertain medical labels
- **Class-Weighted Loss**: Handles class imbalance via BCEWithLogitsLoss
- **RAG Pipeline**: Evidence-based clinical recommendations
- **Agentic Workflow**: Autonomous triage and specialist routing

---

## Project Structure

```
├── notebooks/
│   ├── chexpert_classification_final.ipynb    # Training notebook
│   ├── rag_agentic_final.ipynb                # RAG + Agentic pipeline
│   └── frontend.ipynb                         # Demo frontend
├── outputs/
│   ├── densenet_121_best.pth
│   ├── efficientnet_b0_best.pth
│   ├── efficientnet_b3_best.pth
│   ├── resnet_50_best.pth
│   ├── training_history.json
│   ├── model_comparison.csv
│   ├── training_curves.png
│   ├── model_comparison.png
│   └── per_class_all_models.png
└── README.md
```

---

## Setup & Usage

### 1. Clone Repository
```bash
git clone https://github.com/zavisk/AutonomousMedicalImage_TriageAgent.git
```

### 2. Open in Google Colab
- Upload notebook to Colab
- Select GPU runtime (A100 recommended)
- Mount Google Drive for saving checkpoints

### 3. Configure Kaggle API
```python
kaggle_credentials = {
    "username": "YOUR_USERNAME",
    "key": "YOUR_API_KEY"
}
```

### 4. Run All Cells
Training takes ~2-3 hours per model on A100 GPU with early stopping.

---

## Technologies

- PyTorch
- torchvision
- scikit-learn
- pandas
- matplotlib
- LangChain
- ChromaDB
- Sentence Transformers
- Gradio

---

## References

1. Rajpurkar, P., et al. (2017). CheXNet: Radiologist-level pneumonia detection on chest X-rays with deep learning.
2. Irvin, J., et al. (2019). CheXpert: A large chest radiograph dataset with uncertainty labels.
3. Tan, M., & Le, Q. (2019). EfficientNet: Rethinking model scaling for convolutional neural networks.
