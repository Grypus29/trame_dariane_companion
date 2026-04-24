# Contexte de reprise - Trame d'Ariane Mobile

Derniere mise a jour : 2026-04-24

## Resume court
Trame d'Ariane Mobile est une PWA compagnon experimentale pour l'application desktop Trame d'Ariane. Elle ne remplace pas l'app principale. Elle sert a tester sur telephone les usages qui ont du sens : noter vite, relire, dicter, consulter quelques donnees narratives.

Le projet a ete cree separement pour eviter de toucher a la version desktop, qui reste la source de verite.

## Origine de la decision
Julie pensait que Trame d'Ariane etait une application mobile. La version actuelle est en fait une application desktop Tauri. Apres discussion, les choix poses sont :

- iOS natif est hors scope pour l'instant : pas de Mac, pas de Xcode, compte Apple Developer payant et distribution contraignante.
- Android APK est envisageable plus tard, mais le developpeur n'a pas de telephone Android reel pour valider le rendu.
- PWA est le meilleur premier pas, car elle permet de tester sur iPhone reel via Safari.
- Le mobile doit rester compagnon optionnel, pas application autonome complete.

## Application desktop de reference
Chemin local :
`C:\Users\Julien\Documents\Claude\Projets\Editeur Livre`

Repo desktop :
`https://github.com/Grypus29/trame_dariane`

Docs desktop importantes dans le projet principal :
- `docs/ARCHITECTURE.md`
- `docs/PRODUCT.md`
- `docs/DATABASE.md`
- `docs/API.md`
- `docs/ROADMAP.md`
- `docs/UI_GUIDE.md`
- `docs/UI_AUDIT.md`

Important : ne pas modifier le projet desktop depuis une discussion ouverte dans `trame-dariane-mobile`, sauf demande explicite.

## Promesse produit mobile
Phrase de cadrage :

> La version mobile est un compagnon optionnel de capture, lecture et redaction legere. L'application complete reste desktop.

Usages cibles :
- Capturer une idee avant de l'oublier.
- Utiliser la dictee vocale du telephone pour produire un brouillon brut.
- Relire les textes/fragments.
- Consulter des elements narratifs.
- Exporter les donnees vers le desktop.

Non-objectifs :
- Refaire toute l'app desktop.
- Representer la timeline complete sur telephone.
- Representer la Toile/graphe relationnel complet sur telephone.
- Faire un Dedale canvas tactile complexe.
- Ajouter une synchronisation cloud.
- Rendre le mobile autonome avec toute la logique projet.

## Etat actuel du prototype
Projet cree dans :
`C:\Users\Julien\Documents\Claude\Projets\trame-dariane-mobile`

Stack :
- React 19
- TypeScript
- Vite 7
- `vite-plugin-pwa`
- `localStorage` pour le stockage temporaire

Ecrans actuels :
- `Dédale` : liste mobile des idees + creation/edition rapide.
- `Écrire` : plan manuscrit mobile en arborescence `Chapitre` / `Sous-chapitre` / `Bloc`, avec edition du contenu de l'idee liee.
- `Éléments` : creation/edition des personnages, lieux, objets, themes et concepts.
- `Paramètres` : export/import JSON local, futur emplacement possible pour un appairage desktop.

Le prototype contient des donnees d'exemple dans `src/lib/mobileStore.ts`.

## Contrat de donnees actuel
Source : `src/types.ts`

Le format racine est :

```ts
type MobileState = {
  version: 1
  projects: Project[]
  ideas: MobileIdea[]
  manuscriptNodes: ManuscriptNode[]
  elements: NarrativeElement[]
}
```

Ce JSON est le futur point de contact avec le desktop. Tant que le format n'est pas stabilise, il ne faut pas encore ajouter une vraie synchro.

Note 2026-04-25 : le stockage local mobile a ete rapproche du vocabulaire desktop sans figer le futur contrat de transfert. Les anciens `texts` sont migres en idees de type `Fragment` quand ils existent dans le localStorage/import JSON. Le debrief transfert de donnees doit encore decider si le futur format passe en `version: 2` ou s'aligne directement sur les tables desktop.

