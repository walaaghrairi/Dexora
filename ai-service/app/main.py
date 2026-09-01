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

from .hand_preprocessing import HandFrame, HandPreprocessor, normalize_landmarks
from .landmark_refiner import AsLandmarkRefiner
from .sequence_recognizer import SequenceRecognizer

BASE_DIR = Path(__file__).resolve().parents[1]
TUNISIGN_STATIC_MODEL_PATH = BASE_DIR / "models" / "tunisign_static_v3.keras"
EXTENDED_MODEL_PATH = BASE_DIR / "models" / "cnn_model_keras2.h5"
TRAINED_MODEL_PATH = BASE_DIR / "models" / "asl_recognition_model_v2.keras"
LEGACY_MODEL_PATH = BASE_DIR / "models" / "asl_recognition_model.h5"
DEFAULT_MODEL_PATH = (
    TUNISIGN_STATIC_MODEL_PATH
    if TUNISIGN_STATIC_MODEL_PATH.exists()
    else EXTENDED_MODEL_PATH if EXTENDED_MODEL_PATH.exists()
    else TRAINED_MODEL_PATH if TRAINED_MODEL_PATH.exists()
    else LEGACY_MODEL_PATH
)
MODEL_PATH = Path(os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH))
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
SEQUENCE_MODEL_PATH = Path(os.getenv("SEQUENCE_MODEL_PATH", BASE_DIR / "models" / "tunisign_words_v1.keras"))
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_SEQUENCE_SIZE = 24 * 1024 * 1024
MIN_SEQUENCE_FRAMES = 8
MAX_SEQUENCE_FRAMES = 64
DEFAULT_INPUT_SIZE = (224, 224)

model = None
model_error: str | None = None
model_lock = Lock()
input_size = DEFAULT_INPUT_SIZE
input_channels = 3
hand_preprocessor = HandPreprocessor()
as_refiner = AsLandmarkRefiner(AS_REFINER_PATH)
sequence_recognizer = SequenceRecognizer(SEQUENCE_MODEL_PATH)


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
    global model, model_error, input_size, input_channels
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
        raw_input_shape = model.input_shape[0] if isinstance(model.input_shape, list) else model.input_shape
        if not raw_input_shape or len(raw_input_shape) != 4:
            raise ValueError(f"Forme d'entrée non prise en charge : {raw_input_shape}")
        height, width, channels = raw_input_shape[-3:]
        input_size = (
            int(width or DEFAULT_INPUT_SIZE[0]),
            int(height or DEFAULT_INPUT_SIZE[1]),
        )
        input_channels = int(channels or 3)
        if input_channels not in {1, 3}:
            raise ValueError(f"Nombre de canaux non pris en charge : {input_channels}")
        as_refiner.load()
        model_error = None
    except Exception as exc:
        model = None
        model_error = str(exc)


def prepare_image(image: Image.Image) -> np.ndarray:
    color_mode = "L" if input_channels == 1 else "RGB"
    fitted = ImageOps.fit(image.convert(color_mode), input_size, method=Image.Resampling.LANCZOS)
    pixels = np.asarray(fitted, dtype=np.float32)
    if metadata.get("preprocessing") == "binary_otsu":
        import cv2

        _, pixels = cv2.threshold(
            pixels.astype(np.uint8),
            0,
            255,
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU,
        )
        pixels = pixels.astype(np.float32)
    if metadata.get("normalization", "0_1") == "0_1":
        pixels /= 255.0
    if input_channels == 1:
        pixels = np.expand_dims(pixels, axis=-1)
    return np.expand_dims(pixels, axis=0)


def run_predictions(images: list[Image.Image]) -> np.ndarray:
    if model is None:
        raise RuntimeError(model_error or "Le modèle IA n'est pas chargé")
    batch = np.concatenate([prepare_image(image) for image in images], axis=0)
    with model_lock:
        result = model(batch, training=False)
    return np.asarray(result, dtype=np.float32)


