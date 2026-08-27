from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.hand_preprocessing import HandPreprocessor, normalize_landmarks  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collecte vidéo MediaPipe pour les expressions TuniSign")
    parser.add_argument("--label", default="BONJOUR", help="Première expression à collecter")
    parser.add_argument("--target", type=int, default=120, help="Nombre de clips recommandé par expression")
    parser.add_argument("--frames", type=int, default=32, help="Nombre de points temporels par clip")
    parser.add_argument("--interval", type=float, default=0.08, help="Intervalle entre deux images du clip")
    parser.add_argument("--camera", type=int, default=0, help="Index de la webcam OpenCV")
    parser.add_argument("--data", type=Path, default=ROOT / "dataset" / "video", help="Dossier des séquences")
    return parser.parse_args()


def load_labels() -> list[str]:
    return json.loads((ROOT / "models" / "sequence_labels.json").read_text(encoding="utf-8"))


def clip_count(folder: Path) -> int:
    return sum(1 for path in folder.glob("*.npz") if path.is_file())


def main() -> None:
    args = parse_args()
    labels = load_labels()
    if args.label not in labels:
        raise SystemExit(f"Expression inconnue : {args.label}. Valeurs : {', '.join(labels)}")
    if args.frames < 8:
        raise SystemExit("--frames doit être au moins égal à 8.")

    detector = HandPreprocessor()
    if not detector.available:
        raise SystemExit(f"MediaPipe Hands indisponible : {detector.error}")

    camera = cv2.VideoCapture(args.camera)
    if not camera.isOpened():
        raise SystemExit("Webcam inaccessible. Vérifiez --camera et les autorisations Windows.")

    index = labels.index(args.label)
    recording = False
    automatic = False
    sequence: list[np.ndarray] = []
    detected_flags: list[bool] = []
    last_sample = 0.0
    next_auto_start = 0.0

    print("Touches : ESPACE=enregistrer un clip, A=mode automatique, N/P=expression, Q=quitter")
    try:
        while True:
            ok, frame_bgr = camera.read()
            if not ok:
                continue
            frame_bgr = cv2.flip(frame_bgr, 1)
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            hand = detector.extract(Image.fromarray(frame_rgb))
            label = labels[index]
            destination = args.data / label
            destination.mkdir(parents=True, exist_ok=True)
            count = clip_count(destination)

            now = time.monotonic()
            if automatic and not recording and count < args.target and now >= next_auto_start:
                recording = True
                sequence = []
                detected_flags = []
                last_sample = 0.0

            if recording and now - last_sample >= args.interval:
                if hand.detected and hand.landmarks:
                    features = normalize_landmarks(hand.landmarks, hand.handedness)
                    detected_flags.append(True)
                else:
                    features = np.zeros(63, dtype=np.float32)
                    detected_flags.append(False)
                sequence.append(np.asarray(features, dtype=np.float32))
                last_sample = now

                if len(sequence) >= args.frames:
                    detection_rate = sum(detected_flags) / len(detected_flags)
                    if detection_rate >= 0.65:
                        filename = destination / f"{label}_{int(time.time() * 1000)}_{count:04d}.npz"
                        np.savez_compressed(
                            filename,
                            features=np.stack(sequence),
                            detected=np.asarray(detected_flags, dtype=np.bool_),
                            label=label,
                        )
                        print(f"Clip enregistré : {filename.name} ({detection_rate:.0%} de main détectée)")
                    else:
                        print(f"Clip rejeté : main visible seulement {detection_rate:.0%} du temps.")
                    recording = False
                    sequence = []
                    detected_flags = []
                    next_auto_start = now + 1.2

            preview = frame_bgr.copy()
            if hand.bounding_box:
                left, top, right, bottom = hand.bounding_box
                cv2.rectangle(preview, (left, top), (right, bottom), (55, 220, 170), 3)
            progress = len(sequence) if recording else 0
            status = f"{label}: {count}/{args.target} | clip={progress}/{args.frames} | auto={'ON' if automatic else 'OFF'}"
            cv2.putText(preview, status, (18, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.66, (50, 240, 190), 2)
            cv2.putText(preview, "ESPACE clip | A auto | N/P expression | Q quitter", (18, 66), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (245, 245, 245), 1)
            if recording:
                cv2.putText(preview, "GESTE EN COURS", (18, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (40, 190, 255), 3)
            cv2.imshow("TuniSign - collecte expressions", preview)

            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break
            if key == 32 and not recording:
                recording = True
                sequence = []
                detected_flags = []
                last_sample = 0.0
            if key == ord("a"):
                automatic = not automatic
                next_auto_start = now + 1.0
            if key == ord("n") and not recording:
                index = min(index + 1, len(labels) - 1)
                automatic = False
            if key == ord("p") and not recording:
                index = max(index - 1, 0)
                automatic = False
    finally:
        detector.close()
        camera.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
