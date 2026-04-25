# trame-dariane-mobile — Instructions Claude Code

> Garder sous 500 lignes. Si ça déborde → externaliser dans docs/ ou rules/

## Contexte

PWA compagnon de Trame d'Ariane (desktop Tauri). Permet de capturer des idées, dicter des brouillons, relire et consulter ses données narratives depuis un iPhone. Le desktop reste la source de vérité, la PWA se synchronise en Wi-Fi local par appairage QR.

- **URL dev** : `http://192.168.50.73:5173` (IP locale variable selon le réseau)
- **URL prod** : `https://trame-mobile.the-fixer.fr` (à créer sur VeryCloud)
- **Repo** : https://github.com/Grypus29/trame_dariane_companion
- **Repo desktop (ne pas modifier)** : https://github.com/Grypus29/trame_dariane

## Suivi de session

- **`tasks/todo.md`** — plan de la session en cours. Lire en début de session si existant, mettre à jour au fil du travail.
- **`tasks/lessons.md`** — leçons apprises sur ce projet. Alimenter après chaque correction ou décision importante.

Utiliser `/hot` avant de clore une session incomplète.

## Référence — lire avant toute modification

- Architecture & stack : `docs/ARCHITECTURE.md`
- Contrat API sync : `docs/API.md`
- Stockage local : `docs/DATABASE.md`
- Roadmap & état : `docs/ROADMAP.md`
- Cahier des charges : `docs/PRODUCT.md`
- Style & conventions : `rules/code-style.md`
- Contexte complet : `docs/CONTEXT.md`
- Plan de sync : `docs/SYNC.md`
- Passation desktop : `.claude/DESKTOP_HANDOFF.md`

> Ne jamais dupliquer ces infos dans CLAUDE.md — lier, pas copier.

## Stack technique

- **Frontend** : React 19 + TypeScript + Vite 7 + vite-plugin-pwa
- **Backend** : aucun propre — consomme le serveur HTTP local Tauri du desktop
- **Base de données** : `localStorage` (cache mobile, clé `trame-dariane-mobile-state-v1`)
- **Infra** : dev local `--host 0.0.0.0`, à terme déployé sur VM VeryCloud (nginx static)
- **Futur** : Android natif (Tauri mobile / Capacitor / RN — à décider), iOS conditionnel

## Règles — Scope

Ne pas refactorer, renommer ou "améliorer" du code hors scope de la tâche en cours sans validation explicite.

## Règles — NE PAS faire

- **Ne jamais modifier le projet desktop** (`trame_dariane`) depuis cette session — noter dans `.claude/DESKTOP_HANDOFF.md`
- Ne pas rendre le mobile autonome sans appairage : le desktop reste source de vérité
- Ne pas ajouter de cloud, backend tiers ou compte utilisateur
- Ne pas représenter la Toile/graphe complet ou la timeline desktop sur mobile
- Ne jamais commiter `.env` — utiliser `.env.example`

## Règles — Mise à jour de la documentation

- Feature déployée ou bug corrigé → `docs/ROADMAP.md`
- Modification format localStorage → `docs/DATABASE.md`
- Modification du contrat API sync → `docs/API.md`
- Changement stack ou architecture → `docs/ARCHITECTURE.md`
- Correction nécessaire côté desktop → `.claude/DESKTOP_HANDOFF.md`

## Orchestration — parallélisme

Toujours paralléliser les tâches indépendantes :
- Lectures multi-fichiers → un seul message avec plusieurs Read simultanés
- Diagnostic → Grep simultanés, pas séquentiels

## Conventions de code

Voir `rules/code-style.md`. En résumé :
- TypeScript strict, pas de `any`
- Pas de commentaires sauf WHY non-obvious
- `npm run lint && npm run build` avant chaque commit
- Commits isolés par étape fonctionnelle

## Commandes utiles

### Développement local

```bash
npm install
npm run dev -- --host 0.0.0.0   # accessible sur le réseau local (iPhone)
```

### Vérification avant commit

```bash
npm run build
npm run lint
```

### Déploiement VM (VeryCloud — 82.26.157.83)

```bash
npm run build
ssh root@82.26.157.83
# Copier dist/ dans /opt/trame-dariane-mobile/
# Nginx sert les fichiers statiques
```
