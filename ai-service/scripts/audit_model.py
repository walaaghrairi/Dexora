from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit du modèle et de l'ordre des classes")
    parser.add_argument("--model", type=Path, default=ROOT / "models" / "asl_recognition_model.h5")
    args = parser.parse_args()
    from tensorflow import keras

    model = keras.models.load_model(args.model, compile=False)
    indices_path = args.model.with_suffix(".classes.json")
    if not indices_path.exists():
        indices_path = args.model.parent / "class_indices.json"
    metadata_path = args.model.with_suffix(".metadata.json")
    if not metadata_path.exists():
        metadata_path = args.model.parent / "model_metadata.json"
    indices = json.loads(indices_path.read_text(encoding="utf-8")) if indices_path.exists() else None
    metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {}
    digest = hashlib.sha256(args.model.read_bytes()).hexdigest()
    report = {
        "model": str(args.model),
        "sha256": digest,
        "inputShape": model.input_shape,
        "outputShape": model.output_shape,
        "configuredClassIndices": indices,
        "classOrderVerified": bool(metadata.get("classOrderVerified", False)),
        "classOrderSource": metadata.get("classOrderSource", "missing"),
        "warning": None if metadata.get("classOrderVerified") else (
            "Le H5 ne stocke pas class_indices. Fournissez l'artefact original ou réentraînez avec train_model.py."
        ),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2, default=str))


if __name__ == "__main__":
    main()
