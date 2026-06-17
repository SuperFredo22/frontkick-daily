# Architecture & notes techniques

Document de référence pour relire et faire évoluer le code sans casser
l'existant. Mis à jour au fil des passes de qualité.

## Vue d'ensemble

Frontkick Daily est une **SPA React** mono-utilisateur, sans backend de
données : tout l'état persiste dans `localStorage` (préfixe `fk_`). Quelques
fonctions serverless Vercel (`api/`) gèrent uniquement le coach IA et les
notifications push.

### Flux de données

```
localStorage (fk_*)
   ↑↓ via hooks
useStorage  ──►  useJournal / useBanques / useAgenda / useProjets / useJalons ...
   │
   └──►  utils/ (gamification, stats)  ──►  dérivent XP, niveaux, séries, stats
                                               (recalculés à la volée, pas stockés)
```

- `useStorage(key, default)` : hook générique qui lit/écrit une clé `fk_<key>`
  et se resynchronise quand la clé change (ex. journal d'hier ↔ aujourd'hui).
- `getStorage(key)` : lecture ponctuelle hors composant (utilisé par `utils/stats`
  et `utils/gamification` qui balaient l'historique des journaux).
- La **gamification est dérivée** : aucune valeur d'XP n'est stockée, tout est
  recalculé depuis les journaux → la progression est rétroactive et cohérente.

### Écrans (`src/pages`)

| Écran        | Rôle                                                        |
|--------------|-------------------------------------------------------------|
| Aujourdhui   | Cœur du jour : missions suggérées, habitudes, actions, HUD  |
| Agenda       | Calendrier hebdo + RDV (récurrents)                          |
| Stats        | Graphiques (Recharts), jalons, badges                       |
| Banques      | Gestion des « banques » de contenu (TikTok, FightFocus, …)  |
| Coach        | Chat IA (Perplexity via proxy serverless)                   |

### Conventions

- **Thème** : couleurs via variables CSS (`var(--red)`, `var(--ink)`, …) dans
  `src/styles/tokens.css`. Ne pas coder de couleurs en dur.
- **Champs de formulaire** : thème sombre + 16px imposés globalement dans
  `src/index.css` (≥16px = pas d'auto-zoom iOS au focus).
- **Modales** : passer par `components/Modal.jsx` (gère le clavier mobile via
  VisualViewport pour ne pas masquer les champs).
- **Config des banques** : source unique dans `src/data/banques.config.js`
  (`BANQUE_CONFIG`, `banqueColor()`). Ne pas redupliquer les maps emoji/couleur.
- **Types** : formes de données documentées en JSDoc dans `src/types.js`.
  Annoter les nouvelles structures là, et les référencer via `import('../types')`.

## Points améliorables (dette technique)

Classés par priorité. Aucun n'est bloquant ; ce sont des cibles pour les
prochaines passes.

### Maintenabilité
- ✅ **Pages découpées.** `Banques.jsx` (835 → ~120 lignes) éclaté en
  `components/banques/` (`ItemMenu`, `BanqueList`, `ProjetsList`) +
  `data/banqueTabs.js`. `Aujourdhui.jsx` (888 → ~745 lignes) allégé via
  `components/today/` (`VictoiresDuJour`, `ActionsImportantes`, `BackupBanner`).
  `Aujourdhui.jsx` reste le plus gros fichier : la bande « Disciplines du jour »
  et les sheets/modales (sport, note, prières/cigarettes) pourraient encore être
  extraites lors d'une prochaine passe.
- ✅ **Tests automatisés** : Vitest (jsdom). 27 tests sur la logique pure
  (`utils/date`, `utils/gamification`, `utils/stats`). Lancer `npm test`.
  À étendre vers de nouveaux utilitaires au fil de l'eau.
- ✅ **Types documentés en JSDoc** : `src/types.js` définit les formes
  persistées (`Journal`, `Tache`, `Habitudes`, `Sport`, `AgendaEvent`, `Projet`,
  `Jalon`…). Les points centraux (`useJournal`, `dayXP`, `getJournalForDate`)
  les référencent via `import('../types')`. Une migration TypeScript complète
  reste possible plus tard, mais l'IDE a déjà l'autocomplétion sur ces objets.

### Correctness (lint : 0 erreur ✅)
`npm run lint` passe désormais sans erreur ni avertissement. À maintenir avant
chaque PR. Quelques `eslint-disable` ciblés et **justifiés** subsistent là où la
règle produit un faux positif :
- `Aujourdhui.jsx` / `Banques.jsx` : effets « commande one-shot » (`pendingCompose`
  envoyé par le parent) — le `setState` est l'effet voulu de la commande.
- `sport/SeanceEnCours.jsx` : minuterie d'entraînement (refs horodatées +
  bips audio). `Date.now()` à l'init de ref et `setState` de fin de minuterie
  sont intentionnels ; ne pas refactorer sans tests sur le timer.
- Les stats (`Stats.jsx`) sont calculées via des initialiseurs `useState`
  paresseux (plus d'effet de chargement).

### Sécurité
- **Clé API Perplexity côté client** : stockée en `localStorage` et envoyée au
  proxy `api/chat.js`, qui la relaie tel quel (relais ouvert, sans contrôle
  d'origine ni rate-limit). Acceptable pour un usage perso (clé de l'utilisateur),
  mais à ne pas généraliser. Piste : déplacer la clé en variable d'environnement
  serveur + restreindre l'origine.
- `api/subscribe.js` autorise `Access-Control-Allow-Origin: *` et stocke une
  seule souscription push publique. OK pour mono-utilisateur, à revoir si
  multi-appareils.

### Efficacité
- `utils/stats` et `utils/gamification` re-balaient l'historique localStorage à
  chaque appel. Volumes faibles aujourd'hui ; si l'historique grandit, envisager
  un cache mémoïsé invalidé à l'écriture.

### Données
- Aucune synchro cloud → risque de perte si le navigateur efface le stockage.
  Sauvegarde manuelle (export JSON) + rappel après 7 jours en place. Une synchro
  Supabase reste la solution de fond (voir discussions produit).
