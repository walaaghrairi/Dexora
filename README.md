# Dexora

Monorepo scaffold for the Dexora project.

## Structure

- `frontend/` — React, TypeScript, and Vite
- `backend/` — Spring Boot, Maven, and Java 21
- `ai-service/` — FastAPI
- `database/` — PostgreSQL assets (to be added later)
- `docs/` — Project documentation

## Vérification e-mail et connexion Google

L'inscription par mot de passe crée un compte non vérifié. TuniSign envoie un lien à usage unique valable 30 minutes et bloque la connexion jusqu'à sa validation. En développement, sans serveur SMTP, le lien de test est affiché dans l'interface et dans les logs du backend.

La connexion Google utilise Google Identity Services dans React. Le jeton d'identité reçu est vérifié côté Spring Boot (signature, audience, émetteur et expiration), puis le backend crée son propre JWT TuniSign. Un e-mail confirmé par Google est considéré comme vérifié.

### 1. Créer l'identifiant Google OAuth

Dans Google Cloud Console :

1. Configurez l'écran de consentement OAuth.
2. Créez un identifiant **OAuth 2.0 Client ID** de type **Web application**.
3. Ajoutez `http://localhost:5173` aux **Authorized JavaScript origins**.
4. Copiez le Client ID ; aucun secret Google ne doit être placé dans le frontend.

### 2. Configurer le frontend

Copiez `frontend/.env.example` vers `frontend/.env.local`, puis remplacez :

```env
VITE_GOOGLE_CLIENT_ID=123456789-example.apps.googleusercontent.com
```

### 3. Configurer le backend (PowerShell)

Le backend doit recevoir exactement le même Client ID :

```powershell
$env:GOOGLE_CLIENT_ID="123456789-example.apps.googleusercontent.com"
$env:FRONTEND_BASE_URL="http://localhost:5173"
```

Pour envoyer de vrais e-mails avec Gmail, activez la validation en deux étapes du compte expéditeur, créez un mot de passe d'application, puis définissez :

```powershell
$env:MAIL_USERNAME="votre-adresse@gmail.com"
$env:MAIL_PASSWORD="mot-de-passe-application-16-caracteres"
$env:EMAIL_VERIFICATION_EXPOSE_DEV_LINK="false"
```

Ne placez jamais le mot de passe SMTP ou un secret dans Git. Redémarrez le frontend et le backend après toute modification des variables d'environnement.
