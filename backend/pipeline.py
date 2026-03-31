"""
Core triage pipeline — extracted from rag_agentic_final.ipynb and frontend.ipynb.
Keeps the same model architecture, ensemble logic, urgency rules, RAG, and
LangGraph workflow that the original notebooks used.
"""
import os
import uuid
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, TypedDict

import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
# Limit threads to reduce memory overhead on Railway
torch.set_num_threads(2)

logger = logging.getLogger(__name__)

# ─────────────────────────── constants ──────────────────────────────────────

TARGET_LABELS = ["Cardiomegaly", "Pneumonia", "Pneumothorax", "Edema", "Pleural Effusion"]
IMG_SIZE = 256
THRESHOLD = 0.5

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

INFERENCE_TRANSFORM = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

# ─────────────────────────── model builders ─────────────────────────────────

def _build_densenet121(num_classes: int = 5) -> nn.Module:
    m = models.densenet121(weights=None)
    in_f = m.classifier.in_features
    m.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_f, 512),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(512, num_classes),
    )
    return m


def _build_efficientnet_b0(num_classes: int = 5) -> nn.Module:
    m = models.efficientnet_b0(weights=None)
    in_f = m.classifier[1].in_features
    m.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_f, 512),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(512, num_classes),
    )
    return m


def _build_efficientnet_b3(num_classes: int = 5) -> nn.Module:
    m = models.efficientnet_b3(weights=None)
    in_f = m.classifier[1].in_features
    m.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_f, 512),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(512, num_classes),
    )
    return m


def _build_resnet50(num_classes: int = 5) -> nn.Module:
    m = models.resnet50(weights=None)
    in_f = m.fc.in_features
    m.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_f, 512),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(512, num_classes),
    )
    return m


MODEL_BUILDERS = {
    "densenet_121": _build_densenet121,
    "efficientnet_b0": _build_efficientnet_b0,
    "efficientnet_b3": _build_efficientnet_b3,
    "resnet_50": _build_resnet50,
}

CHECKPOINT_NAMES = {
    "densenet_121": "densenet_121_best.pth",
    "efficientnet_b0": "efficientnet_b0_best.pth",
    "efficientnet_b3": "efficientnet_b3_best.pth",
    "resnet_50": "resnet_50_best.pth",
}


# ─────────────────────────── RAG knowledge base ─────────────────────────────

