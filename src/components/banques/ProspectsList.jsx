import { useState } from 'react';
import Modal from '../Modal';
import { formatDate, today } from '../../utils/date';
import { addBonusToJournal } from '../../utils/journalLog';
import {
  PROSPECT_STATUTS, statutConfig, isOpenProspect, dueProspects, sortProspects,
} from '../../utils/prospects';

const EMPTY_FORM = { nom: '', entreprise: '', contact: '', statut: 'a_contacter', relanceDate: '', notes: '' };

function formatRelance(ds) {
  return new Date(`${ds}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Suivi de prospects (CRM léger) : pipeline par statut, date de relance et
// notes. Les relances dues remontent en tête de liste (et sur l'écran
// Aujourd'hui via dueProspects).
export default function ProspectsList({ prospects, setProspects, searchQuery }) {
  const [statusFilter, setStatusFilter] = useState('tous');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // prospect en cours d'édition, ou null
  const [form, setForm] = useState(EMPTY_FORM);

  const todayStr = formatDate(today());
  const dueIds = new Set(dueProspects(prospects, todayStr).map(p => p.id));

  const q = (searchQuery || '').trim().toLowerCase();
  const visible = sortProspects(prospects, todayStr).filter(p => {
    if (statusFilter !== 'tous' && p.statut !== statusFilter) return false;
    if (!q) return true;
    return [p.nom, p.entreprise, p.contact, p.notes].some(v => (v || '').toLowerCase().includes(q));
  });

  const openCount = (prospects || []).filter(isOpenProspect).length;

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      nom: p.nom || '', entreprise: p.entreprise || '', contact: p.contact || '',
      statut: p.statut || 'a_contacter', relanceDate: p.relanceDate || '', notes: p.notes || '',
    });
    setShowForm(true);
  };

  const saveForm = () => {
    if (!form.nom.trim()) return;
    const data = {
      nom: form.nom.trim(),
      entreprise: form.entreprise.trim(),
      contact: form.contact.trim(),
      statut: form.statut,
      relanceDate: form.relanceDate || null,
      notes: form.notes.trim(),
    };
    if (editing) {
      setProspects(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } : p));
    } else {
      setProspects(prev => [...(prev || []), { id: Date.now(), creeLe: Date.now(), ...data }]);
    }
    setShowForm(false);
  };

  const deleteProspect = () => {
    if (!editing) return;
    setProspects(prev => prev.filter(p => p.id !== editing.id));
    setShowForm(false);
  };

  // « Relancé ✓ » : loggue une action bonus dans le journal du jour (+XP via
  // le moteur existant), passe le prospect en « Contacté » et efface la date
  // de relance (à re-planifier via la fiche si besoin).
  const markRelance = (p) => {
    addBonusToJournal(todayStr, `📇 Relance : ${p.nom}`);
    setProspects(prev => prev.map(x =>
      x.id === p.id ? { ...x, statut: 'contacte', relanceDate: null } : x
    ));
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={openNew}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white btn-press"
        style={{ background: 'var(--green)', color: '#06180F' }}
      >
        + Nouveau prospect
      </button>

      {/* Filtres par statut */}
      <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[{ key: 'tous', label: `Tous (${openCount} ouverts)` }, ...PROSPECT_STATUTS].map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium btn-press"
            style={statusFilter === s.key
              ? { background: s.color || 'var(--green)', color: 'white' }
              : { background: 'var(--line-2)', color: 'var(--ink-2)' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-3xl mb-2">📇</div>
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
            {(prospects || []).length === 0
              ? 'Ajoute ton premier prospect pour suivre tes contacts pro.'
              : 'Aucun prospect pour ce filtre.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(p => {
            const st = statutConfig(p.statut);
            const due = dueIds.has(p.id);
            return (
              <div
                key={p.id}
                onClick={() => openEdit(p)}
                className="rounded-xl p-3 btn-press cursor-pointer"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${due ? 'rgba(255,87,87,0.4)' : 'var(--line)'}`,
                  opacity: isOpenProspect(p) ? 1 : 0.6,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{p.nom}</p>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: st.soft, color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>
                {(p.entreprise || p.contact) && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ink-2)' }}>
                    {[p.entreprise, p.contact].filter(Boolean).join(' · ')}
                  </p>
                )}
                {p.relanceDate && isOpenProspect(p) && (
                  <p className="text-xs mt-1 font-medium" style={{ color: due ? 'var(--red)' : 'var(--ink-3)' }}>
                    🔔 Relance le {formatRelance(p.relanceDate)}{due ? ' — à faire !' : ''}
                  </p>
                )}
                {p.notes && (
                  <p className="text-xs mt-1 truncate" style={{ color: 'var(--ink-3)' }}>{p.notes}</p>
                )}
                {due && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRelance(p); }}
                    className="w-full mt-2 py-2 rounded-lg text-xs font-bold btn-press"
                    style={{ background: 'var(--green)', color: '#06180F' }}
                  >
                    ✓ Relancé aujourd'hui (+10 XP)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Formulaire ajout / édition */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? '📇 Modifier le prospect' : '📇 Nouveau prospect'}
        footer={
          <div className="flex gap-2 w-full">
            {editing && (
              <button
                onClick={deleteProspect}
                className="py-2.5 px-4 rounded-lg font-medium text-sm btn-press"
                style={{ background: 'var(--red-50)', color: 'var(--red)' }}
              >
                Supprimer
              </button>
            )}
            <button
              onClick={saveForm}
              disabled={!form.nom.trim()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40 btn-press"
              style={{ background: 'var(--green)', color: '#06180F' }}
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <label>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Nom *</span>
            <input
              autoFocus={!editing}
              value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Nom du prospect"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Entreprise (optionnel)</span>
            <input
              value={form.entreprise}
              onChange={e => setForm(f => ({ ...f, entreprise: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Contact — tél, mail, insta… (optionnel)</span>
            <input
              value={form.contact}
              onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <div>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Statut</span>
            <div className="flex flex-wrap gap-1.5">
              {PROSPECT_STATUTS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setForm(f => ({ ...f, statut: s.key }))}
                  className="px-2.5 py-1.5 rounded-full text-xs font-medium btn-press"
                  style={form.statut === s.key
                    ? { background: s.color, color: 'white' }
                    : { background: 'var(--line-2)', color: 'var(--ink-2)' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <label>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Prochaine relance (optionnel)</span>
            <input
              type="date"
              value={form.relanceDate}
              onChange={e => setForm(f => ({ ...f, relanceDate: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="text-xs block mb-1" style={{ color: 'var(--ink-3)' }}>Notes (optionnel)</span>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Contexte, besoin, dernier échange…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
