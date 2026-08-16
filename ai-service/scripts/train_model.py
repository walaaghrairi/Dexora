from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Réentraînement reproductible du classifieur ASL TuniSign")
    parser.add_argument("--data", type=Path, default=ROOT / "dataset" / "images")
    parser.add_argument("--output", type=Path, default=ROOT / "models" / "asl_recognition_model_v2.keras")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--fine-tune-epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=24)
    parser.add_argument("--validation-split", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--weights", choices=("imagenet", "none"), default="imagenet")
    parser.add_argument(
        "--profile",
        choices=("alphabet", "legacy29", "available"),
        default="alphabet",
        help="alphabet=A-Z (cours), legacy29=A-Z+del/nothing/space, available=classes non vides",
    )
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help="Alias historique de --profile available",
    )
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Vérifier les classes et les images sans lancer TensorFlow",
    )
    return parser.parse_args()


def configured_labels() -> list[str]:
    with (ROOT / "models" / "labels.json").open(encoding="utf-8") as labels_file:
        return json.load(labels_file)


def count_images(data_dir: Path, labels: list[str]) -> Counter:
    return Counter(
        {
            label: sum(1 for path in (data_dir / label).glob("*") if path.suffix.lower() in IMAGE_EXTENSIONS)
            for label in labels
        }
    )


def select_class_names(
    labels: list[str], counts: Counter, profile: str, allow_partial: bool
) -> tuple[list[str], list[str]]:
    if allow_partial:
        profile = "available"

    if profile == "alphabet":
        requested = [label for label in labels if len(label) == 1 and "A" <= label <= "Z"]
    elif profile == "legacy29":
        requested = labels
    else:
        requested = [label for label in labels if counts[label] > 0]

    missing = [label for label in requested if counts[label] == 0]
    return requested, missing


def main() -> None:
    args = parse_args()
    if not args.data.is_dir():
        raise SystemExit(f"Dataset introuvable : {args.data}")
    if not 0 < args.validation_split < 1:
        raise SystemExit("--validation-split doit être compris entre 0 et 1.")

    labels = configured_labels()
    counts = count_images(args.data, labels)
    selected_profile = "available" if args.allow_partial else args.profile
    class_names, missing = select_class_names(labels, counts, args.profile, args.allow_partial)
    if missing:
        raise SystemExit(
            f"Classes requises sans images pour le profil {selected_profile} : "
            + ", ".join(missing)
            + "."
        )
    if len(class_names) < 2:
        raise SystemExit("Au moins deux classes contenant des images sont nécessaires.")

    ignored = [label for label in labels if label not in class_names and counts[label] > 0]
    print(f"Profil : {selected_profile}")
    print("Classes : " + ", ".join(class_names))
    print("Images : " + ", ".join(f"{label}={counts[label]}" for label in class_names))
    if ignored:
        print("Classes ignorées par ce profil : " + ", ".join(ignored))
    if args.check_only:
        print("Vérification terminée : le dataset est prêt pour l'entraînement.")
        return

    import tensorflow as tf
    from tensorflow import keras

    tf.keras.utils.set_random_seed(args.seed)

    train_ds, validation_ds = keras.utils.image_dataset_from_directory(
        args.data,
        labels="inferred",
        label_mode="int",
        class_names=class_names,
        image_size=(224, 224),
        batch_size=args.batch_size,
        validation_split=args.validation_split,
        subset="both",
        seed=args.seed,
    )
    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(autotune)
    validation_ds = validation_ds.prefetch(autotune)

    augmentation = keras.Sequential(
        [
            keras.layers.RandomFlip("horizontal"),
            keras.layers.RandomRotation(0.08),
            keras.layers.RandomTranslation(0.10, 0.10),
            keras.layers.RandomZoom(0.15),
            keras.layers.RandomContrast(0.20),
        ],
        name="webcam_augmentation",
    )
    weights = None if args.weights == "none" else "imagenet"
    backbone = keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights=weights,
    )
    backbone.trainable = False
    inputs = keras.Input(shape=(224, 224, 3), name="image")
    x = augmentation(inputs)
    x = keras.applications.mobilenet_v2.preprocess_input(x)
    x = backbone(x, training=False)
    x = keras.layers.GlobalAveragePooling2D()(x)
    x = keras.layers.Dropout(0.30)(x)
    outputs = keras.layers.Dense(len(class_names), activation="softmax", name="classes")(x)
    model = keras.Model(inputs, outputs, name="tunisign_asl_v2")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    largest_class = max(counts[label] for label in class_names)
    difficult = {"A", "S", "M", "N", "T"}
    class_weight = {
        index: min(4.0, largest_class / max(counts[label], 1) * (1.5 if label in difficult else 1.0))
        for index, label in enumerate(class_names)
    }
    callbacks = [
        keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True, monitor="val_accuracy"),
        keras.callbacks.ReduceLROnPlateau(patience=2, factor=0.35, monitor="val_loss"),
    ]
    model.fit(
        train_ds,
        validation_data=validation_ds,
        epochs=args.epochs,
        class_weight=class_weight,
        callbacks=callbacks,
    )

    if args.fine_tune_epochs > 0:
        backbone.trainable = True
        for layer in backbone.layers[:-30]:
            layer.trainable = False
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=1e-5),
            loss="sparse_categorical_crossentropy",
            metrics=["accuracy"],
        )
        model.fit(
            train_ds,
            validation_data=validation_ds,
            epochs=args.fine_tune_epochs,
            class_weight=class_weight,
            callbacks=callbacks,
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.output)
    indices = {label: index for index, label in enumerate(class_names)}
    args.output.with_suffix(".classes.json").write_text(
        json.dumps(indices, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    args.output.with_suffix(".labels.json").write_text(
        json.dumps(class_names, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    metadata = {
        "modelVersion": "2.0",
        "trainingProfile": selected_profile,
        "classOrderVerified": True,
        "classOrderSource": "Explicit class_names passed to image_dataset_from_directory",
        "normalization": "embedded",
        "inputSize": [224, 224, 3],
        "dynamicClasses": [label for label in ("J", "Z") if label in class_names],
        "trainingImageCounts": {label: counts[label] for label in class_names},
        "ignoredClasses": ignored,
        "hardClasses": sorted(difficult.intersection(class_names)),
        "seed": args.seed,
    }
    args.output.with_suffix(".metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Modèle enregistré : {args.output}")
    print("Ordre exact :", indices)


if __name__ == "__main__":
    main()