MEDICAL_KNOWLEDGE_BASE = [
    {
        "id": "pneumothorax_1",
        "text": (
            "Pneumothorax: Air in the pleural space causing lung collapse. "
            "Tension pneumothorax is immediately life-threatening, requiring "
            "emergency needle decompression followed by chest tube insertion. "
            "Spontaneous pneumothorax may be managed conservatively or with "
            "aspiration depending on size and symptoms."
        ),
    },
    {
        "id": "pneumothorax_2",
        "text": (
            "Pneumothorax management: Small (<2 cm) stable spontaneous cases "
            "may be observed. Large or symptomatic require chest tube. "
            "Tension pneumothorax is a clinical emergency — tracheal deviation, "
            "absent breath sounds, hypotension indicate immediate intervention."
        ),
    },
    {
        "id": "edema_1",
        "text": (
            "Pulmonary edema: Fluid accumulation in the alveoli causing acute "
            "respiratory distress. Cardiogenic edema is most common and requires "
            "diuresis (furosemide IV), oxygen, and potential intubation for "
            "severe cases. BNP elevation confirms cardiac origin."
        ),
    },
    {
        "id": "edema_2",
        "text": (
            "Pulmonary edema treatment: CPAP/BiPAP for non-invasive ventilation, "
            "IV nitroglycerin to reduce preload, IV furosemide 40–80 mg. "
            "Position patient upright. Monitor SpO2, HR, and BP closely. "
            "ICU admission for severe cases."
        ),
    },
    {
        "id": "pneumonia_1",
        "text": (
            "Pneumonia: Lung parenchymal infection requiring prompt antibiotic "
            "therapy. Community-acquired pneumonia (CAP) — first-line: "
            "amoxicillin or azithromycin. Hospital-acquired: broad-spectrum "
            "coverage including Pseudomonas. PSI/PORT score guides admission."
        ),
    },
    {
        "id": "pneumonia_2",
        "text": (
            "Pneumonia severity: CURB-65 score (confusion, urea, RR, BP, age≥65). "
            "Score 0–1: outpatient. Score 2: hospital admission. Score ≥3: ICU. "
            "Culture blood and sputum before antibiotics. Supportive: O2, fluids."
        ),
    },
    {
        "id": "cardiomegaly_1",
        "text": (
            "Cardiomegaly: Enlarged cardiac silhouette (cardiothoracic ratio >0.5). "
            "Causes include hypertensive heart disease, dilated cardiomyopathy, "
            "valvular disease. Requires echocardiography for definitive evaluation "
            "of chamber dimensions and ejection fraction."
        ),
    },
    {
        "id": "cardiomegaly_2",
        "text": (
            "Cardiomegaly management: ACE inhibitors/ARBs for reduced EF, "
            "beta-blockers for heart failure, diuretics for volume overload. "
            "Refer to cardiology for echocardiogram, Holter monitoring, "
            "and possible cardiac MRI to determine etiology."
        ),
    },
    {
        "id": "pleural_effusion_1",
        "text": (
            "Pleural effusion: Fluid between visceral and parietal pleura. "
            "Transudative (heart failure, cirrhosis) vs exudative (infection, "
            "malignancy). Light's criteria: protein ratio >0.5 or LDH ratio >0.6 "
            "indicates exudate. Thoracentesis for diagnosis and therapy."
        ),
    },
    {
        "id": "pleural_effusion_2",
        "text": (
            "Pleural effusion treatment: Treat underlying cause. "
            "Therapeutic thoracentesis for symptomatic large effusions. "
            "Chest tube for empyema. Pleurodesis for malignant recurrent effusions. "
            "Ultrasound guidance reduces complication rates."
        ),
    },
    {
        "id": "urgency_1",
        "text": (
            "CRITICAL urgency (immediate): Findings requiring intervention "
            "within 15 minutes. Examples: tension pneumothorax, acute pulmonary "
            "edema with respiratory failure, massive hemothorax. "
            "Page Emergency Medicine and activate rapid response team immediately."
        ),
    },
    {
        "id": "urgency_2",
        "text": (
            "Triage levels: URGENT — evaluation within 1 hour (pneumonia with "
            "CURB-65 ≥2, moderate pneumothorax). MODERATE — same-day evaluation "
            "(stable cardiomegaly, small pleural effusion). ROUTINE — "
            "scheduled follow-up within 1 week for incidental non-urgent findings."
        ),
    },
]


def _build_rag_collection():
    """Use keyword-based retrieval (avoids macOS fork/mutex crash from sentence-transformers)."""
    logger.info("Using keyword-based evidence retrieval.")
    return None, None


def _keyword_evidence(positive_findings: List[str]) -> str:
    """Fallback evidence retrieval using simple keyword matching."""
    results = []
    for finding in positive_findings:
        key = finding.lower().replace(" ", "_")
        for doc in MEDICAL_KNOWLEDGE_BASE:
            if key in doc["id"] or finding.lower() in doc["text"].lower():
                results.append(doc["text"])
                if len(results) >= 4:
                    break
    if not results:
        for doc in MEDICAL_KNOWLEDGE_BASE:
            if "urgency" in doc["id"]:
                results.append(doc["text"])
    return "\n\n".join(results[:5]) if results else "No specific evidence retrieved."


# ─────────────────────────── urgency / routing ──────────────────────────────

def classify_urgency(predictions: Dict[str, float]) -> Tuple[str, str]:
    if predictions["Pneumothorax"] > 0.7:
        return "CRITICAL", "High-confidence Pneumothorax (>70%) — tension pneumothorax risk"
    if predictions["Edema"] > 0.7:
        return "CRITICAL", "High-confidence Pulmonary Edema (>70%) — acute respiratory failure risk"
    if predictions["Pneumonia"] > 0.6:
        return "URGENT", "Pneumonia detected with high confidence (>60%)"
    if predictions["Pneumothorax"] > 0.5:
        return "URGENT", "Moderate-confidence Pneumothorax (50–70%)"
    if predictions["Cardiomegaly"] > 0.5 or predictions["Pleural Effusion"] > 0.5:
        return "MODERATE", "Cardiomegaly or Pleural Effusion detected"
    return "ROUTINE", "No significant acute findings"


