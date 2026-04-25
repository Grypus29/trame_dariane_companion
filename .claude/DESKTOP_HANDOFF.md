# Handoff — Session desktop (trame_dariane)

> Ce fichier est écrit par la session mobile pour briefer la session desktop.
> Lire en entier avant toute action. Ne pas modifier ce fichier depuis la session desktop — mettre à jour MOBILE_HANDOFF.md à la place.

Mis à jour le 2026-04-25 — branche `feat/sync-mobile` du repo mobile.

---

## Contrat API attendu par le mobile

### `GET /pair/claim?token=TOKEN&deviceId=DEVICE_UUID`

Réponse attendue :
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
    "projects": [{ "id": "123", "name": "Premier livre" }]
  }
}
```

**Note token** : le mobile utilise le `token` de l'URL comme Bearer token pour toutes les requêtes suivantes. Si le desktop veut retourner un token différent (long-terme), le mettre dans `state.pairing.token` — mais le mobile ne l'utilise pas encore (voir `syncClient.ts:claimPairing`). À discuter si nécessaire.

### `GET /sync/state`

Headers :
```
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

Réponse :
```json
{
  "serverRevision": 43,
  "state": { "ideas": [...], "elements": [...], "manuscriptNodes": [...], "dedaleLinks": [...], "projects": [...] }
}
```

### `POST /sync/push`

Headers : `Authorization: Bearer <token>`, `X-Device-Id: <deviceId>`, `Content-Type: application/json`

Body :
```json
{
  "baseRevision": 42,
  "operations": [
    { "id": "uuid", "entity": "idea", "action": "upsert", "entityId": "idea-uuid", "payload": {...}, "createdAt": "ISO8601" }
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

Les opérations absentes de `acceptedOperationIds` restent en queue mobile et seront renvoyées.
La `state` retournée remplace entièrement le cache mobile (sauf `pairing` et les ops encore en attente).

---

## CORS — critique

**Problème potentiel** : Safari bloque les fetch cross-origin depuis la PWA vers le serveur HTTP local desktop.

Toutes les routes doivent répondre avec :
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Authorization, X-Device-Id, Content-Type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

Sans ça, le fetch depuis Safari sera bloqué avec une CORS error et le mobile ne pourra jamais se connecter.

---

## Types d'opérations que le mobile envoie

```
idea.upsert          payload : MobileIdea complet ou patch (content, updatedAt)
dedaleLink.upsert    payload : MobileIdeaLink complet
dedaleLink.delete    payload : null
manuscriptNode.upsert  payload : ManuscriptNode complet
manuscriptNode.move    payload : { parentId, sortOrder, updatedAt } ou { direction, updatedAt }
element.upsert       payload : NarrativeElement complet
```

Types `entity` possibles : `idea` | `dedaleLink` | `manuscriptNode` | `element`
Types `action` possibles : `upsert` | `delete` | `move`

---

## Pairing — durée de vie

- QR token (dans l'URL) : peut expirer en 10 minutes.
- Pairing (token bearer) : doit durer 30 jours, renouvelé à chaque sync réussie.

---

## Pare-feu Windows

Le serveur HTTP local desktop doit être autorisé dans le pare-feu Windows sinon l'iPhone ne peut pas l'atteindre même en Wi-Fi local. À documenter dans le README desktop et idéalement à détecter au lancement.

---

## Refresh desktop au push mobile

Quand le serveur Rust reçoit un `/sync/push` et l'applique, émettre un événement Tauri vers le frontend :

```rust
// handler /sync/push, après application des opérations
app_handle.emit("sync:updated", ()).ok();
```

```ts
// composant Dédale (et idéalement Écrire + Éléments)
useEffect(() => {
  const unlisten = listen("sync:updated", () => {
    refreshIdeas() // re-fetch SQLite des idées uniquement, sans reset de vue
  })
  return () => { unlisten.then(f => f()) }
}, [])
```

Objectif : l'idée ajoutée sur mobile apparaît dans le Dédale desktop sans que l'utilisateur change de page, et sans perturber le formulaire en cours d'édition (le refresh ne touche que la liste, pas le state local du formulaire).

---

## Mapping MobileState ↔ tables desktop

Non encore stabilisé. Décisions en attente :
- `dedaleLinks` → `dedale_links` desktop : confirmer le nom de table et les colonnes.
- `manuscriptNodes` avec `kind: block` → quelle table desktop ? (`manuscript_blocks` ?)
- `version: 1` du format mobile → potentiellement `version: 2` si le format change après stabilisation.
