# Roadmap — trame-dariane-mobile

Dernière mise à jour : 2026-04-25

## État actuel

PWA fonctionnelle avec sync Wi-Fi local opérationnel. Appairage QR testé sur iPhone. Données desktop visibles sur mobile. Engine de sync automatique en place (feat/sync-mobile mergé sur main à faire).

## En cours

| Feature | Statut | Notes |
|---|---|---|
| feat/sync-mobile | 🔧 À merger | syncEngine, pairing gate, indicateur offline, fix URL format |

## Backlog

| Feature | Priorité | Notes |
|---|---|---|
| Merge feat/sync-mobile → main + push | 🔴 Haute | Commits prêts |
| Déploiement VM VeryCloud | 🔴 Haute | nginx static, URL à définir |
| Rendu markdown dans les contenus | 🔴 Haute | Le desktop envoie du balisage, le mobile affiche les tags bruts |
| Rafraîchissement desktop auto (Tauri events) | 🟡 Moyenne | Voir `.claude/DESKTOP_HANDOFF.md` |
| Passe ergonomie UX/UI | 🟡 Moyenne | Touch targets, navigation, typo, mode dictée |
| Android natif | 🟢 Basse | Tauri mobile / Capacitor / RN — à décider |
| iOS natif | 🟢 Basse | Conditionnel : licence Apple + Mac |

## Terminé

| Feature | Date |
|---|---|
| Setup projet React 19 + Vite 7 + vite-plugin-pwa | 2026-04-24 |
| 4 écrans : Dédale, Écrire, Éléments, Paramètres | 2026-04-24 |
| Pairing QR + syncClient (pair/claim, sync/state, sync/push) | 2026-04-25 |
| useSyncEngine : auto-flush, retry 30s, events online/offline | 2026-04-25 |
| Gate appairage : vues métier masquées sans pairing | 2026-04-25 |
| Indicateur sync : Connecté / Sync... / Hors ligne | 2026-04-25 |
| Fix : URL QR complète acceptée dans le champ appairage manuel | 2026-04-25 |
| DESKTOP_HANDOFF.md : contrat API + CORS + note Tauri events | 2026-04-25 |

## Bugs connus

| Bug | Priorité | Workaround |
|---|---|---|
| Balises de mise en forme affichées dans les contenus | 🔴 Haute | Aucun — à corriger avec un renderer markdown |
| PWA installée ≠ localStorage Safari (limitation iOS) | 🟡 Moyenne | Appairer via collage manuel d'URL dans Settings |