def predict_variants(source: Image.Image) -> dict:
    candidates: list[dict] = []
    for orientation, image in (("original", source), ("mirrored", ImageOps.mirror(source))):
        hand: HandFrame = hand_preprocessor.extract(image)
        if hand_preprocessor.available and not hand.detected:
            continue
        candidates.append(
            {
                "orientation": orientation,
                "hand": hand,
            }
        )

    if not candidates:
        return {
            "status": "no_hand",
            "label": "",
            "confidence": 0.0,
            "topPredictions": [],
            "orientation": None,
            "variants": [],
            "handDetected": False,
            "handedness": None,
            "boundingBox": None,
            "landmarkRefinement": {
                "available": as_refiner.available,
                "applied": False,
            },
        }

    probability_batches = run_predictions([candidate["hand"].image for candidate in candidates])
    for candidate, probabilities in zip(candidates, probability_batches, strict=True):
        hand = candidate["hand"]
        refined, refinement = as_refiner.refine(
            probabilities,
            labels,
            hand.landmarks,
            hand.handedness,
        )
        candidate["probabilities"] = refined
        candidate["rawProbabilities"] = probabilities
        candidate["refinement"] = refinement

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
        "status": "recognized",
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
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.on_event("startup")
async def startup() -> None:
    await asyncio.to_thread(load_recognition_model)
    await asyncio.to_thread(sequence_recognizer.load)


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
    if not sequence_recognizer.available:
        warnings.append("Le modèle vidéo des expressions n'est pas encore entraîné.")
    available_labels = [*(labels if model is not None else []), *sequence_recognizer.labels]
    available_labels = list(dict.fromkeys(available_labels))
    first_sign_labels = ["BONJOUR", "HI", "THANK_YOU", "I_LOVE_YOU", "MERCI"]
    return {
        "ready": model is not None or sequence_recognizer.available,
        "model": MODEL_PATH.name,
        "sequenceModel": SEQUENCE_MODEL_PATH.name,
        "sequenceReady": sequence_recognizer.available,
        "inputShape": [*input_size, input_channels],
        "classes": available_labels,
        "classIndices": {label: index for index, label in enumerate(available_labels)},
        "classOrderVerified": bool(metadata.get("classOrderVerified", False)),
        "handTracking": hand_preprocessor.available,
        "dualOrientation": True,
        "asLandmarkRefiner": as_refiner.available,
        "dynamicClasses": metadata.get("dynamicClasses", ["J", "Z"]),
        "capabilities": {
            "alphabet": all(label in available_labels for label in list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")),
            "numbers": all(str(value) in available_labels for value in range(10)),
            "firstSigns": all(label in available_labels for label in first_sign_labels),
        },
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
        "inputShape": [*input_size, input_channels],
        "motionRequired": result["label"] in metadata.get("dynamicClasses", ["J", "Z"]),
    }


def extract_sequence_features(sources: list[Image.Image]) -> tuple[np.ndarray, int]:
    features: list[np.ndarray] = []
    detected_count = 0
    for source in sources:
        hand = hand_preprocessor.extract(source)
        if hand.detected and hand.landmarks:
            features.append(normalize_landmarks(hand.landmarks, hand.handedness))
            detected_count += 1
        else:
            features.append(np.zeros(63, dtype=np.float32))
    return np.stack(features), detected_count


@app.post("/predict-sequence")
async def predict_sequence(images: list[UploadFile] = File(...)) -> dict:
    if not sequence_recognizer.available:
        raise HTTPException(status_code=503, detail=sequence_recognizer.error or "Modèle vidéo indisponible")
    if not MIN_SEQUENCE_FRAMES <= len(images) <= MAX_SEQUENCE_FRAMES:
        raise HTTPException(
            status_code=422,
            detail=f"Envoyez entre {MIN_SEQUENCE_FRAMES} et {MAX_SEQUENCE_FRAMES} images.",
        )

    sources: list[Image.Image] = []
    total_size = 0
    try:
        for upload in images:
            if upload.content_type not in {"image/jpeg", "image/png", "image/webp"}:
                raise HTTPException(status_code=415, detail="Formats acceptés : JPEG, PNG ou WebP")
            content = await upload.read(MAX_IMAGE_SIZE + 1)
            total_size += len(content)
            if len(content) > MAX_IMAGE_SIZE or total_size > MAX_SEQUENCE_SIZE:
                raise HTTPException(status_code=413, detail="La séquence dépasse la taille autorisée")
            sources.append(Image.open(BytesIO(content)).convert("RGB"))

        features, detected_count = await asyncio.to_thread(extract_sequence_features, sources)
        if detected_count < max(3, int(len(sources) * 0.45)):
            return {
                "status": "no_hand",
                "label": "",
                "confidence": 0.0,
                "topPredictions": [],
                "handDetected": False,
                "model": SEQUENCE_MODEL_PATH.stem,
                "inputShape": [sequence_recognizer.sequence_length, sequence_recognizer.feature_size],
                "motionRequired": True,
            }
        result = await asyncio.to_thread(sequence_recognizer.predict, features)
    except HTTPException:
        raise
    except (ValueError, OSError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Séquence invalide : {exc}") from exc

    return {
        **result,
        "handDetected": True,
        "model": SEQUENCE_MODEL_PATH.stem,
        "inputShape": [sequence_recognizer.sequence_length, sequence_recognizer.feature_size],
        "motionRequired": True,
    }