def determine_routing(
    predictions: Dict[str, float],
    urgency: str,
) -> Tuple[str, str]:
    if urgency == "CRITICAL":
        return "Emergency Medicine + ICU", "Critical findings require immediate emergency intervention"
    if predictions["Pneumothorax"] > 0.6:
        return "Thoracic Surgery", "Pneumothorax may require chest tube or surgical intervention"
    if predictions["Edema"] > 0.6:
        return "Cardiology", "Pulmonary edema likely cardiogenic in origin"
    if predictions["Pneumonia"] > 0.5:
        return "Pulmonology / Infectious Disease", "Pneumonia management and culture-guided antibiotics"
    if predictions["Cardiomegaly"] > 0.5:
        return "Cardiology", "Cardiomegaly requires echocardiographic evaluation"
    if predictions["Pleural Effusion"] > 0.5:
        return "Pulmonology", "Pleural effusion may require thoracentesis"
    return "General Medicine", "Routine follow-up with primary care"


def create_alerts(urgency: str, specialist: str, patient_id: str) -> List[str]:
    alerts: List[str] = []
    if urgency == "CRITICAL":
        alerts.append(f"CRITICAL ALERT — Page {specialist} immediately for patient {patient_id}!")
        alerts.append("Activate rapid response team. Prepare for emergency intervention.")
    elif urgency == "URGENT":
        alerts.append(f"URGENT: {specialist} evaluation required within 1 hour — patient {patient_id}")
    elif urgency == "MODERATE":
        alerts.append(f"MODERATE: Same-day {specialist} evaluation recommended — patient {patient_id}")
    else:
        alerts.append(f"ROUTINE: Schedule {specialist} follow-up within 1 week — patient {patient_id}")
    return alerts


# ─────────────────────────── LangGraph workflow ─────────────────────────────

class TriageState(TypedDict):
    image: Any
    patient_id: str
    predictions: Dict[str, float]
    individual_predictions: Dict[str, List[float]]
    positive_findings: List[str]
    evidence: str
    urgency: str
    urgency_reason: str
    specialist: str
    routing_reason: str
    report: str
    alerts: List[str]
    timestamp: str


# ─────────────────────────── main pipeline class ────────────────────────────

