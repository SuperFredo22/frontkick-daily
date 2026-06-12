# ⚡ Frontkick Daily

PWA personnelle de pilotage quotidien : habitudes (prières, sport, cigarettes), banques de tâches (TikTok, FightFocus, Marque, Projets), agenda hebdomadaire, statistiques, et coach IA.

Conçue pour iPhone (installée via « Ajouter à l'écran d'accueil »), hébergée sur Vercel.

## Stack

- **Front** : React 19 + Vite, Tailwind CSS, recharts, dnd-kit, lucide-react
- **Données** : 100 % localStorage (préfixe `fk_`), avec export/import JSON et sauvegarde auto optionnelle vers Vercel Blob
- **API** (fonctions serverless Vercel, dossier `api/`) :
  - `chat.js` — proxy Perplexity Sonar pour le coach IA
  - `subscribe.js` — enregistrement des souscriptions push (multi-appareils)
  - `cron.js` — envoi des notifications push (avec skip intelligent)
  - `backup.js` — réception du résumé du jour + sauvegarde complète rotative (7 jours)
  - `health.js` — diagnostic de la config
- **Notifications** : Web Push (VAPID) déclenchées par GitHub Actions (`.github/workflows/notifications.yml`), horaires en heure de Paris (été/hiver gérés)

## Démarrage

```bash
npm install
npm run dev       # serveur local
npm run build     # build de production
npm test          # tests unitaires (vitest)
npm run lint      # eslint
```

## Variables d'environnement (Vercel)

| Variable | Rôle |
|---|---|
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (souscriptions push + backups) |
| `CRON_SECRET` | Doit correspondre au secret GitHub Actions du même nom |
| `PERPLEXITY_API_KEY` | Optionnelle — clé du coach IA côté serveur (sinon saisie dans l'app) |

## Architecture des données (localStorage)

| Clé | Contenu |
|---|---|
| `fk_journal_YYYY-MM-DD` | Journal du jour : tâches, habitudes, bonus, sport |
| `fk_tiktok` / `fk_fightfocus` / `fk_marque` | Banques de tâches |
| `fk_projets` | Projets et leurs tâches |
| `fk_agenda` | Événements agenda |
| `fk_reporte_YYYY-MM-DD` | Tâches passées (« skip ») du jour |
| `fk_coach_session_YYYY-MM-DD` | Conversation coach du jour (purge > 7 j) |
| `fk_coach_bilans` | Résumés des 14 derniers bilans |
| `fk_pin` | Hash SHA-256 salé du code PIN |
| `fk_theme` | `auto` / `light` / `dark` |
| `fk_autobackup` | Sauvegarde auto en ligne activée (opt-in) |

## Notifications intelligentes

Si la sauvegarde auto est activée, l'app pousse un résumé du jour (`daily-state.json`) ; `api/cron.js` saute alors les rappels déjà accomplis (prières faites, sport fait, journal rempli…). Sans résumé, tous les rappels partent (fail-open).
