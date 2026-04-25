# Stratégie de tests — trame-dariane-mobile

## État actuel

Pas de tests automatisés. Le projet est en phase prototype.

## Tests manuels en priorité

Avant chaque commit ou déploiement :

1. `npm run build` — pas d'erreur TypeScript
2. `npm run lint` — pas d'erreur ESLint
3. Test sur iPhone réel via Safari (`npm run dev -- --host 0.0.0.0`)
   - Appairage QR ou collage URL manuel
   - Créer une idée → vérifier qu'elle apparaît sur desktop
   - Couper le Wi-Fi → créer une idée → réactiver → vérifier sync

## À ajouter plus tard

- Tests unitaires sur `mobileStore.ts` (normalisation, edge cases JSON)
- Tests unitaires sur `syncClient.ts` (parsePairingUrl avec les deux formats)
- Tests d'intégration sync (mock du serveur desktop)
