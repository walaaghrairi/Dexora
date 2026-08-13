from __future__ import annotations

from pathlib import Path

import numpy as np

from .hand_preprocessing import normalize_landmarks


class AsLandmarkRefiner:
    """Optional A/S tie-breaker trained on MediaPipe's 21 hand landmarks."""

    def __init__(self, model_path: Path) -> None:
        self.model_path = model_path
        self.model = None
        self.error: str | None = None

    @property
    def available(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        if not self.model_path.exists():
            self.error = "Correcteur A/S non entraîné"
            return
        try:
            from tensorflow import keras

            self.model = keras.models.load_model(self.model_path, compile=False)
            self.error = None
        except Exception as exc:
            self.model = None
            self.error = str(exc)

    def refine(
        self,
        probabilities: np.ndarray,
        labels: list[str],
        landmarks: list[list[float]] | None,
        handedness: str | None,
    ) -> tuple[np.ndarray, dict]:
        diagnostics = {"available": self.available, "applied": False}
        if self.model is None or landmarks is None or "A" not in labels or "S" not in labels:
            return probabilities, diagnostics

        a_index, s_index = labels.index("A"), labels.index("S")
        top_indices = probabilities.argsort()[-3:]
        if a_index not in top_indices and s_index not in top_indices:
            return probabilities, diagnostics

        features = normalize_landmarks(landmarks, handedness)
        prediction = np.asarray(self.model.predict(features[None, ...], verbose=0)[0], dtype=np.float32)
        if prediction.shape[0] != 2:
            diagnostics["error"] = "Le correcteur A/S doit avoir deux sorties"
            return probabilities, diagnostics

        as_mass = float(probabilities[a_index] + probabilities[s_index])
        refined = probabilities.copy()
        refined[a_index] = as_mass * float(prediction[0])
        refined[s_index] = as_mass * float(prediction[1])
        diagnostics.update(
            {
                "applied": True,
                "label": "A" if prediction[0] >= prediction[1] else "S",
                "confidence": float(max(prediction)),
            }
        )
        return refined, diagnostics
