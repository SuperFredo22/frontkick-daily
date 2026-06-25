# Frontkick Daily

PWA de discipline quotidienne qui transforme tes habitudes (contenu, sport,
prières, etc.) en **progression de combattant** : XP, niveaux, grades, séries
de victoires et badges. Tout est stocké **en local** (localStorage), avec un
coach IA optionnel.

## Démarrage

```bash
npm install
npm run dev       # serveur de dev Vite
npm run build     # build de production (dossier dist/)
npm run preview   # prévisualise le build
npm run lint      # ESLint
npm test          # Vitest (logique pure)
```

## Stack

- **React 19** + **Vite 8**
- **Tailwind CSS 3** + tokens CSS maison (thème sombre) — voir `src/styles/tokens.css`
- **Recharts** (graphiques de stats), **@dnd-kit** (réordonnancement), **lucide-react** (icônes)
- **Vercel** pour l'hébergement + fonctions serverless (`api/`) : coach IA (Perplexity)

## Organisation du repo

```
api/                 Fonctions serverless Vercel (coach IA Perplexity)
public/              Manifeste PWA, service worker, icônes
src/
  pages/             Écrans principaux (Aujourdhui, Agenda, Stats, Banques, Coach)
  components/        UI réutilisable (Modal, HUD, SuggestionCard, today/, banques/, sport/, …)
  hooks/             Logique d'état réutilisable (useStorage, useJournal, useLongPress, …)
  data/              Données de seed + config (banques, séances, jalons)
  utils/             Logique pure (gamification, stats, dates)
  styles/            tokens.css (variables de thème)
  index.css          Styles globaux + thème des champs de formulaire
```

Pour le détail de l'architecture et la dette technique connue, voir
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Données & sauvegarde

Toutes les données vivent dans `localStorage` (préfixe `fk_`). Il n'y a pas
encore de synchronisation cloud : **exporte régulièrement** tes données depuis
Réglages → Sauvegarde (un rappel s'affiche après 7 jours sans export).
