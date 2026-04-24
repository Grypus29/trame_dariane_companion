# Trame d'Ariane Mobile - Instructions Codex

## Contexte
Prototype PWA compagnon de l'application desktop Trame d'Ariane.

L'application desktop principale vit dans :
`C:\Users\Julien\Documents\Claude\Projets\Editeur Livre`

Ce projet mobile est volontairement separe pour ne pas fragiliser la version desktop. Il sert a tester l'usage mobile reel sur iPhone via Safari avant de decider si une APK Android native vaut le coup.

## Produit
But : compagnon optionnel, non autonome, pour Julie.

Ce que le mobile doit faire :
- capturer une idee rapidement ;
- consulter les idees sous forme de liste ;
- lire et editer des fragments de texte ;
- permettre la redaction par dictee vocale du telephone ;
- consulter les elements narratifs simples ;
- exporter/importer un JSON local qui servira de passerelle avec le desktop.

Ce que le mobile ne doit pas faire pour l'instant :
- pas de portage complet de l'app desktop ;
- pas de timeline complexe sur telephone ;
- pas de Toile/graphe complet ;
- pas de Dedale canvas, seulement une liste ;
- pas de cloud ;
- pas de sync automatique ;
- pas d'iOS natif tant qu'il n'y a pas de Mac/Xcode ;
- pas d'APK Android tant que le flux PWA n'est pas valide.

## Stack
- React + TypeScript
- Vite
- vite-plugin-pwa
- Stockage actuel : `localStorage`
- Donnees d'echange : JSON versionne `MobileState.version = 1`

## Commandes
```powershell
npm install
npm run dev -- --host 0.0.0.0
npm run build
npm run lint
npm audit --omit=dev
```

URL locale :
`http://localhost:5173`

URL reseau pour telephone :
Vite affiche une URL de type `http://192.168.x.x:5173`.
Le telephone doit etre sur le meme Wi-Fi. Si l'URL ne charge pas, verifier le pare-feu Windows pour Node/Vite.

## Structure utile
- `src/App.tsx` : prototype complet et navigation mobile.
- `src/types.ts` : contrat de donnees mobile.
- `src/lib/mobileStore.ts` : chargement/sauvegarde localStorage + import JSON.
- `vite.config.ts` : configuration PWA.
- `public/app-icon.svg` : icone PWA.
- `docs/CONTEXT.md` : contexte detaille pour reprise de discussion.

## Contraintes
- Ne pas modifier le projet desktop depuis ce dossier sans demande explicite.
- Garder l'experience mobile simple et tactile.
- Toujours tester sur largeur mobile si l'UI change.
- Apres modification, lancer au minimum `npm run build` et `npm run lint`.
- Le contrat JSON doit rester simple et versionne.
- Toute evolution du format d'echange doit etre documentee dans `docs/CONTEXT.md`.

## Infos Obsidian disponibles
Vault repere :
`C:\Users\Julien\Documents\Claude\Projets\Obsidian`

Etat observe au 2026-04-24 : le dossier visible contient surtout `.claude/hot.md`, avec du contexte infra/n8n non directement lie a Trame d'Ariane Mobile. Ne pas supposer qu'il existe une documentation produit mobile dans le vault sans la chercher explicitement.

Si une nouvelle discussion doit utiliser Obsidian, commencer par inspecter ce vault et demander confirmation avant d'en tirer des decisions produit.
