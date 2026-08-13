# Service IA TuniSign

Le service reconnaît les signes statiques ASL à partir d'une image webcam. La version 2 ajoute :

- détection et recadrage de la main avec MediaPipe Hands ;
- comparaison automatique de l'image normale et de sa version miroir ;
- ordre de classes explicite dans `models/class_indices.json` ;
- collecte d'images et des 21 points de la main ;
- réentraînement reproductible et rapport de confusion ;
- correcteur A/S entraîné sur les points MediaPipe.

## 1. Environnement

Python **3.12 x64** est requis. Python 3.14 n'est pas compatible avec TensorFlow 2.18.

```powershell
cd ai-service
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

État du service : <http://localhost:8000/health>

Les indicateurs importants sont :

- `handTracking: true` : MediaPipe est chargé ;
- `dualOrientation: true` : original et miroir sont testés ;
- `classOrderVerified`: `true` seulement pour un modèle produit par le nouveau script ;
- `asLandmarkRefiner: true` après entraînement du correcteur A/S.

## 2. Limite du modèle historique

Le H5 fourni possède bien 29 sorties, mais il ne contient ni `class_indices`, ni le code d'entraînement. Une recherche locale n'a trouvé aucun artefact original. L'ordre actuel est donc la convention suivante :

```text
A-Z, del, nothing, space
```

Cet ordre est écrit explicitement dans `models/class_indices.json`, mais `model_metadata.json` garde `classOrderVerified: false`. Il ne faut passer cette valeur à `true` que si l'artefact original confirme l'ordre, ou après un réentraînement avec `scripts/train_model.py`.

Audit :

```powershell
.\.venv\Scripts\python.exe scripts\audit_model.py
```

## 3. Collecter son propre dataset webcam

Commencer par A, puis recommencer pour chaque classe. Utiliser plusieurs utilisateurs, fonds, distances et éclairages.

```powershell
.\.venv\Scripts\python.exe scripts\collect_webcam.py --label A --target 200
```

Touches de la fenêtre :

- `ESPACE` : enregistrer une image ;
- `A` : activer/désactiver la capture automatique ;
- `N` / `P` : classe suivante/précédente ;
- `Q` ou `Échap` : quitter.

Les images recadrées sont placées dans `dataset/images/<classe>/`. Les 63 valeurs issues des 21 points sont enregistrées dans `dataset/landmarks/<classe>.jsonl`.

Recommandation minimale : 200 images par classe, au moins 3 personnes, 3 fonds et 3 niveaux d'éclairage. Pour `A/S` et `M/N/T`, viser 400 images par classe.

## 4. Entraîner le correcteur A/S

Après avoir collecté au moins 30 exemples de A et de S :

```powershell
.\.venv\Scripts\python.exe scripts\train_as_landmarks.py
```

Redémarrer ensuite le service. `/health` doit afficher `asLandmarkRefiner: true`.

## 5. Réentraîner le modèle d'images

Le mode normal exige les 29 dossiers. Pour un essai incomplet, ajouter `--allow-partial`.

```powershell
.\.venv\Scripts\python.exe scripts\train_model.py --epochs 15 --fine-tune-epochs 5
```

Le script :

- fixe explicitement `class_names` ;
- génère `asl_recognition_model_v2.classes.json`, `asl_recognition_model_v2.labels.json` et les métadonnées liées au modèle ;
- applique rotation, translation, zoom, contraste et miroir ;
- augmente le poids de `A/S/M/N/T` ;
- enregistre un modèle MobileNetV2 dans `models/asl_recognition_model_v2.keras` ;
- marque l'ordre des classes comme vérifié.

Pour utiliser le nouveau modèle :

```powershell
$env:MODEL_PATH="models/asl_recognition_model_v2.keras"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## 6. Évaluer les confusions

Placer un dataset indépendant dans `dataset/test/<classe>/`, puis exécuter :

```powershell
.\.venv\Scripts\python.exe scripts\evaluate_model.py
```

Les résultats sont créés dans `reports/evaluation.json` et `reports/evaluation.csv`. Vérifier particulièrement `A↔S`, `M↔N`, `M↔T` et `N↔T`.

## 7. Cas J et Z

J et Z comprennent un mouvement. Le classifieur d'image ne voit qu'une pose finale et ne peut donc pas les valider complètement. Ils sont déclarés dans `dynamicClasses` et la réponse `/predict` renvoie `motionRequired: true`.

Étape future : enregistrer des clips dans `dataset/video/J/` et `dataset/video/Z/`, extraire une séquence de points MediaPipe, puis entraîner un modèle temporel (LSTM, GRU ou Transformer léger).
