from __future__ import annotations

import asyncio
import json
import os
from io import BytesIO
from pathlib import Path
from threading import Lock

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

from .hand_preprocessing import HandFrame, HandPreprocessor
from .landmark_refiner import AsLandmarkRefiner

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "asl_recognition_model.h5"))
LABELS_PATH = Path(os.getenv("LABELS_PATH", BASE_DIR / "models" / "labels.json"))
MODEL_CLASS_INDICES_PATH = MODEL_PATH.with_suffix(".classes.json")
MODEL_METADATA_PATH = MODEL_PATH.with_suffix(".metadata.json")
CLASS_INDICES_PATH = Path(os.getenv(
    "CLASS_INDICES_PATH",
    MODEL_CLASS_INDICES_PATH if MODEL_CLASS_INDICES_PATH.exists() else BASE_DIR / "models" / "class_indices.json",
))
METADATA_PATH = Path(os.getenv(
    "MODEL_METADATA_PATH",
    MODEL_METADATA_PATH if MODEL_METADATA_PATH.exists() else BASE_DIR / "models" / "model_metadata.json",
))
AS_REFINER_PATH = Path(os.getenv("AS_REFINER_PATH", BASE_DIR / "models" / "as_landmark_classifier.keras"))
MAX_IMAGE_SIZE = 5 * 1024 * 1024
INPUT_SIZE = (224, 224)

model = None
model_error: str | None = None
model_lock = Lock()
hand_preprocessor = HandPreprocessor()
as_refiner = AsLandmarkRefiner(AS_REFINER_PATH)


def load_metadata() -> dict:
    if not METADATA_PATH.exists():
        return {
            "classOrderVerified": False,
            "normalization": "0_1",
            "source": "legacy-h5-without-training-metadata",
        }
    with METADATA_PATH.open(encoding="utf-8") as metadata_file:
        value = json.load(metadata_file)
    if not isinstance(value, dict):
        raise ValueError("model_metadata.json doit contenir un objet JSON")
    return value


def load_labels() -> list[str]:
    if CLASS_INDICES_PATH.exists():
        with CLASS_INDICES_PATH.open(encoding="utf-8") as indices_file:
            indices = json.load(indices_file)
        if isinstance(indices, dict) and all(isinstance(name, str) and isinstance(index, int) for name, index in indices.items()):
            ordered = sorted(indices.items(), key=lambda item: item[1])
            if [index for _, index in ordered] != list(range(len(ordered))):
                raise ValueError("class_indices.json doit utiliser des indices continus à partir de zéro")
            return [name for name, _ in ordered]

    with LABELS_PATH.open(encoding="utf-8") as labels_file:
        value = json.load(labels_file)
    if not isinstance(value, list) or not all(isinstance(label, str) for label in value):
        raise ValueError("labels.json doit contenir une liste de chaînes")
    return value


metadata = load_metadata()
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
                f"Le modèle possède {output_classes} sorties mais la configuration contient {len(labels)} classes"
            )
        as_refiner.load()
        model_error = None
    except Exception as exc:
        model = None
        model_error = str(exc)


def prepare_image(image: Image.Image) -> np.ndarray:
    fitted = ImageOps.fit(image.convert("RGB"), INPUT_SIZE, method=Image.Resampling.LANCZOS)
    pixels = np.asarray(fitted, dtype=np.float32)
    if metadata.get("normalization", "0_1") == "0_1":
        pixels /= 255.0
    return np.expand_dims(pixels, axis=0)


def run_prediction(image: Image.Image) -> np.ndarray:
    if model is None:
        raise RuntimeError(model_error or "Le modèle IA n'est pas chargé")
    with model_lock:
        result = model.predict(prepare_image(image), verbose=0)[0]
    return np.asarray(result, dtype=np.float32)


def predict_variants(source: Image.Image) -> dict:
    candidates: list[dict] = []
    for orientation, image in (("original", source), ("mirrored", ImageOps.mirror(source))):
        hand: HandFrame = hand_preprocessor.extract(image)
        if hand_preprocessor.available and not hand.detected:
            continue
        probabilities = run_prediction(hand.image)
        refined, refinement = as_refiner.refine(
            probabilities,
            labels,
            hand.landmarks,
            hand.handedness,
        )
        candidates.append(
            {
                "orientation": orientation,
                "probabilities": refined,
                "rawProbabilities": probabilities,
                "hand": hand,
                "refinement": refinement,
            }
        )

    if not candidates:
        raise ValueError("Aucune main détectée. Place une seule main entière dans le cadre et améliore l'éclairage.")

    best = max(candidates, key=lambda candidate: float(np.max(candidate["probabilities"])))
    probabilities = best["probabilities"]
    best_indices = probabilities.argsort()[-3:][::-1]
    top_predictions = [
        {"label": labels[int(index)], "confidence": float(probabilities[int(index)])}
        for index in best_indices
    ]
    variant_results = []
    for candidate in candidates:
        index = int(np.argmax(candidate["probabilities"]))
        variant_results.append(
            {
                "orientation": candidate["orientation"],
                "label": labels[index],
                "confidence": float(candidate["probabilities"][index]),
                "handDetected": candidate["hand"].detected,
            }
        )

    hand: HandFrame = best["hand"]
    return {
        "label": top_predictions[0]["label"],
        "confidence": top_predictions[0]["confidence"],
        "topPredictions": top_predictions,
        "orientation": best["orientation"],
        "variants": variant_results,
        "handDetected": hand.detected,
        "handedness": hand.handedness,
        "boundingBox": list(hand.bounding_box) if hand.bounding_box else None,
        "landmarkRefinement": best["refinement"],
    }


app = FastAPI(title="TuniSign AI Service", version="2.0.0")
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


@app.on_event("shutdown")
def shutdown() -> None:
    hand_preprocessor.close()


@app.get("/health")
def health() -> dict:
    warnings = []
    if not metadata.get("classOrderVerified", False):
        warnings.append("L'ordre des classes du modèle historique n'est pas confirmé par ses données d'entraînement.")
    if not hand_preprocessor.available:
        warnings.append(f"MediaPipe indisponible : {hand_preprocessor.error}")
    if not as_refiner.available:
        warnings.append("Le correcteur A/S par points de la main n'est pas encore entraîné.")
    return {
        "ready": model is not None,
        "model": MODEL_PATH.name,
        "inputShape": [*INPUT_SIZE, 3],
        "classes": labels,
        "classIndices": {label: index for index, label in enumerate(labels)},
        "classOrderVerified": bool(metadata.get("classOrderVerified", False)),
        "handTracking": hand_preprocessor.available,
        "dualOrientation": True,
        "asLandmarkRefiner": as_refiner.available,
        "dynamicClasses": metadata.get("dynamicClasses", ["J", "Z"]),
        "warnings": warnings,
        "error": model_error,
    }


@app.post("/predict")
async def predict(image: UploadFile = File(...)) -> dict:
    if model is None:
        raise HTTPException(status_code=503, detail=model_error or "Modèle IA indisponible")
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Formats acceptés : JPEG, PNG ou WebP")

    content = await image.read(MAX_IMAGE_SIZE + 1)
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="L'image dépasse 5 Mo")

    try:
        source = Image.open(BytesIO(content))
        result = await asyncio.to_thread(predict_variants, source)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Image invalide : {exc}") from exc

    return {
        **result,
        "model": MODEL_PATH.stem,
        "inputShape": [*INPUT_SIZE, 3],
        "motionRequired": result["label"] in metadata.get("dynamicClasses", ["J", "Z"]),
    }
