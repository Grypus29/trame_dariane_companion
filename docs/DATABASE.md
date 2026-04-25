# Stockage — trame-dariane-mobile

> Pas de base de données. Tout est en `localStorage` navigateur.

## Clé localStorage

```
trame-dariane-mobile-state-v1
```

## Format — MobileState (version 1)

```ts
type MobileState = {
  version: 1
  pairing: PairingState
  pendingOperations: SyncOperation[]
  projects: Project[]
  ideas: MobileIdea[]
  dedaleLinks: MobileIdeaLink[]
  manuscriptNodes: ManuscriptNode[]
  elements: NarrativeElement[]
}
```

### PairingState

| Champ | Type | Description |
|---|---|---|
| `paired` | boolean | Appairage actif |
| `pairingId` | string \| null | ID de session d'appairage |
| `deviceId` | string | UUID de l'appareil (généré une fois) |
| `desktopInstanceId` | string \| null | ID stable du desktop |
| `desktopBaseUrl` | string \| null | `http://<ip>:<port>` du serveur desktop |
| `projectId` | string \| null | Projet desktop associé |
| `projectName` | string \| null | Nom affiché |
| `token` | string \| null | Bearer token (secret, non affiché) |
| `serverRevision` | number \| null | Révision desktop au dernier sync |
| `pairedAt` | ISO8601 \| null | Date d'appairage |
| `lastSyncAt` | ISO8601 \| null | Date du dernier sync réussi |

### SyncOperation (queue)

| Champ | Type | Description |
|---|---|---|
| `id` | string | UUID de l'opération |
| `entity` | SyncEntity | `idea` \| `dedaleLink` \| `manuscriptNode` \| `element` |
| `action` | SyncAction | `upsert` \| `delete` \| `move` |
| `entityId` | string | ID de l'entité concernée |
| `payload` | unknown | Données à appliquer |
| `createdAt` | ISO8601 | Horodatage de création |

## Normalisation

Toutes les lectures localStorage passent par `normalizeState()` dans `mobileStore.ts`. Ça protège contre :
- Un format v0 (anciens `texts` migrés en idées de type `fragment`)
- Des champs manquants ou mal typés
- Un `version` incompatible (retour à `initialState`)

## Règles

- Incrémenter `version` si le format devient incompatible (actuellement `1`)
- Ne jamais stocker de données dérivées (recalculables côté desktop)
- Le `token` est un secret — ne jamais l'afficher dans l'UI
- La PWA installée et Safari partagent des localStorage séparés (limitation iOS)

## Évolutions prévues

| Évolution | Impact |
|---|---|
| Mapping vers tables desktop stabilisé | Potentiel passage à `version: 2` |
| Android natif | SQLite local possible (à décider) |
