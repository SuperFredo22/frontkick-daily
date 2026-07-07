import { useState } from 'react';
import Modal from '../Modal';

// Lieux proposés — chacun mappe vers un SportType existant pour que les
// stats par type (club/gym/maison/autre) continuent de fonctionner.
const LIEUX = [
  { key: 'exterieur', label: '🌳 Extérieur', type: 'autre' },
  { key: 'maison',    label: '🏠 Maison',    type: 'maison' },
  { key: 'salle',     label: '🏋️ Salle',     type: 'gym' },
  { key: 'club',      label: '🥊 Club',      type: 'club' },
];

const MATERIEL = [
  'Poids du corps',
  'Barre de traction',
  'Bande 15 kg',
  'Bande 25 kg',
  'Bande 35 kg',
  'Haltères',
  'Kettlebell',
  'Corde à sauter',
];

const DUREES = [15, 20, 30, 45, 60, 90];

const emptyExo = () => ({ id: Date.now() + Math.random(), nom: '', series: '', reps: '', charge: '' });

// Séance improvisée : lieu, matériel utilisé (bandes de résistance, barre de
// traction…), exercices détaillés (séries/reps/charge) et durée. Monté
// uniquement quand ouvert pour repartir d'un formulaire vierge.
export default function SeanceLibre({ open, onClose, onSave }) {
  if (!open) return null;
  return <Form onClose={onClose} onSave={onSave} />;
}

function Form({ onClose, onSave }) {
  const [titre, setTitre] = useState('');
  const [lieu, setLieu] = useState('exterieur');
  const [materiel, setMateriel] = useState([]);
  const [materielAutre, setMaterielAutre] = useState('');
  const [exos, setExos] = useState([emptyExo()]);
  const [duree, setDuree] = useState('');
  const [notes, setNotes] = useState('');

  const toggleMateriel = (m) => {
    setMateriel(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const setExo = (id, patch) => {
    setExos(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const removeExo = (id) => setExos(prev => prev.filter(e => e.id !== id));

  const namedExos = exos.filter(e => e.nom.trim());
  const canSave = Number(duree) > 0 || namedExos.length > 0 || titre.trim();

  const save = () => {
    if (!canSave) return;
    const allMateriel = [...materiel, ...(materielAutre.trim() ? [materielAutre.trim()] : [])];
    onSave({
      type: LIEUX.find(l => l.key === lieu)?.type || 'autre',
      lieu,
      duree_reelle: Number(duree) || 0,
      seance_nom: titre.trim() || 'Séance libre',
      materiel: allMateriel,
      exercices: namedExos.map(e => ({
        nom: e.nom.trim(),
        series: Number(e.series) || null,
        reps: e.reps.trim() || null,
        charge: e.charge.trim() || null,
      })),
      notes: notes.trim(),
    });
  };

  const chip = (active) => ({
    background: active ? 'var(--cyan)' : 'var(--line-2)',
    color: active ? '#06121A' : 'var(--ink-2)',
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="✍️ Séance libre"
      footer={
        <button
          onClick={save}
          disabled={!canSave}
          className="w-full py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40 btn-press"
          style={{ background: 'var(--grad-fire)' }}
        >
          Enregistrer la séance
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Titre */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Titre (optionnel)</p>
          <input
            value={titre}
            onChange={e => setTitre(e.target.value)}
            placeholder="Ex : Tractions + bandes au parc"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Lieu */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Lieu</p>
          <div className="grid grid-cols-2 gap-2">
            {LIEUX.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setLieu(key)}
                className="py-2 rounded-lg text-sm font-medium btn-press"
                style={chip(lieu === key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Matériel */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Matériel utilisé</p>
          <div className="flex flex-wrap gap-1.5">
            {MATERIEL.map(m => (
              <button
                key={m}
                onClick={() => toggleMateriel(m)}
                className="px-2.5 py-1.5 rounded-full text-xs font-medium btn-press"
                style={chip(materiel.includes(m))}
              >
                {m}
              </button>
            ))}
          </div>
          <input
            value={materielAutre}
            onChange={e => setMaterielAutre(e.target.value)}
            placeholder="Autre matériel…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2"
          />
        </div>

        {/* Exercices */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Exercices</p>
          <div className="flex flex-col gap-2">
            {exos.map((e, i) => (
              <div key={e.id} className="rounded-xl p-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <input
                    value={e.nom}
                    onChange={ev => setExo(e.id, { nom: ev.target.value })}
                    placeholder={i === 0 ? 'Ex : Tractions pronation' : `Exercice ${i + 1}`}
                    className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
                  />
                  {exos.length > 1 && (
                    <button
                      onClick={() => removeExo(e.id)}
                      className="text-sm px-2 py-1 rounded-lg shrink-0"
                      style={{ color: 'var(--ink-3)', background: 'var(--line-2)' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={e.series}
                    onChange={ev => setExo(e.id, { series: ev.target.value })}
                    placeholder="Séries"
                    className="w-1/4 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <span className="text-xs shrink-0" style={{ color: 'var(--ink-3)' }}>×</span>
                  <input
                    value={e.reps}
                    onChange={ev => setExo(e.id, { reps: ev.target.value })}
                    placeholder="Reps"
                    className="w-1/4 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <input
                    value={e.charge}
                    onChange={ev => setExo(e.id, { charge: ev.target.value })}
                    placeholder="Charge (bande 25 kg…)"
                    className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setExos(prev => [...prev, emptyExo()])}
            className="w-full mt-2 py-2 rounded-lg text-sm font-medium btn-press"
            style={{ background: 'var(--cyan-soft)', color: 'var(--cyan)' }}
          >
            + Ajouter un exercice
          </button>
        </div>

        {/* Durée */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Durée (minutes)</p>
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {DUREES.map(d => (
              <button
                key={d}
                onClick={() => setDuree(String(d))}
                className="px-3 py-1.5 rounded-full text-xs font-medium btn-press"
                style={chip(Number(duree) === d)}
              >
                {d} min
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={duree}
            onChange={e => setDuree(e.target.value)}
            placeholder="Durée exacte…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Notes */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Notes (optionnel)</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Sensations, progrès, à refaire…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
            rows={2}
          />
        </div>
      </div>
    </Modal>
  );
}
