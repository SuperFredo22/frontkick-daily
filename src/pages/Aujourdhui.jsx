import { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { formatDateFR, formatDate, today, yesterday } from '../utils/date';
import { useJournal, useReporteAujourdhui } from '../hooks/useJournal';
import { useAllBanques } from '../hooks/useBanques';
import { useProjets, getNextProjetTask, getActiveProjects } from '../hooks/useProjets';
import { useAgenda } from '../hooks/useAgenda';
import { useTravail } from '../hooks/useTravail';
import { useProspects } from '../hooks/useProspects';
import { workBlockForDate, hasWorkSchedule } from '../utils/travail';
import { dueProspects } from '../utils/prospects';
import { getConsecutiveNoSportDays } from '../utils/stats';
import { useProgression } from '../hooks/useProgression';
import { XP, dayXP, sessionXP, mantraOfTheDay, yesterdayMissed, protectStreak } from '../utils/gamification';
import { newlyUnlockedByLevel } from '../utils/unlockables';
import { useLongPress } from '../hooks/useLongPress';
import { banqueColor } from '../data/banques.config';
import SuggestionCard from '../components/SuggestionCard';
import VictoiresDuJour from '../components/today/VictoiresDuJour';
import ActionsImportantes from '../components/today/ActionsImportantes';
import BackupBanner from '../components/today/BackupBanner';
import DisciplinesStrip from '../components/today/DisciplinesStrip';
import HUD from '../components/HUD';
import DailyObjective from '../components/DailyObjective';
import FocusOverlay from '../components/FocusOverlay';
import { XpFlash, LevelUpOverlay } from '../components/RewardFx';
import Modal from '../components/Modal';
import SportSheet from '../components/today/SportSheet';
import WorkScheduleModal from '../components/WorkScheduleModal';
import CounterModal from '../components/today/CounterModal';
import LogVideoModal from '../components/LogVideoModal';
import { VIDEO_FORMATS } from '../data/videoFormats';

function makeItemLabel(banque, item) {
  if (banque === 'tiktok') return item.titre;
  if (item.code) return `${item.code} — ${item.description}`;
  return item.description;
}

// État de la dernière sauvegarde (export). Isolé hors du render pour garder
// celui-ci pur. Renvoie le timestamp et le nombre de jours écoulés.
function backupReminderState() {
  const last = Number(localStorage.getItem('fk_last_backup') || 0);
  const days = last ? Math.floor((Date.now() - last) / 864e5) : Infinity;
  return { last, days };
}

export default function Aujourdhui({ pendingCompose, onPendingConsumed, onOpenSettings, onNavigate, onOpenProspects }) {
  const [viewDate, setViewDate] = useState(today());
  const isYesterday = formatDate(viewDate) !== formatDate(today());

  // PWA laissée ouverte après minuit : « aujourd'hui » capturé au montage est
  // périmé au retour au premier plan. On resynchronise la vue sur le nouveau
  // jour — seulement si l'utilisateur regardait l'« aujourd'hui » périmé, pour
  // ne pas l'arracher à une édition volontaire de la veille.
  const todayStrRef = useRef(formatDate(today()));
  useEffect(() => {
    const sync = () => {
      const nowStr = formatDate(today());
      if (nowStr === todayStrRef.current) return;
      const oldToday = todayStrRef.current;
      todayStrRef.current = nowStr;
      setViewDate(prev => (formatDate(prev) === oldToday ? today() : prev));
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  const [journal, setJournal] = useJournal(viewDate);
  const [reporte, setReporte] = useReporteAujourdhui(viewDate);
  const [, setAgenda] = useAgenda();
  const [travail, setTravail] = useTravail();
  const [prospects] = useProspects();
  const { markDone, markUndone, getNextItem } = useAllBanques();
  const [projets, setProjets] = useProjets();

  // Combatant progression — recomputed whenever today's data changes so the
  // XP bar and streak react instantly to completing a mission.
  const [prog, refreshProg] = useProgression();
  useEffect(() => { refreshProg(); }, [journal, projets, reporte, refreshProg]);

  // Reward feedback: "+XP" flash + level-up overlay.
  const [xpFlash, setXpFlash] = useState({ amount: 0, trigger: 0 });
  const [levelUp, setLevelUp] = useState(null);
  const prevLevelRef = useRef(prog.level);
  const flashXp = (amount) => setXpFlash(f => ({ amount, trigger: f.trigger + 1 }));
  const [focusOpen, setFocusOpen] = useState(false);
  useEffect(() => {
    if (prog.level > prevLevelRef.current) {
      setLevelUp({
        level: prog.level,
        rank: prog.rank,
        unlocks: newlyUnlockedByLevel(prevLevelRef.current, prog.level),
      });
    }
    prevLevelRef.current = prog.level;
  }, [prog.level, prog.rank]);

  const [showBonusInput, setShowBonusInput] = useState(false);
  const [heroFading, setHeroFading] = useState(false);
  const [showSportSheet, setShowSportSheet] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [showLogVideo, setShowLogVideo] = useState(false);
  const [backupDismissed, setBackupDismissed] = useState(false);

  // Édition habitudes
  const [showPrieresEdit, setShowPrieresEdit] = useState(false);
  const [showCigsEdit, setShowCigsEdit] = useState(false);
  const [editPrieres, setEditPrieres] = useState(0);
  const [editCigs, setEditCigs] = useState(0);

  const skipped = reporte || [];

  const nextTiktok     = getNextItem('tiktok',     skipped);
  const nextFightfocus = getNextItem('fightfocus', skipped);
  const nextMarque     = getNextItem('marque',     skipped);
  const activeProjects = getActiveProjects(projets, skipped);

  // Build unified suggestions list
  const allSuggestions = [
    nextTiktok     && { banque: 'tiktok',     item: nextTiktok },
    nextFightfocus && { banque: 'fightfocus', item: nextFightfocus },
    nextMarque     && { banque: 'marque',     item: nextMarque },
    ...activeProjects.map(p => {
      const task = getNextProjetTask(p, skipped);
      return task ? { banque: 'projet', item: task, projet: p } : null;
    }),
  ].filter(Boolean);

  const hero  = allSuggestions[0] || null;
  const queue = allSuggestions.slice(1);

  // Handle the one-shot compose command sent by the parent (FAB). Opening the
  // matching input is a side effect of that command, so setState-in-effect is
  // intentional here; we consume the command immediately to avoid re-runs.
  useEffect(() => {
    if (pendingCompose === 'bonus') {
      setShowBonusInput(true); // eslint-disable-line react-hooks/set-state-in-effect
      onPendingConsumed?.();
    } else if (pendingCompose === 'video_tournee') {
      setShowLogVideo(true);
      onPendingConsumed?.();
    }
  }, [pendingCompose, onPendingConsumed]);

  // ─── Agenda event ────────────────────────────────────────────────────────

  const addAgendaEvent = (label, banque, color, timeSlot) => {
    if (!timeSlot?.debut || !timeSlot?.fin) return;
    setAgenda(prev => [...(prev || []), {
      id: Date.now(), titre: label,
      date: formatDate(viewDate), heureDebut: timeSlot.debut, heureFin: timeSlot.fin,
      type: banque, color, fromTask: true,
    }]);
  };

  const addJournalTache = (entry) => {
    setJournal(prev => ({
      ...prev,
      taches: [
        ...(prev.taches || []).filter(t => !(t.id === entry.id && t.banque === entry.banque && t.projetId === entry.projetId)),
        entry,
      ],
    }));
  };

  // ─── Banques handlers ────────────────────────────────────────────────────

  const handleFait = (banque, item, timeSlot) => {
    markDone(banque, item.id);
    const label = makeItemLabel(banque, item);
    addJournalTache({ id: item.id, banque, label, statut: 'fait', heure: timeSlot });
    addAgendaEvent(label, banque, banqueColor(banque), timeSlot);
  };

  const handleReporte = (banque, item) => {
    setReporte(prev => [...(prev || []), `${banque}_${item.id}`]);
    addJournalTache({ id: item.id, banque, label: makeItemLabel(banque, item), statut: 'reporte' });
  };

  const handleSuivante = (banque, item) => {
    setReporte(prev => [...(prev || []), `${banque}_${item.id}`]);
  };

  // ─── Projet handlers ──────────────────────────────────────────────────────

  const handleProjetFait = (projet, tache, timeSlot) => {
    setProjets(prev => prev.map(p =>
      p.id === projet.id
        ? { ...p, taches: p.taches.map(t => t.id === tache.id ? { ...t, statut: 'fait' } : t) }
        : p
    ));
    addJournalTache({
      id: tache.id, banque: 'projet', projetId: projet.id, projetNom: projet.nom,
      label: tache.description, statut: 'fait', heure: timeSlot,
    });
    addAgendaEvent(tache.description, `projet_${projet.id}`, projet.couleur, timeSlot);
  };

  const handleProjetReporte = (projet, tache) => {
    setReporte(prev => [...(prev || []), `projet_${projet.id}_${tache.id}`]);
    addJournalTache({ id: tache.id, banque: 'projet', projetId: projet.id, projetNom: projet.nom, label: tache.description, statut: 'reporte' });
  };

  const handleProjetSuivante = (projet, tache) => {
    setReporte(prev => [...(prev || []), `projet_${projet.id}_${tache.id}`]);
  };

  // ─── Generic suggestion handlers ─────────────────────────────────────────

  const handleSuggestionFait = (suggestion, timeSlot) => {
    if (suggestion.banque === 'projet') handleProjetFait(suggestion.projet, suggestion.item, timeSlot);
    else handleFait(suggestion.banque, suggestion.item, timeSlot);
    flashXp(XP.mission);
  };

  const handleSuggestionReporte = (suggestion) => {
    if (suggestion.banque === 'projet') handleProjetReporte(suggestion.projet, suggestion.item);
    else handleReporte(suggestion.banque, suggestion.item);
  };

  const handleSuggestionSuivante = (suggestion) => {
    if (suggestion.banque === 'projet') handleProjetSuivante(suggestion.projet, suggestion.item);
    else handleSuivante(suggestion.banque, suggestion.item);
  };

  // Hero "Fait" with fade animation
  const handleHeroFait = (_, timeSlot) => {
    setHeroFading(true);
    setTimeout(() => {
      handleSuggestionFait(hero, timeSlot);
      setHeroFading(false);
    }, 280);
  };

  // ─── Sport ────────────────────────────────────────────────────────────────

  const handleSportSave = (sportData) => {
    setJournal(prev => ({
      ...prev,
      sport: sportData,
      habitudes: { ...(prev.habitudes || {}), sport: true },
    }));
    setShowSportSheet(false);
    flashXp(sessionXP(sportData));
  };

  const handleSportClear = () => {
    setJournal(prev => ({ ...prev, sport: null, habitudes: { ...(prev.habitudes || {}), sport: false } }));
  };

  // ─── Vidéo tournée hors liste ─────────────────────────────────────────────
  // Logged as a completed TikTok mission in today's journal: it earns XP,
  // shows in "Victoires du jour", counts in the monthly "Vidéos publiées"
  // stat and is seen by the Coach — exactly like marking a bank idea done.
  const handleLogVideoSave = ({ titre, format }) => {
    const fallback = VIDEO_FORMATS.find(f => f.key === format)?.defaultLabel || 'Vidéo (hors liste)';
    addJournalTache({ id: Date.now(), banque: 'tiktok', label: titre || fallback, statut: 'fait', horsListe: true, format });
    setShowLogVideo(false);
    flashXp(XP.mission);
  };

  // ─── Habitudes ────────────────────────────────────────────────────────────

  const updateHabitude = (field, value) => {
    setJournal(prev => ({ ...prev, habitudes: { ...(prev.habitudes || {}), [field]: value } }));
  };

  // Log an "action importante" (free text or quick chip); both earn bonus XP.
  const addBonus = (texte) => {
    const t = (texte || '').trim();
    if (!t) return;
    setJournal(prev => ({ ...prev, bonus: [...(prev.bonus || []), { id: Date.now(), texte: t }] }));
    flashXp(XP.bonus);
  };
  const addBonusQuick = addBonus;

  const removeBonus = (id) => {
    setJournal(prev => ({ ...prev, bonus: (prev.bonus || []).filter(b => b.id !== id) }));
  };

  const handleUndoFait = (tache) => {
    if (tache.banque === 'projet') {
      setProjets(prev => prev.map(p => p.id === tache.projetId
        ? { ...p, taches: p.taches.map(t => t.id === tache.id ? { ...t, statut: 'a_faire' } : t) }
        : p
      ));
    } else {
      markUndone(tache.banque, tache.id);
    }
    setJournal(prev => ({
      ...prev,
      taches: (prev.taches || []).filter(t =>
        !(t.id === tache.id && t.banque === tache.banque && t.projetId === tache.projetId)
      ),
    }));
  };

  // ─── Long press sur prières & cigarettes ─────────────────────────────────
  // Après un long press, iOS synthétise un click ~300ms après touchend qui frappe
  // le fond du modal et le refermerait immédiatement. Ce ref bloque la fermeture
  // backdrop pendant 500ms après l'ouverture par long press.
  const blockModalCloseRef = useRef(false);
  const openWithBlock = (openFn) => {
    blockModalCloseRef.current = true;
    openFn();
    setTimeout(() => { blockModalCloseRef.current = false; }, 500);
  };

  const hab = journal?.habitudes || { prieres: 0, sport: false, cigarettes: 0, note: '' };

  const prieresLongPress = useLongPress(
    () => openWithBlock(() => { setEditPrieres(hab.prieres || 0); setShowPrieresEdit(true); }),
    () => updateHabitude('prieres', (hab.prieres || 0) + 1),
  );

  const cigsLongPress = useLongPress(
    () => openWithBlock(() => { setEditCigs(hab.cigarettes || 0); setShowCigsEdit(true); }),
    () => updateHabitude('cigarettes', (hab.cigarettes || 0) + 1),
  );

  const noSportDays = getConsecutiveNoSportDays();

  // Horaires de travail du jour affiché + relances prospects dues aujourd'hui.
  const todayWork = workBlockForDate(travail, formatDate(viewDate));
  const workConfigured = hasWorkSchedule(travail);
  const dueRelances = dueProspects(prospects, formatDate(today()));

  // Rappel de sauvegarde : si des données existent et qu'aucun export récent
  // (> 7 j) n'a été fait, on invite à exporter pour ne plus jamais tout perdre.
  const { last: lastBackup, days: daysSinceBackup } = backupReminderState();
  const needsBackup = !isYesterday && !backupDismissed && (prog.trackedDays || 0) >= 2 && daysSinceBackup >= 7;
  const tachesFaites    = (journal?.taches || []).filter(t => t.statut === 'fait');
  const tachesReportees = (journal?.taches || []).filter(t => t.statut === 'reporte');

  const sportDone = journal?.sport || journal?.habitudes?.sport;
  const sportLabel = journal?.sport?.seance_nom || journal?.sport?.notes ||
    (journal?.sport?.type === 'club' ? 'Club MMA' : journal?.sport?.type === 'gym' ? 'Gym' : journal?.sport?.type === 'maison' ? 'Maison' : null) ||
    (journal?.habitudes?.sport ? 'Sport' : null);

  // Suggestion config for projets
  const getSuggConfig = (s) => {
    if (s.banque !== 'projet') return undefined;
    return {
      label: s.projet.nom,
      color: s.projet.couleur,
      bg: s.projet.couleur + '22',
      emoji: s.projet.emoji || '📁',
      getLabel: (t) => t.description,
      getSub: () => null,
      badge: () => null,
    };
  };

  return (
    <div className="flex flex-col gap-0 pb-nav">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <p className="uppercase tracking-widest text-[10px] font-bold mb-0.5" style={{ color: 'var(--ink-3)' }}>
            {isYesterday ? 'Modification veille' : new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="font-display" style={{ fontSize: 21, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {isYesterday ? formatDateFR(viewDate) : 'Prêt au combat'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isYesterday && (
            <button
              onClick={() => setViewDate(today())}
              className="px-3 py-1.5 rounded-lg font-semibold btn-press"
              style={{ background: 'var(--red)', color: 'white', fontSize: 12 }}
            >
              ← Aujourd'hui
            </button>
          )}
          {!isYesterday && (
            <button
              onClick={() => setViewDate(yesterday())}
              className="px-3 py-1.5 rounded-lg font-medium btn-press"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: 12, border: '1px solid var(--line)' }}
            >
              Hier
            </button>
          )}
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center btn-press"
            style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)' }}
          >
            <Menu size={18} strokeWidth={2} color="var(--ink-2)" />
          </button>
        </div>
      </div>

      {/* ── Combatant HUD ─────────────────────────────────────────────── */}
      {!isYesterday && (
        <div className="px-4 mb-1 flex flex-col gap-3">
          <HUD prog={prog} onOpen={() => onNavigate?.('stats')} />
          <DailyObjective
            todayXP={dayXP(journal)}
            goal={prog.goal}
            mantra={mantraOfTheDay()}
            tokens={prog.tokens}
            yesterdayMissed={yesterdayMissed()}
            onProtect={() => { protectStreak(prog.level); refreshProg(); }}
          />
        </div>
      )}

      {/* Retroactivity banner */}
      {isYesterday && (
        <div className="mx-4 mt-2 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'var(--orange-soft)', border: '1px solid rgba(255,159,28,0.35)' }}>
          <span className="text-xl">📅</span>
          <p className="text-sm font-semibold" style={{ color: 'var(--orange)' }}>Modification de la veille</p>
        </div>
      )}

      {/* Nudge sport */}
      {!isYesterday && noSportDays >= 3 && !journal?.sport && !journal?.habitudes?.sport && (
        <div className="mx-4 mt-2 rounded-xl px-4 py-2.5 flex items-center gap-3" style={{ background: 'var(--orange-soft)', border: '1px solid rgba(255,159,28,0.3)' }}>
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-medium" style={{ color: 'var(--orange)' }}>{noSportDays} jours sans entraînement — bouge !</p>
        </div>
      )}

      {/* Rappel de sauvegarde — évite de reperdre ses données */}
      <BackupBanner
        show={needsBackup}
        hasBackup={!!lastBackup}
        onExport={() => onOpenSettings?.()}
        onDismiss={() => setBackupDismissed(true)}
      />

      {/* Relances prospects dues aujourd'hui */}
      {!isYesterday && dueRelances.length > 0 && (
        <button
          onClick={() => onOpenProspects?.()}
          className="mx-4 mt-2 rounded-xl px-4 py-2.5 flex items-center gap-3 text-left btn-press"
          style={{ background: 'var(--cyan-soft)', border: '1px solid rgba(0,180,216,0.3)' }}
        >
          <span className="text-xl">📇</span>
          <p className="text-sm font-medium flex-1" style={{ color: 'var(--cyan)' }}>
            {dueRelances.length} prospect{dueRelances.length > 1 ? 's' : ''} à relancer
            {' '}({dueRelances.slice(0, 2).map(p => p.nom).join(', ')}{dueRelances.length > 2 ? '…' : ''})
          </p>
          <span style={{ color: 'var(--cyan)', fontSize: 12 }}>›</span>
        </button>
      )}

      {/* Horaires de travail du jour */}
      <div className="px-4 mt-2">
        <button
          onClick={() => setShowWorkModal(true)}
          className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 btn-press"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
        >
          <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
            <span>💼</span>
            {todayWork
              ? <span>Travail {todayWork.debut} – {todayWork.fin}{todayWork.exception ? ' (modifié)' : ''}</span>
              : workConfigured
              ? <span>Repos {isYesterday ? 'ce jour-là' : "aujourd'hui"}</span>
              : <span>Renseigner mes horaires de travail</span>}
          </span>
          <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>Modifier ›</span>
        </button>
      </div>

      {/* ── Disciplines strip ──────────────────────────────────────────── */}
      <DisciplinesStrip
        hab={hab}
        sportDone={sportDone}
        sportLabel={sportLabel}
        prieresProps={prieresLongPress}
        cigsProps={cigsLongPress}
        onOpenSport={() => setShowSportSheet(true)}
        onOpenNote={() => setShowNoteModal(true)}
      />

      {/* ── À faire maintenant ─────────────────────────────────────────── */}
      <section className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="uppercase tracking-widest text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>
            Mission prioritaire
          </p>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-3)' }}>
            {allSuggestions.length > 0 ? `1/${allSuggestions.length}` : '0/0'}
          </span>
        </div>

        {hero ? (
          <SuggestionCard
            hero
            fadingOut={heroFading}
            banque={hero.banque}
            item={hero.item}
            config={getSuggConfig(hero)}
            onFait={handleHeroFait}
            onReporte={() => handleSuggestionReporte(hero)}
            onLogVideo={() => setShowLogVideo(true)}
            onSuivante={() => handleSuggestionSuivante(hero)}
            onFocus={() => setFocusOpen(true)}
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-sm font-bold font-display" style={{ color: 'var(--ink)' }}>Combat remporté</p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-3)' }}>Toutes les missions sont accomplies</p>
          </div>
        )}
      </section>

      {/* ── Suite ──────────────────────────────────────────────────────── */}
      {queue.length > 0 && (
        <section className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="uppercase tracking-widest text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>File de missions</p>
          </div>
          <div className="flex flex-col gap-3">
            {queue.map((s, i) => (
              <SuggestionCard
                key={i}
                banque={s.banque}
                item={s.item}
                config={getSuggConfig(s)}
                onFait={(_, timeSlot) => handleSuggestionFait(s, timeSlot)}
                onReporte={() => handleSuggestionReporte(s)}
                onLogVideo={() => setShowLogVideo(true)}
                onSuivante={() => handleSuggestionSuivante(s)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Autres actions importantes ──────────────────────────────────── */}
      <ActionsImportantes
        bonus={journal?.bonus || []}
        showInput={showBonusInput}
        onOpen={() => setShowBonusInput(true)}
        onClose={() => setShowBonusInput(false)}
        onAdd={addBonus}
        onAddQuick={addBonusQuick}
        onRemove={removeBonus}
      />

      {/* ── Déjà fait aujourd'hui ──────────────────────────────────────── */}
      <VictoiresDuJour
        tachesFaites={tachesFaites}
        tachesReportees={tachesReportees}
        hab={hab}
        sportDone={sportDone}
        sportLabel={sportLabel}
        onUndoFait={handleUndoFait}
      />

      {/* ── Sport bottom sheet ─────────────────────────────────────────── */}
      <SportSheet
        open={showSportSheet}
        onClose={() => setShowSportSheet(false)}
        journal={journal}
        onSportSave={handleSportSave}
        onSportClear={handleSportClear}
        setAgenda={setAgenda}
        viewDate={formatDate(viewDate)}
      />

      {/* ── Horaires de travail (semaine type + exception du jour) ────── */}
      <WorkScheduleModal
        open={showWorkModal}
        onClose={() => setShowWorkModal(false)}
        travail={travail}
        setTravail={setTravail}
        focusDate={formatDate(viewDate)}
        focusLabel={isYesterday ? formatDateFR(viewDate) : "Aujourd'hui"}
      />

      {/* ── Note modal ─────────────────────────────────────────────────── */}
      <Modal
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="📝 Note du jour"
        footer={
          <button
            onClick={() => setShowNoteModal(false)}
            className="w-full py-2.5 rounded-lg font-medium text-sm btn-press"
            style={{ background: 'var(--red)', color: 'white' }}
          >
            Enregistrer
          </button>
        }
      >
        <textarea
          autoFocus
          value={hab.note || ''}
          onChange={e => updateHabitude('note', e.target.value)}
          placeholder="Comment s'est passée ta journée ?"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          rows={5}
        />
      </Modal>

      {/* ── Modal édition prières ──────────────────────────────────────── */}
      <CounterModal
        open={showPrieresEdit}
        onClose={() => { if (blockModalCloseRef.current) return; setShowPrieresEdit(false); }}
        title="🙏 Prières"
        value={editPrieres}
        onChange={setEditPrieres}
        onReset={() => { updateHabitude('prieres', 0); setShowPrieresEdit(false); }}
        onSave={() => { updateHabitude('prieres', editPrieres); setShowPrieresEdit(false); }}
        accent="var(--red)"
      />

      {/* ── Modal édition cigarettes ───────────────────────────────────── */}
      <CounterModal
        open={showCigsEdit}
        onClose={() => { if (blockModalCloseRef.current) return; setShowCigsEdit(false); }}
        title="🚬 Cigarettes"
        value={editCigs}
        onChange={setEditCigs}
        onReset={() => { updateHabitude('cigarettes', 0); setShowCigsEdit(false); }}
        onSave={() => { updateHabitude('cigarettes', editCigs); setShowCigsEdit(false); }}
        accent="var(--orange)"
      />

      {/* ── Vidéo tournée hors liste (modal) ───────────────────────────── */}
      <LogVideoModal
        open={showLogVideo}
        onClose={() => setShowLogVideo(false)}
        onSave={handleLogVideoSave}
      />

      {/* ── Mode Focus ─────────────────────────────────────────────────── */}
      {focusOpen && hero && (
        <FocusOverlay
          label={hero.banque === 'projet' ? hero.item.description : makeItemLabel(hero.banque, hero.item)}
          color={hero.banque === 'projet' ? (hero.projet?.couleur || 'var(--red)') : banqueColor(hero.banque)}
          onComplete={() => {
            setFocusOpen(false);
            handleSuggestionFait(hero, null);
            // Focus bonus, logged as a bonus mission (+10 XP via the engine)
            setJournal(prev => ({ ...prev, bonus: [...(prev.bonus || []), { id: Date.now(), texte: '🎯 Session focus' }] }));
          }}
          onClose={() => setFocusOpen(false)}
        />
      )}

      {/* ── Reward feedback ────────────────────────────────────────────── */}
      <XpFlash
        amount={xpFlash.amount}
        trigger={xpFlash.trigger}
        onDone={() => setXpFlash(f => ({ ...f, trigger: 0 }))}
      />
      <LevelUpOverlay
        level={levelUp?.level}
        rank={levelUp?.rank}
        unlocks={levelUp?.unlocks}
        onClose={() => setLevelUp(null)}
      />
    </div>
  );
}
