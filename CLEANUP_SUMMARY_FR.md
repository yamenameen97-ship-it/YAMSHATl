# Nettoyage du projet

Ce paquet a été réorganisé et allégé.

## Éléments supprimés
- fichiers de build et caches (`dist`, `__pycache__`, `.pytest_cache`, `.gradle`, `*.pyc`)
- fichiers temporaires et doublons techniques (`*.FIXED`, `*.orig`, `*.bak`, `*.old`, logs temporaires)
- maquettes/anciens écrans non reliés au flux principal (`frontend/legacy_html`, `web/`)
- ancienne archive imbriquée du projet (`yamshat/`)
- fichiers d’aperçu locaux inutiles
- configurations dupliquées à l’intérieur de `frontend/src/` qui ne doivent pas vivre dans le code source

## Structure conservée
- `backend/`
- `frontend/`
- `mobile/`
- `gateway/`
- `services/`
- `infra/`, `k8s/`, `monitoring/`, `gitops-repo/`
- `scripts/`, `tests/`, `worker/`, `security/`

## Remarque
Le nettoyage est volontairement conservateur : le code métier principal a été gardé, seules les parties manifestement générées, obsolètes ou dupliquées ont été retirées.