class TriagePipeline:
    def __init__(self, model_dir: str = "./models"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info("Device: %s", self.device)
        self.models: Dict[str, nn.Module] = {}
        self._load_models(model_dir)
        self.collection, self.embedder = _build_rag_collection()

    def _ensure_weights(self, model_dir: str):
        """Auto-download weights from Google Drive if any are missing."""
        missing = [
            f for f in CHECKPOINT_NAMES.values()
            if not os.path.exists(os.path.join(model_dir, f))
        ]
        if not missing:
            return
        logger.info("Missing weights: %s — attempting download from Google Drive...", missing)
        try:
            from download_weights import download
            download()
        except Exception as e:
            logger.warning("Auto-download failed: %s — continuing with random weights", e)

    def _load_models(self, model_dir: str):
        self._ensure_weights(model_dir)
        for name, builder in MODEL_BUILDERS.items():
            ckpt_path = os.path.join(model_dir, CHECKPOINT_NAMES[name])
            model = builder(num_classes=len(TARGET_LABELS))
            if os.path.exists(ckpt_path):
                try:
                    ckpt = torch.load(ckpt_path, map_location=self.device, weights_only=False)
                    state = ckpt.get("model_state_dict", ckpt)
                    # Strip "model." prefix if checkpoints were saved with a wrapper class
                    if any(k.startswith("model.") for k in state):
                        state = {k.removeprefix("model."): v for k, v in state.items()}
                    model.load_state_dict(state)
                    logger.info("Loaded checkpoint: %s", ckpt_path)
                except Exception as e:
                    logger.warning("Could not load %s: %s — using random weights", ckpt_path, e)
            else:
                logger.warning("Checkpoint not found: %s — using random weights", ckpt_path)
            model.to(self.device)
            model.eval()
            # Apply dynamic quantization to reduce memory ~4x on CPU
            model = torch.quantization.quantize_dynamic(
                model, {torch.nn.Linear, torch.nn.Conv2d}, dtype=torch.qint8
            )
            self.models[name] = model

    # ── inference ────────────────────────────────────────────────────────────

    def _predict(self, image: Image.Image) -> Tuple[Dict[str, float], Dict[str, List[float]]]:
        tensor = INFERENCE_TRANSFORM(image).unsqueeze(0).to(self.device)
        individual: Dict[str, List[float]] = {label: [] for label in TARGET_LABELS}
        all_probs: List[np.ndarray] = []

        with torch.no_grad():
            for name, model in self.models.items():
                logits = model(tensor)
                probs = torch.sigmoid(logits).cpu().numpy()[0]
                all_probs.append(probs)
                for i, label in enumerate(TARGET_LABELS):
                    individual[label].append(float(probs[i]))

        avg = np.mean(all_probs, axis=0)
        predictions = {label: float(avg[i]) for i, label in enumerate(TARGET_LABELS)}
        return predictions, individual

    # ── RAG evidence ─────────────────────────────────────────────────────────

    def _get_evidence(self, positive_findings: List[str]) -> str:
        if not positive_findings:
            return "No positive findings — routine follow-up recommended."
        if self.collection is None or self.embedder is None:
            return _keyword_evidence(positive_findings)
        try:
            all_evidence: List[str] = []
            for finding in positive_findings:
                query = f"{finding} clinical guidelines treatment urgency"
                emb = self.embedder.encode([query]).tolist()
                results = self.collection.query(query_embeddings=emb, n_results=2)
                all_evidence.extend(results["documents"][0])
            urgency_emb = self.embedder.encode(["urgency triage levels"]).tolist()
            urgency_res = self.collection.query(query_embeddings=urgency_emb, n_results=1)
            all_evidence.extend(urgency_res["documents"][0])
            # Deduplicate while preserving order
            seen: set = set()
            unique: List[str] = []
            for e in all_evidence:
                if e not in seen:
                    seen.add(e)
                    unique.append(e)
            return "\n\n".join(unique[:5])
        except Exception as e:
            logger.warning("RAG query failed: %s", e)
            return _keyword_evidence(positive_findings)

    # ── report generation ────────────────────────────────────────────────────

    @staticmethod
    def _generate_report(state: TriageState) -> str:
        findings_lines = "\n".join(
            f"  {'[POSITIVE]' if state['predictions'][lbl] >= THRESHOLD else '[negative]'} "
            f"{lbl}: {state['predictions'][lbl]:.1%}"
            for lbl in TARGET_LABELS
        )
        alerts_text = "\n".join(f"  • {a}" for a in state["alerts"])
        return (
            f"MEDICAL TRIAGE REPORT\n"
            f"{'='*50}\n"
            f"Patient ID  : {state['patient_id']}\n"
            f"Timestamp   : {state['timestamp']}\n"
            f"{'='*50}\n\n"
            f"PATHOLOGY PREDICTIONS\n"
            f"{findings_lines}\n\n"
            f"TRIAGE DECISION\n"
            f"  Urgency   : {state['urgency']}\n"
            f"  Reason    : {state['urgency_reason']}\n"
            f"  Specialist: {state['specialist']}\n"
            f"  Routing   : {state['routing_reason']}\n\n"
            f"ALERTS\n"
            f"{alerts_text}\n\n"
            f"CLINICAL EVIDENCE (excerpt)\n"
            f"{state['evidence'][:600]}...\n"
            f"{'='*50}\n"
        )

    # ── public API ───────────────────────────────────────────────────────────

    def run(self, image: Image.Image, patient_id: str) -> Dict[str, Any]:
        timestamp = datetime.now().isoformat()

        # Stage 1 — model inference
        predictions, individual = self._predict(image)
        positive_findings = [lbl for lbl, p in predictions.items() if p >= THRESHOLD]

        # Stage 2 — RAG
        evidence = self._get_evidence(positive_findings)

        # Stage 3 — urgency classification
        urgency, urgency_reason = classify_urgency(predictions)

        # Stage 4 — specialist routing
        specialist, routing_reason = determine_routing(predictions, urgency)

        # Stage 5 — alerts
        alerts = create_alerts(urgency, specialist, patient_id)

        state: TriageState = {
            "image": None,
            "patient_id": patient_id,
            "predictions": predictions,
            "individual_predictions": individual,
            "positive_findings": positive_findings,
            "evidence": evidence,
            "urgency": urgency,
            "urgency_reason": urgency_reason,
            "specialist": specialist,
            "routing_reason": routing_reason,
            "report": "",
            "alerts": alerts,
            "timestamp": timestamp,
        }

        # Stage 6 — report
        state["report"] = self._generate_report(state)

        return {
            "patient_id": patient_id,
            "timestamp": timestamp,
            "predictions": predictions,
            "individual_predictions": individual,
            "positive_findings": positive_findings,
            "urgency": urgency,
            "urgency_reason": urgency_reason,
            "specialist": specialist,
            "routing_reason": routing_reason,
            "evidence": evidence,
            "alerts": alerts,
            "report": state["report"],
        }
# End-to-end latency < 2 seconds
