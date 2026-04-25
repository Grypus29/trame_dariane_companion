# Session en cours — trame-dariane-mobile

Mise à jour : 2026-04-25

## Fait cette session

- [x] Branche `feat/sync-mobile` créée
- [x] `src/lib/syncEngine.ts` — hook useSyncEngine (auto-flush, retry 30s, online/offline)
- [x] App.tsx : engine branché, boutons Recevoir/Envoyer → "Synchroniser maintenant"
- [x] Gate appairage : tabs métier masqués sans pairing, `visibleTab` dérivé
- [x] Indicateur sync dans status-strip (Connecté / Sync... / Hors ligne)
- [x] Écran d'invitation "Scanner le QR" dans Settings
- [x] Fix : URL QR complète acceptée dans le champ manuel
- [x] DESKTOP_HANDOFF.md rempli (contrat API, CORS, Tauri events)
- [x] Structure projet créée (CLAUDE.md, docs/, rules/, tasks/)

## À faire

- [ ] Merger `feat/sync-mobile` → `main`
- [ ] `git push` vers GitHub
- [ ] Déploiement sur VM VeryCloud (URL à définir)
- [ ] Corriger le rendu des balises markdown dans les contenus
- [ ] Passe ergonomie UX/UI
