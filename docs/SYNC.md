# Synchronisation mobile V1

Derniere mise a jour : 2026-04-25

## Decision produit

La version mobile est un compagnon appaire au desktop. Elle ne doit pas devenir une application autonome gratuite.

Regle V1 :
- sans appairage, le mobile ne donne pas acces aux vues metier ;
- le desktop reste la source de verite ;
- le mobile emprunte une session de travail sur un projet desktop ;
- la synchronisation se fait automatiquement sur Wi-Fi local ;
- il n'y a pas de cloud ni de compte utilisateur.

## Experience cible

1. Julie ouvre le desktop.
2. Dans le desktop, elle choisit `Parametres > Appairer un mobile`.
3. Le desktop lance un serveur local temporaire et affiche un QR code.
4. Le QR code contient une URL locale du type :

```text
http://192.168.1.42:48973/pair?token=...&projectId=...
```

5. L'iPhone ouvre cette URL dans Safari.
6. Le mobile enregistre l'appairage et recupere l'etat initial du projet.
7. Les modifications mobile sont stockees localement comme operations.
8. Quand le desktop est joignable sur le meme Wi-Fi, le mobile pousse les operations en attente.
9. Le desktop applique les operations puis renvoie un etat a jour.

## Contraintes techniques

- Le PC et l'iPhone doivent etre sur le meme Wi-Fi.
- Le pare-feu Windows peut bloquer le serveur local desktop.
- iOS/Safari peut limiter certains comportements PWA en HTTP local. A valider sur iPhone reel.
- La V1 peut utiliser HTTP local avec token long aleatoire. Pas de cloud.
- Le serveur desktop doit etre actif uniquement quand l'app desktop est lancee.

## Appairage

Le desktop genere :
- `desktopInstanceId` : identifiant stable de l'installation desktop ;
- `pairingId` : identifiant de l'appairage ;
- `pairingToken` : secret aleatoire, long, affiche uniquement dans le QR ;
- `projectId` : projet desktop associe ;
- `expiresAt` : expiration du QR d'appairage, par exemple 10 minutes.

Le mobile stocke :
- `paired: true` ;
- `pairingId` ;
- `deviceId` ;
- `desktopInstanceId` ;
- `desktopBaseUrl` ;
- `projectId` ;
- `projectName` ;
- `pairedAt` ;
- `lastSyncAt` ;
- `token`.

Le token est un secret local. Il ne doit pas etre affiche dans l'interface.

## Routes desktop locales proposees

### `GET /pair/claim`

Utilisee apres ouverture du QR.

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

Retourne l'etat desktop courant pour le projet appaire.

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

Envoie les operations mobile en attente.

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

## Operations mobiles V1

Operations suffisantes pour les vues mobiles actuelles :

- `idea.upsert`
- `idea.delete` plus tard si suppression mobile ajoutee
- `dedaleLink.upsert`
- `dedaleLink.delete`
- `manuscriptNode.upsert`
- `manuscriptNode.move`
- `manuscriptNode.delete` plus tard si suppression mobile ajoutee
- `element.upsert`
- `element.delete` plus tard si suppression mobile ajoutee

Format commun :

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

## Conflits V1

Regle simple pour demarrer :
- le desktop applique les operations dans l'ordre `createdAt` ;
- si l'entite existe et a ete modifiee des deux cotes, le champ le plus recent gagne ;
- le desktop renvoie toujours l'etat final ;
- le mobile remplace sa copie locale par l'etat final apres push accepte.

Cette regle suffit pour un usage solo si Julie n'edite pas le meme bloc simultanement sur mobile et desktop.

## Etat verrouille

Sans appairage :
- afficher `Appairer a l'ordinateur` ;
- masquer `Dédale`, `Écrire`, `Éléments` ;
- permettre uniquement une page `Parametres/Appairage`.

Exception possible de developpement :
- un mode demo local peut rester disponible derriere un flag de dev, mais pas comme experience produit principale.

## Hors V1

- Cloud ou relais distant.
- Multi-utilisateur.
- Resolution fine des conflits avec interface dediee.
- Synchronisation en arriere-plan garantie sur iOS.
- Toile mobile.
