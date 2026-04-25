# Cahier des charges — trame-dariane-mobile

## Contexte & problème

Trame d'Ariane est une application desktop Tauri pour l'écriture de romans. Les utilisateurs ont besoin d'accéder à leurs données narratives et de capturer des idées depuis leur téléphone, sans attendre d'être devant leur ordinateur.

iOS natif est hors scope (pas de Mac, pas de licence Apple). Android APK est envisageable mais sans device réel pour valider. La PWA est le meilleur premier pas : testable sur iPhone via Safari, distribuable sans store.

## Utilisateurs cibles

Auteurs utilisant Trame d'Ariane desktop, qui veulent un compagnon mobile pour :
- Capturer une idée avant de l'oublier
- Dicter un brouillon brut via la reconnaissance vocale du téléphone
- Relire leurs textes et fragments en déplacement
- Consulter leurs éléments narratifs (personnages, lieux, etc.)

## Fonctionnalités attendues

### Must-have (V1 — état actuel)

- [x] Appairage QR avec le desktop (Wi-Fi local, sans cloud)
- [x] Sync automatique : pull au mount, push sur chaque action, retry 30s offline
- [x] Indicateur de connexion (connecté / hors ligne / en attente)
- [x] Gate appairage : vues métier inaccessibles sans pairing
- [x] Dédale : liste des idées, création/édition rapide, liens entre idées
- [x] Écrire : arborescence manuscrit (chapitre/sous-chapitre/bloc), édition de contenu
- [x] Éléments : personnages, lieux, objets, thèmes, concepts
- [x] Paramètres : appairage, export/import JSON
- [x] Mode offline : données utilisables, sync au retour connexion

### Nice-to-have (V2+)

- [ ] Rendu markdown dans les contenus (le desktop utilise du balisage)
- [ ] Passe ergonomie UX/UI mobile (touch targets, navigation, typo)
- [ ] Rafraîchissement desktop automatique quand le mobile pousse (Tauri events)
- [ ] Déploiement VM (URL publique pour tests distants)
- [ ] Dictée vocale intégrée (ou guide pour utiliser celle du clavier iOS)
- [ ] Android natif (Tauri mobile / Capacitor / React Native — à décider)
- [ ] iOS natif (conditionnel : licence Apple + Mac)

## Contraintes

- **Technique** : solo-dev, PWA uniquement pour V1, iPhone comme cible principale
- **Réseau** : Wi-Fi local uniquement, pas de cloud
- **Scope** : compagnon optionnel — le desktop reste l'application principale
- **Budget** : zéro coût infra supplémentaire (VM VeryCloud déjà existante)

## Non-objectifs

- Refaire toute l'application desktop sur mobile
- Représenter la Toile/graphe relationnel complet
- Représenter la timeline complète
- Canvas Dédale tactile complexe
- Synchronisation cloud ou multi-utilisateur
- Rendre le mobile totalement autonome

## Critères de succès

- Un utilisateur peut appairer son téléphone en scannant le QR du desktop
- Une idée créée sur mobile apparaît dans le desktop après sync
- L'application reste utilisable hors ligne et synchronise au retour réseau
- Le téléphone ne perd pas les données en cas de coupure
