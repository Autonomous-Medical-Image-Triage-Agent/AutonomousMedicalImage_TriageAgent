import os
import io
import uuid
import logging
from typing import List, Optional
from pydantic import BaseModel

import httpx
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_pipeline = None


def get_pipeline():
    global _pipeline
    if _pipeline is None:
        from pipeline import TriagePipeline
        model_dir = os.environ.get("MODEL_DIR", "./models")
        logger.info("Loading triage pipeline...")
        _pipeline = TriagePipeline(model_dir=model_dir)
        logger.info("Pipeline ready.")
    return _pipeline


app = FastAPI(
    title="Medical Image Triage API",
    description="Autonomous chest X-ray triage agent",
    version="1.0.0",
)

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    patient_id: str = Form(default=""),
):
    pipeline = get_pipeline()

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 20 MB)")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image")

    pid = patient_id.strip() or f"PT-{uuid.uuid4().hex[:8].upper()}"

    try:
        result = pipeline.run(image=image, patient_id=pid)
    except Exception as e:
        logger.exception("Pipeline error")
        raise HTTPException(status_code=500, detail=str(e))

    # Strip em dashes from all string fields
    def _strip_dashes(obj):
        if isinstance(obj, str):
            return obj.replace("\u2014", "-").replace("\u2013", "-")
        if isinstance(obj, dict):
            return {k: _strip_dashes(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_strip_dashes(i) for i in obj]
        return obj

    result = _strip_dashes(result)

    return JSONResponse(content=result)


# ─── OpenRouter-powered RAG Chat ──────────────────────────────────────────────

from pipeline import MEDICAL_KNOWLEDGE_BASE

OPENROUTER_API_KEY = os.environ.get(
    "OPENROUTER_API_KEY",
    "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"
)
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_URL   = "https://openrouter.ai/api/v1/chat/completions"

# Build static knowledge base string once at startup
_KB_TEXT = "\n\n".join(
    f"[{doc['id']}]\n{doc['text']}" for doc in MEDICAL_KNOWLEDGE_BASE
)

SYSTEM_PROMPT = f"""You are MediScan Assistant, the AI helper embedded in the MediScan AI chest X-ray triage platform.

Your knowledge is strictly limited to the following 5 pathologies detected by this system, plus triage and specialist-routing guidelines:
1. Pneumothorax (collapsed lung)
2. Pulmonary Edema (fluid in lungs)
3. Pneumonia (lung infection)
4. Cardiomegaly (enlarged heart)
5. Pleural Effusion (fluid around lungs)

You also know about urgency levels (CRITICAL, URGENT, MODERATE, ROUTINE) and specialist routing.

CLINICAL KNOWLEDGE BASE (use this as your primary source):
{_KB_TEXT}

RULES — follow these strictly:
- Only answer questions about the 5 conditions above, triage levels, specialist routing, or how to read this system's results.
- If asked anything outside this scope (general health, other diseases, personal advice, coding, etc.), politely decline and redirect.
- Keep answers concise, clear, and clinically accurate.
- Use bullet points for lists. Use **bold** for key terms.
- Never make up clinical information not present in the knowledge base.
- Always add a brief disclaimer that this is for educational/research purposes only.
- Do NOT use em dashes (—). Use a simple hyphen (-) or comma instead.
"""

IN_SCOPE_KEYWORDS = [
    "pneumothorax", "edema", "pneumonia", "cardiomegaly", "pleural", "effusion",
    "triage", "urgency", "critical", "urgent", "moderate", "routine",
    "x-ray", "xray", "chest", "lung", "heart", "breathing", "dyspnea",
    "treatment", "symptom", "diagnosis", "precaution", "prevent", "cause",
    "sign", "manage", "specialist", "what is", "how to", "define", "explain",
    "tell me", "describe", "scan", "radiology", "radiograph", "finding",
    "detect", "result", "report", "evidence", "antibiotic", "diuretic",
    "thoracentesis", "echocardiogram", "curb", "effusion", "collapse",
    "oxygen", "fluid", "cardiac", "infection", "consolidation",
]


def is_in_scope(query: str) -> bool:
    q = query.lower()
    return any(kw in q for kw in IN_SCOPE_KEYWORDS)


class HistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[HistoryMessage]] = []


async def call_openrouter(messages: list) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "MediScan AI",
        "Content-Type": "application/json",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": 600,
        "temperature": 0.4,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


OUT_OF_SCOPE_REPLY = (
    "I'm **MediScan Assistant** - I'm scoped to this project only.\n\n"
    "I can help you with:\n"
    "- **Pneumothorax**, **Pulmonary Edema**, **Pneumonia**, **Cardiomegaly**, **Pleural Effusion**\n"
    "- Triage urgency levels (CRITICAL, URGENT, MODERATE, ROUTINE)\n"
    "- Specialist routing and clinical management\n\n"
    "Please ask something related to chest X-ray findings or these 5 conditions."
)


@app.post("/chat")
async def chat(req: ChatRequest):
    query = req.message.strip()
    if not query:
        return JSONResponse(content={"reply": "Please type a question."})

    if not is_in_scope(query):
        return JSONResponse(content={"reply": OUT_OF_SCOPE_REPLY})

    # Build message list: system + prior history + new user message
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for h in (req.history or []):
        if h.role in ("user", "assistant"):
            messages.append({"role": h.role, "content": h.content})

    messages.append({"role": "user", "content": query})

    try:
        reply = await call_openrouter(messages)
        # Strip em dashes just in case the LLM sneaks them in
        reply = reply.replace("\u2014", "-").replace("\u2013", "-")
    except Exception as e:
        logger.exception("OpenRouter error")
        reply = f"Sorry, the AI assistant is temporarily unavailable. ({e})"

    return JSONResponse(content={"reply": reply})
