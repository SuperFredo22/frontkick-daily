import { useState } from 'react';
import Modal from './Modal';
import { JOURS_SEMAINE, hoursBetween, totalWorkHours, formatHeures } from '../utils/travail';

const DEFAULT_HOURS = { debut: '09:00', fin: '17:00' };

// Éditeur des horaires de travail : semaine type (un horaire par jour) et,
// si `focusDate` est fourni, une exception ponctuelle pour cette date
// (horaires modifiés ou repos). Monté uniquement quand ouvert pour repartir
// d'un état frais à chaque ouverture.
export default function WorkScheduleModal({ open, onClose, travail, setTravail, focusDate, focusLabel }) {
  if (!open) return null;
  return (
    <Editor
      onClose={onClose}
      travail={travail}
      setTravail={setTravail}
      focusDate={focusDate}
      focusLabel={focusLabel}
    />
  );
}

function Editor({ onClose, travail, setTravail, focusDate, focusLabel }) {
  const [horaires, setHoraires] = useState(() => ({ ...(travail?.horaires || {}) }));

  // Exception du jour ciblé : 'normal' (suivre la semaine type) | 'custom' | 'repos'.
  const initialEx = focusDate ? (travail?.exceptions || {})[focusDate] : undefined;
  const [exMode, setExMode] = useState(
    initialEx === undefined ? 'normal' : initialEx === null ? 'repos' : 'custom'
  );
  const [exHours, setExHours] = useState(initialEx || DEFAULT_HOURS);

  const setDay = (key, patch) => {
    setHoraires(prev => ({ ...prev, [key]: { ...(prev[key] || DEFAULT_HOURS), ...patch } }));
  };

  const toggleDay = (key) => {
    setHoraires(prev => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      // Nouveau jour travaillé : reprend le dernier horaire saisi pour aller vite.
      const model = Object.values(prev)[0] || DEFAULT_HOURS;
      return { ...prev, [key]: { ...model } };
    });
  };

  // Raccourci : copie l'horaire du lundi sur mardi→vendredi.
  const applyWeekdays = () => {
    const lundi = horaires['1'];
    if (!lundi) return;
    setHoraires(prev => ({
      ...prev,
      2: { ...lundi }, 3: { ...lundi }, 4: { ...lundi }, 5: { ...lundi },
    }));
  };

  const save = () => {
    setTravail(prev => {
      const exceptions = { ...(prev?.exceptions || {}) };
      if (focusDate) {
        if (exMode === 'normal') delete exceptions[focusDate];
        else if (exMode === 'repos') exceptions[focusDate] = null;
        else exceptions[focusDate] = { debut: exHours.debut, fin: exHours.fin };
      }
      return { ...(prev || {}), horaires, exceptions };
    });
    onClose();
  };

  // Total hebdo de la semaine type (les exceptions ne comptent pas ici).
  const weekTotal = JOURS_SEMAINE.reduce((sum, j) => {
    const h = horaires[j.key];
    return h ? sum + hoursBetween(h.debut, h.fin) : sum;
  }, 0);

  const dayHours = focusDate ? totalWorkHours({ horaires, exceptions: {} }, [focusDate]) : 0;

  const chip = (active, color) => ({
    background: active ? color : 'var(--line-2)',
    color: active ? 'white' : 'var(--ink-2)',
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="💼 Horaires de travail"
      footer={
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--ink-3)' }}>
            {formatHeures(weekTotal)}/sem.
          </span>
          <button
            onClick={save}
            className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm btn-press"
            style={{ background: 'var(--red)' }}
          >
            Enregistrer
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* ── Exception ponctuelle pour la date ciblée ── */}
        {focusDate && (
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink-2)' }}>
              {focusLabel || focusDate} — exceptionnellement :
            </p>
            <div className="flex gap-2 mb-2">
              {[
                { key: 'normal', label: 'Horaire habituel' },
                { key: 'custom', label: 'Modifié' },
                { key: 'repos', label: 'Repos' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setExMode(key)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium btn-press"
                  style={chip(exMode === key, key === 'repos' ? 'var(--green)' : 'var(--cyan)')}
                >
                  {label}
                </button>
              ))}
            </div>
            {exMode === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={exHours.debut}
                  onChange={e => setExHours(h => ({ ...h, debut: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
                <span style={{ color: 'var(--ink-3)' }}>→</span>
                <input
                  type="time"
                  value={exHours.fin}
                  onChange={e => setExHours(h => ({ ...h, fin: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
            )}
            {exMode === 'normal' && dayHours > 0 && (
              <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                Semaine type : {formatHeures(dayHours)} ce jour-là.
              </p>
            )}
          </div>
        )}

        {/* ── Semaine type ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
              Semaine type
            </p>
            {horaires['1'] && (
              <button
                onClick={applyWeekdays}
                className="text-xs font-medium px-2 py-1 rounded-lg btn-press"
                style={{ background: 'var(--cyan-soft)', color: 'var(--cyan)' }}
              >
                Copier lundi → ven.
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {JOURS_SEMAINE.map(({ key, label }) => {
              const h = horaires[key];
              return (
                <div key={key} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDay(key)}
                    className="w-20 shrink-0 py-1.5 rounded-lg text-xs font-semibold btn-press text-left px-2.5"
                    style={chip(!!h, 'var(--red)')}
                  >
                    {label}
                  </button>
                  {h ? (
                    <>
                      <input
                        type="time"
                        value={h.debut}
                        onChange={e => setDay(key, { debut: e.target.value })}
                        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      />
                      <span style={{ color: 'var(--ink-3)' }}>→</span>
                      <input
                        type="time"
                        value={h.fin}
                        onChange={e => setDay(key, { fin: e.target.value })}
                        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      />
                      <span className="text-xs w-10 text-right shrink-0" style={{ color: 'var(--ink-3)' }}>
                        {formatHeures(hoursBetween(h.debut, h.fin))}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs flex-1" style={{ color: 'var(--ink-3)' }}>Repos</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--ink-3)' }}>
            Les jours travaillés apparaissent automatiquement dans l'agenda,
            chaque semaine, sans rien ressaisir.
          </p>
        </div>
      </div>
    </Modal>
  );
}
