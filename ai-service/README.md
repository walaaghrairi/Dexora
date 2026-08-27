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

## 3. Solution retenue : deux modèles TuniSign

L'ancien dépôt de 44 classes ne contient ni les poids, ni les images d'entraînement. TuniSign utilise donc deux modèles entraînés avec la webcam de l'application :

- `tunisign_static_v3.keras` : A-Z et chiffres 0-9 à partir d'images recadrées ;
- `tunisign_words_v1.keras` : `BONJOUR`, `HI`, `THANK_YOU`, `I_LOVE_YOU` et `MERCI` à partir de séquences de points MediaPipe.

Le service charge automatiquement ces modèles lorsqu'ils existent. `/health` expose `capabilities.alphabet`, `capabilities.numbers`, `capabilities.firstSigns` et `sequenceReady`. Le frontend garde chaque cours verrouillé tant que toutes ses classes ne sont pas réellement disponibles.

## 4. Collecter son propre dataset webcam

Commencer par A, puis recommencer pour chaque classe. Utiliser plusieurs utilisateurs, fonds, distances et éclairages.

```powershell
.\.venv\Scripts\python.exe scripts\collect_webcam.py --label A --target 200
```

Pour collecter les chiffres 0 à 9, démarrer sur 0 puis utiliser `N` pour passer au chiffre suivant :

```powershell
.\.venv\Scripts\python.exe scripts\collect_webcam.py --profile numbers --label 0 --target 300
```

Touches de la fenêtre :

- `ESPACE` : enregistrer une image ;
- `A` : activer/désactiver la capture automatique ;
- `N` / `P` : classe suivante/précédente ;
- `Q` ou `Échap` : quitter.

Les images recadrées sont placées dans `dataset/images/<classe>/`. Les 63 valeurs issues des 21 points sont enregistrées dans `dataset/landmarks/<classe>.jsonl`.

Recommandation minimale : 200 images par classe, au moins 3 personnes, 3 fonds et 3 niveaux d'éclairage. Pour `A/S` et `M/N/T`, viser 400 images par classe.

## 5. Entraîner le correcteur A/S

Après avoir collecté au moins 30 exemples de A et de S :

```powershell
.\.venv\Scripts\python.exe scripts\train_as_landmarks.py
```

Redémarrer ensuite le service. `/health` doit afficher `asLandmarkRefiner: true`.

## 6. Réentraîner le modèle d'images

Le profil par défaut `alphabet` entraîne uniquement les 26 lettres A–Z utilisées par les leçons. Les anciennes classes de contrôle `del`, `nothing` et `space` ne sont donc pas obligatoires.

Vérifier d'abord les images sans lancer TensorFlow :

```powershell
.\.venv\Scripts\python.exe scripts\train_model.py --check-only
```

```powershell
.\.venv\Scripts\python.exe scripts\train_model.py --epochs 15 --fine-tune-epochs 5
```

Pour reproduire explicitement l'ancien modèle à 29 classes, il faut collecter les trois classes de contrôle puis utiliser `--profile legacy29`. `--profile available` reste disponible pour un prototype incomplet.

Après avoir collecté A-Z et 0-9, vérifier puis entraîner le modèle étendu sans écraser le modèle Alphabet actuel :

```powershell
.\.venv\Scripts\python.exe scripts\train_model.py --profile extended --check-only
.\.venv\Scripts\python.exe scripts\train_model.py --profile extended --epochs 20 --fine-tune-epochs 8
```

Le script :

- fixe explicitement `class_names` ;
- génère `asl_recognition_model_v2.classes.json`, `asl_recognition_model_v2.labels.json` et les métadonnées liées au modèle ;
- applique rotation, translation, zoom, contraste et miroir ;
- augmente le poids de `A/S/M/N/T` ;
- enregistre le profil `extended` dans `models/tunisign_static_v3.keras` ;
- marque l'ordre des classes comme vérifié.

Au redémarrage, le service choisit d'abord `tunisign_static_v3.keras`, puis l'ancien modèle étendu s'il est fourni, puis `asl_recognition_model_v2.keras`. Pour forcer explicitement un autre modèle :

```powershell
$env:MODEL_PATH="models/asl_recognition_model_v2.keras"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## 7. Collecter et entraîner les expressions vidéo

Lancer la collecte sur `BONJOUR`. `N` et `P` changent d'expression, `ESPACE` enregistre un clip et `A` active la collecte automatique :

```powershell
.\.venv\Scripts\python.exe scripts\collect_video.py --label BONJOUR --target 120
```

Utiliser au moins 3 personnes, plusieurs fonds et plusieurs distances. Chaque clip dure environ 2,5 secondes et contient 32 séries de 63 coordonnées normalisées.

Vérifier puis entraîner le GRU :

```powershell
.\.venv\Scripts\python.exe scripts\train_sequence_model.py --check-only
.\.venv\Scripts\python.exe scripts\train_sequence_model.py --epochs 60
```

Le modèle est enregistré dans `models/tunisign_words_v1.keras`. Le frontend capture automatiquement une séquence webcam et l'envoie à `/predict-sequence`.

## 8. Évaluer les confusions

Collecter des images indépendantes (nouvelle session, autres fonds et éclairages) dans `dataset/test/images/<classe>/`. Le script de collecte crée automatiquement cette structure :

```powershell
.\.venv\Scripts\python.exe scripts\collect_webcam.py --data dataset/test --label A --target 30
```

Puis exécuter :

```powershell
.\.venv\Scripts\python.exe scripts\evaluate_model.py
```

Les résultats sont créés dans `reports/evaluation.json` et `reports/evaluation.csv`. Vérifier particulièrement `A↔S`, `M↔N`, `M↔T` et `N↔T`.

## 9. Cas J et Z

J et Z comprennent un mouvement. Le classifieur d'image ne voit qu'une pose finale et ne peut donc pas les valider complètement. Ils sont déclarés dans `dynamicClasses` et la réponse `/predict` renvoie `motionRequired: true`.

Étape future : enregistrer des clips dans `dataset/video/J/` et `dataset/video/Z/`, extraire une séquence de points MediaPipe, puis entraîner un modèle temporel (LSTM, GRU ou Transformer léger).
