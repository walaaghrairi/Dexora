import asyncio
import json
import os
from pathlib import Path
from threading import Lock

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "asl_recognition_model.h5"))
LABELS_PATH = Path(os.getenv("LABELS_PATH", BASE_DIR / "models" / "labels.json"))
MAX_IMAGE_SIZE = 5 * 1024 * 1024

model = None
model_error: str | None = None
model_lock = Lock()


def load_labels() -> list[str]:
    with LABELS_PATH.open(encoding="utf-8") as labels_file:
        labels = json.load(labels_file)
    if not isinstance(labels, list) or not all(isinstance(label, str) for label in labels):
        raise ValueError("labels.json doit contenir une liste de chaînes")
    return labels


labels = load_labels()


def load_recognition_model() -> None:
    global model, model_error
    try:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Modèle introuvable : {MODEL_PATH}")
        os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
        from tensorflow import keras

        model = keras.models.load_model(MODEL_PATH, compile=False)
        output_classes = int(model.output_shape[-1])
        if output_classes != len(labels):
            raise ValueError(
                f"Le modèle possède {output_classes} sorties mais labels.json contient {len(labels)} classes"
            )
        model_error = None
    except Exception as exc:  # Le service reste disponible pour exposer son état.
        model = None
        model_error = str(exc)


def prepare_image(image: Image.Image) -> np.ndarray:
    normalized = ImageOps.fit(image.convert("RGB"), (224, 224), method=Image.Resampling.LANCZOS)
    pixels = np.asarray(normalized, dtype=np.float32) / 255.0
    return np.expand_dims(pixels, axis=0)


def run_prediction(image: Image.Image) -> np.ndarray:
    if model is None:
        raise RuntimeError(model_error or "Le modèle IA n'est pas chargé")
    with model_lock:
        result = model.predict(prepare_image(image), verbose=0)[0]
    return np.asarray(result, dtype=np.float32)


app = FastAPI(title="TuniSign AI Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    await asyncio.to_thread(load_recognition_model)


@app.get("/health")
def health() -> dict:
    return {
        "ready": model is not None,
        "model": MODEL_PATH.name,
        "inputShape": [224, 224, 3],
        "classes": labels,
        "error": model_error,
    }


@app.post("/predict")
async def predict(image: UploadFile = File(...)) -> dict:
    if model is None:
        raise HTTPException(status_code=503, detail=model_error or "Modèle IA indisponible")
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Format accepté : JPEG, PNG ou WebP")

    content = await image.read(MAX_IMAGE_SIZE + 1)
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="L'image dépasse 5 Mo")

    try:
        from io import BytesIO

        source = Image.open(BytesIO(content))
        probabilities = await asyncio.to_thread(run_prediction, source)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Image invalide : {exc}") from exc

    best_indices = probabilities.argsort()[-3:][::-1]
    top_predictions = [
        {"label": labels[int(index)], "confidence": float(probabilities[int(index)])}
        for index in best_indices
    ]
    return {
        "label": top_predictions[0]["label"],
        "confidence": top_predictions[0]["confidence"],
        "topPredictions": top_predictions,
        "model": MODEL_PATH.stem,
        "inputShape": [224, 224, 3],
    }
