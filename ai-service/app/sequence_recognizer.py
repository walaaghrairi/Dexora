from __future__ import annotations

import json
from pathlib import Path
from threading import Lock

import numpy as np


class SequenceRecognizer:
    def __init__(self, model_path: Path) -> None:
        self.model_path = model_path
        self.model = None
        self.labels: list[str] = []
        self.sequence_length = 32
        self.feature_size = 63
        self.error: str | None = None
        self._lock = Lock()

    @property
    def available(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        try:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Modèle d'expressions introuvable : {self.model_path}")
            classes_path = self.model_path.with_suffix(".classes.json")
            metadata_path = self.model_path.with_suffix(".metadata.json")
            indices = json.loads(classes_path.read_text(encoding="utf-8"))
            ordered = sorted(indices.items(), key=lambda item: item[1])
            if [index for _, index in ordered] != list(range(len(ordered))):
                raise ValueError("Les indices du modèle d'expressions ne sont pas continus")
            self.labels = [label for label, _ in ordered]
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))

            from tensorflow import keras

            self.model = keras.models.load_model(self.model_path, compile=False)
            raw_shape = self.model.input_shape[0] if isinstance(self.model.input_shape, list) else self.model.input_shape
            if not raw_shape or len(raw_shape) != 3:
                raise ValueError(f"Forme séquentielle non prise en charge : {raw_shape}")
            self.sequence_length = int(raw_shape[-2] or metadata.get("sequenceLength", 32))
            self.feature_size = int(raw_shape[-1] or metadata.get("featureSize", 63))
            if int(self.model.output_shape[-1]) != len(self.labels):
                raise ValueError("Le nombre de sorties ne correspond pas aux classes d'expressions")
            self.error = None
        except Exception as exc:
            self.model = None
            self.error = str(exc)

    def _resize(self, features: np.ndarray) -> np.ndarray:
        if features.ndim != 2 or features.shape[1] != self.feature_size or features.shape[0] == 0:
            raise ValueError(f"Séquence de points invalide : {features.shape}")
        positions = np.linspace(0, features.shape[0] - 1, self.sequence_length)
        indices = np.rint(positions).astype(np.int32)
        return features[indices].astype(np.float32)

    def predict(self, features: np.ndarray) -> dict:
        if self.model is None:
            raise RuntimeError(self.error or "Le modèle d'expressions n'est pas chargé")
        batch = np.expand_dims(self._resize(features), axis=0)
        with self._lock:
            probabilities = np.asarray(self.model(batch, training=False), dtype=np.float32)[0]
        best_indices = probabilities.argsort()[-3:][::-1]
        top_predictions = [
            {"label": self.labels[int(index)], "confidence": float(probabilities[int(index)])}
            for index in best_indices
        ]
        return {
            "status": "recognized",
            "label": top_predictions[0]["label"],
            "confidence": top_predictions[0]["confidence"],
            "topPredictions": top_predictions,
        }
