# MediScan AI — Autonomous Medical Image Triage Agent

**Multi-Label Chest X-Ray Classification using Deep Learning + RAG + Agentic AI**

A full-stack autonomous triage system that analyzes chest X-rays to detect 5 critical pathologies, assign urgency levels, route to the right specialist, and provide evidence-based clinical recommendations — powered by a 4-model CNN ensemble and a RAG-based medical chatbot.

> DS 5500 Capstone · Khoury College of Computer Sciences · Northeastern University · Spring 2026

---

## Authors
- **Vishal Kumar**
- **Deepashree Srinivasa Rao Rannore**

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://mediscan-ai-frontend-pi.vercel.app |
| Backend API (Railway) | `/analyze` · `/chat` · `/health` |

---

## Problem Statement

Radiologists are overwhelmed with massive scan volumes, and critical cases often wait hours in the queue alongside routine cases. MediScan AI analyzes chest X-rays to:
- Detect pathological conditions across 5 clinically significant classes
- Prioritize life-threatening cases for immediate radiologist attention
- Provide evidence-based clinical recommendations via a RAG chatbot
- Route cases to the appropriate specialist automatically

---

## Results

### Ensemble Performance

| Method | Mean AUC-ROC |
|--------|-------------|
| **Weighted Ensemble (4 models)** | **0.8827** |
| Plain Ensemble | 0.8825 |
| CheXpert Baseline | 0.8500 |

### Individual Model AUC-ROC

| Model | Parameters | AUC-ROC |
|-------|-----------|---------|
| **EfficientNet-B0** | 5.3M | **0.878** |
| EfficientNet-B3 | 12M | 0.875 |
| ResNet-50 | 25M | 0.867 |
| DenseNet-121 | 7M | 0.861 |

### Per-Class AUC-ROC (Best Model: EfficientNet-B0)

| Pathology | AUC-ROC |
|-----------|---------|
| Edema | 0.942 |
| Pleural Effusion | 0.927 |
| Pneumothorax | 0.859 |
| Pneumonia | 0.841 |
| Cardiomegaly | 0.822 |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                   │
│         (Upload · Analysis Panel · RAG Chatbot)          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (REST)
┌────────────────────────▼────────────────────────────────┐
│                   FastAPI Backend                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │            4-Model CNN Ensemble                  │    │
│  │  DenseNet-121 · EfficientNet-B0/B3 · ResNet-50  │    │
│  │           Weighted average → triage              │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              RAG Pipeline                        │    │
│  │  ChromaDB · all-MiniLM-L6-v2 · OpenRouter       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Dataset

**CheXpert** (Stanford ML Group)
- 224,316 chest radiographs from 65,240 patients
- 14 pathology labels with uncertainty annotations
- Source: [Kaggle — CheXpert v1.0 Small](https://www.kaggle.com/datasets/willarevalo/chexpert-v10-small)

**Target Pathologies:** Cardiomegaly · Pneumonia · Pneumothorax · Edema · Pleural Effusion

---

## Key Features

- **4-Model Ensemble**: DenseNet-121, EfficientNet-B0, EfficientNet-B3, ResNet-50 with weighted averaging
- **Transfer Learning**: ImageNet pretrained weights fine-tuned on CheXpert
- **RAG Chatbot**: Scoped medical Q&A powered by ChromaDB + sentence-transformers + OpenRouter (GPT-4o-mini)
- **Agentic Triage**: Urgency scoring (CRITICAL / HIGH / MODERATE / ROUTINE) + specialist routing
- **Dynamic Quantization**: int8 quantization for CPU deployment (4x memory reduction on Railway)
- **Interactive UI**: Split-panel analysis, per-model confidence chart, evidence citations, dark/light mode

### Training Optimizations
- Cosine Annealing with Warm Restarts (LR scheduling)
- Label Smoothing (reduces overconfidence on uncertain labels)
- Class-Weighted BCEWithLogitsLoss (handles class imbalance)
- Early Stopping (patience = 5)

---

## Tech Stack

### Frontend
- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Framer Motion · Recharts · Lucide React

### Backend
- FastAPI + Uvicorn
- PyTorch (CPU, dynamic int8 quantization)
- sentence-transformers (`all-MiniLM-L6-v2`)
- ChromaDB (vector store for RAG)
- OpenRouter API (GPT-4o-mini)
- gdown (auto model weight download from Google Drive)

### Infrastructure
- Backend: Railway (Docker, CPU)
- Frontend: Vercel

---

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI server (/analyze, /chat, /health)
│   ├── pipeline.py              # 4-model ensemble inference pipeline
│   ├── download_weights.py      # Auto-downloads model weights from Google Drive
│   ├── Dockerfile               # Docker config for Railway deployment
│   ├── railway.toml             # Railway service config
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Root page
│       │   ├── layout.tsx           # Root layout
│       │   └── globals.css          # Theme + animations
│       ├── components/
│       │   ├── LandingHero.tsx          # Landing page
│       │   ├── XrayApp.tsx              # Split-panel analysis app
│       │   ├── ImageUploader.tsx        # Drag-and-drop X-ray upload
│       │   ├── FloatingChat.tsx         # RAG chatbot widget
│       │   ├── PathologyChart.tsx       # Confidence bar chart
│       │   ├── ModelAgreementChart.tsx  # Per-model agreement heatmap
│       │   └── ThemeToggle.tsx          # Dark/light mode toggle
│       └── lib/types.ts             # TypeScript interfaces
├── chexpert_classification_final.ipynb   # Model training + evaluation
├── rag_agentic_final.ipynb               # RAG pipeline construction
├── Requirements.txt
└── README.md
```

---

## Setup & Usage

### Prerequisites
- Python 3.10+
- Node.js 18+
- ~2 GB free disk space (model weights)

### Backend

```bash
cd backend
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env

# Model weights are downloaded automatically on first startup
TOKENIZERS_PARALLELISM=false uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Set backend URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Open http://localhost:3000

### Docker (Backend)

```bash
cd backend
docker build -t mediscan-backend .
docker run -p 8000:8000 --env-file .env mediscan-backend
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key for GPT-4o-mini |
| `MODEL_DIR` | Path to model weights directory (default: `./models`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | Upload chest X-ray, returns pathology predictions + triage level |
| `POST` | `/chat` | RAG-powered medical Q&A |
| `GET` | `/health` | Health check |

---

## References

1. Irvin, J., et al. (2019). CheXpert: A Large Chest Radiograph Dataset with Uncertainty Labels. *AAAI*.
2. Rajpurkar, P., et al. (2017). CheXNet: Radiologist-Level Pneumonia Detection on Chest X-Rays with Deep Learning. *arXiv*.
3. Tan, M., & Le, Q. (2019). EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks. *ICML*.
4. He, K., et al. (2016). Deep Residual Learning for Image Recognition. *CVPR*.
5. Huang, G., et al. (2017). Densely Connected Convolutional Networks. *CVPR*.
6. Lewis, P., et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *NeurIPS*.
