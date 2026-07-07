import { formatDate } from './date';
import { workBlockForDate, hoursBetween, hasWorkSchedule } from './travail';
import { dueProspects, isOpenProspect, statutConfig } from './prospects';
import { exerciseSummary } from './sportHistory';

const DOW_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function readJournal(date) {
  try {
    const raw = localStorage.getItem(`fk_journal_${formatDate(date)}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function readLS(key) {
  try { return JSON.parse(localStorage.getItem(`fk_${key}`) || 'null'); } catch { return null; }
}

function avg(arr) {
  const valid = arr.filter(v => typeof v === 'number');
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

function getLast30() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return { date: d, journal: readJournal(d) };
  });
}

function getUpcomingDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function analyzeData() {
  const days = getLast30();
  const todayEntry = days[0];

  // ── Today ──────────────────────────────────────────────────────────────────
  const todayJournal = todayEntry.journal;
  const today = {
    prieres:      todayJournal?.habitudes?.prieres    || 0,
    cigarettes:   todayJournal?.habitudes?.cigarettes || 0,
    sport:        !!(todayJournal?.sport || todayJournal?.habitudes?.sport),
    tachesFaites: (todayJournal?.taches || []).filter(t => t.statut === 'fait').length,
    note:         todayJournal?.habitudes?.note || '',
    bonus:        (todayJournal?.bonus || []).map(b => b.texte || b.label || b.text || '').filter(Boolean),
  };

  // ── Habits (30j) ───────────────────────────────────────────────────────────
  const prieresArr  = days.map(d => d.journal?.habitudes?.prieres    || 0);
  const cigsArr     = days.map(d => d.journal?.habitudes?.cigarettes || 0);
  const sportDays   = days.filter(d => d.journal?.sport || d.journal?.habitudes?.sport);
  const noSportDays = days.filter(d => !(d.journal?.sport || d.journal?.habitudes?.sport));

  // ── Streaks ────────────────────────────────────────────────────────────────
  let prieresStreak = 0;
  for (const d of days) {
    if ((d.journal?.habitudes?.prieres || 0) > 0) prieresStreak++;
    else break;
  }
  let noSportStreak = 0;
  for (const d of days) {
    if (!(d.journal?.sport || d.journal?.habitudes?.sport)) noSportStreak++;
    else break;
  }

  // ── Sport sessions ─────────────────────────────────────────────────────────
  const sessions = sportDays.map(d => d.journal?.sport).filter(Boolean);
  const sportTypes = {};
  sessions.forEach(s => { if (s.type) sportTypes[s.type] = (sportTypes[s.type] || 0) + 1; });

  // Dernières séances détaillées (nom, durée, matériel, exercices) — les plus
  // récentes d'abord, pour que le coach propose des progressions cohérentes.
  const dernieresSeances = sportDays.slice(0, 5)
    .filter(d => d.journal?.sport)
    .map(d => {
      const s = d.journal.sport;
      return {
        date: formatDate(d.date),
        nom: s.seance_nom || s.notes || s.type || 'Séance',
        duree: s.duree_reelle || 0,
        materiel: s.materiel || [],
        exercices: (s.exercices || []).map(e => `${e.nom} (${exerciseSummary(e) || '—'})`),
      };
    })
    .slice(0, 3);

  // ── Correlations ───────────────────────────────────────────────────────────
  const avgCigsSport   = avg(sportDays.map(d => d.journal?.habitudes?.cigarettes || 0));
  const avgCigsNoSport = avg(noSportDays.map(d => d.journal?.habitudes?.cigarettes || 0));

  // Cigs by day of week
  const cigsByDow = DOW_FR.map((label, dow) => {
    const subset = days.filter(d => d.date.getDay() === dow);
    return { label, avg: avg(subset.map(d => d.journal?.habitudes?.cigarettes || 0)), count: subset.length };
  });
  const worstDow = cigsByDow.reduce((a, b) => b.avg > a.avg ? b : a, cigsByDow[0]);

  // Productivity: tasks done on sport days vs no-sport days
  const avgTasksSport   = avg(sportDays.map(d => (d.journal?.taches || []).filter(t => t.statut === 'fait').length));
  const avgTasksNoSport = avg(noSportDays.map(d => (d.journal?.taches || []).filter(t => t.statut === 'fait').length));

  // ── Recent notes (7 derniers jours non vides) ──────────────────────────────
  const recentNotes = days.slice(0, 7)
    .filter(d => d.journal?.habitudes?.note?.trim())
    .map(d => ({ date: formatDate(d.date), text: d.journal.habitudes.note.trim() }));

  // ── Agenda ────────────────────────────────────────────────────────────────
  const agendaRaw = readLS('agenda') || [];
  const todayStr  = formatDate(new Date());

  // Today's events
  const agendaToday = agendaRaw
    .filter(e => e.date === todayStr)
    .sort((a, b) => (a.heureDebut || '').localeCompare(b.heureDebut || ''))
    .map(e => ({
      titre:    e.titre,
      debut:    e.heureDebut,
      fin:      e.heureFin,
      lieu:     e.lieu || '',
      note:     e.note || '',
    }));

  // Upcoming events (next 7 days, excluding today)
  const upcomingDates = getUpcomingDays(8).slice(1).map(d => formatDate(d));
  const agendaUpcoming = agendaRaw
    .filter(e => upcomingDates.includes(e.date))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.heureDebut || '').localeCompare(b.heureDebut || ''))
    .slice(0, 10)
    .map(e => ({
      date:  e.date,
      titre: e.titre,
      debut: e.heureDebut,
      fin:   e.heureFin,
      lieu:  e.lieu || '',
      note:  e.note || '',
    }));

  // ── Banques détail ────────────────────────────────────────────────────────
  function pendingItems(key, activeStatuts, labelFn) {
    const items = readLS(key) || [];
    return items
      .filter(item => activeStatuts.includes(item.statut || item.status || ''))
      .slice(0, 5)
      .map(labelFn);
  }

  const tiktokPending    = pendingItems('tiktok',     ['a_tourner'], i => i.titre || '');
  const fightfocusPending = pendingItems('fightfocus', ['a_faire'],  i => i.code ? `${i.code} — ${i.description}` : i.description || '');
  const marquePending    = pendingItems('marque',      ['a_faire'],  i => i.description || '');

  let backlog = 0;
  ['tiktok', 'fightfocus', 'marque'].forEach(b => {
    try {
      const items = readLS(b) || [];
      backlog += items.filter(item => {
        const s = item.statut || item.status || '';
        return s !== 'fait' && s !== 'publiee';
      }).length;
    } catch { /* skip malformed banque entry */ }
  });

  // ── Projets ────────────────────────────────────────────────────────────────
  let projetTotal = 0, projetDone = 0;
  const projetsSummary = [];
  try {
    const projets = readLS('projets') || [];
    projets.forEach(p => {
      const tasks   = p.taches || [];
      const done    = tasks.filter(t => t.statut === 'fait').length;
      const pending = tasks.filter(t => t.statut === 'a_faire').map(t => t.description || t.titre || t.label || '').filter(Boolean).slice(0, 3);
      projetTotal += tasks.length;
      projetDone  += done;
      if (pending.length) {
        projetsSummary.push({ nom: p.nom || p.titre || 'Projet', done, total: tasks.length, pending });
      }
    });
  } catch { /* skip malformed projets */ }

  // ── Horaires de travail ───────────────────────────────────────────────────
  const travailRaw = readLS('travail');
  const workToday = workBlockForDate(travailRaw, todayStr);
  const travail = {
    configured: hasWorkSchedule(travailRaw),
    today: workToday
      ? { debut: workToday.debut, fin: workToday.fin, heures: hoursBetween(workToday.debut, workToday.fin), exception: !!workToday.exception }
      : null,
  };

  // ── Prospects ─────────────────────────────────────────────────────────────
  const prospectsRaw = readLS('prospects') || [];
  const prospectsOuverts = prospectsRaw.filter(isOpenProspect);
  const prospects = {
    ouverts: prospectsOuverts.length,
    dus: dueProspects(prospectsRaw, todayStr).map(p => ({
      nom: p.nom,
      entreprise: p.entreprise || '',
      statut: statutConfig(p.statut).label,
      notes: p.notes || '',
    })),
  };

  // ── Alerts ────────────────────────────────────────────────────────────────
  const alerts = [];
  if (today.prieres === 0)
    alerts.push({ level: 'danger', msg: 'Pas encore de prière aujourd\'hui' });
  if (noSportStreak >= 4)
    alerts.push({ level: 'warning', msg: `${noSportStreak} jours sans sport — risque de décrochage` });
  else if (noSportStreak >= 2)
    alerts.push({ level: 'info', msg: `${noSportStreak} jours sans sport` });
  if (today.cigarettes >= 5)
    alerts.push({ level: 'warning', msg: `${today.cigarettes} cigarettes aujourd'hui — au-dessus de ta moyenne` });
  if (backlog > 15)
    alerts.push({ level: 'info', msg: `${backlog} tâches en attente dans tes banques` });
  if (avgCigsNoSport - avgCigsSport > 1.2)
    alerts.push({ level: 'insight', msg: `Tu fumes ${(avgCigsNoSport - avgCigsSport).toFixed(1)} cig/j de plus les jours sans sport` });
  if (avgTasksSport - avgTasksNoSport > 0.8)
    alerts.push({ level: 'insight', msg: `Tu complètes ${(avgTasksSport - avgTasksNoSport).toFixed(1)} tâche(s) de plus les jours avec sport` });
  if (agendaToday.length > 0)
    alerts.push({ level: 'info', msg: `${agendaToday.length} événement(s) à l'agenda aujourd'hui` });
  if (prospects.dus.length > 0)
    alerts.push({ level: 'warning', msg: `${prospects.dus.length} prospect(s) à relancer aujourd'hui` });

  return {
    today,
    averages: {
      prieres:    avg(prieresArr),
      cigarettes: avg(cigsArr),
      sportDays:  sportDays.length,
    },
    streaks:      { prieres: prieresStreak, noSport: noSportStreak },
    sport:        { sessions: sessions.length, avgDuration: avg(sessions.map(s => s.duree_reelle || 0)), types: sportTypes },
    correlations: { cigsSport: avgCigsSport, cigsNoSport: avgCigsNoSport, tasksSport: avgTasksSport, tasksNoSport: avgTasksNoSport },
    patterns:     { worstCigDay: worstDow.label, worstCigAvg: worstDow.avg },
    tasks:        { backlog, projetTotal, projetDone, faites: days.reduce((n, d) => n + (d.journal?.taches || []).filter(t => t.statut === 'fait').length, 0) },
    recentNotes,
    agenda:       { today: agendaToday, upcoming: agendaUpcoming },
    banques:      { tiktokPending, fightfocusPending, marquePending },
    projets:      projetsSummary,
    travail,
    prospects,
    dernieresSeances,
    alerts,
    daysWithData: days.filter(d => d.journal).length,
  };
}

export function buildSystemPrompt(analysis) {
  if (!analysis) return '';
  const { today, averages, streaks, sport, correlations, tasks, patterns, recentNotes, agenda, banques, projets, travail, prospects, dernieresSeances } = analysis;
  const sportTypeStr = Object.entries(sport.types).map(([k, v]) => `${k}(${v})`).join(', ') || 'non précisé';

  // ── Travail section ───────────────────────────────────────────────────────
  let travailSection = '';
  if (travail?.configured) {
    travailSection = travail.today
      ? `\nTravail aujourd'hui : ${travail.today.debut}–${travail.today.fin} (${travail.today.heures}h)${travail.today.exception ? ' [horaire exceptionnel]' : ''} — le temps libre est avant/après.`
      : `\nTravail aujourd'hui : repos (pas de travail prévu).`;
  }

  // ── Prospects section ─────────────────────────────────────────────────────
  let prospectsSection = '';
  if (prospects && (prospects.ouverts > 0 || prospects.dus.length > 0)) {
    prospectsSection = `\nProspects business : ${prospects.ouverts} ouverts`;
    if (prospects.dus.length > 0) {
      prospectsSection += ` | À RELANCER AUJOURD'HUI :\n` + prospects.dus.map(p => {
        let line = `  • ${p.nom}${p.entreprise ? ` (${p.entreprise})` : ''} — ${p.statut}`;
        if (p.notes) line += ` — notes : "${p.notes}"`;
        return line;
      }).join('\n');
    }
  }

  // ── Dernières séances détaillées ──────────────────────────────────────────
  let seancesSection = '';
  if (dernieresSeances?.length) {
    seancesSection = '\nDernières séances détaillées :\n' + dernieresSeances.map(s => {
      let line = `  • ${s.date} : ${s.nom}${s.duree ? ` (${s.duree} min)` : ''}`;
      if (s.materiel.length) line += ` — matériel : ${s.materiel.join(', ')}`;
      if (s.exercices.length) line += `\n    ${s.exercices.join(' | ')}`;
      return line;
    }).join('\n');
  }

  // ── Agenda section ────────────────────────────────────────────────────────
  let agendaSection = '';
  if (agenda.today.length > 0) {
    const lines = agenda.today.map(e => {
      let line = `  • ${e.debut}–${e.fin} : ${e.titre}`;
      if (e.lieu) line += ` [${e.lieu}]`;
      if (e.note) line += ` — note : "${e.note}"`;
      return line;
    }).join('\n');
    agendaSection += `\nAujourd'hui à l'agenda :\n${lines}`;
  }
  if (agenda.upcoming.length > 0) {
    const lines = agenda.upcoming.map(e => {
      let line = `  • ${e.date} ${e.debut}–${e.fin} : ${e.titre}`;
      if (e.lieu) line += ` [${e.lieu}]`;
      if (e.note) line += ` — "${e.note}"`;
      return line;
    }).join('\n');
    agendaSection += `\nÀ venir (7j) :\n${lines}`;
  }

  // ── Notes section ─────────────────────────────────────────────────────────
  let notesSection = '';
  if (today.note) notesSection += `\nNote du jour : "${today.note}"`;
  if (recentNotes.length > 0) {
    const lines = recentNotes.filter(n => n.date !== formatDate(new Date())).slice(0, 4)
      .map(n => `  • ${n.date} : "${n.text}"`).join('\n');
    if (lines) notesSection += `\nNotes récentes :\n${lines}`;
  }

  // ── Banques section ───────────────────────────────────────────────────────
  let banquesSection = `\nBanques (${tasks.backlog} en attente) :`;
  if (banques.tiktokPending.length)    banquesSection += `\n  TikTok : ${banques.tiktokPending.slice(0, 3).join(' | ')}`;
  if (banques.fightfocusPending.length) banquesSection += `\n  FightFocus : ${banques.fightfocusPending.slice(0, 3).join(' | ')}`;
  if (banques.marquePending.length)    banquesSection += `\n  Marque : ${banques.marquePending.slice(0, 3).join(' | ')}`;

  // ── Projets section ───────────────────────────────────────────────────────
  let projetsSection = `\nProjets : ${tasks.projetDone}/${tasks.projetTotal} tâches réalisées`;
  projets.forEach(p => {
    projetsSection += `\n  [${p.nom}] ${p.done}/${p.total} — À faire : ${p.pending.join(', ')}`;
  });

  // ── Bonus section ─────────────────────────────────────────────────────────
  const bonusSection = today.bonus.length
    ? `\nTâches bonus aujourd'hui : ${today.bonus.join(', ')}`
    : '';

  return `Tu es le coach personnel de l'utilisateur — il pratique les arts martiaux (MMA, kickboxing, BJJ), crée du contenu TikTok sur le combat, gère un site web FightFocus et une marque de vêtements de combat. Il a aussi un travail salarié (horaires ci-dessous) et suit des prospects business. Son matériel de sport : barre de traction, bandes de résistance 15/25/35 kg, poids du corps.

DONNÉES 30 DERNIERS JOURS (${analysis.daysWithData} jours avec données) :
Habitudes :
- Prières : ${averages.prieres.toFixed(1)}/j en moy. | streak actuel : ${streaks.prieres}j consécutifs
- Cigarettes : ${averages.cigarettes.toFixed(1)}/j en moy. | pire jour : ${patterns.worstCigDay} (${patterns.worstCigAvg.toFixed(1)}/j)
- Sport : ${sport.sessions} séances | types : ${sportTypeStr} | durée moy : ${Math.round(sport.avgDuration)}min | sans sport depuis : ${streaks.noSport}j${seancesSection}

Corrélations détectées :
- Cigarettes jours sport : ${correlations.cigsSport.toFixed(1)}/j vs sans sport : ${correlations.cigsNoSport.toFixed(1)}/j
- Tâches complétées jours sport : ${correlations.tasksSport.toFixed(1)} vs sans sport : ${correlations.tasksNoSport.toFixed(1)}
- ${tasks.faites} tâches complétées en 30j
${banquesSection}
${projetsSection}${prospectsSection}

AUJOURD'HUI :
Prières : ${today.prieres} | Cigarettes : ${today.cigarettes} | Sport : ${today.sport ? 'fait ✓' : 'pas encore'} | Tâches : ${today.tachesFaites} complétées${travailSection}${bonusSection}${agendaSection}${notesSection}

INSTRUCTIONS : Réponds en français, en texte brut sans aucun formatage markdown (zéro **, *, #, tirets de liste). Parle comme un coach humain — direct, sans fioritures, max 4 phrases sauf si on te demande plus. Signal d'alerte en premier. Actions concrètes uniquement. Tiens compte de l'agenda et des horaires de travail dans tes conseils. Exception unique au "pas de markdown" : quand on te demande explicitement un bloc \`\`\`json, fournis-le exactement au format demandé, en toute fin de réponse.`;
}

