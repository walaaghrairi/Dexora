from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Évalue TuniSign et produit une matrice de confusion")
    parser.add_argument("--data", type=Path, default=ROOT / "dataset" / "test")
    parser.add_argument("--model", type=Path, default=ROOT / "models" / "asl_recognition_model_v2.keras")
    parser.add_argument("--report", type=Path, default=ROOT / "reports" / "evaluation.json")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    from tensorflow import keras

    indices_path = args.model.with_suffix(".classes.json")
    if not indices_path.exists():
        indices_path = args.model.parent / "class_indices.json"
    indices = json.loads(indices_path.read_text(encoding="utf-8"))
    labels = [name for name, _ in sorted(indices.items(), key=lambda item: item[1])]
    metadata_path = args.model.with_suffix(".metadata.json")
    if not metadata_path.exists():
        metadata_path = args.model.parent / "model_metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {}
    model = keras.models.load_model(args.model, compile=False)
    confusion = np.zeros((len(labels), len(labels)), dtype=np.int64)

    for expected_index, label in enumerate(labels):
        for path in (args.data / label).glob("*"):
            if path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            image = Image.open(path).convert("RGB")
            candidates = []
            for variant in (image, ImageOps.mirror(image)):
                fitted = ImageOps.fit(variant, (224, 224), method=Image.Resampling.LANCZOS)
                pixels = np.asarray(fitted, dtype=np.float32)
                if metadata.get("normalization") == "0_1":
                    pixels /= 255.0
                prediction = np.asarray(model.predict(pixels[None, ...], verbose=0)[0])
                candidates.append(prediction)
            prediction = max(candidates, key=lambda values: float(np.max(values)))
            confusion[expected_index, int(np.argmax(prediction))] += 1

    total = int(confusion.sum())
    correct = int(np.trace(confusion))
    per_class = {}
    for index, label in enumerate(labels):
        samples = int(confusion[index].sum())
        per_class[label] = {
            "samples": samples,
            "accuracy": float(confusion[index, index] / samples) if samples else None,
        }
    confusions = []
    for expected in range(len(labels)):
        for predicted in range(len(labels)):
            if expected != predicted and confusion[expected, predicted]:
                confusions.append(
                    {
                        "expected": labels[expected],
                        "predicted": labels[predicted],
                        "count": int(confusion[expected, predicted]),
                    }
                )
    confusions.sort(key=lambda value: value["count"], reverse=True)
    report = {
        "model": str(args.model),
        "samples": total,
        "accuracy": correct / total if total else None,
        "classIndices": indices,
        "perClass": per_class,
        "topConfusions": confusions[:20],
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    matrix_path = args.report.with_suffix(".csv")
    with matrix_path.open("w", newline="", encoding="utf-8") as output:
        writer = csv.writer(output)
        writer.writerow(["expected/predicted", *labels])
        for index, label in enumerate(labels):
            writer.writerow([label, *confusion[index].tolist()])
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
