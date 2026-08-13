from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Entraîne le correcteur A/S sur les 21 points MediaPipe")
    parser.add_argument("--data", type=Path, default=ROOT / "dataset" / "landmarks")
    parser.add_argument("--output", type=Path, default=ROOT / "models" / "as_landmark_classifier.keras")
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--seed", type=int, default=2026)
    return parser.parse_args()


def load_records(folder: Path) -> tuple[np.ndarray, np.ndarray]:
    features: list[list[float]] = []
    targets: list[int] = []
    for target, label in enumerate(("A", "S")):
        path = folder / f"{label}.jsonl"
        if not path.exists():
            raise SystemExit(f"Données manquantes : {path}")
        with path.open(encoding="utf-8") as source:
            for line in source:
                record = json.loads(line)
                if len(record.get("features", [])) == 63:
                    features.append(record["features"])
                    targets.append(target)
    if min(targets.count(0), targets.count(1)) < 30:
        raise SystemExit("Collectez au moins 30 exemples A et 30 exemples S avant l'entraînement.")
    return np.asarray(features, dtype=np.float32), np.asarray(targets, dtype=np.int32)


def main() -> None:
    args = parse_args()
    import tensorflow as tf
    from tensorflow import keras

    tf.keras.utils.set_random_seed(args.seed)
    features, targets = load_records(args.data)
    order = np.random.default_rng(args.seed).permutation(len(features))
    features, targets = features[order], targets[order]
    split = int(len(features) * 0.8)
    train_x, validation_x = features[:split], features[split:]
    train_y, validation_y = targets[:split], targets[split:]

    model = keras.Sequential(
        [
            keras.Input(shape=(63,)),
            keras.layers.GaussianNoise(0.015),
            keras.layers.Dense(64, activation="relu"),
            keras.layers.Dropout(0.25),
            keras.layers.Dense(24, activation="relu"),
            keras.layers.Dense(2, activation="softmax"),
        ],
        name="as_landmark_refiner",
    )
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    model.fit(
        train_x,
        train_y,
        validation_data=(validation_x, validation_y),
        epochs=args.epochs,
        batch_size=16,
        callbacks=[keras.callbacks.EarlyStopping(patience=8, restore_best_weights=True)],
        verbose=2,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.output)
    print(f"Correcteur A/S enregistré : {args.output}")


if __name__ == "__main__":
    main()