Principes pour faire evoluer le contrat :
- incrementer `version` si le format devient incompatible ;
- garder les champs simples et serialisables ;
- eviter les champs derives qui peuvent etre recalcules cote desktop ;
- documenter toute evolution ici.

## Commandes utiles
Installer :

```powershell
cd "C:\Users\Julien\Documents\Claude\Projets\trame-dariane-mobile"
npm install
```

Lancer en local + reseau :

```powershell
npm run dev -- --host 0.0.0.0
```

Vite affiche alors :
- `http://localhost:5173`
- une URL reseau de type `http://192.168.x.x:5173`

Sur iPhone :
- connecter l'iPhone au meme Wi-Fi ;
- ouvrir l'URL reseau dans Safari ;
- tester la saisie, le clavier vocal, les onglets et le scroll ;
- pour simuler l'app installee : Safari > Partager > Ajouter a l'ecran d'accueil.

Verifier :

```powershell
npm run build
npm run lint
npm audit --omit=dev
```

## Points techniques connus
- `vite-plugin-pwa` stable ne declarait pas encore la compatibilite avec Vite 8 au moment de la creation. Le projet a donc ete aligne sur Vite 7, comme le desktop.
- `dev-dist` est genere par le plugin PWA en mode dev et ignore par ESLint/git.
- Les donnees sont sauvegardees dans `localStorage`, cle `trame-dariane-mobile-state-v1`.
- Il n'y a pas encore de backend, de SQLite mobile, ni de pont direct avec Tauri.

## Direction UX
Mobile-first, tres simple :
- gros champs tactiles ;
- navigation basse ;
- pas de mise en page dense ;
- priorite a la capture et a la dictee ;
- les vues complexes du desktop deviennent des listes ou des fiches.

La couleur et la matiere restent proches de l'identite desktop : papier, atelier, brun chaud, calme.

## Prochaines etapes probables
1. Tester sur iPhone reel, notamment le zoom Safari et la navigation basse.
2. Debrief transfert de donnees mobile <-> desktop.
3. Stabiliser le JSON exporte.
4. Ajouter une ergonomie mobile plus fine pour l'organisation dans `Écrire` : drag tactile ou commandes de deplacement plus riches.
5. Etudier les liens du `Dédale` sur mobile via une interaction de recherche/association plutot qu'un graphe.
6. Ajouter cote desktop un import manuel du JSON mobile, uniquement quand le format est clair.

## Obsidian / vault
Vault repere :
`C:\Users\Julien\Documents\Claude\Projets\Obsidian`

Observation au 2026-04-24 :
- le dossier visible contient `.claude/hot.md` et `.claude/settings.local.json` ;
- `hot.md` parle surtout d'infra, n8n, Whisper, Ollama, Syncthing et Home Assistant ;
- ce contenu n'est pas une specification directe de Trame d'Ariane Mobile.

Element potentiellement interessant plus tard :
- la note mentionne un pipeline vocal n8n : webhook -> Whisper -> Ollama -> ecriture `.md`.
- Ce pipeline peut inspirer une future capture vocale, mais il ne doit pas etre integre au prototype mobile sans decision explicite.

Consigne de reprise :
si l'utilisateur dit que des notes Obsidian existent pour Trame d'Ariane ou pour Julie, les chercher dans le vault avant de decider. Ne pas inventer de contexte Obsidian non verifie.

## Regles de travail
- Toujours partir de ce dossier pour les discussions mobile.
- Lire `AGENTS.md` puis ce fichier.
- Ne pas toucher a l'app desktop sans demande claire.
- Garder le prototype PWA jetable tant que l'usage n'est pas valide.
- Preferer des petits changements testables sur iPhone.
- Apres chaque changement UI significatif, verifier au moins une largeur mobile et lancer `npm run build` + `npm run lint`.
