import { useState } from 'react';
import { Target, Plus, Minus, Pencil, Trash2, Check, Zap } from 'lucide-react';
import Modal from './Modal';
import { useJalons } from '../hooks/useJalons';
import { JALON_CATEGORIES } from '../data/jalons';
import { getMonthStats, getSportMonthStats, getSportQuarterCount } from '../utils/stats';

const CATEGORIES = Object.keys(JALON_CATEGORIES);

// Suivis automatiques : la progression est lue en direct depuis les données
// réelles de l'app (journal). Le jalon devient alors non éditable à la main.
const JALON_SOURCES = {
  videos_mois:   { label: 'Vidéos publiées · ce mois',    compute: () => getMonthStats().tiktok },
  seances_mois:  { label: 'Entraînements · ce mois',      compute: () => getSportMonthStats().total },
  seances_trim:  { label: 'Entraînements · ce trimestre', compute: () => getSportQuarterCount() },
  missions_mois: { label: 'Missions accomplies · ce mois', compute: () => {
    const m = getMonthStats();
    return m.tiktok + m.fightfocus + m.marque +
      Object.values(m.projets || {}).reduce((a, b) => a + (b.count || 0), 0);
  } },
};

// Days remaining until a deadline (null if none). Negative = overdue.
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 864e5);
}

function DeadlineChip({ echeance }) {
  const days = daysUntil(echeance);
  if (days === null) return null;
  const overdue = days < 0;
  const soon = days >= 0 && days <= 7;
  const color = overdue ? 'var(--red)' : soon ? 'var(--orange)' : 'var(--ink-3)';
  const label = overdue ? `Retard ${-days}j` : days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `J-${days}`;
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color, border: '1px solid var(--line)' }}>
      ⏳ {label}
    </span>
  );
}

