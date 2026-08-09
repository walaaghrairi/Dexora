# Service IA TuniSign

Ce service charge un modèle Keras d'images fixes et expose `POST /predict`.

## Installation et démarrage

Depuis `ai-service` :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Vérifiez ensuite l'état du modèle sur <http://localhost:8000/health>.

Le fichier attendu est `models/asl_recognition_model.h5`. Il est volontairement ignoré par Git car il dépasse 100 Mo. Vous pouvez choisir un autre emplacement avec la variable `MODEL_PATH`.

## Important sur les classes

Le modèle possède 29 sorties, sans noms de classes enregistrés dans le fichier H5. `models/labels.json` utilise l'ordre conventionnel du dataset ASL Alphabet (`A-Z`, `del`, `nothing`, `space`). Remplacez cet ordre par le `class_indices` exact de l'entraînement si nécessaire.

Ce CNN reconnaît une image statique ASL en 224 × 224. Il ne reconnaît pas encore les mouvements vidéo, la posture complète ni la langue des signes tunisienne. Une version LST demandera un jeu de données tunisien et un modèle adapté.
