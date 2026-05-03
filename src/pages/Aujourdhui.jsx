import { useState } from 'react';
import { formatDateFR, formatDate, today, yesterday } from '../utils/date';
import { useJournal, useReporteAujourdhui } from '../hooks/useJournal';
import { useAllBanques } from '../hooks/useBanques';
import { useProjets, getNextProjetTask, getActiveProjects } from '../hooks/useProjets';
import { useAgenda } from '../hooks/useAgenda';
import { getConsecutiveNoSportDays } from '../utils/stats';
import SuggestionCard from '../components/SuggestionCard';
import Card from '../components/Card';
import SportModule from '../components/sport/SportModule';

function makeItemLabel(banque, item) {
  if (banque === 'tiktok') return item.titre;
  if (item.code) return `${item.code} — ${item.description}`;
  return item.description;
}

export default function Aujourdhui() {
  const [viewDate, setViewDate] = useState(today());
  const isYesterday = formatDate(viewDate) !== formatDate(today());

  const [journal, setJournal] = useJournal(viewDate);
  const [reporte, setReporte] = useReporteAujourdhui(viewDate);
  const [agenda, setAgenda] = useAgenda();
  const { tiktok, fightfocus, marque, markDone, markUndone, getNextItem, hasAvailableItems } = useAllBanques();
  const [projets, setProjets] = useProjets();

  const [bonusInput, setBonusInput] = useState('');
  const [showBonusInput, setShowBonusInput] = useState(false);

  const skipped = reporte || [];

  const nextTiktok     = getNextItem('tiktok',     skipped);
  const nextFightfocus = getNextItem('fightfocus', skipped);
  const nextMarque     = getNextItem('marque',     skipped);

  const activeProjects = getActiveProjects(projets, skipped);

  // ─── Handlers communs ────────────────────────────────────────────────────

  const addAgendaEvent = (label, banque, color, timeSlot) => {
    if (!timeSlot?.debut || !timeSlot?.fin) return;
    setAgenda(prev => [...(prev || []), {
      id: Date.now(),
      titre: label,
      date: formatDate(viewDate),
      heureDebut: timeSlot.debut,
      heureFin: timeSlot.fin,
      type: banque,
      color,
      fromTask: true,
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

  // ─── Banques ──────────────────────────────────────────────────────────────

  const handleFait = (banque, item, timeSlot) => {
    markDone(banque, item.id);
    const label = makeItemLabel(banque, item);
    const colors = { tiktok: 'var(--red)', fightfocus: 'var(--cyan)', marque: 'var(--orange)' };
    addJournalTache({ id: item.id, banque, label, statut: 'fait', heure: timeSlot });
    addAgendaEvent(label, banque, colors[banque], timeSlot);
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

  // ─── Projets ──────────────────────────────────────────────────────────────

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
    addJournalTache({
      id: tache.id, banque: 'projet', projetId: projet.id, projetNom: projet.nom,
      label: tache.description, statut: 'reporte',
    });
  };

  const handleProjetAutre = (projet, tache, texte) => {
    addJournalTache({
      id: tache.id, banque: 'projet', projetId: projet.id, projetNom: projet.nom,
      label: tache.description, statut: 'autre', autreTexte: texte,
    });
  };

  const handleProjetSuivante = (projet, tache) => {
    setReporte(prev => [...(prev || []), `projet_${projet.id}_${tache.id}`]);
  };

  // ─── Sport ────────────────────────────────────────────────────────────────

  const handleSportSave = (sportData) => {
    setJournal(prev => ({
      ...prev,
      sport: sportData,
      habitudes: { ...(prev.habitudes || {}), sport: true },
    }));
  };

  const handleSportClear = () => {
    setJournal(prev => ({ ...prev, sport: null, habitudes: { ...(prev.habitudes || {}), sport: false } }));
  };

  // ─── Habitudes ────────────────────────────────────────────────────────────

  const updateHabitude = (field, value) => {
    setJournal(prev => ({
      ...prev,
      habitudes: { ...(prev.habitudes || {}), [field]: value },
    }));
  };

  const addBonus = () => {
    if (!bonusInput.trim()) return;
    setJournal(prev => ({
      ...prev,
      bonus: [...(prev.bonus || []), { id: Date.now(), texte: bonusInput.trim() }],
    }));
    setBonusInput('');
    setShowBonusInput(false);
  };

  const removeBonus = (id) => {
    setJournal(prev => ({ ...prev, bonus: (prev.bonus || []).filter(b => b.id !== id) }));
  };

  // ─── Undo fait ────────────────────────────────────────────────────────────

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

  const noSportDays = getConsecutiveNoSportDays();
  const hab = journal?.habitudes || { prieres: 0, sport: false, cigarettes: 0, note: '' };
  const tachesFaites    = (journal?.taches || []).filter(t => t.statut === 'fait');
  const tachesReportees = (journal?.taches || []).filter(t => t.statut === 'reporte');

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-nav">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            {isYesterday ? 'Rétroactivité' : 'Bonjour 👋'}
          </p>
          <h1 className="text-xl font-bold text-gray-900 capitalize leading-tight">
            {formatDateFR(viewDate)}
          </h1>
        </div>
        <button
          onClick={() => setViewDate(isYesterday ? today() : yesterday())}
          className="text-sm px-3 py-1.5 rounded-lg font-medium mt-1"
          style={isYesterday
            ? { background: 'var(--red)', color: 'var(--surface)' }
            : { background: 'var(--line-2)', color: 'var(--ink-2)' }
          }
        >
          {isYesterday ? '← Aujourd\'hui' : 'Hier'}
        </button>
      </div>

      {/* Retroactivity banner */}
      {isYesterday && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📅</span>
          <p className="text-sm text-amber-800 font-semibold">Modification de la veille</p>
        </div>
      )}

      {/* Nudge sport (hidden when viewing yesterday) */}
      {!isYesterday && noSportDays >= 3 && !journal?.sport && !journal?.habitudes?.sport && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm text-amber-800 font-medium">
            {noSportDays} jours sans sport — c'est le moment de bouger !
          </p>
        </div>
      )}

      {/* Suggestions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Suggestions du jour
        </h2>
        <div className="flex flex-col gap-3">
          <SuggestionCard
            banque="tiktok"
            item={nextTiktok}
            exhaustedToday={!nextTiktok && hasAvailableItems('tiktok') && skipped.some(s => s.startsWith('tiktok_'))}
            onFait={(item, time) => handleFait('tiktok', item, time)}
            onReporte={(item) => handleReporte('tiktok', item)}
            onAutre={(item, texte) => handleAutre('tiktok', item, texte)}
            onSuivante={(item) => handleSuivante('tiktok', item)}
          />
          <SuggestionCard
            banque="fightfocus"
            item={nextFightfocus}
            exhaustedToday={!nextFightfocus && hasAvailableItems('fightfocus') && skipped.some(s => s.startsWith('fightfocus_'))}
            onFait={(item, time) => handleFait('fightfocus', item, time)}
            onReporte={(item) => handleReporte('fightfocus', item)}
            onAutre={(item, texte) => handleAutre('fightfocus', item, texte)}
            onSuivante={(item) => handleSuivante('fightfocus', item)}
          />
          <SuggestionCard
            banque="marque"
            item={nextMarque}
            exhaustedToday={!nextMarque && hasAvailableItems('marque') && skipped.some(s => s.startsWith('marque_'))}
            onFait={(item, time) => handleFait('marque', item, time)}
            onReporte={(item) => handleReporte('marque', item)}
            onAutre={(item, texte) => handleAutre('marque', item, texte)}
            onSuivante={(item) => handleSuivante('marque', item)}
          />

          {activeProjects.map(projet => {
            const nextTask = getNextProjetTask(projet, skipped);
            const bg = projet.couleur + '22';
            return (
              <SuggestionCard
                key={projet.id}
                banque="projet"
                item={nextTask}
                config={{
                  label: projet.nom,
                  color: projet.couleur,
                  bg,
                  emoji: projet.emoji || '📁',
                  getLabel: (t) => t.description,
                  getSub: () => null,
                  badge: () => null,
                }}
                onFait={(tache, time) => handleProjetFait(projet, tache, time)}
                onReporte={(tache) => handleProjetReporte(projet, tache)}
                onAutre={(tache, texte) => handleProjetAutre(projet, tache, texte)}
                onSuivante={(tache) => handleProjetSuivante(projet, tache)}
              />
            );
          })}
        </div>
      </section>

      {/* J'ai aussi fait */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            J'ai aussi fait
          </h2>
          <button onClick={() => setShowBonusInput(true)}
            className="w-8 h-8 rounded-full text-white text-lg font-bold flex items-center justify-center"
            style={{ background: 'var(--red)' }}>
            +
          </button>
        </div>

        {showBonusInput && (
          <div className="flex gap-2 mb-2">
            <input autoFocus value={bonusInput} onChange={e => setBonusInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addBonus(); if (e.key === 'Escape') setShowBonusInput(false); }}
              placeholder="Ce que tu as accompli..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <button onClick={addBonus} className="px-3 py-2 rounded-lg text-white text-sm font-medium" style={{ background: 'var(--red)' }}>
              OK
            </button>
          </div>
        )}

        {(journal?.bonus || []).length === 0 && !showBonusInput && (
          <p className="text-sm text-gray-400 italic">Rien encore — ajoute une tâche bonus !</p>
        )}
        <div className="flex flex-col gap-2">
          {(journal?.bonus || []).map(b => (
            <div key={b.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-card">
              <span className="text-green-500 text-sm">✓</span>
              <span className="text-sm text-gray-700 flex-1">{b.texte}</span>
              <button
                onClick={() => removeBonus(b.id)}
                className="text-gray-300 text-base px-1 active:text-red-400"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Habitudes */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Habitudes
        </h2>
        <Card>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm font-medium text-gray-700">🙏 Prières</span>
            <div className="flex items-center gap-3">
              <button onClick={() => updateHabitude('prieres', Math.max(0, (hab.prieres || 0) - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center">−</button>
              <span className="text-lg font-bold w-6 text-center" style={{ color: 'var(--red)' }}>{hab.prieres || 0}</span>
              <button onClick={() => updateHabitude('prieres', (hab.prieres || 0) + 1)}
                className="w-8 h-8 rounded-full text-white font-bold text-lg flex items-center justify-center"
                style={{ background: 'var(--red)' }}>+</button>
            </div>
          </div>

          <SportModule
            journal={journal}
            onSportSave={handleSportSave}
            onSportClear={handleSportClear}
            setAgenda={setAgenda}
            viewDate={formatDate(viewDate)}
          />

          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm font-medium text-gray-700">🚬 Cigarettes</span>
            <div className="flex items-center gap-3">
              <button onClick={() => updateHabitude('cigarettes', Math.max(0, (hab.cigarettes || 0) - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center">−</button>
              <span className={`text-lg font-bold w-6 text-center ${(hab.cigarettes || 0) === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                {hab.cigarettes || 0}
              </span>
              <button onClick={() => updateHabitude('cigarettes', (hab.cigarettes || 0) + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center">+</button>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-sm font-medium text-gray-700 block mb-1.5">📝 Note libre</span>
            <textarea value={hab.note || ''} onChange={e => updateHabitude('note', e.target.value)}
              placeholder="Comment s'est passée ta journée ?"
              className="w-full text-sm border border-gray-100 rounded-lg px-3 py-2 resize-none bg-gray-50" rows={3} />
          </div>
        </Card>
      </section>

      {/* Résumé */}
      {(tachesFaites.length > 0 || tachesReportees.length > 0) && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Résumé du jour</h2>
          <Card>
            {tachesFaites.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-green-600 font-semibold mb-1.5">✅ Accompli</p>
                {tachesFaites.map((t, i) => {
                  const color = t.banque === 'tiktok' ? 'var(--red)'
                    : t.banque === 'fightfocus' ? 'var(--cyan)'
                    : t.banque === 'marque' ? 'var(--orange)'
                    : t.banque === 'projet'
                    ? (projets.find(p => p.id === t.projetId)?.couleur || 'var(--ink-3)')
                    : 'var(--ink-3)';
                  return (
                    <div key={i} className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs shrink-0" style={{ color }}>●</span>
                      <span className="text-xs text-gray-600 leading-snug flex-1">{t.label}</span>
                      <button
                        onClick={() => handleUndoFait(t)}
                        className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 active:bg-gray-200 shrink-0"
                      >
                        ↩️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {tachesReportees.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-1.5">🔄 Reporté</p>
                {tachesReportees.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <span className="text-xs mt-0.5 text-gray-300">●</span>
                    <span className="text-xs text-gray-400 leading-snug">{t.label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-xs text-gray-500">
              <span>🙏 {hab.prieres || 0} prières</span>
              <span>{(journal?.sport || hab.sport) ? `🥊 ${journal?.sport?.seance_nom || 'Sport ✓'}` : '🥊 Sport —'}</span>
              <span>🚬 {hab.cigarettes || 0}</span>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
