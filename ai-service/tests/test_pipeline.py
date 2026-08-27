from __future__ import annotations

import json
import sys
import unittest
from collections import Counter
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.hand_preprocessing import normalize_landmarks  # noqa: E402
from scripts.train_model import default_output, select_class_names  # noqa: E402
from scripts.train_sequence_model import resize_sequence, stratified_split  # noqa: E402


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

    def test_alphabet_profile_does_not_require_legacy_control_classes(self) -> None:
        labels = [*list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "del", "nothing", "space"]
        counts = Counter({label: 10 for label in labels})
        counts["del"] = 0

        selected, missing = select_class_names(labels, counts, "alphabet", False)

        self.assertEqual(list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), selected)
        self.assertEqual([], missing)

    def test_legacy_profile_still_requires_all_29_classes(self) -> None:
        labels = [*list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "del", "nothing", "space"]
        counts = Counter({label: 10 for label in labels})
        counts["del"] = 0

        _, missing = select_class_names(labels, counts, "legacy29", False)

        self.assertEqual(["del"], missing)

    def test_numbers_and_extended_profiles_use_the_expected_classes(self) -> None:
        labels = [*list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), *[str(value) for value in range(10)]]
        counts = Counter({label: 10 for label in labels})

        numbers, missing_numbers = select_class_names(labels, counts, "numbers", False)
        extended, missing_extended = select_class_names(labels, counts, "extended", False)

        self.assertEqual([str(value) for value in range(10)], numbers)
        self.assertEqual(labels, extended)
        self.assertEqual([], missing_numbers)
        self.assertEqual([], missing_extended)
        self.assertEqual("tunisign_static_v3.keras", default_output("extended").name)

    def test_extended_model_mapping_matches_the_source_database(self) -> None:
        indices = json.loads((ROOT / "models" / "cnn_model_keras2.classes.json").read_text(encoding="utf-8"))
        ordered = [name for name, _ in sorted(indices.items(), key=lambda item: item[1])]

        self.assertEqual(44, len(ordered))
        self.assertEqual(list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), ordered[:26])
        self.assertEqual([str(value) for value in range(10)], ordered[26:36])
        self.assertEqual("I love you", ordered[-1])

    def test_sequence_labels_and_resampling_are_stable(self) -> None:
        labels = json.loads((ROOT / "models" / "sequence_labels.json").read_text(encoding="utf-8"))
        source = np.arange(12 * 63, dtype=np.float32).reshape(12, 63)
        resized = resize_sequence(source, 32)
        targets = np.repeat(np.arange(5), 10)
        train_indices, validation_indices = stratified_split(targets, 0.2, 2026)

        self.assertEqual(["BONJOUR", "HI", "THANK_YOU", "I_LOVE_YOU", "MERCI"], labels)
        self.assertEqual((32, 63), resized.shape)
        self.assertEqual(40, len(train_indices))
        self.assertEqual(10, len(validation_indices))


if __name__ == "__main__":
    unittest.main()
