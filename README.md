# Trame d'Ariane Mobile

PWA compagnon experimentale pour l'application desktop Trame d'Ariane.

Ce projet est separe du desktop pour tester l'usage mobile sans risquer de casser l'application principale.

## Objectif

Le mobile sert a :
- noter rapidement une idee ;
- dicter ou rediger un fragment de texte ;
- relire une liste d'idees ;
- consulter quelques elements narratifs ;
- exporter/importer un JSON local.

Il ne sert pas a remplacer l'app desktop. Pas de timeline complete, pas de graphe, pas de Dedale canvas.

## Demarrage

```powershell
npm install
npm run dev -- --host 0.0.0.0
```

Sur le PC :

```text
http://localhost:5173
```

Sur un telephone connecte au meme Wi-Fi, utiliser l'URL reseau affichee par Vite, par exemple :

```text
http://192.168.x.x:5173
```

Si le telephone ne charge pas la page, verifier le pare-feu Windows pour Node/Vite.

## Verification

```powershell
npm run build
npm run lint
npm audit --omit=dev
```

## Stack

- React
- TypeScript
- Vite
- vite-plugin-pwa
- localStorage

## Fichiers importants

- `AGENTS.md` : consignes Codex pour reprendre une discussion dans ce dossier.
- `docs/CONTEXT.md` : contexte complet de reprise.
- `src/App.tsx` : interface mobile actuelle.
- `src/types.ts` : contrat JSON mobile.
- `src/lib/mobileStore.ts` : stockage local et import/export.
- `vite.config.ts` : configuration PWA.

## Application desktop

Le desktop reste la source de verite.

Chemin local :

```text
C:\Users\Julien\Documents\Claude\Projets\Editeur Livre
```

Ne pas modifier ce projet desktop depuis une session mobile sans demande explicite.
