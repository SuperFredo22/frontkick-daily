import { useState } from 'react';
import { formatDateFR, formatDate, today, yesterday } from '../utils/date';
import { useJournal, useReporteAujourdhui } from '../hooks/useJournal';
import { useAllBanques } from '../hooks/useBanques';
import { useAgenda } from '../hooks/useAgenda';
import SuggestionCard from '../components/SuggestionCard';
import Card from '../components/Card';

export default function Aujourdhui() {
  const [viewDate, setViewDate] = useState(today());
  const isYesterday = formatDate(viewDate) !== formatDate(today());

  const [journal, setJournal] = useJournal(viewDate);
  const [reporte, setReporte] = useReporteAujourdhui(viewDate);
  const [agenda, setAgenda] = useAgenda();
  const { tiktok, fightfocus, marque, markDone, getNextItem } = useAllBanques();

  const [bonusInput, setBonusInput] = useState('');
  const [showBonusInput, setShowBonusInput] = useState(false);

  const reportedIds = reporte || [];

  const nextTiktok = getNextItem('tiktok', reportedIds);
  const nextFightfocus = getNextItem('fightfocus', reportedIds);
  const nextMarque = getNextItem('marque', reportedIds);

  const handleFait = (banque, item, timeSlot) => {
    markDone(banque, item.id);

    const tacheEntry = {
      id: item.id,
      banque,
      label: banque === 'tiktok' ? item.titre : (item.code ? `${item.code} — ${item.description}` : item.description),
      statut: 'fait',
      heure: timeSlot,
    };

    setJournal(prev => ({
      ...prev,
      taches: [...(prev.taches || []).filter(t => !(t.id === item.id && t.banque === banque)), tacheEntry],
    }));

    if (timeSlot?.debut && timeSlot?.fin) {
      const colors = { tiktok: '#C0392B', fightfocus: '#00b4d8', marque: '#E67E22' };
      const newEvent = {
        id: Date.now(),
        titre: tacheEntry.label,
        date: formatDate(viewDate),
        heureDebut: timeSlot.debut,
        heureFin: timeSlot.fin,
        type: banque,
        color: colors[banque],
        fromTask: true,
      };
      setAgenda(prev => [...(prev || []), newEvent]);
    }
  };

  const handleReporte = (banque, item) => {
    setReporte(prev => [...(prev || []), `${banque}_${item.id}`]);
    setJournal(prev => ({
      ...prev,
      taches: [...(prev.taches || []).filter(t => !(t.id === item.id && t.banque === banque)),
        { id: item.id, banque, label: banque === 'tiktok' ? item.titre : (item.code ? `${item.code} — ${item.description}` : item.description), statut: 'reporte' }],
    }));
  };

  const handleAutre = (banque, item, texte) => {
    setJournal(prev => ({
      ...prev,
      taches: [...(prev.taches || []).filter(t => !(t.id === item.id && t.banque === banque)),
        { id: item.id, banque, label: banque === 'tiktok' ? item.titre : (item.code ? `${item.code} — ${item.description}` : item.description), statut: 'autre', autreTexte: texte }],
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

  const updateHabitude = (field, value) => {
    setJournal(prev => ({
      ...prev,
      habitudes: { ...(prev.habitudes || {}), [field]: value },
    }));
  };

  const hab = journal?.habitudes || { prieres: 0, sport: false, cigarettes: 0, note: '' };
  const tachesFaites = (journal?.taches || []).filter(t => t.statut === 'fait');
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
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium mt-1"
        >
          {isYesterday ? '← Aujourd\'hui' : 'Hier'}
        </button>
      </div>

      {/* Suggestions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Suggestions du jour
        </h2>
        <div className="flex flex-col gap-3">
          <SuggestionCard
            banque="tiktok"
            item={nextTiktok}
            onFait={(item, time) => handleFait('tiktok', item, time)}
            onReporte={(item) => handleReporte('tiktok', item)}
            onAutre={(item, texte) => handleAutre('tiktok', item, texte)}
          />
          <SuggestionCard
            banque="fightfocus"
            item={nextFightfocus}
            onFait={(item, time) => handleFait('fightfocus', item, time)}
            onReporte={(item) => handleReporte('fightfocus', item)}
            onAutre={(item, texte) => handleAutre('fightfocus', item, texte)}
          />
          <SuggestionCard
            banque="marque"
            item={nextMarque}
            onFait={(item, time) => handleFait('marque', item, time)}
            onReporte={(item) => handleReporte('marque', item)}
            onAutre={(item, texte) => handleAutre('marque', item, texte)}
          />
        </div>
      </section>

      {/* J'ai aussi fait */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            J'ai aussi fait
          </h2>
          <button
            onClick={() => setShowBonusInput(true)}
            className="w-8 h-8 rounded-full text-white text-lg font-bold flex items-center justify-center"
            style={{ background: '#C0392B' }}
          >
            +
          </button>
        </div>

        {showBonusInput && (
          <div className="flex gap-2 mb-2">
            <input
              autoFocus
              value={bonusInput}
              onChange={e => setBonusInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addBonus(); if (e.key === 'Escape') setShowBonusInput(false); }}
              placeholder="Ce que tu as accompli..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={addBonus} className="px-3 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#C0392B' }}>
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
              <span className="text-sm text-gray-700">{b.texte}</span>
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
          {/* Prières */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm font-medium text-gray-700">🙏 Prières</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateHabitude('prieres', Math.max(0, (hab.prieres || 0) - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center"
              >−</button>
              <span className="text-lg font-bold w-6 text-center" style={{ color: '#C0392B' }}>
                {hab.prieres || 0}
              </span>
              <button
                onClick={() => updateHabitude('prieres', (hab.prieres || 0) + 1)}
                className="w-8 h-8 rounded-full text-white font-bold text-lg flex items-center justify-center"
                style={{ background: '#C0392B' }}
              >+</button>
            </div>
          </div>

          {/* Sport */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm font-medium text-gray-700">🥊 Sport</span>
            <button
              onClick={() => updateHabitude('sport', !hab.sport)}
              className={`w-12 h-6 rounded-full transition-colors relative ${hab.sport ? '' : 'bg-gray-200'}`}
              style={{ background: hab.sport ? '#C0392B' : undefined }}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hab.sport ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Cigarettes */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm font-medium text-gray-700">🚬 Cigarettes</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateHabitude('cigarettes', Math.max(0, (hab.cigarettes || 0) - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center"
              >−</button>
              <span className={`text-lg font-bold w-6 text-center ${(hab.cigarettes || 0) === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                {hab.cigarettes || 0}
              </span>
              <button
                onClick={() => updateHabitude('cigarettes', (hab.cigarettes || 0) + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center"
              >+</button>
            </div>
          </div>

          {/* Note */}
          <div className="pt-2">
            <span className="text-sm font-medium text-gray-700 block mb-1.5">📝 Note libre</span>
            <textarea
              value={hab.note || ''}
              onChange={e => updateHabitude('note', e.target.value)}
              placeholder="Comment s'est passée ta journée ?"
              className="w-full text-sm border border-gray-100 rounded-lg px-3 py-2 resize-none bg-gray-50"
              rows={3}
            />
          </div>
        </Card>
      </section>

      {/* Résumé */}
      {(tachesFaites.length > 0 || tachesReportees.length > 0) && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Résumé du jour
          </h2>
          <Card>
            {tachesFaites.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-green-600 font-semibold mb-1.5">✅ Accompli</p>
                {tachesFaites.map(t => (
                  <div key={`${t.banque}-${t.id}`} className="flex items-start gap-2 mb-1">
                    <span className="text-xs mt-0.5" style={{
                      color: t.banque === 'tiktok' ? '#C0392B' : t.banque === 'fightfocus' ? '#00b4d8' : '#E67E22'
                    }}>●</span>
                    <span className="text-xs text-gray-600 leading-snug">{t.label}</span>
                  </div>
                ))}
              </div>
            )}
            {tachesReportees.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-1.5">🔄 Reporté</p>
                {tachesReportees.map(t => (
                  <div key={`${t.banque}-${t.id}`} className="flex items-start gap-2 mb-1">
                    <span className="text-xs mt-0.5 text-gray-300">●</span>
                    <span className="text-xs text-gray-400 leading-snug">{t.label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-xs text-gray-500">
              <span>🙏 {hab.prieres || 0} prières</span>
              <span>{hab.sport ? '🥊 Sport ✓' : '🥊 Sport —'}</span>
              <span>🚬 {hab.cigarettes || 0}</span>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