function JalonCard({ jalon, onStep, onEdit, onDelete }) {
  const color = JALON_CATEGORIES[jalon.categorie]?.color || 'var(--ink-3)';
  const cible = jalon.cible || 1;
  const sourceDef = jalon.source ? JALON_SOURCES[jalon.source] : null;
  const auto = !!sourceDef;
  const actuel = auto ? sourceDef.compute() : Math.max(0, jalon.actuel || 0);
  const pct = Math.min(100, Math.round((actuel / cible) * 100));
  const done = actuel >= cible;

  return (
    <div className="rounded-card p-3" style={{ background: 'var(--surface)', border: `1px solid ${done ? color : 'var(--line)'}` }}>
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: color + '22', color }}>
          {jalon.categorie}
        </span>
        <DeadlineChip echeance={jalon.echeance} />
        <div className="flex-1" />
        <button onClick={() => onEdit(jalon)} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: 'var(--ink-3)' }}>
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(jalon.id)} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: 'var(--red)' }}>
          <Trash2 size={13} />
        </button>
      </div>

      <p className="text-sm font-semibold mt-1.5 leading-snug" style={{ color: 'var(--ink)' }}>
        {done && <Check size={13} className="inline mr-1" style={{ color }} />}{jalon.titre}
      </p>

      <div className="flex items-center gap-2 mt-2">
        {!auto && (
          <button
            onClick={() => onStep(jalon.id, -1)}
            disabled={actuel <= 0}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-30"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
          >
            <Minus size={14} />
          </button>
        )}

        <div className="flex-1">
          <div style={{ height: 6, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 400ms ease' }} />
          </div>
          <p className="text-[10px] mt-1 text-center flex items-center justify-center gap-1" style={{ color: 'var(--ink-3)' }}>
            {auto && <Zap size={9} style={{ color }} />}
            {actuel} / {cible} {jalon.unite || ''} · {pct}%
            {auto && <span style={{ color: 'var(--ink-3)' }}>· auto</span>}
          </p>
        </div>

        {!auto && (
          <button
            onClick={() => onStep(jalon.id, 1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: color, color: '#fff' }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM = { titre: '', categorie: 'Contenu', cible: 1, actuel: 0, unite: '', echeance: '', source: '' };

export default function Jalons() {
  const [jalons, setJalons] = useJalons();
  const [editJalon, setEditJalon] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const list = jalons || [];
  const jalonValue = (j) => {
    const def = j.source ? JALON_SOURCES[j.source] : null;
    return def ? def.compute() : Math.max(0, j.actuel || 0);
  };
  const reached = list.filter(j => jalonValue(j) >= (j.cible || 1)).length;

  const stepProgress = (id, delta) => {
    setJalons(prev => prev.map(j => j.id === id
      ? { ...j, actuel: Math.max(0, (j.actuel || 0) + delta) }
      : j));
  };

  const openAdd = () => { setEditJalon(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (j) => { setEditJalon(j); setForm({ ...j }); setShowForm(true); };

  const save = () => {
    if (!form.titre.trim()) return;
    const cleaned = {
      titre: form.titre.trim(),
      categorie: form.categorie,
      cible: Math.max(1, Number(form.cible) || 1),
      actuel: Math.max(0, Number(form.actuel) || 0),
      unite: form.unite.trim(),
      echeance: form.echeance || '',
      source: form.source || '',
    };
    if (editJalon) {
      setJalons(prev => prev.map(j => j.id === editJalon.id ? { ...j, ...cleaned } : j));
    } else {
      const id = Math.max(0, ...list.map(j => j.id)) + 1;
      setJalons(prev => [...(prev || []), { id, ...cleaned }]);
    }
    setShowForm(false);
  };

  const remove = (id) => setJalons(prev => prev.filter(j => j.id !== id));

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--ink-3)' }}>
          <Target size={13} /> Objectifs & jalons
        </h2>
        <div className="flex items-center gap-2">
          {list.length > 0 && (
            <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>{reached}/{list.length} atteints</span>
          )}
          <button onClick={openAdd}
            className="w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md"
            style={{ background: 'var(--violet)' }}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-card p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <Target size={22} className="mx-auto mb-2" style={{ color: 'var(--ink-3)' }} />
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Aucun jalon pour l'instant</p>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-3)' }}>Définis une cible précise pour suivre ta progression</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map(j => (
            <JalonCard key={j.id} jalon={j} onStep={stepProgress} onEdit={openEdit} onDelete={remove} />
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editJalon ? 'Modifier le jalon' : 'Nouveau jalon'}
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={save} disabled={!form.titre.trim()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40"
              style={{ background: 'var(--violet)' }}>
              Enregistrer
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
              Annuler
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <label>
            <span className="text-xs text-gray-500 block mb-1">Objectif *</span>
            <input autoFocus value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              placeholder="Ex: Publier 20 vidéos ce mois" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="text-xs text-gray-500 block mb-1">Catégorie</span>
            <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>
            <span className="text-xs text-gray-500 block mb-1">Suivi</span>
            <select value={form.source || ''} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Manuel (boutons +/−)</option>
              {Object.entries(JALON_SOURCES).map(([key, s]) => (
                <option key={key} value={key}>⚡ {s.label}</option>
              ))}
            </select>
            {form.source && (
              <span className="text-[10px] mt-1 block" style={{ color: 'var(--ink-3)' }}>
                Compté automatiquement depuis ton activité.
              </span>
            )}
          </label>
          <div className="flex gap-3">
            {!form.source && (
              <label className="flex-1">
                <span className="text-xs text-gray-500 block mb-1">Actuel</span>
                <input type="number" min="0" value={form.actuel} onChange={e => setForm(f => ({ ...f, actuel: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </label>
            )}
            <label className="flex-1">
              <span className="text-xs text-gray-500 block mb-1">Cible</span>
              <input type="number" min="1" value={form.cible} onChange={e => setForm(f => ({ ...f, cible: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="flex gap-3">
            <label className="flex-1">
              <span className="text-xs text-gray-500 block mb-1">Unité (optionnel)</span>
              <input value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))}
                placeholder="vidéos, séances…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex-1">
              <span className="text-xs text-gray-500 block mb-1">Échéance (optionnel)</span>
              <input type="date" value={form.echeance || ''} onChange={e => setForm(f => ({ ...f, echeance: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>
        </div>
      </Modal>
    </section>
  );
}
