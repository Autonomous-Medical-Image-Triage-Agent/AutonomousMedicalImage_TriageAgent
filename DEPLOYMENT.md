# Deployment Guide

## Architecture

```
Vercel (Next.js UI)  ──────►  Railway / Render (FastAPI + PyTorch)
     frontend/                        backend/
```

---

## 1. Prepare model weights

After training (or if you already have `.pth` files), place them into `backend/models/`:

```
backend/models/
├── densenet_121_best.pth
├── efficientnet_b0_best.pth
├── efficientnet_b3_best.pth
└── resnet_50_best.pth
```

The server starts without weights (uses random weights for demo) but predictions will be meaningless. For production, always include your trained checkpoints.

---

## 2. Deploy backend on Railway (recommended)

1. Create a Railway account at railway.app
2. New Project → Deploy from GitHub → select your repo
3. Set the **root directory** to `backend/`
4. Railway auto-detects the `Dockerfile` — no extra config needed
5. Add environment variables in Railway dashboard:
   ```
   MODEL_DIR=/app/models
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
6. If you need persistent model storage, add a Railway Volume mounted at `/app/models` and upload your `.pth` files
7. Copy the public Railway URL (e.g. `https://medical-triage-api.railway.app`)

### Alternative: Render

1. New → Web Service → Connect repo
2. Set root directory to `backend/`
3. Render will use `render.yaml` automatically
4. Set `ALLOWED_ORIGINS` in the Render dashboard
5. Use a Render Disk (5 GB) to persist model weights

---

## 3. Deploy frontend on Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. `cd frontend && vercel`
3. Follow prompts (Next.js auto-detected)
4. Add environment variable in Vercel dashboard or CLI:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
5. Redeploy: `vercel --prod`

Or connect GitHub → Vercel will auto-deploy on every push.

---

## 4. Local development

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # edit as needed
mkdir -p models               # place .pth files here
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                   # opens http://localhost:3000
```

---

## 5. Test the API directly

```bash
# Health check
curl https://your-backend.railway.app/health

# Analyze an image
curl -X POST https://your-backend.railway.app/analyze \
  -F "file=@chest_xray.jpg" \
  -F "patient_id=PT-001"
```

