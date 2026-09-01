# Tests et sécurité TuniSign

Ce socle réduit les risques connus, mais aucun outil automatique ne peut certifier qu'une application est « protégée contre tout OWASP Top 10 ». La référence retenue est OWASP Top 10:2025, complétée par OWASP ASVS 5.0 pour les vérifications manuelles.

Références officielles : [OWASP Top 10](https://owasp.org/Top10/), [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), [Playwright](https://playwright.dev/docs/intro), [ZAP Baseline](https://www.zaproxy.org/docs/docker/baseline-scan/) et [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/).

## Outils retenus

| Niveau | Outil | Rôle |
| --- | --- | --- |
| Frontend | Vitest + Testing Library | composants, navigation et règles d'interface |
| Backend | JUnit 5 + Mockito + MockMvc + Spring Security Test | services, validation, JWT et autorisations 401/403 |
| IA | `unittest` | ordre des classes, normalisation et profils des modèles |
| E2E | Playwright + Chromium | parcours réel visiteur/authentification |
| Dépendances | `npm audit` + OWASP Dependency-Check | vulnérabilités connues JavaScript et Java |
| DAST | OWASP ZAP Baseline | analyse passive d'une application démarrée |
| CI | GitHub Actions | exécution à chaque push et pull request |

## Commandes locales

Frontend :

```powershell
cd frontend
npm ci
npm run lint
npm test
npm run build
npm run security:audit
$env:PLAYWRIGHT_BROWSERS_PATH="0"
npx playwright install chromium
npm run test:e2e
```

Backend :

```powershell
cd backend
mvn test
```

Si Maven n'a pas accès au dépôt utilisateur dans l'environnement Codex :

```powershell
mvn "-Dmaven.repo.local=$PWD\.m2\repository" test
```

Service IA :

```powershell
cd ai-service
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Analyse Java des dépendances (un `NVD_API_KEY` est recommandé pour éviter les limites du flux NVD) :

```powershell
cd backend
$env:NVD_API_KEY="votre-cle-nvd"
mvn -Psecurity-scan verify
```

Analyse ZAP passive, après démarrage de la plateforme dans un environnement de test :

```powershell
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:5173 -r zap-report.html
```

Ne lancez jamais un scan actif contre la production sans autorisation et fenêtre de maintenance.

## Couverture OWASP Top 10:2025

| Risque | Mesures présentes |
| --- | --- |
| A01 Contrôle d'accès | routes privées, rôles `ADMIN`, réponses JSON 401/403, tests MockMvc et navigation privée masquée |
| A02 Mauvaise configuration | profil production, Swagger désactivé, CORS explicite, CSP et autres en-têtes, erreurs sans stack trace |
| A03 Chaîne logicielle | lockfile npm, `npm audit`, Dependency-Check et CI reproductible |
| A04 Cryptographie | BCrypt coût 12, secret JWT Base64 d'au moins 256 bits, secret obligatoire en production |
| A05 Injection | JPA paramétré, DTO validés, listes d'avatar autorisées et limites d'upload |
| A06 Conception non sûre | blocage du dernier admin, 2FA optionnelle en deux étapes et vérification d'e-mail |
| A07 Authentification | JWT expirant, Google vérifié côté serveur, 2FA TOTP et limitation des tentatives |
| A08 Intégrité | signature des certificats, validation JWT et versions de dépendances verrouillées |
| A09 Journalisation | événements d'administration et échecs d'authentification journalisés sans mot de passe/token |
| A10 Erreurs exceptionnelles | réponses `ProblemDetail`, identifiant d'incident, limites de tailles et statuts 413/415/422/429 |

## Risques restant à corriger avant production

1. Les badges utilisés pour émettre un certificat doivent être recalculés uniquement depuis la progression stockée côté serveur. Le nombre envoyé par le navigateur ne doit jamais faire foi.
2. Le JWT est encore conservé dans `localStorage`. Pour réduire l'impact d'une XSS, migrer vers un cookie `HttpOnly`, `Secure`, `SameSite` et réactiver une protection CSRF adaptée.
3. La limitation de débit est en mémoire. Pour plusieurs instances, utiliser Redis ou la passerelle/API gateway.
4. Forcer HTTPS/TLS, HSTS et la gestion des secrets via le service d'hébergement, pas via Git.
5. Ajouter une vraie supervision centralisée, des alertes et une politique de rétention des journaux.
6. Faire une revue ASVS et un test d'intrusion indépendant avant toute mise en production publique.
