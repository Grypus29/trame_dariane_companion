# Leçons apprises — trame-dariane-mobile

## 2026-04-25

### eslint-plugin-react-hooks v7 trace à travers les fonctions async

**Problème** : `react-hooks/set-state-in-effect` flagge `void flush()` dans un `useEffect` même si `flush` est async et que le `setState` est toujours après un `await`.

**Solution** : `eslint-disable-next-line react-hooks/set-state-in-effect` sur la ligne `void flush()`, avec commentaire expliquant que c'est un faux positif (setState différé, jamais synchrone).

**Règle dérivée** : pour les hooks qui ont besoin d'appeler une fonction async depuis un effet, documenter le disable avec la raison.

---

### `stateRef.current = state` interdit pendant le rendu (react-hooks/refs v7)

**Problème** : assigner `stateRef.current = state` directement dans le corps du hook (pendant le rendu) est flaggé par la règle `react-hooks/refs`.

**Solution** : déplacer dans un `useEffect(() => { stateRef.current = state })` sans deps — s'exécute après chaque rendu et garde le ref à jour.

**Pattern safe** :
```ts
const stateRef = useRef(state)
useEffect(() => { stateRef.current = state })  // après rendu
const flush = useCallback(async () => {
  const current = stateRef.current  // toujours à jour lors de l'appel
  ...
}, [setState])  // setState stable → flush stable
```

---

### URL QR ≠ URL de pairing

**Problème** : le QR code encode `http://<ip>:5173/?pair=<url-encodée>` (URL de la PWA), mais le champ manuel attendait directement l'URL `/pair/claim`.

**Solution** : `parsePairingUrl` détecte le paramètre `?pair=` et l'extrait avant de chercher le token. Les deux formats sont maintenant acceptés.

---

### localStorage PWA installée ≠ localStorage Safari (iOS)

**Problème** : si l'utilisateur paire dans un onglet Safari, la PWA installée (home screen) a un localStorage séparé et ne voit pas le pairing.

**Workaround** : appairer depuis la PWA installée via le champ manuel de collage d'URL, ou utiliser l'app uniquement dans Safari.

**À garder en tête** : pour Android natif, ce problème disparaît (WebView unifiée).
