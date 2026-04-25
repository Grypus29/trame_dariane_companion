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

## Etat desktop apres reprise du 2026-04-25

Le repo desktop a maintenant une premiere implementation non committee de la synchro locale.

Fichiers desktop principaux modifies/ajoutes :

```text
src-tauri/src/mobile_sync.rs
src-tauri/src/lib.rs
src-tauri/Cargo.toml
src-tauri/Cargo.lock
src/components/PairMobileModal.tsx
src/components/Toolbar.tsx
src/screens/ProjectView.tsx
docs/API.md
docs/ARCHITECTURE.md
docs/ROADMAP.md
package.json
package-lock.json
```

Ce qui est implemente cote desktop :
- serveur HTTP local Rust/Tauri demarre a la demande par `start_mobile_pairing` ;
- ecoute sur `0.0.0.0:<port dynamique>` pendant que l'app desktop tourne ;
- detection d'une IP locale pour construire l'URL reseau ;
- `desktopInstanceId` stable stocke dans le dossier config Tauri ;
- token long aleatoire temporaire, garde en memoire, expiration 10 minutes ;
- modale desktop `Mobile` avec QR code scannable + URL copiable en fallback ;
- dependance frontend `qrcode` ajoutee pour generer le QR code ;
- `GET /pair/claim` ;
- `GET /sync/state` ;
- `POST /sync/push` ;
- mapping SQLite desktop vers `MobileState.version = 1` ;
- application des operations V1 sures dans SQLite, en transaction, puis retour de l'etat desktop final.

Verifications deja faites cote desktop :

```powershell
npm run build
cargo check
```

Les deux passent. Le build Vite garde seulement l'avertissement habituel sur la taille du chunk.

Important : le repo mobile n'a pas ete modifie par la conversation desktop, sauf ce fichier de relais a la demande explicite de Julien.

## Contrat desktop actuel pour la discussion mobile

La discussion mobile peut maintenant brancher l'app compagnon sur ces routes.

### Appairage

Le desktop affiche un QR code contenant une URL du type :

```text
http://<ip-locale>:<port>/pair/claim?token=<token>
```

Le mobile doit appeler :

```text
GET /pair/claim?token=<token>&deviceId=<deviceId>
```

Reponse desktop actuelle :

```json
{
  "pairingId": "pair_...",
  "desktopInstanceId": "desktop_...",
  "project": { "id": "1", "name": "Premier livre" },
  "serverRevision": 12,
  "state": {}
}
```

Le mobile doit stocker :
- `pairingId`
- `desktopInstanceId`
- `desktopBaseUrl` deduit de l'URL scannee
- `project.id`
- `project.name`
- `token`
- `serverRevision`
- `state`

### Lecture d'etat

```text
GET /sync/state
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

Reponse :

```json
{
  "serverRevision": 12,
  "state": {
    "version": 1,
    "pairing": {},
    "pendingOperations": [],
    "projects": [],
    "ideas": [],
    "dedaleLinks": [],
    "manuscriptNodes": [],
    "elements": []
  }
}
```

### Push mobile

```text
POST /sync/push
Authorization: Bearer <token>
X-Device-Id: <deviceId>
Content-Type: application/json
```

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

Regle mobile importante : apres un push accepte, remplacer la copie locale par `state` renvoye par le desktop et retirer de `pendingOperations` les operations dont l'id est dans `acceptedOperationIds`.

Operations desktop actuellement prises en charge :
- `idea.upsert`
- `idea.delete`
- `dedaleLink.upsert`
- `dedaleLink.delete`
- `manuscriptNode.upsert`
- `manuscriptNode.move`
- `manuscriptNode.delete`
- `element.upsert`
- `element.delete`

Regles desktop actuelles :
- tri par `createdAt`, puis par `id` ;
- transaction SQLite pour les operations valides ;
- resolution des IDs mobiles temporaires dans un meme push ;
- les operations invalides ou impossibles a resoudre ne sont pas acceptees et ne bloquent pas le reste ;
- le desktop renvoie toujours l'etat final comme source de verite.

## Ce qui reste a faire cote desktop apres branchement mobile

Quand le mobile aura commence a appeler les routes, reprendre dans le repo desktop et verifier :

1. Lancer l'app Tauri desktop reelle et ouvrir la modale `Mobile`.
2. Scanner le QR code depuis l'iPhone / Safari / PWA mobile.
3. Valider que `GET /pair/claim` est atteint depuis le telephone sur le meme Wi-Fi.
4. Tester `GET /sync/state` depuis le mobile avec les headers.
5. Tester un `POST /sync/push` avec une idee simple creee sur mobile.
6. Verifier dans le desktop que l'idee arrive bien dans le Dedale projet.
7. Tester un push de `dedaleLink`, `manuscriptNode` et `element`.
8. Ajuster les mappings desktop selon les vrais payloads emis par le mobile.
9. Ajouter ensuite un vrai stockage des appairages autorises si besoin.
10. Durcir les conflits et ajouter des messages utilisateur plus nets en cas de pare-feu Windows.

Points de vigilance cote desktop :
- le serveur lit `sqlite:trame.db` via le dossier `app_config_dir`, comme `tauri-plugin-sql` ;
- les nouvelles idees mobiles sans ID desktop sont creees comme idees du Dedale projet (`in_pool=1`) ;
- le mobile ne doit pas inventer des IDs desktop numeriques pour les nouvelles entites ; utiliser des IDs temporaires string et laisser le desktop renvoyer l'etat final ;
- le QR code est maintenant obligatoire dans l'UI desktop, l'URL copiable n'est qu'un secours ;
- ne pas transformer le mobile en app autonome.

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
