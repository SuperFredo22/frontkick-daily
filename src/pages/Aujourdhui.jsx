import { useState, useEffect, useRef } from 'react';
import { Menu, ChevronRight } from 'lucide-react';
import { formatDateFR, formatDate, today, yesterday } from '../utils/date';
import { useJournal, useReporteAujourdhui } from '../hooks/useJournal';
import { useAllBanques } from '../hooks/useBanques';
import { useProjets, getNextProjetTask, getActiveProjects } from '../hooks/useProjets';
import { useAgenda } from '../hooks/useAgenda';
import { getConsecutiveNoSportDays } from '../utils/stats';
import SuggestionCard from '../components/SuggestionCard';
import Card from '../components/Card';
import SportModule from '../components/sport/SportModule';
import Modal from '../components/Modal';

function makeItemLabel(banque, item) {
  if (banque === 'tiktok') return item.titre;
  if (item.code) return `${item.code} — ${item.description}`;
  return item.description;
}

const BANQUE_EMOJI = { tiktok: '🎬', fightfocus: '🌐', marque: '👕' };
const BANQUE_COLOR = { tiktok: 'var(--red)', fightfocus: 'var(--cyan)', marque: 'var(--orange)' };

// Long-press hook: fires callback after `delay` ms, returns {onPointerDown, onPointerUp, onPointerLeave, onClick}
function useLongPress(onLongPress, onShortPress, delay = 500) {
  const timer = useRef(null);
  const fired = useRef(false);

  const start = () => {
    fired.current = false;
    timer.current = setTimeout(() => {
      fired.current = true;
      onLongPress?.();
    }, delay);
  };

  const cancel = () => {
    clearTimeout(timer.current);
  };

  const handleClick = () => {
    if (!fired.current) onShortPress?.();
    fired.current = false;
  };

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onClick: handleClick,
  };
}

