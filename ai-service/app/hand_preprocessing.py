from __future__ import annotations

from dataclasses import dataclass
from threading import Lock

import numpy as np
from PIL import Image, ImageOps


@dataclass(frozen=True)
class HandFrame:
    image: Image.Image
    detected: bool
    landmarks: list[list[float]] | None = None
    handedness: str | None = None
    bounding_box: tuple[int, int, int, int] | None = None


def normalize_landmarks(points: list[list[float]], handedness: str | None) -> np.ndarray:
    """Return 63 translation/scale/handedness-normalized landmark features."""
    values = np.asarray(points, dtype=np.float32).reshape(21, 3)
    values -= values[0]
    if handedness and handedness.lower() == "left":
        values[:, 0] *= -1
    scale = float(np.max(np.linalg.norm(values[:, :2], axis=1)))
    if scale > 1e-6:
        values /= scale
    return values.reshape(-1)


class HandPreprocessor:
    """Detect one hand with MediaPipe and crop a padded square around it."""

    def __init__(self, margin: float = 0.28) -> None:
        self.margin = margin
        self.available = False
        self.error: str | None = None
        self._lock = Lock()
        self._hands = None
        try:
            import mediapipe as mp

            self._hands = mp.solutions.hands.Hands(
                static_image_mode=True,
                max_num_hands=1,
                model_complexity=1,
                min_detection_confidence=0.45,
                min_tracking_confidence=0.45,
            )
            self.available = True
        except Exception as exc:
            self.error = str(exc)

    def extract(self, source: Image.Image) -> HandFrame:
        image = ImageOps.exif_transpose(source).convert("RGB")
        if not self.available or self._hands is None:
            return HandFrame(image=image, detected=False)

        pixels = np.ascontiguousarray(np.asarray(image, dtype=np.uint8))
        with self._lock:
            result = self._hands.process(pixels)
        if not result.multi_hand_landmarks:
            return HandFrame(image=image, detected=False)

        hand = result.multi_hand_landmarks[0]
        points = [[float(point.x), float(point.y), float(point.z)] for point in hand.landmark]
        handedness = None
        if result.multi_handedness:
            handedness = result.multi_handedness[0].classification[0].label

        width, height = image.size
        xs = [point[0] * width for point in points]
        ys = [point[1] * height for point in points]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        span = max(max_x - min_x, max_y - min_y, 1.0)
        padding = span * self.margin
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        half_size = span / 2 + padding
        left = max(0, int(center_x - half_size))
        top = max(0, int(center_y - half_size))
        right = min(width, int(center_x + half_size))
        bottom = min(height, int(center_y + half_size))
        crop = image.crop((left, top, right, bottom))
        crop = ImageOps.pad(crop, (max(crop.size), max(crop.size)), color=(245, 245, 245))

        return HandFrame(
            image=crop,
            detected=True,
            landmarks=points,
            handedness=handedness,
            bounding_box=(left, top, right, bottom),
        )

    def close(self) -> None:
        if self._hands is not None:
            self._hands.close()
