# MediScan AI — Autonomous Medical Image Triage Agent

**Multi-Label Chest X-Ray Classification using Deep Learning + RAG + Agentic AI**

A full-stack autonomous triage system that analyzes chest X-rays to detect 5 critical pathologies, assign urgency levels, route to the right specialist, and provide evidence-based clinical recommendations — all in under 2 seconds.

## Authors
- Vishal Kumar
- Deepashree Srinivasa Rao Rannore

---

## Problem Statement

Radiologists are overwhelmed with massive scan volumes, and critical cases often wait hours in the queue alongside routine cases. Our system analyzes chest X-rays to detect pathological conditions, prioritize life-threatening cases for immediate attention, and provide evidence-based clinical recommendations.

---

## Live Demo

- **Frontend**: Next.js 14 app with split-panel analysis, interactive report, and RAG chatbot
- **Backend**: FastAPI with 4-model PyTorch ensemble + OpenRouter-powered chat

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
- **RAG Chatbot**: Scoped medical Q&A powered by OpenRouter
- **Agentic Workflow**: Autonomous triage and specialist routing
- **Interactive UI**: FAANG-level Next.js frontend with dark/light mode

---

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Framer Motion
- Recharts

### Backend
- FastAPI + Uvicorn
- PyTorch (DenseNet-121, EfficientNet-B0/B3, ResNet-50)
- OpenRouter API (Claude / GPT-4o-mini)
- httpx, Pillow

---

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI server with /analyze and /chat endpoints
│   ├── pipeline.py          # 4-model ensemble inference pipeline
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx         # Root page
│       │   ├── layout.tsx       # Root layout
│       │   ├── globals.css      # Theme + animations
│       │   └── report/page.tsx  # Full interactive report page
│       ├── components/
│       │   ├── LandingHero.tsx       # Landing page
│       │   ├── XrayApp.tsx           # Split-panel analysis app
│       │   ├── FloatingChat.tsx      # RAG chatbot widget
│       │   ├── ThemeToggle.tsx       # Dark/light mode toggle
│       │   ├── PathologyChart.tsx    # Confidence bar chart
│       │   └── ModelAgreementChart.tsx
│       └── lib/types.ts         # TypeScript interfaces
├── chexpert_classification_final.ipynb   # Model training
├── rag_agentic_final.ipynb               # RAG pipeline
└── README.md
```

---

## Setup & Usage

### Backend
```bash
cd backend
pip install -r requirements.txt
TOKENIZERS_PARALLELISM=false uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## References

1. Rajpurkar, P., et al. (2017). CheXNet: Radiologist-level pneumonia detection on chest X-rays with deep learning.
2. Irvin, J., et al. (2019). CheXpert: A large chest radiograph dataset with uncertainty labels.
3. Tan, M., & Le, Q. (2019). EfficientNet: Rethinking model scaling for convolutional neural networks.
