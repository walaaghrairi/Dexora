from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import cv2
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.hand_preprocessing import HandPreprocessor, normalize_landmarks  # noqa: E402

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collecte webcam TuniSign avec recadrage MediaPipe Hands")
    parser.add_argument("--label", default="A", help="Première classe à collecter")
    parser.add_argument("--target", type=int, default=200, help="Nombre recommandé d'images par classe")
    parser.add_argument("--camera", type=int, default=0, help="Index de la webcam OpenCV")
    parser.add_argument("--interval", type=float, default=0.30, help="Intervalle de capture automatique")
    parser.add_argument("--data", type=Path, default=ROOT / "dataset", help="Racine du dataset")
    parser.add_argument(
        "--profile",
        choices=("alphabet", "legacy29"),
        default="alphabet",
        help="alphabet=A-Z (cours), legacy29=A-Z+del/nothing/space",
    )
    return parser.parse_args()


def load_labels(profile: str) -> list[str]:
    with (ROOT / "models" / "labels.json").open(encoding="utf-8") as labels_file:
        labels = json.load(labels_file)
    if profile == "alphabet":
        return [label for label in labels if len(label) == 1 and "A" <= label <= "Z"]
    return labels


def image_count(folder: Path) -> int:
    return sum(1 for path in folder.glob("*") if path.suffix.lower() in IMAGE_EXTENSIONS)


def main() -> None:
    args = parse_args()
    labels = load_labels(args.profile)
    if args.label not in labels:
        raise SystemExit(f"Classe inconnue : {args.label}. Valeurs : {', '.join(labels)}")

    detector = HandPreprocessor()
    if not detector.available:
        raise SystemExit(f"MediaPipe Hands indisponible : {detector.error}")

    camera = cv2.VideoCapture(args.camera)
    if not camera.isOpened():
        raise SystemExit("Webcam inaccessible. Vérifiez --camera et les autorisations Windows.")

    index = labels.index(args.label)
    automatic = False
    last_capture = 0.0
    images_root = args.data / "images"
    landmarks_root = args.data / "landmarks"
    landmarks_root.mkdir(parents=True, exist_ok=True)

    print("Touches : ESPACE=enregistrer, A=auto, N=classe suivante, P=précédente, Q=quitter")
    try:
        while True:
            ok, frame_bgr = camera.read()
            if not ok:
                continue
            frame_bgr = cv2.flip(frame_bgr, 1)
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            hand = detector.extract(Image.fromarray(frame_rgb))
            label = labels[index]
            destination = images_root / label
            destination.mkdir(parents=True, exist_ok=True)
            count = image_count(destination)

            preview = frame_bgr.copy()
            if hand.bounding_box:
                left, top, right, bottom = hand.bounding_box
                cv2.rectangle(preview, (left, top), (right, bottom), (55, 220, 170), 3)
            status = f"{label}: {count}/{args.target} | main={'OK' if hand.detected else 'absente'} | auto={'ON' if automatic else 'OFF'}"
            cv2.putText(preview, status, (18, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (50, 240, 190), 2)
            cv2.putText(preview, "ESPACE capture | A auto | N/P classe | Q quitter", (18, 66), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (240, 240, 240), 1)
            cv2.imshow("TuniSign - collecte dataset", preview)

            now = time.monotonic()
            key = cv2.waitKey(1) & 0xFF
            should_capture = key == 32 or (automatic and now - last_capture >= args.interval and count < args.target)
            if should_capture and hand.detected and hand.landmarks:
                filename = f"{label}_{int(time.time() * 1000)}_{count:04d}.jpg"
                path = destination / filename
                hand.image.save(path, "JPEG", quality=95)
                features = normalize_landmarks(hand.landmarks, hand.handedness).tolist()
                record = {
                    "label": label,
                    "image": str(path.relative_to(args.data)),
                    "handedness": hand.handedness,
                    "features": features,
                }
                with (landmarks_root / f"{label}.jsonl").open("a", encoding="utf-8") as output:
                    output.write(json.dumps(record, ensure_ascii=False) + "\n")
                last_capture = now
            elif should_capture:
                print("Capture ignorée : aucune main complète détectée.")

            if key in (ord("q"), 27):
                break
            if key == ord("a"):
                automatic = not automatic
                last_capture = 0.0
            if key == ord("n"):
                index = min(index + 1, len(labels) - 1)
                automatic = False
            if key == ord("p"):
                index = max(index - 1, 0)
                automatic = False
    finally:
        detector.close()
        camera.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
