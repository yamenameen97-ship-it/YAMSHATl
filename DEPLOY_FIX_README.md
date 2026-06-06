# YAMSHAT — Correctifs Backend (CORS / 404 / 500 / Schema DB)

## 🔥 Causes réelles des erreurs visibles dans la console

Sur les captures fournies, les erreurs étaient :

1. **`AttributeError: 'Settings' object has no attribute 'effective_database_url'`**
   → crash du backend au démarrage → toutes les routes répondent en erreur
2. **`notifications.user_id does not exist at character 46`** (PostgreSQL live)
   → 500 sur `/api/notifications` → le navigateur l'affiche comme erreur CORS
3. **404 sur `/api/notifications/register-device`**, `subscribe-push`, `unregister-device`
   → routes absentes côté backend, mais appelées par le frontend
4. **404 sur `POST /api/upload`** (sans slash)
   → la route n'existait qu'en `/api/upload/` (avec slash) et `redirect_slashes=False`
5. **`Unexpected Error in pubsub listening thread`** (Redis)
   → Redis indisponible, mais le backend tentait quand même d'utiliser AsyncRedisManager
6. **`No 'Access-Control-Allow-Origin' header`** sur 4xx/5xx
   → les exception handlers ne réinjectaient pas les CORS headers

## ✅ Fichiers modifiés

| Fichier | Correction |
|---|---|
| `backend/app/main.py` | Bootstrap DB tolérant aux erreurs au démarrage, lifespan robuste |
| `backend/app/db/session.py` | Fallback défensif si `effective_database_url` est absent (ancien cache d'image) |
| `backend/app/db/bootstrap.py` | Vérifie systématiquement `notifications.user_id`, chaque étape de migration isolée dans try/except |
| `backend/app/core/error_handlers.py` | CORS headers ajoutés sur **toutes** les réponses d'erreur (4xx/5xx) → fini les fausses erreurs CORS |
| `backend/app/api/routes/upload.py` | Route `POST /api/upload` (sans slash) ajoutée en plus de `POST /api/upload/` |
| `backend/app/api/routes/notifications.py` | Ajout de : `register-device`, `unregister-device`, `subscribe-push`, `unsubscribe-push`, `DELETE /{id}`, `GET /unread-count` |
| `backend/app/api/routes/__init__.py` | Tous les routers exportés explicitement |

> ℹ️ `socket_server.py` était déjà OK (il fait déjà un probe Redis avant `AsyncRedisManager`).
> ℹ️ `security_extra.py` était déjà OK (CORS sur OPTIONS et erreurs internes).

## 🚀 Déploiement sur Render

1. **Backend** (`yamshat-1ya4`) :
   - Upload de cette archive en remplacement complet du dossier `backend/`
   - Vérifier que les variables d'env contiennent toujours :
     - `DATABASE_URL` → l'URL externe PostgreSQL (Oregon)
     - `FRONTEND_ORIGIN=https://yamshat8.onrender.com`
     - `CORS_ORIGINS=https://yamshat8.onrender.com,https://yamshat-1ya4.onrender.com`
   - **Manual Deploy → Clear build cache & deploy** (important pour casser l'ancien cache responsable de l'AttributeError)
   - Surveiller les logs : tu dois voir `Database initialized successfully on startup.`

2. **Vérification après deploy** :
   ```
   GET https://yamshat-1ya4.onrender.com/health
   ```
   doit retourner `{"status": "ok", "database": "ok", ...}`

3. **Frontend** (`yamshat8`) :
   - Aucun changement nécessaire dans le code frontend
   - Faire un hard refresh (`Ctrl+Shift+R`) côté navigateur pour vider le service worker

## 🧪 Comment confirmer que tout marche

Dans la console du navigateur après login, tu dois pouvoir :
- Charger les notifications → `GET /api/notifications` répond 200
- Publier un post → `POST /api/posts` répond 201
- Uploader → `POST /api/upload` répond 200 (sans slash final)
- Enregistrer le device → `POST /api/notifications/register-device` répond 200
- Pas d'erreur CORS rouge
- Pas de `notifications.user_id does not exist` dans les logs Render

## ⚠️ Points d'attention

- L'archive est livrée **sans `node_modules`** comme demandé
- Le backend a son `requirements.txt` ; Render relance `pip install` automatiquement
- Si la migration `notifications.user_id` échoue (permissions PG), exécuter manuellement sur la base externe :
  ```sql
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id INTEGER;
  ```
