# API — trame-dariane-mobile

> Le mobile n'expose pas d'API. Il consomme les routes HTTP locales du desktop Tauri.
> Documentation complète du contrat dans `.claude/DESKTOP_HANDOFF.md`.

## Base URL

- Desktop local : `http://<ip-locale>:<port>` (variable, stocké dans `pairing.desktopBaseUrl`)

## Authentification

Après appairage, toutes les requêtes portent :

```
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

Le `token` est issu du paramètre `token=` de l'URL QR. Le `deviceId` est un UUID généré au premier lancement, persisté en localStorage.

## Routes consommées

### `GET /pair/claim`

**Usage** : appairage initial (une fois par installation)

Query params :
- `token` — secret court issu du QR
- `deviceId` — UUID de l'appareil

Réponse :
```json
{
  "pairingId": "pair_...",
  "desktopInstanceId": "desktop_...",
  "project": { "id": "123", "name": "Premier livre" },
  "serverRevision": 42,
  "state": {
    "ideas": [...],
    "elements": [...],
    "manuscriptNodes": [...],
    "dedaleLinks": [...],
    "projects": [...]
  }
}
```

---

### `GET /sync/state`

**Usage** : pull de l'état courant (au mount, retry 30s)

Headers : `Authorization`, `X-Device-Id`

Réponse :
```json
{
  "serverRevision": 43,
  "state": { ... }
}
```

---

### `POST /sync/push`

**Usage** : envoi de la queue d'opérations mobile vers le desktop

Headers : `Authorization`, `X-Device-Id`, `Content-Type: application/json`

Body :
```json
{
  "baseRevision": 42,
  "operations": [
    {
      "id": "uuid",
      "entity": "idea",
      "action": "upsert",
      "entityId": "idea-uuid",
      "payload": { ... },
      "createdAt": "2026-04-25T..."
    }
  ]
}
```

Réponse :
```json
{
  "acceptedOperationIds": ["uuid"],
  "serverRevision": 43,
  "state": { ... }
}
```

## Types d'opérations

| entity | action | payload |
|---|---|---|
| `idea` | `upsert` | `MobileIdea` complet ou patch `{ content, updatedAt }` |
| `dedaleLink` | `upsert` | `MobileIdeaLink` complet |
| `dedaleLink` | `delete` | `null` |
| `manuscriptNode` | `upsert` | `ManuscriptNode` complet |
| `manuscriptNode` | `move` | `{ parentId, sortOrder, updatedAt }` ou `{ direction, updatedAt }` |
| `element` | `upsert` | `NarrativeElement` complet |

## CORS

Le desktop doit répondre avec :
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Authorization, X-Device-Id, Content-Type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```
