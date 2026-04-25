# Conventions de code — trame-dariane-mobile

## TypeScript

- Strict mode activé (`tsconfig.json`)
- Pas de `any` — typer explicitement ou utiliser `unknown`
- Préférer `type` à `interface` pour les types de données
- Imports de types avec `import type { ... }`

## React

- Composants fonctionnels uniquement
- `useState` + `useCallback` + `useMemo` + `useRef` — pas de classes
- Pas de `useEffect` qui appelle directement `setState` de façon synchrone (règle `react-hooks/set-state-in-effect`)
- Pour les callbacks stables qui lisent un state changeant : pattern `useRef` + `useCallback([setState])`
- Dériver les valeurs plutôt que les synchroniser via effet quand possible

## Style

- Pas de Tailwind ni de lib UI — CSS vanilla dans `App.css`
- Variables CSS définies dans `index.css`
- Mobile-first : `min-height: 44px` sur tous les éléments tactiles
- Pas d'emoji dans le code sauf si demandé explicitement

## Fichiers

- Un seul composant `App.tsx` pour l'instant (l'app est simple)
- La logique métier dans `src/lib/` (mobileStore, syncClient, syncEngine)
- Les types dans `src/types.ts`

## Commits

- `npm run build && npm run lint` avant chaque commit
- Commits isolés par étape fonctionnelle
- Message en anglais, impératif, sans point final
- Format : `Verb what-it-does` (ex: `Add syncEngine hook with auto-flush`)

## Nommage

- Fonctions : camelCase
- Types : PascalCase
- Fichiers : camelCase pour les modules, PascalCase pour les composants React
- CSS classes : kebab-case avec BEM léger (`.idea-card`, `.idea-card--active`)
