# Prompt de relais vers la conversation desktop

Derniere mise a jour : 2026-04-25

Ce document sert de relais entre la conversation mobile et une nouvelle conversation ouverte dans le repo desktop.

## Contexte de depart

Tu es dans le projet desktop :

```text
C:\Users\Julien\Documents\Claude\Projets\Editeur Livre
```

Repo desktop :

```text
https://github.com/Grypus29/trame_dariane
```

Le projet mobile compagnon est separe :

```text
C:\Users\Julien\Documents\Claude\Projets\Trame d'Ariane mobile
```

Repo mobile :

```text
https://github.com/Grypus29/trame_dariane_companion
```

Important :
- ne pas modifier le repo mobile depuis la conversation desktop sauf demande explicite ;
- ne pas confondre avec le repo desktop `trame_dariane` ;
- le desktop reste la source de verite produit et donnees ;
- le mobile est un compagnon appaire, pas une app autonome.

## Fichiers a lire avant de coder

Dans le repo mobile :

```text
C:\Users\Julien\Documents\Claude\Projets\Trame d'Ariane mobile\docs\SYNC.md
C:\Users\Julien\Documents\Claude\Projets\Trame d'Ariane mobile\docs\CONTEXT.md
```

Dans le repo desktop :

```text
docs\ARCHITECTURE.md
docs\DATABASE.md
docs\API.md
docs\PRODUCT.md
src\types.ts
src\lib\db.ts
src\screens\ProjectView.tsx
src\components\Toolbar.tsx
src-tauri\src\lib.rs
```

Lire d'abord les fichiers desktop existants pour respecter les patterns locaux.

## Decisions deja prises

Le mobile doit utiliser les appellations desktop :
- `Dédale`
- `Fil`
- `Éléments`
- `Toile`
- `Écrire`
- `Bilan`

Pour la V1 mobile :
- `Dédale` : liste mobile des idees, edition, liens mobiles sous forme d'association ;
- `Écrire` : arborescence `Chapitre` / `Sous-chapitre` / `Bloc`, chaque bloc pointe vers une idee ;
- `Éléments` : creation/edition complete ;
- `Paramètres` : appairage/synchro, import/export temporaire ;
- `Toile` : hors scope mobile ;
- `Fil` : hors scope mobile sauf future lecture simple ;
- `Bilan` : optionnel/light, pas obligatoire.

Decision synchro :
- V1 = synchronisation automatique sur Wi-Fi local ;
- appairage type WhatsApp Web, mais sans cloud ;
- le desktop affiche un QR code ;
- l'iPhone ouvre/scanne le lien ;
- le mobile ne doit pas etre pleinement utilisable sans appairage en experience produit normale ;
- le desktop reste source de verite ;
- le mobile garde une copie locale et des operations en attente ;
- au retour sur le meme Wi-Fi, le mobile pousse les operations.

## Etat du repo mobile au moment du relais

Derniers commits mobiles importants :

```text
c36af1f Document local wifi sync plan
74cd1ae Improve mobile viewport ergonomics
81eadfe Add mobile JSON copy paste exchange
f37603d Expand mobile writing and dedale workflows
b06d8cd Align mobile companion with desktop vocabulary
```

Le mobile contient deja :
- `MobileState.version = 1`
- `pairing: PairingState`
- `pendingOperations: SyncOperation[]`
- `projects`
- `ideas`
- `dedaleLinks`
- `manuscriptNodes`
- `elements`

Types principaux cote mobile :

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

Les operations prevues :

```ts
type SyncOperation = {
  id: string
  entity: 'idea' | 'dedaleLink' | 'manuscriptNode' | 'element'
  action: 'upsert' | 'delete' | 'move'
  entityId: string
  payload: unknown
  createdAt: string
}
```

## Objectif de la conversation desktop

Implementer la premiere brique desktop de la synchro locale :

1. Inspecter l'architecture Tauri existante.
2. Proposer ou implementer un serveur local HTTP cote desktop.
3. Ajouter un mecanisme d'appairage mobile :
   - generation d'un token temporaire ;
   - URL locale ;
   - affichage dans l'UI desktop, idealement QR code ou au minimum URL copiable pour V1 technique.
4. Ajouter les premieres routes :
   - `GET /pair/claim`
   - `GET /sync/state`
   - `POST /sync/push`
5. Mapper l'etat SQLite desktop vers le `MobileState` mobile.
6. Preparer l'application des operations mobiles vers SQLite.

Si tout implementer d'un coup est trop large, faire un premier batch vertical :
- serveur local ;
- route `/sync/state` lecture seule ;
- UI desktop qui affiche l'URL d'appairage ;
- documentation.

## Routes cible

### `GET /pair/claim`

Query :
- `token`
- `deviceId`

Reponse :

```json
{
  "pairingId": "pair_...",
  "desktopInstanceId": "desktop_...",
  "project": { "id": "1", "name": "Premier livre" },
  "state": {}
}
```

### `GET /sync/state`

Headers :
- `Authorization: Bearer <token>`
- `X-Device-Id: <deviceId>`

Reponse :

```json
{
  "serverRevision": 12,
  "state": {}
}
```

### `POST /sync/push`

Headers :
- `Authorization: Bearer <token>`
- `X-Device-Id: <deviceId>`

Body :

```json
{
  "baseRevision": 12,
  "operations": []
}
```

Reponse :

```json
{
  "acceptedOperationIds": [],
  "serverRevision": 13,
  "state": {}
}
```

## Contraintes importantes

- Pas de cloud.
- Pas de compte utilisateur.
- Token long aleatoire, temporaire au moment de l'appairage.
- Le serveur local doit ecouter uniquement pendant que le desktop tourne.
- Prevoir les problemes de pare-feu Windows.
- Rester simple pour V1.
- Ne pas faire de refonte UI large.
- Ne pas casser l'app desktop existante.
- Lancer au minimum le build desktop si le code change.
- Respecter les consignes `AGENTS.md` du repo desktop.

## Questions techniques a trancher dans la conversation desktop

1. Est-ce que le serveur local doit etre en Rust/Tauri ou en JS cote frontend ?
   - a priori Rust/Tauri est plus adapte pour ecouter un port local.
2. Quelle crate HTTP utiliser si aucune n'existe deja ?
   - choisir minimal et compatible Tauri v2.
3. Comment trouver l'IP locale a afficher dans le QR ?
4. Ou stocker `desktopInstanceId` et les appairages autorises ?
5. Quelle UI minimale pour afficher l'URL/QR ?
6. Faut-il commencer par URL copiable avant QR code pour reduire le risque ?

## Prompt court a utiliser

Demande utilisateur probable :

> Lis le fichier de relais mobile puis commence l'implementation desktop de la synchro Wi-Fi locale. Le fichier de relais est dans `C:\Users\Julien\Documents\Claude\Projets\Trame d'Ariane mobile\docs\DESKTOP_HANDOFF_PROMPT.md`. Travaille uniquement dans le repo desktop sauf besoin explicite.

