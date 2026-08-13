from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.hand_preprocessing import normalize_landmarks  # noqa: E402


class PipelineConfigurationTests(unittest.TestCase):
    def test_class_indices_are_contiguous_and_match_labels(self) -> None:
        labels = json.loads((ROOT / "models" / "labels.json").read_text(encoding="utf-8"))
        indices = json.loads((ROOT / "models" / "class_indices.json").read_text(encoding="utf-8"))
        ordered = [name for name, _ in sorted(indices.items(), key=lambda item: item[1])]
        self.assertEqual(list(range(29)), sorted(indices.values()))
        self.assertEqual(labels, ordered)

    def test_landmarks_are_translation_and_scale_normalized(self) -> None:
        points = [[float(index), float(index * 2), float(index) / 10] for index in range(21)]
        normalized = normalize_landmarks(points, "Right").reshape(21, 3)
        np.testing.assert_allclose(normalized[0], np.zeros(3), atol=1e-7)
        self.assertAlmostEqual(float(np.max(np.linalg.norm(normalized[:, :2], axis=1))), 1.0, places=6)

    def test_left_hand_is_reflected_to_canonical_orientation(self) -> None:
        points = [[float(index), float(index * 2), 0.0] for index in range(21)]
        right = normalize_landmarks(points, "Right").reshape(21, 3)
        left = normalize_landmarks(points, "Left").reshape(21, 3)
        np.testing.assert_allclose(left[:, 0], -right[:, 0], atol=1e-7)
        np.testing.assert_allclose(left[:, 1:], right[:, 1:], atol=1e-7)


if __name__ == "__main__":
    unittest.main()
