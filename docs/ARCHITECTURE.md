# Architecture — trame-dariane-mobile

## Vue d'ensemble

PWA mobile-only. Pas de serveur propre. Tout le state est en `localStorage`. La synchronisation se fait en Wi-Fi local vers le serveur HTTP du desktop Tauri.

```
iPhone (Safari / PWA)
    │
    ├── localStorage (cache MobileState)
    │
    └── HTTP local (Wi-Fi) ──→ Desktop Tauri (source de vérité)
                                    ├── /pair/claim
                                    ├── /sync/state
                                    └── /sync/push
```

## Stack

| Couche | Techno | Rôle |
|---|---|---|
| UI | React 19 + TypeScript | Composants, state local |
| Build | Vite 7 | Dev server, bundler |
| PWA | vite-plugin-pwa + Workbox | Service worker, manifest |
| Sync | fetch() natif | Appels HTTP vers le desktop |
| Stockage | localStorage | Cache local du state |
| Infra | Nginx (VM) / `--host` (dev) | Distribution de la PWA |

## Structure des dossiers

```
src/
├── App.tsx              — composant racine, toute la logique UI
├── App.css              — styles
├── types.ts             — types TypeScript partagés
├── sw.ts                — service worker PWA
└── lib/
    ├── mobileStore.ts   — load/save localStorage, normalisation
    ├── syncClient.ts    — appels HTTP vers le desktop (pair, state, push)
    └── syncEngine.ts    — hook useSyncEngine (auto-flush, retry, offline)
```

## Flux de données

### Appairage (une seule fois)
1. QR code desktop encode `http://<ip>:5173/?pair=<url-pair-claim-encodée>`
2. Safari ouvre l'URL → App lit `?pair=` → appelle `/pair/claim`
3. Réponse : token, état complet, infos projet → stockés en localStorage
4. À partir de là, toutes les requêtes portent `Authorization: Bearer <token>` + `X-Device-Id`

### Sync en cours de session
- **Pull** : `GET /sync/state` → écrase le cache local (desktop gagne)
- **Push** : `POST /sync/push` avec la queue d'opérations → desktop applique → renvoie état final
- Auto-flush : au mount, toutes les 30s, immédiatement sur nouvelle opération, au retour réseau

### Offline
- Les opérations s'accumulent dans `pendingOperations` (localStorage)
- Au retour du réseau : flush automatique

## Décisions d'architecture

| Décision | Raison | Alternative écartée |
|---|---|---|
| localStorage uniquement | Pas de SQLite mobile, PWA simple | SQLite via WASM (trop lourd) |
| Pas de backend propre | Le desktop est la source de vérité | Relay cloud (hors scope V1) |
| Vite 7 (pas 8) | Compatibilité vite-plugin-pwa stable | Vite 8 (non encore supporté au moment du setup) |
| useSyncEngine hook | Isolation sync / UI | Sync dans App.tsx directement |
| Token QR comme Bearer | Simplicité V1 | Token long-terme séparé (à faire si besoin) |

## Historique

| Date | Changement |
|---|---|
| 2026-04-24 | Création du projet PWA (React 19 + Vite 7 + vite-plugin-pwa) |
| 2026-04-25 | Ajout sync : syncClient, pairing QR, push/pull manuel |
| 2026-04-25 | feat/sync-mobile : syncEngine auto-flush, pairing gate, indicateur offline |