export default function Aujourdhui({ pendingCompose, onPendingConsumed }) {
  const [viewDate, setViewDate] = useState(today());
  const isYesterday = formatDate(viewDate) !== formatDate(today());

  const [journal, setJournal] = useJournal(viewDate);
  const [reporte, setReporte] = useReporteAujourdhui(viewDate);
  const [agenda, setAgenda] = useAgenda();
  const { markDone, markUndone, getNextItem, hasAvailableItems } = useAllBanques();
  const [projets, setProjets] = useProjets();

  const [bonusInput, setBonusInput] = useState('');
  const [showBonusInput, setShowBonusInput] = useState(false);
  const [heroFading, setHeroFading] = useState(false);
  const [showSportSheet, setShowSportSheet] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

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

  // Handle pendingCompose from FAB
  useEffect(() => {
    if (pendingCompose === 'bonus') {
      setShowBonusInput(true);
      onPendingConsumed?.();
    }
  }, [pendingCompose]);

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
    addAgendaEvent(label, banque, BANQUE_COLOR[banque], timeSlot);
  };

  const handleReporte = (banque, item) => {
    setReporte(prev => [...(prev || []), `${banque}_${item.id}`]);
    addJournalTache({ id: item.id, banque, label: makeItemLabel(banque, item), statut: 'reporte' });
  };

  const handleAutre = (banque, item, texte) => {
    addJournalTache({ id: item.id, banque, label: makeItemLabel(banque, item), statut: 'autre', autreTexte: texte });
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

  const handleProjetAutre = (projet, tache, texte) => {
    addJournalTache({ id: tache.id, banque: 'projet', projetId: projet.id, projetNom: projet.nom, label: tache.description, statut: 'autre', autreTexte: texte });
  };

  const handleProjetSuivante = (projet, tache) => {
    setReporte(prev => [...(prev || []), `projet_${projet.id}_${tache.id}`]);
  };

  // ─── Generic suggestion handlers ─────────────────────────────────────────

  const handleSuggestionFait = (suggestion, timeSlot) => {
    if (suggestion.banque === 'projet') handleProjetFait(suggestion.projet, suggestion.item, timeSlot);
    else handleFait(suggestion.banque, suggestion.item, timeSlot);
  };

  const handleSuggestionReporte = (suggestion) => {
    if (suggestion.banque === 'projet') handleProjetReporte(suggestion.projet, suggestion.item);
    else handleReporte(suggestion.banque, suggestion.item);
  };

  const handleSuggestionAutre = (suggestion, texte) => {
    if (suggestion.banque === 'projet') handleProjetAutre(suggestion.projet, suggestion.item, texte);
    else handleAutre(suggestion.banque, suggestion.item, texte);
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
  };

  const handleSportClear = () => {
    setJournal(prev => ({ ...prev, sport: null, habitudes: { ...(prev.habitudes || {}), sport: false } }));
  };

  // ─── Habitudes ────────────────────────────────────────────────────────────

  const updateHabitude = (field, value) => {
    setJournal(prev => ({ ...prev, habitudes: { ...(prev.habitudes || {}), [field]: value } }));
  };

  const addBonus = () => {
    if (!bonusInput.trim()) return;
    setJournal(prev => ({ ...prev, bonus: [...(prev.bonus || []), { id: Date.now(), texte: bonusInput.trim() }] }));
    setBonusInput('');
    setShowBonusInput(false);
  };

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

  const prieresLongPress = useLongPress(
    () => { setEditPrieres(hab.prieres || 0); setShowPrieresEdit(true); },
    () => updateHabitude('prieres', (hab.prieres || 0) + 1),
  );

  const cigsLongPress = useLongPress(
    () => { setEditCigs(hab.cigarettes || 0); setShowCigsEdit(true); },
    () => updateHabitude('cigarettes', (hab.cigarettes || 0) + 1),
  );

  const noSportDays = getConsecutiveNoSportDays();
  const hab = journal?.habitudes || { prieres: 0, sport: false, cigarettes: 0, note: '' };
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
      <div className="flex items-start justify-between px-5 pt-4 pb-1">
        <div>
          <p className="uppercase tracking-widest text-[11px] font-bold mb-0.5" style={{ color: 'var(--ink-3)' }}>
            {isYesterday ? 'Modification veille' : new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {isYesterday ? formatDateFR(viewDate) : "Bonjour 👋"}
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isYesterday && (
            <button
              onClick={() => setViewDate(today())}
              className="text-sm px-3 py-1.5 rounded-lg font-semibold btn-press"
              style={{ background: 'var(--red)', color: 'white', fontSize: 12 }}
            >
              ← Aujourd'hui
            </button>
          )}
          {!isYesterday && (
            <button
              onClick={() => setViewDate(yesterday())}
              className="text-sm px-3 py-1.5 rounded-lg font-medium btn-press"
              style={{ background: 'var(--line-2)', color: 'var(--ink-2)', fontSize: 12 }}
            >
              Hier
            </button>
          )}
          <button
            className="flex items-center justify-center btn-press"
            style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}
          >
            <Menu size={18} strokeWidth={2} color="var(--ink-2)" />
          </button>
        </div>
      </div>

      {/* Retroactivity banner */}
      {isYesterday && (
        <div className="mx-4 mt-2 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📅</span>
          <p className="text-sm text-amber-800 font-semibold">Modification de la veille</p>
        </div>
      )}

      {/* Nudge sport */}
      {!isYesterday && noSportDays >= 3 && !journal?.sport && !journal?.habitudes?.sport && (
        <div className="mx-4 mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-amber-800 font-medium">{noSportDays} jours sans sport — bouge !</p>
        </div>
      )}

      {/* ── Habits strip ───────────────────────────────────────────────── */}
      <div
        className="flex gap-2 px-5 mt-4 pb-1"
        style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Prières — tap = +1, long press = éditer */}
        <button
          className="flex items-center gap-1.5 shrink-0 btn-press"
          style={{
            background: (hab.prieres || 0) > 0 ? 'var(--red-50)' : 'var(--surface)',
            border: `1px solid ${(hab.prieres || 0) > 0 ? '#F4D5D1' : 'var(--line)'}`,
            borderRadius: 14, padding: '8px 12px',
            color: (hab.prieres || 0) > 0 ? 'var(--red)' : 'var(--ink-2)',
            fontSize: 13, fontWeight: 500,
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
          {...prieresLongPress}
          title="Tap = +1 · Maintenir = éditer"
        >
          <span>🙏</span>
          <span>{hab.prieres || 0}</span>
        </button>

        {/* Sport */}
        <button
          className="flex items-center gap-1.5 shrink-0 btn-press"
          style={{
            background: sportDone ? 'var(--green-soft)' : 'var(--surface)',
            border: `1px solid ${sportDone ? '#86EFAC' : 'var(--line)'}`,
            borderRadius: 14, padding: '8px 12px',
            color: sportDone ? 'var(--green)' : 'var(--ink-2)',
            fontSize: 13, fontWeight: 500,
          }}
          onClick={() => setShowSportSheet(true)}
        >
          <span>🥊</span>
          <span>{sportDone ? `✓ ${sportLabel || 'Fait'}` : 'Sport'}</span>
        </button>

        {/* Cigarettes — tap = +1, long press = éditer */}
        <button
          className="flex items-center gap-1.5 shrink-0 btn-press"
          style={{
            background: (hab.cigarettes || 0) === 0 ? 'var(--surface)' : 'var(--orange-soft)',
            border: `1px solid ${(hab.cigarettes || 0) === 0 ? 'var(--line)' : '#F6C89A'}`,
            borderRadius: 14, padding: '8px 12px',
            color: (hab.cigarettes || 0) === 0 ? 'var(--green)' : 'var(--orange)',
            fontSize: 13, fontWeight: 500,
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
          {...cigsLongPress}
          title="Tap = +1 · Maintenir = éditer"
        >
          <span>🚬</span>
          <span>{hab.cigarettes || 0}</span>
        </button>

        {/* Note */}
        <button
          className="flex items-center gap-1.5 shrink-0 btn-press"
          style={{
            background: hab.note ? 'var(--red-50)' : 'var(--surface)',
            border: `1px solid ${hab.note ? '#F4D5D1' : 'var(--line)'}`,
            borderRadius: 14, padding: '8px 12px',
            color: hab.note ? 'var(--ink-2)' : 'var(--ink-3)',
            fontSize: 13, fontWeight: 500, maxWidth: 140,
          }}
          onClick={() => setShowNoteModal(true)}
        >
          <span>📝</span>
          <span className="truncate">{hab.note || 'Note…'}</span>
        </button>
      </div>

      {/* ── À faire maintenant ─────────────────────────────────────────── */}
      <section className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="uppercase tracking-widest text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>
            À faire maintenant
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
            onAutre={(_, texte) => handleSuggestionAutre(hero, texte)}
            onSuivante={() => handleSuggestionSuivante(hero)}
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>Toutes les tâches sont accomplies !</p>
          </div>
        )}
      </section>

      {/* ── Suite ──────────────────────────────────────────────────────── */}
      {queue.length > 0 && (
        <section className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="uppercase tracking-widest text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>Suite</p>
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
                onAutre={(_, texte) => handleSuggestionAutre(s, texte)}
                onSuivante={() => handleSuggestionSuivante(s)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── J'ai aussi fait (bonus) ─────────────────────────────────────── */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="uppercase tracking-widest text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>
            J'ai aussi fait
          </p>
          {!showBonusInput && (
            <button
              onClick={() => setShowBonusInput(true)}
              className="w-7 h-7 rounded-full text-white text-lg font-bold flex items-center justify-center btn-press"
              style={{ background: 'var(--red)', fontSize: 18, lineHeight: 1 }}
            >
              +
            </button>
          )}
        </div>

        {showBonusInput && (
          <div className="mb-3" style={{ background: 'var(--surface)', borderRadius: 14, padding: '10px 12px', boxShadow: 'var(--shadow-card)' }}>
            <input
              autoFocus value={bonusInput}
              onChange={e => setBonusInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addBonus(); if (e.key === 'Escape') { setShowBonusInput(false); setBonusInput(''); } }}
              placeholder="Ce que tu as accompli..."
              className="w-full text-sm mb-2"
              style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--ink)', fontSize: 14 }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowBonusInput(false); setBonusInput(''); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium btn-press"
                style={{ background: 'var(--line-2)', color: 'var(--ink-2)' }}
              >
                Annuler
              </button>
              <button
                onClick={addBonus}
                disabled={!bonusInput.trim()}
                className="px-3 py-1.5 rounded-lg text-white text-sm font-medium btn-press disabled:opacity-40"
                style={{ background: 'var(--red)' }}
              >
                Ajouter
              </button>
            </div>
          </div>
        )}

        {(journal?.bonus || []).length === 0 && !showBonusInput && (
          <p className="text-sm italic" style={{ color: 'var(--ink-3)' }}>Rien encore — ajoute une tâche bonus !</p>
        )}
        <div className="flex flex-col gap-2">
          {(journal?.bonus || []).map(b => (
            <div key={b.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-card">
              <span className="text-sm" style={{ color: 'var(--green)' }}>✓</span>
              <span className="text-sm flex-1" style={{ color: 'var(--ink-2)' }}>{b.texte}</span>
              <button onClick={() => removeBonus(b.id)} className="text-gray-300 px-1 active:text-red-400">🗑️</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Déjà fait aujourd'hui ──────────────────────────────────────── */}
      {(tachesFaites.length > 0 || tachesReportees.length > 0) && (
        <section className="px-4 mt-6 mb-2">
          <p className="uppercase tracking-widest text-[11px] font-bold mb-3" style={{ color: 'var(--ink-3)' }}>
            Déjà fait aujourd'hui · {tachesFaites.length}
          </p>
          <Card>
            {tachesFaites.map((t, i) => {
              const color = t.banque === 'tiktok' ? 'var(--red)'
                : t.banque === 'fightfocus' ? 'var(--cyan)'
                : t.banque === 'marque' ? 'var(--orange)'
                : t.banque === 'projet'
                ? (projets.find(p => p.id === t.projetId)?.couleur || 'var(--ink-3)')
                : 'var(--ink-3)';
              return (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span
                    className="shrink-0 flex items-center justify-center"
                    style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--green-soft)' }}
                  >
                    <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>✓</span>
                  </span>
                  <span className="text-[13px] flex-1 leading-snug" style={{ color: 'var(--ink-2)', textDecoration: 'line-through', textDecorationColor: '#CBD5E1' }}>
                    {t.label}
                  </span>
                  <button
                    onClick={() => handleUndoFait(t)}
                    className="text-xs px-1.5 py-0.5 rounded btn-press shrink-0"
                    style={{ background: 'var(--line-2)', color: 'var(--ink-3)', fontSize: 11 }}
                  >
                    ↩️
                  </button>
                </div>
              );
            })}
            {tachesReportees.length > 0 && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                <p className="text-[10px] font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>🔄 Reporté</p>
                {tachesReportees.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <span className="text-xs mt-0.5" style={{ color: 'var(--line)' }}>●</span>
                    <span className="text-xs leading-snug" style={{ color: 'var(--ink-3)' }}>{t.label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t flex gap-4 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
              <span>🙏 {hab.prieres || 0}</span>
              <span>{sportDone ? `🥊 ${sportLabel || '✓'}` : '🥊 —'}</span>
              <span>🚬 {hab.cigarettes || 0}</span>
            </div>
          </Card>
        </section>
      )}

      {/* ── Sport bottom sheet ─────────────────────────────────────────── */}
      {showSportSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(15,23,42,.4)' }}
            onClick={() => setShowSportSheet(false)}
          />
          <div
            className="relative w-full"
            style={{
              maxWidth: 480,
              background: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              paddingTop: 12,
              paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
            }}
          >
            <div className="w-8 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--line)' }} />
            <div className="px-4">
              <SportModule
                journal={journal}
                onSportSave={handleSportSave}
                onSportClear={handleSportClear}
                setAgenda={setAgenda}
                viewDate={formatDate(viewDate)}
              />
            </div>
          </div>
        </div>
      )}

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
      <Modal
        open={showPrieresEdit}
        onClose={() => setShowPrieresEdit(false)}
        title="🙏 Prières"
        footer={
          <div className="flex gap-2 w-full">
            <button
              onClick={() => { updateHabitude('prieres', 0); setShowPrieresEdit(false); }}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm btn-press"
              style={{ background: 'var(--line-2)', color: 'var(--ink-2)' }}
            >
              Réinitialiser
            </button>
            <button
              onClick={() => { updateHabitude('prieres', editPrieres); setShowPrieresEdit(false); }}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm btn-press"
              style={{ background: 'var(--red)', color: 'white' }}
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="flex items-center justify-center gap-6 py-2">
          <button
            onClick={() => setEditPrieres(v => Math.max(0, v - 1))}
            className="w-12 h-12 rounded-full text-2xl font-bold btn-press flex items-center justify-center"
            style={{ background: 'var(--line-2)', color: 'var(--ink-2)' }}
          >
            −
          </button>
          <span style={{ fontSize: 40, fontWeight: 800, color: 'var(--ink)', minWidth: 60, textAlign: 'center' }}>
            {editPrieres}
          </span>
          <button
            onClick={() => setEditPrieres(v => v + 1)}
            className="w-12 h-12 rounded-full text-2xl font-bold btn-press flex items-center justify-center"
            style={{ background: 'var(--red)', color: 'white' }}
          >
            +
          </button>
        </div>
      </Modal>

      {/* ── Modal édition cigarettes ───────────────────────────────────── */}
      <Modal
        open={showCigsEdit}
        onClose={() => setShowCigsEdit(false)}
        title="🚬 Cigarettes"
        footer={
          <div className="flex gap-2 w-full">
            <button
              onClick={() => { updateHabitude('cigarettes', 0); setShowCigsEdit(false); }}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm btn-press"
              style={{ background: 'var(--line-2)', color: 'var(--ink-2)' }}
            >
              Réinitialiser
            </button>
            <button
              onClick={() => { updateHabitude('cigarettes', editCigs); setShowCigsEdit(false); }}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm btn-press"
              style={{ background: 'var(--orange)', color: 'white' }}
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="flex items-center justify-center gap-6 py-2">
          <button
            onClick={() => setEditCigs(v => Math.max(0, v - 1))}
            className="w-12 h-12 rounded-full text-2xl font-bold btn-press flex items-center justify-center"
            style={{ background: 'var(--line-2)', color: 'var(--ink-2)' }}
          >
            −
          </button>
          <span style={{ fontSize: 40, fontWeight: 800, color: 'var(--ink)', minWidth: 60, textAlign: 'center' }}>
            {editCigs}
          </span>
          <button
            onClick={() => setEditCigs(v => v + 1)}
            className="w-12 h-12 rounded-full text-2xl font-bold btn-press flex items-center justify-center"
            style={{ background: 'var(--orange)', color: 'white' }}
          >
            +
          </button>
        </div>
      </Modal>
    </div>
  );
}
