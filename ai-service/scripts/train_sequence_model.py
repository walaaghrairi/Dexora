from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FEATURE_SIZE = 63


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Entraînement GRU des expressions vidéo TuniSign")
    parser.add_argument("--data", type=Path, default=ROOT / "dataset" / "video")
    parser.add_argument("--output", type=Path, default=ROOT / "models" / "tunisign_words_v1.keras")
    parser.add_argument("--sequence-length", type=int, default=32)
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--validation-split", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--minimum-clips", type=int, default=20)
    parser.add_argument("--check-only", action="store_true")
    return parser.parse_args()


def load_labels() -> list[str]:
    return json.loads((ROOT / "models" / "sequence_labels.json").read_text(encoding="utf-8"))


def resize_sequence(features: np.ndarray, target_length: int) -> np.ndarray:
    if features.ndim != 2 or features.shape[1] != FEATURE_SIZE or features.shape[0] == 0:
        raise ValueError(f"Séquence invalide : {features.shape}")
    positions = np.linspace(0, features.shape[0] - 1, target_length)
    indices = np.rint(positions).astype(np.int32)
    return features[indices].astype(np.float32)


def load_dataset(data: Path, labels: list[str], sequence_length: int) -> tuple[np.ndarray, np.ndarray, Counter]:
    samples: list[np.ndarray] = []
    targets: list[int] = []
    counts: Counter = Counter()
    for class_index, label in enumerate(labels):
        for path in sorted((data / label).glob("*.npz")):
            try:
                with np.load(path, allow_pickle=False) as clip:
                    features = resize_sequence(np.asarray(clip["features"], dtype=np.float32), sequence_length)
                samples.append(features)
                targets.append(class_index)
                counts[label] += 1
            except (KeyError, ValueError, OSError) as exc:
                print(f"Clip ignoré {path.name} : {exc}")
    if not samples:
        return np.empty((0, sequence_length, FEATURE_SIZE), dtype=np.float32), np.empty((0,), dtype=np.int32), counts
    return np.stack(samples), np.asarray(targets, dtype=np.int32), counts


def stratified_split(targets: np.ndarray, validation_split: float, seed: int) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    train_indices: list[int] = []
    validation_indices: list[int] = []
    for label in np.unique(targets):
        indices = np.flatnonzero(targets == label)
        rng.shuffle(indices)
        validation_count = max(1, int(round(len(indices) * validation_split)))
        validation_indices.extend(indices[:validation_count].tolist())
        train_indices.extend(indices[validation_count:].tolist())
    rng.shuffle(train_indices)
    rng.shuffle(validation_indices)
    return np.asarray(train_indices), np.asarray(validation_indices)


def main() -> None:
    args = parse_args()
    if not 0 < args.validation_split < 1:
        raise SystemExit("--validation-split doit être compris entre 0 et 1.")
    labels = load_labels()
    samples, targets, counts = load_dataset(args.data, labels, args.sequence_length)
    missing = [label for label in labels if counts[label] < args.minimum_clips]
    print("Clips : " + ", ".join(f"{label}={counts[label]}" for label in labels))
    if missing:
        raise SystemExit(
            f"Il faut au moins {args.minimum_clips} clips par expression. À compléter : " + ", ".join(missing)
        )
    if args.check_only:
        print("Vérification terminée : le dataset vidéo est prêt.")
        return

    from tensorflow import keras

    keras.utils.set_random_seed(args.seed)
    train_indices, validation_indices = stratified_split(targets, args.validation_split, args.seed)
    train_x, train_y = samples[train_indices], targets[train_indices]
    validation_x, validation_y = samples[validation_indices], targets[validation_indices]

    inputs = keras.Input(shape=(args.sequence_length, FEATURE_SIZE), name="landmark_sequence")
    x = keras.layers.Masking(mask_value=0.0)(inputs)
    x = keras.layers.GaussianNoise(0.015)(x)
    x = keras.layers.Bidirectional(keras.layers.GRU(64, return_sequences=True))(x)
    x = keras.layers.Dropout(0.30)(x)
    x = keras.layers.GRU(48)(x)
    x = keras.layers.Dropout(0.30)(x)
    x = keras.layers.Dense(64, activation="relu")(x)
    outputs = keras.layers.Dense(len(labels), activation="softmax", name="expressions")(x)
    model = keras.Model(inputs, outputs, name="tunisign_words_v1")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=7e-4),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(
        train_x,
        train_y,
        validation_data=(validation_x, validation_y),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=[
            keras.callbacks.EarlyStopping(patience=8, restore_best_weights=True, monitor="val_accuracy"),
            keras.callbacks.ReduceLROnPlateau(patience=4, factor=0.35, monitor="val_loss"),
        ],
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.output)
    indices = {label: index for index, label in enumerate(labels)}
    args.output.with_suffix(".classes.json").write_text(
        json.dumps(indices, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    metadata = {
        "modelVersion": "1.0",
        "modelType": "landmark-sequence-gru",
        "classOrderVerified": True,
        "sequenceLength": args.sequence_length,
        "featureSize": FEATURE_SIZE,
        "trainingClipCounts": dict(counts),
        "seed": args.seed,
    }
    args.output.with_suffix(".metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Modèle séquentiel enregistré : {args.output}")


if __name__ == "__main__":
    main()
