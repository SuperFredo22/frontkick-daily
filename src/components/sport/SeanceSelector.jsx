import { useState } from 'react';
import Modal from '../Modal';
import { seancesGym } from '../../data/seances_gym';
import { seancesMaison } from '../../data/seances_maison';

const NIVEAU_STYLE = {
  'Débutant':      { bg: 'var(--green)', fg: '#06180F' },
  'Intermédiaire': { bg: 'var(--orange)', fg: '#1A0E00' },
  'Avancé':        { bg: 'var(--red)', fg: '#fff' },
};

export default function SeanceSelector({ open, lieu, onSelect, onClose }) {
  const [dureeFilter, setDureeFilter] = useState(null);
  const [niveauFilter, setNiveauFilter] = useState(null);

  const all = lieu === 'gym' ? seancesGym : seancesMaison;

  const filtered = all.filter(s => {
    if (niveauFilter && s.niveau !== niveauFilter) return false;
    if (!dureeFilter) return true;
    if (dureeFilter === 'court') return s.duree <= 20;
    if (dureeFilter === 'moyen') return s.duree > 20 && s.duree <= 40;
    if (dureeFilter === 'long') return s.duree > 40;
    return true;
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choisir une séance"
      footer={
        <button onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
          Annuler
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Durée</p>
          <div className="flex gap-2">
            {[
              { key: 'court', label: '⚡ Court' },
              { key: 'moyen', label: '⏱ Moyen' },
              { key: 'long', label: '🏆 Long' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDureeFilter(dureeFilter === key ? null : key)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={dureeFilter === key
                  ? { background: 'var(--cyan)', color: '#06121A' }
                  : { background: 'var(--line-2)', color: 'var(--ink-2)' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Niveau</p>
          <div className="flex gap-2">
            {['Débutant', 'Intermédiaire', 'Avancé'].map((niv) => {
              const active = niveauFilter === niv;
              const s = NIVEAU_STYLE[niv];
              return (
                <button
                  key={niv}
                  onClick={() => setNiveauFilter(active ? null : niv)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={active
                    ? { background: s.bg, color: s.fg }
                    : { background: 'var(--line-2)', color: 'var(--ink-2)' }
                  }
                >
                  {niv}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">
              Aucune séance pour ce filtre
            </p>
          ) : filtered.map(s => (
            <div key={s.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-semibold text-gray-800">{s.nom}</p>
                <span className="text-xs text-gray-400 ml-2 shrink-0">{s.duree} min</span>
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {s.niveau && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: NIVEAU_STYLE[s.niveau]?.bg, color: NIVEAU_STYLE[s.niveau]?.fg }}>
                    {s.niveau}
                  </span>
                )}
                <span className="text-xs text-gray-500">{s.type}</span>
              </div>
              <div className="mb-2">
                {s.exercices.slice(0, 3).map((e, i) => (
                  <p key={i} className="text-xs text-gray-500">• {e.nom} ({e.series}×{e.reps})</p>
                ))}
                {s.exercices.length > 3 && (
                  <p className="text-xs text-gray-400">+{s.exercices.length - 3} autres…</p>
                )}
              </div>
              {s.materiel && (
                <p className="text-xs text-gray-400 mb-2">Matériel : {s.materiel}</p>
              )}
              <button
                onClick={() => onSelect(s)}
                className="w-full py-2 rounded-lg text-sm font-medium text-white active:opacity-90 transition-opacity"
                style={{ background: 'var(--cyan)' }}
              >
                Lancer cette séance
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
